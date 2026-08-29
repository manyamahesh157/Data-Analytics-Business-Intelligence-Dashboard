import cron from 'node-cron';
import { memoryDb } from '../../db/connection';
import { ReportsService } from './reports.service';
import { logger } from '../../config/logger';

export function initReportScheduler(): void {
  // Check active scheduled reports every minute
  cron.schedule('* * * * *', async () => {
    try {
      const activeReports = memoryDb.reports.filter((r) => r.is_active && r.schedule_cron);
      const now = new Date();

      for (const report of activeReports) {
        if (report.next_run_at && new Date(report.next_run_at) <= now) {
          logger.info(`Cron Scheduler: Dispatching scheduled report [${report.name}]...`);
          try {
            await ReportsService.generateReportNow(report.id, report.org_id, report.created_by || 'system');
            // Advance next_run_at by 24 hours / week
            report.next_run_at = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
          } catch (err: any) {
            logger.error(`Failed executing scheduled report [${report.name}]: ${err.message}`);
          }
        }
      }
    } catch (err: any) {
      logger.error(`Report Scheduler Worker Error: ${err.message}`);
    }
  });

  logger.info('Scheduled Report Cron Service initialized.');
}
