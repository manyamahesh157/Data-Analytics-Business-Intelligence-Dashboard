import { Router } from 'express';
import multer from 'multer';
import { DataSourcesController } from './dataSources.controller';
import { authMiddleware } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
const router = Router();

router.use(authMiddleware);

// Data Sources CRUD
router.get('/', DataSourcesController.listDataSources);
router.get('/:id', DataSourcesController.getDataSourceById);
router.post('/', requirePermission('data:import'), DataSourcesController.createDataSource);

// Ingestion Jobs & Datasets
router.get('/jobs/history', DataSourcesController.listImportJobs);
router.get('/datasets/all', DataSourcesController.listDatasets);
router.get('/datasets/:id', DataSourcesController.getDatasetById);

// ETL Ingestion Trigger (File upload or API connector sync)
router.post('/ingest/upload', requirePermission('data:import'), upload.single('file'), DataSourcesController.runEtl);
router.post('/ingest/connector', requirePermission('data:import'), DataSourcesController.runEtl);

export default router;
