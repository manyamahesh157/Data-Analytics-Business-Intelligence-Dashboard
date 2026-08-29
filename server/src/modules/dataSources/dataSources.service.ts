import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { memoryDb, isUsingPostgres, getDbPool } from '../../db/connection';
import { DataSource, ImportJob, ImportedDataset, DatasetColumn } from '../../types';
import { emitImportProgress } from '../realtime/socketServer';
import { logger } from '../../config/logger';

export class DataSourcesService {
  public static async listDataSources(orgId: string): Promise<DataSource[]> {
    if (isUsingPostgres()) {
      const pool = getDbPool();
      if (pool) {
        const res = await pool.query('SELECT * FROM data_sources WHERE org_id = $1 ORDER BY created_at DESC', [orgId]);
        return res.rows;
      }
    }
    return memoryDb.data_sources.filter((ds) => ds.org_id === orgId);
  }

  public static async getDataSourceById(id: string, orgId: string): Promise<DataSource | null> {
    if (isUsingPostgres()) {
      const pool = getDbPool();
      if (pool) {
        const res = await pool.query('SELECT * FROM data_sources WHERE id = $1 AND org_id = $2', [id, orgId]);
        return res.rows[0] || null;
      }
    }
    return memoryDb.data_sources.find((ds) => ds.id === id && ds.org_id === orgId) || null;
  }

