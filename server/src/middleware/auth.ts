import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthenticatedUser } from '../types';

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
  orgId?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required. Missing Bearer token.' },
      meta: { timestamp: new Date().toISOString() },
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    req.orgId = decoded.org_id;
    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Token is invalid or expired.', details: err.message },
      meta: { timestamp: new Date().toISOString() },
    });
  }
}

export function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as AuthenticatedUser;
      req.user = decoded;
      req.orgId = decoded.org_id;
    } catch {
      // Ignore
    }
  }
  next();
}
