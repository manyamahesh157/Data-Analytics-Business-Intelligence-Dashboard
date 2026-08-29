import { Response, NextFunction } from 'express';
import { KpisService } from './kpis.service';
import { AuthRequest } from '../../middleware/auth';

export class KpisController {
  public static async listKpis(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.org_id;
      const list = await KpisService.listKpis(orgId);
      res.json({ success: true, data: list, meta: { total: list.length, timestamp: new Date().toISOString() } });
    } catch (err) {
      next(err);
    }
  }

  public static async getKpiById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const orgId = req.user!.org_id;
      const item = await KpisService.getKpiById(id, orgId);
      if (!item) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'KPI not found' } });
        return;
      }
      res.json({ success: true, data: item, meta: { timestamp: new Date().toISOString() } });
    } catch (err) {
      next(err);
    }
  }

  public static async createKpi(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.org_id;
      const userId = req.user!.id;
      const item = await KpisService.createKpi(orgId, userId, req.body);
      res.status(201).json({ success: true, data: item, meta: { timestamp: new Date().toISOString() } });
    } catch (err) {
      next(err);
    }
  }

  public static async recalculateKpi(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const orgId = req.user!.org_id;
      const result = await KpisService.recalculateKpi(id, orgId);
      res.json({ success: true, data: result, meta: { timestamp: new Date().toISOString() } });
    } catch (err) {
      next(err);
    }
  }

  public static async listAlerts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.org_id;
      const list = await KpisService.listAlerts(orgId);
      res.json({ success: true, data: list, meta: { total: list.length, timestamp: new Date().toISOString() } });
    } catch (err) {
      next(err);
    }
  }

  public static async acknowledgeAlert(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const orgId = req.user!.org_id;
      const userId = req.user!.id;
      const alert = await KpisService.acknowledgeAlert(id, orgId, userId);
      if (!alert) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Alert not found' } });
        return;
      }
      res.json({ success: true, data: alert, meta: { timestamp: new Date().toISOString() } });
    } catch (err) {
      next(err);
    }
  }

  public static async resolveAlert(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const orgId = req.user!.org_id;
      const alert = await KpisService.resolveAlert(id, orgId);
      if (!alert) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Alert not found' } });
        return;
      }
      res.json({ success: true, data: alert, meta: { timestamp: new Date().toISOString() } });
    } catch (err) {
      next(err);
    }
  }
}
