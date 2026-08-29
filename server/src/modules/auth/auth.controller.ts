import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { AuthRequest } from '../../middleware/auth';

export class AuthController {
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, orgSlug } = req.body;
      const result = await AuthService.login(email, password, orgSlug);
      res.json({
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (err: any) {
      res.status(401).json({
        success: false,
        error: { code: 'AUTH_FAILED', message: err.message },
        meta: { timestamp: new Date().toISOString() },
      });
    }
  }

  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json({
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'REGISTRATION_FAILED', message: err.message },
        meta: { timestamp: new Date().toISOString() },
      });
    }
  }

  public static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_TOKEN', message: 'Refresh token required' },
          meta: { timestamp: new Date().toISOString() },
        });
        return;
      }
      const result = await AuthService.refreshToken(refreshToken);
      res.json({
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (err: any) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_REFRESH_TOKEN', message: err.message },
        meta: { timestamp: new Date().toISOString() },
      });
    }
  }

  public static async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new Error('Unauthorized');
      const profile = await AuthService.getProfile(req.user.id, req.user.org_id);
      res.json({
        success: true,
        data: profile,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (err: any) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: err.message },
        meta: { timestamp: new Date().toISOString() },
      });
    }
  }
}
