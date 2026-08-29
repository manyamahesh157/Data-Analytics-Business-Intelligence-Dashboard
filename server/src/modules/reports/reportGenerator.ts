import ExcelJS from 'exceljs';
import { memoryDb } from '../../db/connection';
import { Dashboard } from '../../types';

export class ReportGenerator {
  /**
   * Generates a styled Excel workbook from dashboard widgets and dataset data.
   */
  public static async generateExcel(dashboard: Dashboard, orgName: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Apex BI Platform';
    workbook.created = new Date();

    // Summary Sheet
    const summarySheet = workbook.addWorksheet('Dashboard Overview');
    summarySheet.columns = [
      { header: 'Property', key: 'prop', width: 25 },
      { header: 'Value', key: 'val', width: 45 },
    ];

    summarySheet.addRow({ prop: 'Dashboard Title', val: dashboard.title });
    summarySheet.addRow({ prop: 'Description', val: dashboard.description || 'N/A' });
    summarySheet.addRow({ prop: 'Organization', val: orgName });
    summarySheet.addRow({ prop: 'Export Generated', val: new Date().toUTCString() });
    summarySheet.addRow({ prop: 'Total Widgets', val: dashboard.widgets?.length || 0 });

    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };

    // Sheets for each table/chart widget with data
    if (dashboard.widgets && dashboard.widgets.length > 0) {
      for (const widget of dashboard.widgets) {
        if (widget.data && widget.data.rows && widget.data.rows.length > 0) {
          const sheetTitle = (widget.title || 'Widget Data').slice(0, 30).replace(/[:\\\/\?\*\[\]]/g, '_');
          const sheet = workbook.addWorksheet(sheetTitle);

          const cols = widget.data.columns || Object.keys(widget.data.rows[0]);
          sheet.columns = cols.map((col: string) => ({
            header: col.toUpperCase().replace(/_/g, ' '),
            key: col,
            width: 20,
          }));

          sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
          sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };

          for (const row of widget.data.rows) {
            sheet.addRow(row);
          }
        }
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Generates a clean CSV file from a widget's query result or dataset.
   */
  public static generateCsv(rows: Record<string, any>[]): string {
    if (rows.length === 0) return '';
    const headers = Object.keys(rows[0]);
    const csvLines = [headers.join(',')];

    for (const row of rows) {
      const line = headers.map((h) => {
        const val = row[h];
        if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val ?? '';
      });
      csvLines.push(line.join(','));
    }

    return csvLines.join('\n');
  }

  /**
   * Generates a printable HTML document designed for crisp PDF rendering.
   */
  public static generatePdfHtml(dashboard: Dashboard, orgName: string): string {
    const widgetsHtml = (dashboard.widgets || [])
      .map(
        (w) => `
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
            ${w.title} <span style="font-size: 12px; color: #64748b; font-weight: normal; margin-left: 8px;">(${w.type.toUpperCase()})</span>
          </div>
          ${
            w.data?.rows?.length > 0
              ? `
            <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
              <thead>
                <tr style="background: #f8fafc; color: #475569;">
                  ${(w.data.columns || Object.keys(w.data.rows[0]))
                    .map((c: string) => `<th style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${c.toUpperCase()}</th>`)
                    .join('')}
                </tr>
              </thead>
              <tbody>
                ${w.data.rows
                  .slice(0, 10)
                  .map(
                    (r: any) => `
                  <tr>
                    ${(w.data.columns || Object.keys(r))
                      .map((c: string) => `<td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #334155;">${r[c]}</td>`)
                      .join('')}
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
            `
              : `<p style="color: #94a3b8; font-size: 13px;">No data recorded</p>`
          }
        </div>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>${dashboard.title} - Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 40px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #3b82f6; padding-bottom: 16px; margin-bottom: 24px; }
          .title { font-size: 24px; font-weight: 700; color: #0f172a; }
          .meta { font-size: 13px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">${dashboard.title}</div>
            <div class="meta">${dashboard.description || 'Executive Business Intelligence Report'}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 600; color: #3b82f6; font-size: 16px;">${orgName}</div>
            <div class="meta">Generated: ${new Date().toUTCString()}</div>
          </div>
        </div>
        <div>
          ${widgetsHtml}
        </div>
      </body>
      </html>
    `;
  }
}
