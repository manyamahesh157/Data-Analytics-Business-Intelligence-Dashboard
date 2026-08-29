import { v4 as uuidv4 } from 'uuid';
import { memoryDb, isUsingPostgres, getDbPool } from '../../db/connection';
import { Dashboard, Widget, WidgetGridLayout, WidgetQueryConfig, WidgetVisualConfig } from '../../types';
import { SafeQueryBuilder } from './queryBuilder';
import { emitWidgetRefresh } from '../realtime/socketServer';
import { invalidateCache } from '../../db/redis';

export class DashboardsService {
  public static async listDashboards(orgId: string): Promise<Dashboard[]> {
    if (isUsingPostgres()) {
      const pool = getDbPool();
      if (pool) {
        const res = await pool.query('SELECT * FROM dashboards WHERE org_id = $1 ORDER BY is_default DESC, created_at DESC', [orgId]);
        return res.rows;
      }
    }
    return memoryDb.dashboards.filter((d) => d.org_id === orgId);
  }

  public static async getDashboardById(id: string, orgId: string, executeWidgets: boolean = true): Promise<Dashboard | null> {
    let dashboard: Dashboard | null = null;
    let widgets: Widget[] = [];

    if (isUsingPostgres()) {
      const pool = getDbPool();
      if (pool) {
        const dRes = await pool.query('SELECT * FROM dashboards WHERE id = $1 AND org_id = $2', [id, orgId]);
        dashboard = dRes.rows[0] || null;

        if (dashboard) {
          const wRes = await pool.query('SELECT * FROM widgets WHERE dashboard_id = $1 AND org_id = $2 ORDER BY created_at ASC', [id, orgId]);
          widgets = wRes.rows;
        }
      }
    } else {
      dashboard = memoryDb.dashboards.find((d) => d.id === id && d.org_id === orgId) || null;
      if (dashboard) {
        widgets = memoryDb.widgets.filter((w) => w.dashboard_id === id && w.org_id === orgId);
      }
    }

    if (!dashboard) return null;

    // Execute widget queries if requested
    if (executeWidgets) {
      const populatedWidgets = await Promise.all(
        widgets.map(async (widget) => {
          if (widget.dataset_id) {
            try {
              const queryResult = await SafeQueryBuilder.executeWidgetQuery(orgId, widget.dataset_id, widget.query_config);
              return { ...widget, data: queryResult };
            } catch (err: any) {
              return { ...widget, data: { rows: [], error: err.message } };
            }
          }
          return widget;
        })
      );
      return { ...dashboard, widgets: populatedWidgets };
    }

    return { ...dashboard, widgets };
  }

  public static async createDashboard(
    orgId: string,
    userId: string,
    data: { title: string; description?: string; layout_config?: any; is_default?: boolean; is_public?: boolean }
  ): Promise<Dashboard> {
    const dashboard: Dashboard = {
      id: uuidv4(),
      org_id: orgId,
      title: data.title,
      description: data.description || null,
      layout_config: data.layout_config || { cols: 12, rowHeight: 90, compactType: 'vertical' },
      is_default: data.is_default || false,
      is_public: data.is_public ?? true,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      widgets: [],
    };

    if (isUsingPostgres()) {
      const pool = getDbPool();
      if (pool) {
        const res = await pool.query(
          `INSERT INTO dashboards (id, org_id, title, description, layout_config, is_default, is_public, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
          [
            dashboard.id,
            dashboard.org_id,
            dashboard.title,
            dashboard.description,
            JSON.stringify(dashboard.layout_config),
            dashboard.is_default,
            dashboard.is_public,
            dashboard.created_by,
          ]
        );
        return { ...res.rows[0], widgets: [] };
      }
    }

    memoryDb.dashboards.unshift(dashboard);
    return dashboard;
  }

  public static async updateDashboard(
    id: string,
    orgId: string,
    data: Partial<Dashboard>
  ): Promise<Dashboard | null> {
    if (isUsingPostgres()) {
      const pool = getDbPool();
      if (pool) {
        const res = await pool.query(
          `UPDATE dashboards
           SET title = COALESCE($1, title),
               description = COALESCE($2, description),
               layout_config = COALESCE($3, layout_config),
               is_default = COALESCE($4, is_default),
               is_public = COALESCE($5, is_public),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $6 AND org_id = $7
           RETURNING *`,
          [
            data.title,
            data.description,
            data.layout_config ? JSON.stringify(data.layout_config) : null,
            data.is_default,
            data.is_public,
            id,
            orgId,
          ]
        );
        return res.rows[0] || null;
      }
    }

    const idx = memoryDb.dashboards.findIndex((d) => d.id === id && d.org_id === orgId);
    if (idx === -1) return null;

    memoryDb.dashboards[idx] = {
      ...memoryDb.dashboards[idx],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return memoryDb.dashboards[idx];
  }

  public static async deleteDashboard(id: string, orgId: string): Promise<boolean> {
    if (isUsingPostgres()) {
      const pool = getDbPool();
      if (pool) {
        const res = await pool.query('DELETE FROM dashboards WHERE id = $1 AND org_id = $2', [id, orgId]);
        return (res.rowCount ?? 0) > 0;
      }
    }

    const idx = memoryDb.dashboards.findIndex((d) => d.id === id && d.org_id === orgId);
    if (idx === -1) return false;

    memoryDb.dashboards.splice(idx, 1);
    memoryDb.widgets = memoryDb.widgets.filter((w) => w.dashboard_id !== id);
    return true;
  }

  // ============================================================================
  // WIDGET OPERATIONS
  // ============================================================================
  public static async createWidget(
    dashboardId: string,
    orgId: string,
    data: {
      dataset_id?: string;
      title: string;
      type: Widget['type'];
      grid_layout: WidgetGridLayout;
      query_config: WidgetQueryConfig;
      visual_config: WidgetVisualConfig;
      refresh_interval_seconds?: number;
    }
  ): Promise<Widget> {
    const widget: Widget = {
      id: uuidv4(),
      dashboard_id: dashboardId,
      org_id: orgId,
      dataset_id: data.dataset_id || null,
      title: data.title,
      type: data.type,
      grid_layout: data.grid_layout,
      query_config: data.query_config,
      visual_config: data.visual_config,
      refresh_interval_seconds: data.refresh_interval_seconds || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isUsingPostgres()) {
      const pool = getDbPool();
      if (pool) {
        await pool.query(
          `INSERT INTO widgets (id, dashboard_id, org_id, dataset_id, title, type, grid_layout, query_config, visual_config, refresh_interval_seconds)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            widget.id,
            widget.dashboard_id,
            widget.org_id,
            widget.dataset_id,
            widget.title,
            widget.type,
            JSON.stringify(widget.grid_layout),
            JSON.stringify(widget.query_config),
            JSON.stringify(widget.visual_config),
            widget.refresh_interval_seconds,
          ]
        );
      }
    } else {
      memoryDb.widgets.push(widget);
    }

