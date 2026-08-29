import { Response, NextFunction } from 'express';
import { DataSourcesService } from './dataSources.service';
import { AuthRequest } from '../../middleware/auth';

export class DataSourcesController {
  public static async listDataSources(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.org_id;
      const list = await DataSourcesService.listDataSources(orgId);
      res.json({ success: true, data: list, meta: { total: list.length, timestamp: new Date().toISOString() } });
    } catch (err) {
      next(err);
    }
  }

  public static async getDataSourceById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const orgId = req.user!.org_id;
      const item = await DataSourcesService.getDataSourceById(id, orgId);
      if (!item) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Data source not found' } });
        return;
      }
      res.json({ success: true, data: item, meta: { timestamp: new Date().toISOString() } });
    } catch (err) {
      next(err);
    }
  }

  public static async createDataSource(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.org_id;
      const userId = req.user!.id;
      const item = await DataSourcesService.createDataSource(orgId, userId, req.body);
      res.status(201).json({ success: true, data: item, meta: { timestamp: new Date().toISOString() } });
    } catch (err) {
      next(err);
    }
  }

  public static async listImportJobs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.org_id;
      const list = await DataSourcesService.listImportJobs(orgId);
      res.json({ success: true, data: list, meta: { total: list.length, timestamp: new Date().toISOString() } });
    } catch (err) {
      next(err);
    }
  }

  public static async listDatasets(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.org_id;
      const list = await DataSourcesService.listDatasets(orgId);
      res.json({ success: true, data: list, meta: { total: list.length, timestamp: new Date().toISOString() } });
    } catch (err) {
      next(err);
    }
  }

  public static async getDatasetById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const orgId = req.user!.org_id;
      const item = await DataSourcesService.getDatasetById(id, orgId);
      if (!item) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Dataset not found' } });
        return;
      }
      res.json({ success: true, data: item, meta: { timestamp: new Date().toISOString() } });
    } catch (err) {
      next(err);
    }
  }

  public static async runEtl(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.org_id;
      const userId = req.user!.id;
      const file = (req as any).file;

      const { dataSourceId, sourceType, datasetName, tableName, restConfig, googleSheetsConfig } = req.body;

      const result = await DataSourcesService.runEtlPipeline(orgId, userId, {
        dataSourceId,
        sourceType: sourceType || (file ? (file.originalname.endsWith('.csv') ? 'csv' : 'excel') : 'rest_api'),
        datasetName: datasetName || (file ? file.originalname.split('.')[0] : 'Ingested Dataset'),
        tableName,
        fileBuffer: file?.buffer,
        fileName: file?.originalname,
        restConfig: typeof restConfig === 'string' ? JSON.parse(restConfig) : restConfig,
        googleSheetsConfig: typeof googleSheetsConfig === 'string' ? JSON.parse(googleSheetsConfig) : googleSheetsConfig,
      });

      res.status(201).json({
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'ETL_FAILED', message: err.message },
        meta: { timestamp: new Date().toISOString() },
      });
    }
  }
}
