import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { initDatabase } from './db/connection';
import { initRedis } from './db/redis';
import { initSocketServer } from './modules/realtime/socketServer';
import { initReportScheduler } from './modules/reports/reportScheduler';

async function bootstrap() {
  try {
    logger.info('Initializing Production BI & Data Analytics Backend Engine...');

    // 1. Initialize Database
    await initDatabase();

    // 2. Initialize Redis Cache
    initRedis();

    // 3. Create Express App & HTTP Server
    const app = createApp();
    const server = http.createServer(app);

    // 4. Initialize Real-Time WebSocket Engine
    initSocketServer(server);

    // 5. Initialize Report Cron Scheduler
    initReportScheduler();

    // 6. Start Listening
    server.listen(env.PORT, () => {
      logger.info(`=======================================================`);
      logger.info(`🚀 BI & Analytics Server running on port: ${env.PORT}`);
      logger.info(`📡 API Base URL: http://localhost:${env.PORT}/api`);
      logger.info(`📑 Swagger Docs: http://localhost:${env.PORT}/api/docs`);
      logger.info(`🩺 Health Check: http://localhost:${env.PORT}/health`);
      logger.info(`⚡ Real-Time Socket.io: Enabled on port ${env.PORT}`);
      logger.info(`=======================================================`);
    });
  } catch (err: any) {
    logger.error(`Critical Server Startup Failure: ${err.message}`, { stack: err.stack });
    process.exit(1);
  }
}

bootstrap();
