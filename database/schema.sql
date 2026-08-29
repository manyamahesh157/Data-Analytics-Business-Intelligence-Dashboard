-- ============================================================================
-- PRODUCTION BI & DATA ANALYTICS DASHBOARD PLATFORM
-- PostgreSQL Database Schema (DDL)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean existing objects (if re-running)
DROP MATERIALIZED VIEW IF EXISTS mv_kpi_monthly_aggregates CASCADE;
DROP TABLE IF EXISTS report_history CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS kpi_alerts CASCADE;
DROP TABLE IF EXISTS kpi_values CASCADE;
DROP TABLE IF EXISTS kpi_definitions CASCADE;
DROP TABLE IF EXISTS dashboard_permissions CASCADE;
DROP TABLE IF EXISTS widgets CASCADE;
DROP TABLE IF EXISTS dashboards CASCADE;
DROP TABLE IF EXISTS imported_datasets CASCADE;
DROP TABLE IF EXISTS import_jobs CASCADE;
DROP TABLE IF EXISTS data_sources CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Utility function for automatic updated_at timestamp management
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- 1. MULTI-TENANT ORGANIZATIONS & ACCESS CONTROL (RBAC)
-- ============================================================================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    plan VARCHAR(50) NOT NULL DEFAULT 'enterprise', -- 'starter', 'pro', 'enterprise'
    settings JSONB NOT NULL DEFAULT '{
        "theme": "dark",
        "timezone": "UTC",
        "currency": "USD",
        "dateFormat": "YYYY-MM-DD",
        "allowPublicDashboards": true,
        "retentionDays": 365
    }'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_organizations_slug ON organizations(slug);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    phone VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    refresh_token_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_org_email UNIQUE(org_id, email)
);

CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_users_email ON users(email);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_roles_org_name UNIQUE(org_id, name)
);

CREATE INDEX idx_roles_org_id ON roles(org_id);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- 'dashboards', 'kpis', 'data_sources', 'reports', 'users', 'settings'
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_permissions_code ON permissions(code);
CREATE INDEX idx_permissions_category ON permissions(category);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id, org_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
CREATE INDEX idx_user_roles_org ON user_roles(org_id);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- e.g. 'CREATE_DASHBOARD', 'UPDATE_KPI', 'RUN_IMPORT_JOB', 'LOGIN'
    entity VARCHAR(100) NOT NULL, -- e.g. 'dashboards', 'kpi_definitions', 'data_sources'
    entity_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity, entity_id);

-- ============================================================================
-- 2. MULTI-SOURCE DATA IMPORT & ETL INGESTION
-- ============================================================================

CREATE TABLE data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'csv', 'excel', 'postgres', 'mysql', 'rest_api', 'google_sheets'
    status VARCHAR(50) NOT NULL DEFAULT 'connected', -- 'connected', 'disconnected', 'error', 'syncing'
    connection_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_synced_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_data_sources_org_id ON data_sources(org_id);
CREATE INDEX idx_data_sources_type ON data_sources(type);

CREATE TABLE import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    data_source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
    total_rows INTEGER NOT NULL DEFAULT 0,
    processed_rows INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    error_log JSONB NOT NULL DEFAULT '[]'::jsonb,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_import_jobs_org_id ON import_jobs(org_id);
CREATE INDEX idx_import_jobs_data_source_id ON import_jobs(data_source_id);
CREATE INDEX idx_import_jobs_status ON import_jobs(status);
CREATE INDEX idx_import_jobs_created_at ON import_jobs(created_at DESC);