  public static async createDataSource(
    orgId: string,
    userId: string,
    data: { name: string; type: DataSource['type']; connection_settings: Record<string, any> }
  ): Promise<DataSource> {
    const newDs: DataSource = {
      id: uuidv4(),
      org_id: orgId,
      name: data.name,
      type: data.type,
      status: 'connected',
      connection_settings: data.connection_settings || {},
      last_synced_at: new Date().toISOString(),
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isUsingPostgres()) {
      const pool = getDbPool();
      if (pool) {
        const res = await pool.query(
          `INSERT INTO data_sources (id, org_id, name, type, status, connection_settings, last_synced_at, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
          [newDs.id, newDs.org_id, newDs.name, newDs.type, newDs.status, JSON.stringify(newDs.connection_settings), newDs.last_synced_at, newDs.created_by]
        );
        return res.rows[0];
      }
    }

    memoryDb.data_sources.unshift(newDs);
    return newDs;
  }

  public static async listImportJobs(orgId: string): Promise<ImportJob[]> {
    if (isUsingPostgres()) {
      const pool = getDbPool();
      if (pool) {
        const res = await pool.query(
          `SELECT j.*, d.name as data_source_name
           FROM import_jobs j
           JOIN data_sources d ON d.id = j.data_source_id
           WHERE j.org_id = $1 ORDER BY j.created_at DESC`,
          [orgId]
        );
        return res.rows;
      }
    }
    return memoryDb.import_jobs
      .filter((j) => j.org_id === orgId)
      .map((j) => {
        const ds = memoryDb.data_sources.find((d) => d.id === j.data_source_id);
        return { ...j, data_source_name: ds?.name || 'Unknown Source' };
      });
  }

  public static async listDatasets(orgId: string): Promise<ImportedDataset[]> {
    if (isUsingPostgres()) {
      const pool = getDbPool();
      if (pool) {
        const res = await pool.query('SELECT * FROM imported_datasets WHERE org_id = $1 ORDER BY created_at DESC', [orgId]);
        return res.rows;
      }
    }
    return memoryDb.imported_datasets.filter((ds) => ds.org_id === orgId);
  }

  public static async getDatasetById(id: string, orgId: string): Promise<ImportedDataset | null> {
    if (isUsingPostgres()) {
      const pool = getDbPool();
      if (pool) {
        const res = await pool.query('SELECT * FROM imported_datasets WHERE id = $1 AND org_id = $2', [id, orgId]);
        return res.rows[0] || null;
      }
    }
    return memoryDb.imported_datasets.find((ds) => ds.id === id && ds.org_id === orgId) || null;
  }

  // ============================================================================
  // ETL INGESTION PIPELINE (Extract -> Validate -> Transform -> Load)
  // ============================================================================
  public static async runEtlPipeline(
    orgId: string,
    userId: string,
    options: {
      dataSourceId?: string;
      sourceType: DataSource['type'];
      datasetName: string;
      tableName?: string;
      fileBuffer?: Buffer;
      fileName?: string;
      restConfig?: { endpoint: string; headers?: Record<string, string> };
      googleSheetsConfig?: { sheetUrl: string };
      customColumns?: DatasetColumn[];
    }
  ): Promise<{ job: ImportJob; dataset: ImportedDataset }> {
    const jobId = uuidv4();
    const datasetId = uuidv4();

    // 1. Create Data Source if not provided
    let dataSourceId = options.dataSourceId;
    if (!dataSourceId) {
      const ds = await this.createDataSource(orgId, userId, {
        name: options.datasetName + ' Source',
        type: options.sourceType,
        connection_settings: { filename: options.fileName, endpoint: options.restConfig?.endpoint },
      });
      dataSourceId = ds.id;
    }

    // 2. Initialize Import Job
    const job: ImportJob = {
      id: jobId,
      org_id: orgId,
      data_source_id: dataSourceId,
      status: 'processing',
      total_rows: 0,
      processed_rows: 0,
      error_count: 0,
      error_log: [],
      started_at: new Date().toISOString(),
      completed_at: null,
      created_by: userId,
      created_at: new Date().toISOString(),
    };

    memoryDb.import_jobs.unshift(job);
    emitImportProgress(orgId, { jobId, status: 'processing', progress: 10, processedRows: 0, totalRows: 0 });

    try {
      // Step A: EXTRACT
      let rawRows: any[] = [];

      if (options.sourceType === 'csv' && options.fileBuffer) {
        const text = options.fileBuffer.toString('utf-8');
        const parsed = Papa.parse(text, { header: true, dynamicTyping: true, skipEmptyLines: true });
        rawRows = parsed.data;
      } else if (options.sourceType === 'excel' && options.fileBuffer) {
        const workbook = XLSX.read(options.fileBuffer, { type: 'buffer' });
        const firstSheetName = workbook.SheetNames[0];
        rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName]);
      } else if (options.sourceType === 'rest_api' || options.sourceType === 'google_sheets') {
        // Synthetic realistic pull for external API / Google Sheets demo
        rawRows = [
          { date: '2026-01-01', revenue: 45000, cost: 18000, conversion_rate: 3.8, channel: 'Organic Search' },
          { date: '2026-01-02', revenue: 52000, cost: 21000, conversion_rate: 4.1, channel: 'Paid Ads' },
          { date: '2026-01-03', revenue: 49000, cost: 19500, conversion_rate: 3.9, channel: 'Email Newsletter' },
          { date: '2026-01-04', revenue: 61000, cost: 24000, conversion_rate: 4.5, channel: 'Social Media' },
          { date: '2026-01-05', revenue: 58000, cost: 22800, conversion_rate: 4.3, channel: 'Referral' },
          { date: '2026-01-06', revenue: 67000, cost: 26000, conversion_rate: 4.8, channel: 'Direct Traffic' },
        ];
      } else {
        throw new Error('Unsupported or empty ingestion payload provided.');
      }

      job.total_rows = rawRows.length;
      emitImportProgress(orgId, { jobId, status: 'processing', progress: 40, processedRows: 0, totalRows: rawRows.length });

      // Step B: VALIDATE & INFER SCHEMA
      const inferredSchema: DatasetColumn[] = [];
      if (rawRows.length > 0) {
        const firstRow = rawRows[0];
        for (const [key, value] of Object.entries(firstRow)) {
          let type: DatasetColumn['type'] = 'string';
          if (typeof value === 'number') {
            type = 'number';
          } else if (typeof value === 'boolean') {
            type = 'boolean';
          } else if (typeof value === 'string' && !isNaN(Date.parse(value)) && (value.includes('-') || value.includes('/'))) {
            type = 'date';
          }
          inferredSchema.push({ name: key, type });
        }
      }

      // Step C: TRANSFORM
      const transformedRows = rawRows.map((row, idx) => {
        const cleanRow: Record<string, any> = {};
        for (const col of inferredSchema) {
          const val = row[col.name];
          if (col.type === 'number') {
            cleanRow[col.name] = val === null || val === undefined || isNaN(Number(val)) ? 0 : Number(val);
          } else {
            cleanRow[col.name] = val ?? '';
          }
        }
        return cleanRow;
      });

      emitImportProgress(orgId, { jobId, status: 'processing', progress: 80, processedRows: transformedRows.length, totalRows: rawRows.length });

      // Step D: LOAD
      const tableName = options.tableName || options.datasetName.toLowerCase().replace(/[^a-z0-9_]/g, '_') + '_' + Date.now();
      const dataset: ImportedDataset = {
        id: datasetId,
        org_id: orgId,
        data_source_id: dataSourceId,
        import_job_id: jobId,
        name: options.datasetName,
        table_name: tableName,
        schema_definition: options.customColumns || inferredSchema,
        row_count: transformedRows.length,
        size_bytes: JSON.stringify(transformedRows).length,
        data_preview: transformedRows.slice(0, 10),
        raw_data: transformedRows,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (isUsingPostgres()) {
        const pool = getDbPool();
        if (pool) {
          await pool.query(
            `INSERT INTO imported_datasets (id, org_id, data_source_id, import_job_id, name, table_name, schema_definition, row_count, size_bytes, data_preview, raw_data)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              dataset.id,
              dataset.org_id,
              dataset.data_source_id,
              dataset.import_job_id,
              dataset.name,
              dataset.table_name,
              JSON.stringify(dataset.schema_definition),
              dataset.row_count,
              dataset.size_bytes,
              JSON.stringify(dataset.data_preview),
              JSON.stringify(dataset.raw_data),
            ]
          );
        }
      }

      memoryDb.imported_datasets.unshift(dataset);

      // Finalize Job
      job.status = 'completed';
      job.processed_rows = transformedRows.length;
      job.completed_at = new Date().toISOString();

      emitImportProgress(orgId, { jobId, status: 'completed', progress: 100, processedRows: transformedRows.length, totalRows: rawRows.length });
      logger.info(`ETL Import Job [${jobId}] completed successfully: ${transformedRows.length} rows loaded into dataset '${dataset.name}'.`);

      return { job, dataset };
    } catch (err: any) {
      job.status = 'failed';
      job.error_count = 1;
      job.error_log.push({ error: err.message });
      job.completed_at = new Date().toISOString();

      emitImportProgress(orgId, { jobId, status: 'failed', progress: 100, processedRows: job.processed_rows, totalRows: job.total_rows });
      logger.error(`ETL Import Job [${jobId}] failed: ${err.message}`);
      throw err;
    }
  }
}
