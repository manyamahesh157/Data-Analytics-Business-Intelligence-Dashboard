export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'starter' | 'pro' | 'enterprise';
  settings: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  org_id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
  phone?: string | null;
  is_active: boolean;
  roles?: string[];
  permissions?: string[];
}

export interface DataSource {
  id: string;
  org_id: string;
  name: string;
  type: 'csv' | 'excel' | 'postgres' | 'mysql' | 'rest_api' | 'google_sheets';
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  connection_settings: Record<string, any>;
  last_synced_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ImportJob {
  id: string;
  org_id: string;
  data_source_id: string;
  data_source_name?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  total_rows: number;
  processed_rows: number;
  error_count: number;
  error_log: Array<{ row?: number; column?: string; error: string }>;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
}

export interface DatasetColumn {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
}

export interface ImportedDataset {
  id: string;
  org_id: string;
  data_source_id?: string | null;
  import_job_id?: string | null;
  name: string;
  table_name: string;
  schema_definition: DatasetColumn[];
  row_count: number;
  size_bytes: number;
  data_preview: Record<string, any>[];
  raw_data?: Record<string, any>[];
  created_at: string;
  updated_at: string;
}

export type WidgetType = 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'kpi_card' | 'table' | 'gauge';

export interface WidgetGridLayout {
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export interface WidgetQueryConfig {
  metrics: string[];
  dimensions: string[];
  filters?: Array<{ field: string; operator: string; value: any }>;
  sort?: Array<{ field: string; direction: 'ASC' | 'DESC' }>;
  groupBy?: string[];
  limit?: number;
}

export interface WidgetVisualConfig {
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  sparkline?: boolean;
  threshold?: number | null;
  gaugeMin?: number;
  gaugeMax?: number;
  numberFormat?: 'standard' | 'currency' | 'percentage' | 'compact' | 'duration';
}

export interface Widget {
  id: string;
  dashboard_id: string;
  org_id: string;
  dataset_id?: string | null;
  title: string;
  type: WidgetType;
  grid_layout: WidgetGridLayout;
  query_config: WidgetQueryConfig;
  visual_config: WidgetVisualConfig;
  refresh_interval_seconds: number;
  created_at: string;
  updated_at: string;
  data?: {
    datasetName?: string;
    rowCount?: number;
    columns?: string[];
    rows: Record<string, any>[];
    cached?: boolean;
    executionTimeMs?: number;
  };
}

export interface Dashboard {
  id: string;
  org_id: string;
  title: string;
  description?: string | null;
  layout_config: {
    cols: number;
    rowHeight: number;
    compactType?: 'vertical' | 'horizontal' | null;
    [key: string]: any;
  };
  is_default: boolean;
  is_public: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  widgets?: Widget[];
}

export interface KPIDefinition {
  id: string;
  org_id: string;
  dataset_id?: string | null;
  name: string;
  code: string;
  description?: string | null;
  formula_type: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'custom_sql';
  formula_expression?: string | null;
  metric_column?: string | null;
  target_value?: number | null;
  warning_threshold?: number | null;
  critical_threshold?: number | null;
  unit?: string;
  format?: 'currency' | 'percentage' | 'number' | 'duration';
  period_type: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  is_active: boolean;
  current_value?: number;
  delta_previous?: number;
  delta_percentage?: number;
  status?: 'healthy' | 'warning' | 'critical';
  history?: KPIValue[];
  created_at: string;
  updated_at: string;
}

export interface KPIValue {
  id: string;
  kpi_id: string;
  org_id: string;
  value: number;
  target_value?: number | null;
  delta_previous?: number | null;
  delta_percentage?: number | null;
  status: 'healthy' | 'warning' | 'critical';
  period_type: string;
  period_start: string;
  period_end: string;
  calculated_at: string;
}

export interface KPIAlert {
  id: string;
  kpi_id: string;
  org_id: string;
  alert_type: 'warning' | 'critical';
  message: string;
  current_value: number;
  threshold_value: number;
  status: 'active' | 'acknowledged' | 'resolved';
  channels: string[];
  triggered_at: string;
  kpi_name?: string;
  kpi_code?: string;
}

export interface Report {
  id: string;
  org_id: string;
  dashboard_id?: string | null;
  dashboard_title?: string;
  name: string;
  description?: string | null;
  format: 'pdf' | 'excel' | 'csv';
  schedule_cron?: string | null;
  is_active: boolean;
  recipients: string[];
  filter_config: Record<string, any>;
  last_generated_at?: string | null;
  next_run_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportHistory {
  id: string;
  report_id: string;
  org_id: string;
  report_name?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  file_url?: string | null;
  file_size_bytes?: number | null;
  generated_at: string;
  duration_ms?: number | null;
  recipients_sent: string[];
}

export interface AuditLog {
  id: string;
  org_id: string;
  user_id?: string | null;
  user_email?: string;
  first_name?: string;
  last_name?: string;
  action: string;
  entity: string;
  entity_id?: string | null;
  new_values?: Record<string, any> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp: string;
  };
}
