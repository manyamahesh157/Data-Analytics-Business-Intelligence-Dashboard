import { Response, NextFunction } from 'express';
import { ReportsService } from './reports.service';
import { AuthRequest } from '../../middleware/auth';

export class ReportsController {
  public static async listReports(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.org_id;
      const list = await ReportsService.listReports(orgId);
      res.json({ success: true, data: list, meta: { total: list.length, timestamp: new Date().toISOString() } });
    } catch (err) {
      next(err);
    }
  }

  public static async listReportHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.org_id;
      const list = await ReportsService.listReportHistory(orgId);
      res.json({ success: true, data: list, meta: { total: list.length, timestamp: new Date().toISOString() } });
    } catch (err) {
      next(err);
    }
  }

  public static async createReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.org_id;
      const userId = req.user!.id;
      const item = await ReportsService.createReport(orgId, userId, req.body);
      res.status(201).json({ success: true, data: item, meta: { timestamp: new Date().toISOString() } });
    } catch (err) {
      next(err);
    }
  }

  public static async generateReportNow(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const orgId = req.user!.org_id;
      const userId = req.user!.id;
      const result = await ReportsService.generateReportNow(id, orgId, userId);

      if (req.query.download === 'true') {
        res.setHeader('Content-Type', result.contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.send(result.content);
        return;
      }

      res.json({
        success: true,
        data: {
          history: result.history,
          filename: result.filename,
          contentType: result.contentType,
          fileUrl: result.history.file_url,
        },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'REPORT_GEN_FAILED', message: err.message } });
    }
  }
}
