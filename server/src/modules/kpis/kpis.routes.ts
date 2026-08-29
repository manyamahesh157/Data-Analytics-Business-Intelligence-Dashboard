import { Router } from 'express';
import { z } from 'zod';
import { KpisController } from './kpis.controller';
import { authMiddleware } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { validateBody } from '../../middleware/validation';

const router = Router();

router.use(authMiddleware);

const createKpiSchema = z.object({
  dataset_id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  description: z.string().optional(),
  formula_type: z.enum(['sum', 'avg', 'count', 'min', 'max', 'custom_sql']),
  formula_expression: z.string().optional(),
  metric_column: z.string().optional(),
  target_value: z.number().optional(),
  warning_threshold: z.number().optional(),
  critical_threshold: z.number().optional(),
  unit: z.string().optional(),
  format: z.enum(['currency', 'percentage', 'number', 'duration']).optional(),
  period_type: z.enum(['hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
});

// KPI Definitions CRUD & Execution
router.get('/', KpisController.listKpis);
router.get('/alerts/all', KpisController.listAlerts);
router.get('/:id', KpisController.getKpiById);
router.post('/', requirePermission('kpi:manage'), validateBody(createKpiSchema), KpisController.createKpi);
router.post('/:id/recalculate', requirePermission('kpi:manage'), KpisController.recalculateKpi);

// KPI Alerts Management
router.patch('/alerts/:id/acknowledge', requirePermission('kpi:manage'), KpisController.acknowledgeAlert);
router.patch('/alerts/:id/resolve', requirePermission('kpi:manage'), KpisController.resolveAlert);

export default router;
