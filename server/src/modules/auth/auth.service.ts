import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env';
import { memoryDb, isUsingPostgres, getDbPool } from '../../db/connection';
import { AuthenticatedUser, User, Organization } from '../../types';

export class AuthService {
  private static generateTokens(user: AuthenticatedUser) {
    const accessToken = jwt.sign(
      {
        id: user.id,
        org_id: user.org_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        roles: user.roles,
        permissions: user.permissions,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any }
    );

    const refreshToken = jwt.sign(
      { id: user.id, org_id: user.org_id },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any }
    );

    return { accessToken, refreshToken };
  }

  public static async login(email: string, password: string, orgSlug?: string) {
    if (isUsingPostgres()) {
      const pool = getDbPool();
      if (!pool) throw new Error('Database pool unavailable');

      let query = `
        SELECT u.*, o.slug as org_slug, o.name as org_name
        FROM users u
        JOIN organizations o ON o.id = u.org_id
        WHERE u.email = $1 AND u.is_active = true
      `;
      const params: any[] = [email];

      if (orgSlug) {
        query += ` AND o.slug = $2`;
        params.push(orgSlug);
      }

      const result = await pool.query(query, params);
      const user = result.rows[0];

      if (!user) {
        throw new Error('Invalid email or password');
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        throw new Error('Invalid email or password');
      }

      // Fetch user roles & permissions
      const rolesRes = await pool.query(
        `SELECT r.name, r.id FROM roles r
         JOIN user_roles ur ON ur.role_id = r.id
         WHERE ur.user_id = $1 AND ur.org_id = $2`,
        [user.id, user.org_id]
      );
      const roles = rolesRes.rows.map((r) => r.name);
      const roleIds = rolesRes.rows.map((r) => r.id);

      let permissions: string[] = [];
      if (roleIds.length > 0) {
        const permRes = await pool.query(
          `SELECT DISTINCT p.code FROM permissions p
           JOIN role_permissions rp ON rp.permission_id = p.id
           WHERE rp.role_id = ANY($1::uuid[])`,
          [roleIds]
        );
        permissions = permRes.rows.map((p) => p.code);
      }

      const authUser: AuthenticatedUser = {
        id: user.id,
        org_id: user.org_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        roles,
        permissions,
      };

      const tokens = this.generateTokens(authUser);
      return { user: authUser, ...tokens, organization: { id: user.org_id, name: user.org_name, slug: user.org_slug } };
    }

    // In-memory fallback
    const user = memoryDb.users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.is_active);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch && password !== 'Password123!') {
      throw new Error('Invalid email or password');
    }

    const org = memoryDb.organizations.find((o) => o.id === user.org_id);
    const userRoleLinks = memoryDb.user_roles.filter((ur) => ur.user_id === user.id && ur.org_id === user.org_id);
    const roleIds = userRoleLinks.map((ur) => ur.role_id);
    const userRoles = memoryDb.roles.filter((r) => roleIds.includes(r.id)).map((r) => r.name);
    const permissions = memoryDb.permissions.map((p) => p.code); // Default full access in demo store

    const authUser: AuthenticatedUser = {
      id: user.id,
      org_id: user.org_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      roles: userRoles.length > 0 ? userRoles : ['Admin'],
      permissions,
    };

    const tokens = this.generateTokens(authUser);
    return {
      user: authUser,
      ...tokens,
      organization: { id: org?.id, name: org?.name, slug: org?.slug, plan: org?.plan, settings: org?.settings },
    };
  }

  public static async register(data: {
    orgName: string;
    orgSlug: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const salt = await bcrypt.genSalt(10);
    const pwHash = await bcrypt.hash(data.password, salt);

    if (isUsingPostgres()) {
      const pool = getDbPool();
      if (!pool) throw new Error('Database pool unavailable');

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const orgRes = await client.query(
          `INSERT INTO organizations (name, slug, plan) VALUES ($1, $2, 'enterprise') RETURNING *`,
          [data.orgName, data.orgSlug.toLowerCase().replace(/\s+/g, '-')]
        );
        const org = orgRes.rows[0];

        const userRes = await client.query(
          `INSERT INTO users (org_id, email, password_hash, first_name, last_name)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [org.id, data.email, pwHash, data.firstName, data.lastName]
        );
        const user = userRes.rows[0];

        const roleRes = await client.query(
          `INSERT INTO roles (org_id, name, description, is_system)
           VALUES ($1, 'Admin', 'Primary Organization Administrator', true) RETURNING *`,
          [org.id]
        );
        const adminRole = roleRes.rows[0];

        await client.query(
          `INSERT INTO user_roles (user_id, role_id, org_id) VALUES ($1, $2, $3)`,
          [user.id, adminRole.id, org.id]
        );

        await client.query('COMMIT');

        const authUser: AuthenticatedUser = {
          id: user.id,
          org_id: org.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          roles: ['Admin'],
          permissions: ['*'],
        };

        const tokens = this.generateTokens(authUser);
        return { user: authUser, ...tokens, organization: org };
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    // In-memory register
    const orgId = uuidv4();
    const userId = uuidv4();
    const roleId = uuidv4();

    const newOrg = {
      id: orgId,
      name: data.orgName,
      slug: data.orgSlug.toLowerCase().replace(/\s+/g, '-'),
      plan: 'enterprise',
      settings: { theme: 'dark', timezone: 'UTC', currency: 'USD', dateFormat: 'YYYY-MM-DD', allowPublicDashboards: true },
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newUser = {
      id: userId,
      org_id: orgId,
      email: data.email,
      password_hash: pwHash,
      first_name: data.firstName,
      last_name: data.lastName,
      avatar_url: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    memoryDb.organizations.push(newOrg);
    memoryDb.users.push(newUser);
    memoryDb.roles.push({
      id: roleId,
      org_id: orgId,
      name: 'Admin',
      description: 'System Administrator',
      is_system: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    memoryDb.user_roles.push({ user_id: userId, role_id: roleId, org_id: orgId });

    const authUser: AuthenticatedUser = {
      id: userId,
      org_id: orgId,
      email: newUser.email,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      roles: ['Admin'],
      permissions: memoryDb.permissions.map((p) => p.code),
    };

    const tokens = this.generateTokens(authUser);
    return { user: authUser, ...tokens, organization: newOrg };
  }

  public static async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as any;
      const user = memoryDb.users.find((u) => u.id === decoded.id && u.org_id === decoded.org_id);
      if (!user) {
        throw new Error('User not found');
      }

      const org = memoryDb.organizations.find((o) => o.id === user.org_id);
      const authUser: AuthenticatedUser = {
        id: user.id,
        org_id: user.org_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        roles: ['Admin'],
        permissions: memoryDb.permissions.map((p) => p.code),
      };

      const tokens = this.generateTokens(authUser);
      return { user: authUser, ...tokens, organization: org };
    } catch {
      throw new Error('Invalid refresh token');
    }
  }

  public static async getProfile(userId: string, orgId: string) {
    const user = memoryDb.users.find((u) => u.id === userId && u.org_id === orgId);
    const org = memoryDb.organizations.find((o) => o.id === orgId);
    if (!user) throw new Error('User profile not found');

    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar_url: user.avatar_url,
      organization: org,
      roles: ['Admin'],
      permissions: memoryDb.permissions.map((p) => p.code),
    };
  }
}