CREATE TABLE imported_datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    data_source_id UUID REFERENCES data_sources(id) ON DELETE SET NULL,
    import_job_id UUID REFERENCES import_jobs(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    table_name VARCHAR(128) NOT NULL,
    schema_definition JSONB NOT NULL, -- [{ name: "date", type: "date" }, { name: "revenue", type: "number" }]
    row_count INTEGER NOT NULL DEFAULT 0,
    size_bytes BIGINT NOT NULL DEFAULT 0,
    data_preview JSONB NOT NULL DEFAULT '[]'::jsonb,
    raw_data JSONB NOT NULL DEFAULT '[]'::jsonb, -- structured rows for query runner engine
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_imported_datasets_org_id ON imported_datasets(org_id);
CREATE INDEX idx_imported_datasets_data_source_id ON imported_datasets(data_source_id);

-- ============================================================================
-- 3. CUSTOM DASHBOARDS, WIDGETS & PERMISSIONS
-- ============================================================================

CREATE TABLE dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    layout_config JSONB NOT NULL DEFAULT '{"cols": 12, "rowHeight": 80, "compactType": "vertical"}'::jsonb,
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dashboards_org_id ON dashboards(org_id);
CREATE INDEX idx_dashboards_created_by ON dashboards(created_by);

CREATE TABLE widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    dataset_id UUID REFERENCES imported_datasets(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'line', 'bar', 'pie', 'area', 'scatter', 'kpi_card', 'table', 'gauge'
    grid_layout JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "w": 6, "h": 4, "minW": 2, "minH": 2}'::jsonb,
    query_config JSONB NOT NULL DEFAULT '{
        "metrics": [],
        "dimensions": [],
        "filters": [],
        "sort": [],
        "groupBy": [],
        "limit": 100
    }'::jsonb,
    visual_config JSONB NOT NULL DEFAULT '{
        "colors": ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"],
        "showLegend": true,
        "showGrid": true,
        "sparkline": true,
        "threshold": null,
        "gaugeMin": 0,
        "gaugeMax": 100,
        "numberFormat": "standard"
    }'::jsonb,
    refresh_interval_seconds INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_widgets_dashboard_id ON widgets(dashboard_id);
CREATE INDEX idx_widgets_org_id ON widgets(org_id);
CREATE INDEX idx_widgets_dataset_id ON widgets(dataset_id);

CREATE TABLE dashboard_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_level VARCHAR(50) NOT NULL DEFAULT 'viewer', -- 'viewer', 'editor', 'admin'
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_perm_target CHECK (
        (user_id IS NOT NULL AND role_id IS NULL) OR 
        (user_id IS NULL AND role_id IS NOT NULL)
    )
);

CREATE INDEX idx_dashboard_permissions_dashboard ON dashboard_permissions(dashboard_id);
CREATE INDEX idx_dashboard_permissions_user ON dashboard_permissions(user_id);
CREATE INDEX idx_dashboard_permissions_role ON dashboard_permissions(role_id);

-- ============================================================================
-- 4. KPI ENGINE, TIME-SERIES PARTITIONING & ALERTS
-- ============================================================================

CREATE TABLE kpi_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    dataset_id UUID REFERENCES imported_datasets(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL,
    description TEXT,
    formula_type VARCHAR(50) NOT NULL DEFAULT 'sum', -- 'sum', 'avg', 'count', 'min', 'max', 'custom_sql'
    formula_expression TEXT,
    metric_column VARCHAR(100),
    target_value NUMERIC(18, 4),
    warning_threshold NUMERIC(18, 4),
    critical_threshold NUMERIC(18, 4),
    unit VARCHAR(30) DEFAULT '$',
    format VARCHAR(50) DEFAULT 'currency', -- 'currency', 'percentage', 'number', 'duration'
    period_type VARCHAR(50) NOT NULL DEFAULT 'daily', -- 'hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_kpi_org_code UNIQUE(org_id, code)
);

CREATE INDEX idx_kpi_definitions_org_id ON kpi_definitions(org_id);
CREATE INDEX idx_kpi_definitions_code ON kpi_definitions(code);

-- Partitioned time-series table for KPI values
CREATE TABLE kpi_values (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    kpi_id UUID NOT NULL REFERENCES kpi_definitions(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    value NUMERIC(18, 4) NOT NULL,
    target_value NUMERIC(18, 4),
    delta_previous NUMERIC(18, 4),
    delta_percentage NUMERIC(8, 4),
    status VARCHAR(50) NOT NULL DEFAULT 'healthy', -- 'healthy', 'warning', 'critical'
    dimensions JSONB NOT NULL DEFAULT '{}'::jsonb,
    period_type VARCHAR(50) NOT NULL DEFAULT 'daily',
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, period_start)
) PARTITION BY RANGE (period_start);

-- Partitions by year/range
CREATE TABLE kpi_values_2024 PARTITION OF kpi_values
    FOR VALUES FROM ('2024-01-01 00:00:00+00') TO ('2025-01-01 00:00:00+00');

CREATE TABLE kpi_values_2025 PARTITION OF kpi_values
    FOR VALUES FROM ('2025-01-01 00:00:00+00') TO ('2026-01-01 00:00:00+00');

