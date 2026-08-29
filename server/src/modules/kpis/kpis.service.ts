import { v4 as uuidv4 } from 'uuid';
import { memoryDb, isUsingPostgres, getDbPool } from '../../db/connection';
import { KPIDefinition, KPIAlert, KPIValue } from '../../types';
import { KpiEngine } from './kpiEngine';

export class KpisService {
  public static async listKpis(orgId: string): Promise<KPIDefinition[]> {
    let definitions: KPIDefinition[] = [];

    if (isUsingPostgres()) {
      const pool = getDbPool();
      if (pool) {
        const res = await pool.query('SELECT * FROM kpi_definitions WHERE org_id = $1 ORDER BY created_at ASC', [orgId]);
        definitions = res.rows;
      }
    } else {
      definitions = memoryDb.kpi_definitions.filter((k) => k.org_id === orgId);
    }

    // Attach latest reading and historical sparkline series
    const enriched = definitions.map((kpi) => {
      const values = memoryDb.kpi_values
        .filter((v) => v.kpi_id === kpi.id)
        .sort((a, b) => new Date(a.period_start).getTime() - new Date(b.period_start).getTime());

      const latest = values[values.length - 1];

      return {
        ...kpi,
        current_value: latest ? Number(latest.value) : (kpi.target_value ? Number(kpi.target_value) : 0),
        delta_previous: latest ? Number(latest.delta_previous) : 0,
        delta_percentage: latest ? Number(latest.delta_percentage) : 0,
        status: latest ? latest.status : 'healthy',
        history: values.slice(-12),
      };
    });

    return enriched;
  }

  public static async getKpiById(id: string, orgId: string): Promise<KPIDefinition | null> {
    const list = await this.listKpis(orgId);
    return list.find((k) => k.id === id) || null;
  }

  public static async createKpi(
    orgId: string,
    userId: string,
    data: {
      dataset_id?: string;
      name: string;
      code: string;
      description?: string;
      formula_type: KPIDefinition['formula_type'];
      formula_expression?: string;
      metric_column?: string;
      target_value?: number;
      warning_threshold?: number;
      critical_threshold?: number;
      unit?: string;
      format?: KPIDefinition['format'];
      period_type: KPIDefinition['period_type'];
    }
  ): Promise<KPIDefinition> {
    const kpi: KPIDefinition = {
      id: uuidv4(),
      org_id: orgId,
      dataset_id: data.dataset_id || null,
      name: data.name,
      code: data.code.toUpperCase(),
      description: data.description || null,
      formula_type: data.formula_type || 'sum',
      formula_expression: data.formula_expression || null,
      metric_column: data.metric_column || null,
      target_value: data.target_value ?? null,
      warning_threshold: data.warning_threshold ?? null,
      critical_threshold: data.critical_threshold ?? null,
      unit: data.unit || '$',
      format: data.format || 'currency',
      period_type: data.period_type || 'monthly',
      is_active: true,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isUsingPostgres()) {
      const pool = getDbPool();
      if (pool) {
        await pool.query(
          `INSERT INTO kpi_definitions (id, org_id, dataset_id, name, code, description, formula_type, formula_expression, metric_column, target_value, warning_threshold, critical_threshold, unit, format, period_type, is_active, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
          [
            kpi.id,
            kpi.org_id,
            kpi.dataset_id,
            kpi.name,
            kpi.code,
            kpi.description,
            kpi.formula_type,
            kpi.formula_expression,
            kpi.metric_column,
            kpi.target_value,
            kpi.warning_threshold,
            kpi.critical_threshold,
            kpi.unit,
            kpi.format,
            kpi.period_type,
            kpi.is_active,
            kpi.created_by,
          ]
        );
      }
    } else {
      memoryDb.kpi_definitions.push(kpi);
    }

    // Run initial calculation
    await KpiEngine.calculateKpi(kpi);

    return (await this.getKpiById(kpi.id, orgId))!;
  }

  public static async recalculateKpi(id: string, orgId: string) {
    const kpi = memoryDb.kpi_definitions.find((k) => k.id === id && k.org_id === orgId);
    if (!kpi) throw new Error('KPI definition not found');
    return await KpiEngine.calculateKpi(kpi);
  }

  public static async listAlerts(orgId: string): Promise<KPIAlert[]> {
    if (isUsingPostgres()) {
      const pool = getDbPool();
      if (pool) {
        const res = await pool.query(
          `SELECT a.*, d.name as kpi_name, d.code as kpi_code
           FROM kpi_alerts a
           JOIN kpi_definitions d ON d.id = a.kpi_id
           WHERE a.org_id = $1 ORDER BY a.triggered_at DESC`,
          [orgId]
        );
        return res.rows;
      }
    }
    return memoryDb.kpi_alerts.filter((a) => a.org_id === orgId);
  }

  public static async acknowledgeAlert(alertId: string, orgId: string, userId: string): Promise<KPIAlert | null> {
    const alert = memoryDb.kpi_alerts.find((a) => a.id === alertId && a.org_id === orgId);
    if (!alert) return null;

    alert.status = 'acknowledged';
    alert.acknowledged_by = userId;
    alert.acknowledged_at = new Date().toISOString();
    return alert;
  }

  public static async resolveAlert(alertId: string, orgId: string): Promise<KPIAlert | null> {
    const alert = memoryDb.kpi_alerts.find((a) => a.id === alertId && a.org_id === orgId);
    if (!alert) return null;

    alert.status = 'resolved';
    alert.resolved_at = new Date().toISOString();
    return alert;
  }
}
