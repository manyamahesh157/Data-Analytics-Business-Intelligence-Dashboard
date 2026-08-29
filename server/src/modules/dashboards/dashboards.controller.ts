import { Response, NextFunction } from 'express';
import { DashboardsService } from './dashboards.service';
import { AuthRequest } from '../../middleware/auth';
import { SafeQueryBuilder } from './queryBuilder';

export class DashboardsController {
  public static async listDashboards(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.org_id;
      const list = await DashboardsService.listDashboards(orgId);
      res.json({ success: true, data: list, meta: { total: list.length, timestamp: new Date().toISOString() } });
    } catch (err) {
      next(err);
    }
  }

  public static async getDashboardById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const orgId = req.user!.org_id;
      const item = await DashboardsService.getDashboardById(id, orgId, true);
      if (!item) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Dashboard not found' } });
        return;
      }
      res.json({ success: true, data: item, meta: { timestamp: new Date().toISOString() } });
    } catch (err) {
      next(err);
    }
  }

  public static async createDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.org_id;
      const userId = req.user!.id;
      const item = await DashboardsService.createDashboard(orgId, userId, req.body);
      res.status(201).json({ success: true, data: item, meta: { timestamp: new Date().toISOString() } });
    } catch (err) {
      next(err);
    }
  }

  public static async updateDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const orgId = req.user!.org_id;
      const item = await DashboardsService.updateDashboard(id, orgId, req.body);
      if (!item) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Dashboard not found' } });
        return;
      }
      res.json({ success: true, data: item, meta: { timestamp: new Date().toISOString() } });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const orgId = req.user!.org_id;
      const ok = await DashboardsService.deleteDashboard(id, orgId);
      if (!ok) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Dashboard not found' } });
        return;
      }
      res.json({ success: true, data: { deleted: true }, meta: { timestamp: new Date().toISOString() } });
    } catch (err) {
      next(err);
    }
  }

  // Widgets
  public static async createWidget(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { dashboardId } = req.params;
      const orgId = req.user!.org_id;
      const widget = await DashboardsService.createWidget(dashboardId, orgId, req.body);
      res.status(201).json({ success: true, data: widget, meta: { timestamp: new Date().toISOString() } });
    } catch (err) {
      next(err);
    }
  }

  public static async updateWidget(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { dashboardId, widgetId } = req.params;
      const orgId = req.user!.org_id;
      const widget = await DashboardsService.updateWidget(widgetId, dashboardId, orgId, req.body);
      if (!widget) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Widget not found' } });
        return;
      }
      res.json({ success: true, data: widget, meta: { timestamp: new Date().toISOString() } });
    } catch (err) {
      next(err);
    }
  }

  public static async batchUpdateLayouts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { dashboardId } = req.params;
      const orgId = req.user!.org_id;
      await DashboardsService.batchUpdateLayouts(dashboardId, orgId, req.body.layouts);
      res.json({ success: true, data: { updated: true }, meta: { timestamp: new Date().toISOString() } });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteWidget(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { dashboardId, widgetId } = req.params;
      const orgId = req.user!.org_id;
      const ok = await DashboardsService.deleteWidget(widgetId, dashboardId, orgId);
      if (!ok) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Widget not found' } });
        return;
      }
      res.json({ success: true, data: { deleted: true }, meta: { timestamp: new Date().toISOString() } });
    } catch (err) {
      next(err);
    }
  }

  public static async executeQueryPreview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.org_id;
      const { dataset_id, query_config } = req.body;
      const result = await SafeQueryBuilder.executeWidgetQuery(orgId, dataset_id, query_config);
      res.json({ success: true, data: result, meta: { timestamp: new Date().toISOString() } });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'QUERY_EXECUTION_ERROR', message: err.message } });
    }
  }
}