CREATE TABLE kpi_values_2026 PARTITION OF kpi_values
    FOR VALUES FROM ('2026-01-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE kpi_values_2027 PARTITION OF kpi_values
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2028-01-01 00:00:00+00');

CREATE TABLE kpi_values_default PARTITION OF kpi_values DEFAULT;

-- Partitioned table indexes
CREATE INDEX idx_kpi_values_org_kpi ON kpi_values(org_id, kpi_id, period_start DESC);
CREATE INDEX idx_kpi_values_period_start ON kpi_values(period_start DESC);
CREATE INDEX idx_kpi_values_status ON kpi_values(status);

CREATE TABLE kpi_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_id UUID NOT NULL REFERENCES kpi_definitions(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    kpi_value_id UUID,
    alert_type VARCHAR(50) NOT NULL, -- 'warning', 'critical'
    message TEXT NOT NULL,
    current_value NUMERIC(18, 4) NOT NULL,
    threshold_value NUMERIC(18, 4) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'acknowledged', 'resolved'
    channels JSONB NOT NULL DEFAULT '["email", "webhook"]'::jsonb,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_kpi_alerts_org_id ON kpi_alerts(org_id);
CREATE INDEX idx_kpi_alerts_kpi_id ON kpi_alerts(kpi_id);
CREATE INDEX idx_kpi_alerts_status ON kpi_alerts(status);
CREATE INDEX idx_kpi_alerts_triggered_at ON kpi_alerts(triggered_at DESC);

-- ============================================================================
-- 5. EXPORTABLE & SCHEDULED REPORTS
-- ============================================================================

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    dashboard_id UUID REFERENCES dashboards(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    format VARCHAR(50) NOT NULL DEFAULT 'pdf', -- 'pdf', 'excel', 'csv'
    schedule_cron VARCHAR(100), -- e.g. '0 9 * * 1' (Every Monday at 9am)
    is_active BOOLEAN NOT NULL DEFAULT true,
    recipients JSONB NOT NULL DEFAULT '[]'::jsonb, -- ['exec@company.com', 'team@company.com']
    filter_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_generated_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reports_org_id ON reports(org_id);
CREATE INDEX idx_reports_dashboard_id ON reports(dashboard_id);
CREATE INDEX idx_reports_is_active ON reports(is_active);

CREATE TABLE report_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'generating', 'completed', 'failed'
    file_url TEXT,
    file_size_bytes BIGINT,
    error_message TEXT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    duration_ms INTEGER,
    recipients_sent JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_report_history_report_id ON report_history(report_id);
CREATE INDEX idx_report_history_org_id ON report_history(org_id);
CREATE INDEX idx_report_history_generated_at ON report_history(generated_at DESC);

-- ============================================================================
-- 6. MATERIALIZED VIEWS & AUTOMATED TRIGGERS
-- ============================================================================

-- Heavy KPI monthly aggregation materialized view
CREATE MATERIALIZED VIEW mv_kpi_monthly_aggregates AS
SELECT 
    v.org_id,
    v.kpi_id,
    d.name AS kpi_name,
    d.code AS kpi_code,
    d.unit,
    d.format,
    DATE_TRUNC('month', v.period_start) AS month_start,
    COUNT(v.id) AS reading_count,
    AVG(v.value) AS avg_value,
    MIN(v.value) AS min_value,
    MAX(v.value) AS max_value,
    SUM(v.value) AS sum_value,
    AVG(v.target_value) AS avg_target_value,
    AVG(v.delta_percentage) AS avg_delta_percentage,
    COUNT(CASE WHEN v.status = 'warning' THEN 1 END) AS warning_count,
    COUNT(CASE WHEN v.status = 'critical' THEN 1 END) AS critical_count,
    MAX(v.calculated_at) AS last_calculated_at
FROM kpi_values v
JOIN kpi_definitions d ON d.id = v.kpi_id
GROUP BY v.org_id, v.kpi_id, d.name, d.code, d.unit, d.format, DATE_TRUNC('month', v.period_start);

CREATE UNIQUE INDEX idx_mv_kpi_monthly_agg_unique 
    ON mv_kpi_monthly_aggregates(org_id, kpi_id, month_start);

-- Automated updated_at triggers
CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_data_sources_updated_at BEFORE UPDATE ON data_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_imported_datasets_updated_at BEFORE UPDATE ON imported_datasets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_dashboards_updated_at BEFORE UPDATE ON dashboards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_widgets_updated_at BEFORE UPDATE ON widgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_kpi_definitions_updated_at BEFORE UPDATE ON kpi_definitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
