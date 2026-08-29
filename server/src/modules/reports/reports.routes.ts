import { Router } from 'express';
import { z } from 'zod';
import { ReportsController } from './reports.controller';
import { authMiddleware } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { validateBody } from '../../middleware/validation';

const router = Router();

router.use(authMiddleware);

const createReportSchema = z.object({
  dashboard_id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  format: z.enum(['pdf', 'excel', 'csv']),
  schedule_cron: z.string().optional(),
  recipients: z.array(z.string().email()).default([]),
  filter_config: z.record(z.any()).optional(),
});

router.get('/', ReportsController.listReports);
router.get('/history/all', ReportsController.listReportHistory);
router.post('/', requirePermission('reports:generate'), validateBody(createReportSchema), ReportsController.createReport);
router.post('/:id/generate', requirePermission('reports:generate'), ReportsController.generateReportNow);

export default router;