    emitWidgetRefresh(orgId, dashboardId, widget.id);
    return widget;
  }

  public static async updateWidget(
    widgetId: string,
    dashboardId: string,
    orgId: string,
    data: Partial<Widget>
  ): Promise<Widget | null> {
    if (isUsingPostgres()) {
      const pool = getDbPool();
      if (pool) {
        const res = await pool.query(
          `UPDATE widgets
           SET title = COALESCE($1, title),
               type = COALESCE($2, type),
               grid_layout = COALESCE($3, grid_layout),
               query_config = COALESCE($4, query_config),
               visual_config = COALESCE($5, visual_config),
               refresh_interval_seconds = COALESCE($6, refresh_interval_seconds),
               dataset_id = COALESCE($7, dataset_id),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $8 AND dashboard_id = $9 AND org_id = $10
           RETURNING *`,
          [
            data.title,
            data.type,
            data.grid_layout ? JSON.stringify(data.grid_layout) : null,
            data.query_config ? JSON.stringify(data.query_config) : null,
            data.visual_config ? JSON.stringify(data.visual_config) : null,
            data.refresh_interval_seconds,
            data.dataset_id,
            widgetId,
            dashboardId,
            orgId,
          ]
        );
        emitWidgetRefresh(orgId, dashboardId, widgetId);
        return res.rows[0] || null;
      }
    }

    const idx = memoryDb.widgets.findIndex((w) => w.id === widgetId && w.dashboard_id === dashboardId && w.org_id === orgId);
    if (idx === -1) return null;

    memoryDb.widgets[idx] = {
      ...memoryDb.widgets[idx],
      ...data,
      updated_at: new Date().toISOString(),
    };

    emitWidgetRefresh(orgId, dashboardId, widgetId);
    return memoryDb.widgets[idx];
  }

  public static async batchUpdateLayouts(
    dashboardId: string,
    orgId: string,
    layouts: Array<{ id: string; grid_layout: WidgetGridLayout }>
  ): Promise<void> {
    for (const item of layouts) {
      if (isUsingPostgres()) {
        const pool = getDbPool();
        if (pool) {
          await pool.query(
            `UPDATE widgets SET grid_layout = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND dashboard_id = $3 AND org_id = $4`,
            [JSON.stringify(item.grid_layout), item.id, dashboardId, orgId]
          );
        }
      } else {
        const widget = memoryDb.widgets.find((w) => w.id === item.id && w.dashboard_id === dashboardId && w.org_id === orgId);
        if (widget) {
          widget.grid_layout = item.grid_layout;
          widget.updated_at = new Date().toISOString();
        }
      }
    }

    emitWidgetRefresh(orgId, dashboardId);
  }

  public static async deleteWidget(widgetId: string, dashboardId: string, orgId: string): Promise<boolean> {
    if (isUsingPostgres()) {
      const pool = getDbPool();
      if (pool) {
        const res = await pool.query('DELETE FROM widgets WHERE id = $1 AND dashboard_id = $2 AND org_id = $3', [widgetId, dashboardId, orgId]);
        emitWidgetRefresh(orgId, dashboardId);
        return (res.rowCount ?? 0) > 0;
      }
    }

    const idx = memoryDb.widgets.findIndex((w) => w.id === widgetId && w.dashboard_id === dashboardId && w.org_id === orgId);
    if (idx === -1) return false;

    memoryDb.widgets.splice(idx, 1);
    emitWidgetRefresh(orgId, dashboardId);
    return true;
  }
}
