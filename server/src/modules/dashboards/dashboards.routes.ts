import { Router } from 'express';
import { z } from 'zod';
import { DashboardsController } from './dashboards.controller';
import { authMiddleware } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { validateBody } from '../../middleware/validation';

const router = Router();

router.use(authMiddleware);

const createDashboardSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  layout_config: z.record(z.any()).optional(),
  is_default: z.boolean().optional(),
  is_public: z.boolean().optional(),
});

const createWidgetSchema = z.object({
  dataset_id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['line', 'bar', 'pie', 'area', 'scatter', 'kpi_card', 'table', 'gauge']),
  grid_layout: z.object({
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
    minW: z.number().optional(),
    minH: z.number().optional(),
  }),
  query_config: z.object({
    metrics: z.array(z.string()),
    dimensions: z.array(z.string()),
    filters: z.array(z.any()).optional(),
    sort: z.array(z.any()).optional(),
    groupBy: z.array(z.string()).optional(),
    limit: z.number().optional(),
  }),
  visual_config: z.record(z.any()).optional(),
  refresh_interval_seconds: z.number().optional(),
});

// Dashboards CRUD
router.get('/', DashboardsController.listDashboards);
router.get('/:id', DashboardsController.getDashboardById);
router.post('/', requirePermission('dashboard:create'), validateBody(createDashboardSchema), DashboardsController.createDashboard);
router.put('/:id', requirePermission('dashboard:edit'), DashboardsController.updateDashboard);
router.delete('/:id', requirePermission('dashboard:delete'), DashboardsController.deleteDashboard);

// Widgets CRUD
router.post('/:dashboardId/widgets', requirePermission('dashboard:edit'), validateBody(createWidgetSchema), DashboardsController.createWidget);
router.put('/:dashboardId/widgets/:widgetId', requirePermission('dashboard:edit'), DashboardsController.updateWidget);
router.delete('/:dashboardId/widgets/:widgetId', requirePermission('dashboard:edit'), DashboardsController.deleteWidget);
router.post('/:dashboardId/layouts', requirePermission('dashboard:edit'), DashboardsController.batchUpdateLayouts);

// Query Preview
router.post('/query/preview', DashboardsController.executeQueryPreview);

export default router;
