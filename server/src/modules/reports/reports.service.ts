import { v4 as uuidv4 } from 'uuid';
import { memoryDb, isUsingPostgres, getDbPool } from '../../db/connection';
import { Report, ReportHistory, Dashboard } from '../../types';
import { DashboardsService } from '../dashboards/dashboards.service';
import { ReportGenerator } from './reportGenerator';
import { logger } from '../../config/logger';

export class ReportsService {
  public static async listReports(orgId: string): Promise<Report[]> {
    if (isUsingPostgres()) {
      const pool = getDbPool();
      if (pool) {
        const res = await pool.query(
          `SELECT r.*, d.title as dashboard_title
           FROM reports r
           LEFT JOIN dashboards d ON d.id = r.dashboard_id
           WHERE r.org_id = $1 ORDER BY r.created_at DESC`,
          [orgId]
        );
        return res.rows;
      }
    }
    return memoryDb.reports
      .filter((r) => r.org_id === orgId)
      .map((r) => {
        const d = memoryDb.dashboards.find((dash) => dash.id === r.dashboard_id);
        return { ...r, dashboard_title: d?.title };
      });
  }

  public static async listReportHistory(orgId: string): Promise<ReportHistory[]> {
    if (isUsingPostgres()) {
      const pool = getDbPool();
      if (pool) {
        const res = await pool.query(
          `SELECT h.*, r.name as report_name
           FROM report_history h
           LEFT JOIN reports r ON r.id = h.report_id
           WHERE h.org_id = $1 ORDER BY h.generated_at DESC`,
          [orgId]
        );
        return res.rows;
      }
    }
    return memoryDb.report_history
      .filter((h) => h.org_id === orgId)
      .map((h) => {
        const r = memoryDb.reports.find((rep) => rep.id === h.report_id);
        return { ...h, report_name: r?.name || 'Ad-hoc Export' };
      });
  }

  public static async createReport(
    orgId: string,
    userId: string,
    data: {
      dashboard_id?: string;
      name: string;
      description?: string;
      format: Report['format'];
      schedule_cron?: string;
      recipients: string[];
      filter_config?: Record<string, any>;
    }
  ): Promise<Report> {
    const report: Report = {
      id: uuidv4(),
      org_id: orgId,
      dashboard_id: data.dashboard_id || null,
      name: data.name,
      description: data.description || null,
      format: data.format || 'pdf',
      schedule_cron: data.schedule_cron || null,
      is_active: true,
      recipients: data.recipients || [],
      filter_config: data.filter_config || {},
      last_generated_at: null,
      next_run_at: data.schedule_cron ? new Date(Date.now() + 86400000).toISOString() : null,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isUsingPostgres()) {
      const pool = getDbPool();
      if (pool) {
        await pool.query(
          `INSERT INTO reports (id, org_id, dashboard_id, name, description, format, schedule_cron, is_active, recipients, filter_config, next_run_at, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            report.id,
            report.org_id,
            report.dashboard_id,
            report.name,
            report.description,
            report.format,
            report.schedule_cron,
            report.is_active,
            JSON.stringify(report.recipients),
            JSON.stringify(report.filter_config),
            report.next_run_at,
            report.created_by,
          ]
        );
      }
    } else {
      memoryDb.reports.unshift(report);
    }

    return report;
  }

  public static async generateReportNow(
    reportId: string,
    orgId: string,
    userId: string
  ): Promise<{ history: ReportHistory; content: Buffer | string; contentType: string; filename: string }> {
    const startTime = Date.now();
    const report = memoryDb.reports.find((r) => r.id === reportId && r.org_id === orgId);
    if (!report) throw new Error('Report schedule not found');

    const dashboardId = report.dashboard_id || memoryDb.dashboards[0]?.id;
    const dashboard = await DashboardsService.getDashboardById(dashboardId, orgId, true);
    if (!dashboard) throw new Error('Dashboard for report not found');

    const org = memoryDb.organizations.find((o) => o.id === orgId);
    const orgName = org?.name || 'Apex Analytics';

    let content: Buffer | string = '';
    let contentType = 'application/pdf';
    let fileExtension = 'pdf';

    if (report.format === 'excel') {
      content = await ReportGenerator.generateExcel(dashboard, orgName);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileExtension = 'xlsx';
    } else if (report.format === 'csv') {
      const allRows = dashboard.widgets?.flatMap((w) => w.data?.rows || []) || [];
      content = ReportGenerator.generateCsv(allRows);
      contentType = 'text/csv';
      fileExtension = 'csv';
    } else {
      content = ReportGenerator.generatePdfHtml(dashboard, orgName);
      contentType = 'text/html'; // or application/pdf buffer
      fileExtension = 'html';
    }

    const durationMs = Date.now() - startTime;
    const filename = `${report.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.${fileExtension}`;
    const fileUrl = `/exports/${filename}`;

    const historyRecord: ReportHistory = {
      id: uuidv4(),
      report_id: report.id,
      org_id: orgId,
      status: 'completed',
      file_url: fileUrl,
      file_size_bytes: typeof content === 'string' ? Buffer.byteLength(content) : content.length,
      generated_at: new Date().toISOString(),
      duration_ms: durationMs,
      recipients_sent: report.recipients,
      created_by: userId,
      report_name: report.name,
    };

    memoryDb.report_history.unshift(historyRecord);
    report.last_generated_at = new Date().toISOString();

    logger.info(`Generated report [${report.name}] in ${durationMs}ms for ${report.recipients.length} recipients.`);

    return { history: historyRecord, content, contentType, filename };
  }
}
