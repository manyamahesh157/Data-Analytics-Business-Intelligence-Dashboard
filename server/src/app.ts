import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { apiRateLimiter } from './middleware/rateLimiter';
import { auditLogger } from './middleware/audit';
import { errorHandler } from './middleware/errorHandler';
import { isUsingPostgres } from './db/connection';
import { swaggerDocument } from './modules/docs/swagger';

// Route Imports
import authRoutes from './modules/auth/auth.routes';
import dashboardsRoutes from './modules/dashboards/dashboards.routes';
import kpisRoutes from './modules/kpis/kpis.routes';
import dataSourcesRoutes from './modules/dataSources/dataSources.routes';
import reportsRoutes from './modules/reports/reports.routes';
import auditLogsRoutes from './modules/auditLogs/auditLogs.routes';

export function createApp(): Application {
  const app = express();

  // Security & Utility Middlewares
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));
  app.use(apiRateLimiter);

  // Global Write Audit Interceptor
  app.use(auditLogger as any);

  // Health Check Endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      database: isUsingPostgres() ? 'postgresql' : 'in_memory_resilient_store',
      uptime_seconds: process.uptime(),
      memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      timestamp: new Date().toISOString(),
    });
  });

  // Swagger Documentation
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Mount API Endpoints (1:1 Schema Entity Mapping)
  app.use('/api/auth', authRoutes);
  app.use('/api/dashboards', dashboardsRoutes);
  app.use('/api/kpis', kpisRoutes);
  app.use('/api/data-sources', dataSourcesRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/audit-logs', auditLogsRoutes);

  // 404 Handler
  app.use('*', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found` },
      meta: { timestamp: new Date().toISOString() },
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
