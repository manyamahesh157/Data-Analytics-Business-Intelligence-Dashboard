import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export function requirePermission(permissionCode: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        meta: { timestamp: new Date().toISOString() },
      });
      return;
    }

    // Admin role bypasses granular permission checks
    if (req.user.roles?.includes('Admin')) {
      return next();
    }

    if (req.user.permissions && req.user.permissions.includes(permissionCode)) {
      return next();
    }

    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: `Missing required permission: ${permissionCode}`,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  };
}

export function requireRole(roleName: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        meta: { timestamp: new Date().toISOString() },
      });
      return;
    }

    if (req.user.roles && req.user.roles.includes(roleName)) {
      return next();
    }

    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: `User must possess role: ${roleName}`,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  };
}
