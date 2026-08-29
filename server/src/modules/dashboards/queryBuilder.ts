import crypto from 'crypto';
import { WidgetQueryConfig, ImportedDataset } from '../../types';
import { getCache, setCache } from '../../db/redis';
import { memoryDb, isUsingPostgres, getDbPool } from '../../db/connection';
import { logger } from '../../config/logger';

export interface QueryExecutionResult {
  datasetName: string;
  rowCount: number;
  columns: string[];
  rows: Record<string, any>[];
  cached: boolean;
  executionTimeMs: number;
}

export class SafeQueryBuilder {
  /**
   * Generates a deterministic cache key based on org, dataset, and query parameters.
   */
  private static generateCacheKey(orgId: string, datasetId: string, queryConfig: WidgetQueryConfig): string {
    const hash = crypto.createHash('md5').update(JSON.stringify(queryConfig)).digest('hex');
    return `query:${orgId}:${datasetId}:${hash}`;
  }

  /**
   * Executes a safe, parameterized analytics query against the imported dataset.
   */
  public static async executeWidgetQuery(
    orgId: string,
    datasetId: string,
    queryConfig: WidgetQueryConfig
  ): Promise<QueryExecutionResult> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(orgId, datasetId, queryConfig);

    // 1. Check Redis Cache
    const cachedResult = await getCache<QueryExecutionResult>(cacheKey);
    if (cachedResult) {
      return {
        ...cachedResult,
        cached: true,
        executionTimeMs: Date.now() - startTime,
      };
    }

    // 2. Fetch dataset definition
    let dataset: ImportedDataset | null = null;
    if (isUsingPostgres()) {
      const pool = getDbPool();
      if (pool) {
        const res = await pool.query('SELECT * FROM imported_datasets WHERE id = $1 AND org_id = $2', [datasetId, orgId]);
        dataset = res.rows[0] || null;
      }
    } else {
      dataset = memoryDb.imported_datasets.find((ds) => ds.id === datasetId && ds.org_id === orgId) || null;
    }

    if (!dataset) {
      throw new Error(`Dataset [${datasetId}] not found for organization [${orgId}]`);
    }

    // Whitelist valid schema columns to guarantee safe SQL/in-memory execution
    const validColumnNames = new Set(dataset.schema_definition.map((c) => c.name));

    // Sanitize requested metrics and dimensions against column whitelist
    const safeMetrics = (queryConfig.metrics || []).filter((m) => validColumnNames.has(m));
    const safeDimensions = (queryConfig.dimensions || []).filter((d) => validColumnNames.has(d));
    const safeGroupBy = (queryConfig.groupBy || []).filter((g) => validColumnNames.has(g));

    const rawData: any[] = dataset.raw_data || [];
    let processedRows = [...rawData];

    // Apply Filter Expressions Safely
    if (queryConfig.filters && queryConfig.filters.length > 0) {
      for (const filter of queryConfig.filters) {
        if (!validColumnNames.has(filter.field)) continue;

        processedRows = processedRows.filter((row) => {
          const val = row[filter.field];
          switch (filter.operator) {
            case 'eq':
              return val == filter.value;
            case 'neq':
              return val != filter.value;
            case 'gt':
              return Number(val) > Number(filter.value);
            case 'gte':
              return Number(val) >= Number(filter.value);
            case 'lt':
              return Number(val) < Number(filter.value);
            case 'lte':
              return Number(val) <= Number(filter.value);
            case 'contains':
              return String(val).toLowerCase().includes(String(filter.value).toLowerCase());
            case 'in':
              return Array.isArray(filter.value) ? filter.value.includes(val) : val == filter.value;
            default:
              return true;
          }
        });
      }
    }

    // Apply Group By & Aggregations
    if (safeGroupBy.length > 0 && safeMetrics.length > 0) {
      const groups = new Map<string, Record<string, any>>();

      for (const row of processedRows) {
        const groupKey = safeGroupBy.map((g) => row[g]).join('|||');
        if (!groups.has(groupKey)) {
          const groupInit: Record<string, any> = {};
          safeGroupBy.forEach((g) => (groupInit[g] = row[g]));
          safeMetrics.forEach((m) => (groupInit[m] = 0));
          groupInit['__count'] = 0;
          groups.set(groupKey, groupInit);
        }

        const groupObj = groups.get(groupKey)!;
        safeMetrics.forEach((m) => {
          groupObj[m] += Number(row[m]) || 0;
        });
        groupObj['__count'] += 1;
      }

      processedRows = Array.from(groups.values());
    }

    // Apply Sorting
    if (queryConfig.sort && queryConfig.sort.length > 0) {
      for (const s of queryConfig.sort) {
        if (validColumnNames.has(s.field)) {
          const dir = s.direction === 'DESC' ? -1 : 1;
          processedRows.sort((a, b) => {
            if (a[s.field] < b[s.field]) return -1 * dir;
            if (a[s.field] > b[s.field]) return 1 * dir;
            return 0;
          });
        }
      }
    }

    // Apply Limit
    const limit = Math.min(queryConfig.limit || 100, 1000);
    processedRows = processedRows.slice(0, limit);

    // Filter output attributes to selected dimensions + metrics
    const outputColumns = safeDimensions.concat(safeMetrics);
    const finalRows = processedRows.map((row) => {
      if (outputColumns.length === 0) return row;
      const res: Record<string, any> = {};
      for (const col of outputColumns) {
        res[col] = row[col];
      }
      return res;
    });

    const executionTimeMs = Date.now() - startTime;
    const result: QueryExecutionResult = {
      datasetName: dataset.name,
      rowCount: finalRows.length,
      columns: outputColumns.length > 0 ? outputColumns : Object.keys(finalRows[0] || {}),
      rows: finalRows,
      cached: false,
      executionTimeMs,
    };

    // Cache result in Redis for 60 seconds
    await setCache(cacheKey, result, 60);

    return result;
  }
}
