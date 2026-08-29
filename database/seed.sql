-- ============================================================================
-- PRODUCTION BI & DATA ANALYTICS DASHBOARD PLATFORM
-- PostgreSQL Seed Data
-- ============================================================================

-- Fixed UUIDs for predictable relational integrity
DO $$
DECLARE
    v_org_id UUID := 'a0000000-0000-0000-0000-000000000001';
    v_org2_id UUID := 'a0000000-0000-0000-0000-000000000002';
    
    v_user_admin_id UUID := 'b0000000-0000-0000-0000-000000000001';
    v_user_editor_id UUID := 'b0000000-0000-0000-0000-000000000002';
    v_user_viewer_id UUID := 'b0000000-0000-0000-0000-000000000003';
    
    v_role_admin_id UUID := 'c0000000-0000-0000-0000-000000000001';
    v_role_editor_id UUID := 'c0000000-0000-0000-0000-000000000002';
    v_role_viewer_id UUID := 'c0000000-0000-0000-0000-000000000003';

    v_ds_csv_id UUID := 'd0000000-0000-0000-0000-000000000001';
    v_ds_pg_id UUID := 'd0000000-0000-0000-0000-000000000002';
    v_ds_api_id UUID := 'd0000000-0000-0000-0000-000000000003';

    v_job_csv_id UUID := 'e0000000-0000-0000-0000-000000000001';
    v_job_pg_id UUID := 'e0000000-0000-0000-0000-000000000002';

    v_dataset_saas_id UUID := 'f0000000-0000-0000-0000-000000000001';
    v_dataset_ecom_id UUID := 'f0000000-0000-0000-0000-000000000002';

    v_dash_exec_id UUID := '10000000-0000-0000-0000-000000000001';
    v_dash_ecom_id UUID := '10000000-0000-0000-0000-000000000002';

    v_kpi_mrr_id UUID := '20000000-0000-0000-0000-000000000001';
    v_kpi_arr_id UUID := '20000000-0000-0000-0000-000000000002';
    v_kpi_nrr_id UUID := '20000000-0000-0000-0000-000000000003';
    v_kpi_cac_id UUID := '20000000-0000-0000-0000-000000000004';
    v_kpi_churn_id UUID := '20000000-0000-0000-0000-000000000005';

    -- Bcrypt hash for password: 'Password123!'
    v_pw_hash TEXT := '$2a$10$7EqJtq98hPqEX7fNZaFWoOZhB7eP42W5pM67M26A5sFf43X/hA56i';
BEGIN
    -- 1. Organizations
    INSERT INTO organizations (id, name, slug, plan, settings) VALUES
    (v_org_id, 'Apex Global Analytics Inc.', 'apex-analytics', 'enterprise', '{
        "theme": "dark",
        "timezone": "America/New_York",
        "currency": "USD",
        "dateFormat": "YYYY-MM-DD",
        "allowPublicDashboards": true,
        "retentionDays": 730
    }'::jsonb),
    (v_org2_id, 'Nexus FinTech Labs', 'nexus-fintech', 'pro', '{
        "theme": "light",
        "timezone": "Europe/London",
        "currency": "EUR",
        "dateFormat": "DD/MM/YYYY",
        "allowPublicDashboards": false,
        "retentionDays": 365
    }'::jsonb);

    -- 2. Roles
    INSERT INTO roles (id, org_id, name, description, is_system) VALUES
    (v_role_admin_id, v_org_id, 'Admin', 'Full administrative control across the organization', true),
    (v_role_editor_id, v_org_id, 'Editor', 'Can create and modify dashboards, KPIs, and reports', true),
    (v_role_viewer_id, v_org_id, 'Viewer', 'Read-only access to published dashboards and reports', true);

    -- 3. Permissions
    INSERT INTO permissions (id, code, name, description, category) VALUES
    ('30000000-0000-0000-0000-000000000001', 'dashboard:view', 'View Dashboards', 'View assigned and public dashboards', 'dashboards'),
    ('30000000-0000-0000-0000-000000000002', 'dashboard:create', 'Create Dashboards', 'Create new custom dashboards and widgets', 'dashboards'),
    ('30000000-0000-0000-0000-000000000003', 'dashboard:edit', 'Edit Dashboards', 'Modify existing dashboards and widget layouts', 'dashboards'),
    ('30000000-0000-0000-0000-000000000004', 'dashboard:delete', 'Delete Dashboards', 'Delete dashboards and associated widgets', 'dashboards'),
    ('30000000-0000-0000-0000-000000000005', 'kpi:view', 'View KPIs', 'View KPI monitoring cards and sparklines', 'kpis'),
    ('30000000-0000-0000-0000-000000000006', 'kpi:manage', 'Manage KPIs', 'Create, update, and configure KPI formulas & alert thresholds', 'kpis'),
    ('30000000-0000-0000-0000-000000000007', 'data:import', 'Import Data', 'Connect data sources and execute ETL import jobs', 'data_sources'),
    ('30000000-0000-0000-0000-000000000008', 'reports:generate', 'Generate Reports', 'Export and schedule automated PDF/Excel reports', 'reports'),
    ('30000000-0000-0000-0000-000000000009', 'org:admin', 'Organization Admin', 'Manage users, roles, audit logs, and organization settings', 'settings');

    -- Map Permissions to Roles
    -- Admin has all permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_role_admin_id, id FROM permissions;

    -- Editor has dashboard, kpi, data import, and report permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_role_editor_id, id FROM permissions WHERE code IN (
        'dashboard:view', 'dashboard:create', 'dashboard:edit',
        'kpi:view', 'kpi:manage', 'data:import', 'reports:generate'
    );

    -- Viewer has only view permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_role_viewer_id, id FROM permissions WHERE code IN ('dashboard:view', 'kpi:view');

    -- 4. Users
    INSERT INTO users (id, org_id, email, password_hash, first_name, last_name, avatar_url, is_active) VALUES
    (v_user_admin_id, v_org_id, 'admin@apex.io', v_pw_hash, 'Sarah', 'Connor', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', true),
    (v_user_editor_id, v_org_id, 'editor@apex.io', v_pw_hash, 'Marcus', 'Wright', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', true),
    (v_user_viewer_id, v_org_id, 'viewer@apex.io', v_pw_hash, 'Elena', 'Rostova', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', true);

    -- User Roles
    INSERT INTO user_roles (user_id, role_id, org_id) VALUES
    (v_user_admin_id, v_role_admin_id, v_org_id),
    (v_user_editor_id, v_role_editor_id, v_org_id),
    (v_user_viewer_id, v_role_viewer_id, v_org_id);

    -- 5. Data Sources
    INSERT INTO data_sources (id, org_id, name, type, status, connection_settings, last_synced_at, created_by) VALUES
    (v_ds_csv_id, v_org_id, 'SaaS Recurring Revenue 2025-2026', 'csv', 'connected', '{"filename": "saas_metrics_2026.csv", "delimiter": ",", "hasHeader": true}'::jsonb, CURRENT_TIMESTAMP, v_user_admin_id),
    (v_ds_pg_id, v_org_id, 'E-Commerce Transactions DB', 'postgres', 'connected', '{"host": "db.production.internal", "port": 5432, "database": "ecom_sales", "ssl": true}'::jsonb, CURRENT_TIMESTAMP, v_user_admin_id),
    (v_ds_api_id, v_org_id, 'Stripe Billing Live Sync', 'rest_api', 'connected', '{"endpoint": "https://api.stripe.com/v1/charges", "authType": "bearer", "pollIntervalMinutes": 60}'::jsonb, CURRENT_TIMESTAMP, v_user_editor_id);

    -- 6. Import Jobs
    INSERT INTO import_jobs (id, org_id, data_source_id, status, total_rows, processed_rows, error_count, started_at, completed_at, created_by) VALUES
    (v_job_csv_id, v_org_id, v_ds_csv_id, 'completed', 24, 24, 0, CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '1 hour 58 minutes', v_user_admin_id),
    (v_job_pg_id, v_org_id, v_ds_pg_id, 'completed', 1500, 1500, 0, CURRENT_TIMESTAMP - INTERVAL '4 hours', CURRENT_TIMESTAMP - INTERVAL '3 hour 50 minutes', v_user_admin_id);

    -- 7. Imported Datasets
    INSERT INTO imported_datasets (id, org_id, data_source_id, import_job_id, name, table_name, schema_definition, row_count, size_bytes, data_preview, raw_data) VALUES
    (v_dataset_saas_id, v_org_id, v_ds_csv_id, v_job_csv_id, 'SaaS Monthly Financials', 'saas_revenue_monthly', 
    '[
        {"name": "month", "type": "string"},
        {"name": "mrr", "type": "number"},
        {"name": "arr", "type": "number"},
        {"name": "churn_rate", "type": "number"},
        {"name": "new_customers", "type": "number"},
        {"name": "nrr", "type": "number"},
        {"name": "cac", "type": "number"},
        {"name": "ltv", "type": "number"}
    ]'::jsonb, 
    12, 14200, 
    '[
        {"month": "2025-09", "mrr": 115000, "arr": 1380000, "churn_rate": 1.9, "new_customers": 72, "nrr": 112.5, "cac": 480, "ltv": 5800},
        {"month": "2025-10", "mrr": 122000, "arr": 1464000, "churn_rate": 1.8, "new_customers": 85, "nrr": 114.1, "cac": 460, "ltv": 6100},
        {"month": "2025-11", "mrr": 131500, "arr": 1578000, "churn_rate": 1.6, "new_customers": 94, "nrr": 115.8, "cac": 440, "ltv": 6400},
        {"month": "2025-12", "mrr": 144000, "arr": 1728000, "churn_rate": 1.4, "new_customers": 110, "nrr": 117.2, "cac": 420, "ltv": 6800},
        {"month": "2026-01", "mrr": 153000, "arr": 1836000, "churn_rate": 1.5, "new_customers": 105, "nrr": 116.9, "cac": 410, "ltv": 7100},
        {"month": "2026-02", "mrr": 164500, "arr": 1974000, "churn_rate": 1.3, "new_customers": 118, "nrr": 118.4, "cac": 395, "ltv": 7500}
    ]'::jsonb,
    '[
        {"month": "2025-03", "mrr": 82000, "arr": 984000, "churn_rate": 2.4, "new_customers": 45, "nrr": 108.2, "cac": 540, "ltv": 4800},
        {"month": "2025-04", "mrr": 88000, "arr": 1056000, "churn_rate": 2.3, "new_customers": 52, "nrr": 109.0, "cac": 525, "ltv": 5000},
        {"month": "2025-05", "mrr": 94500, "arr": 1134000, "churn_rate": 2.1, "new_customers": 58, "nrr": 110.1, "cac": 510, "ltv": 5200},
        {"month": "2025-06", "mrr": 101000, "arr": 1212000, "churn_rate": 2.0, "new_customers": 63, "nrr": 111.4, "cac": 500, "ltv": 5450},
        {"month": "2025-07", "mrr": 108000, "arr": 1296000, "churn_rate": 1.9, "new_customers": 69, "nrr": 112.0, "cac": 490, "ltv": 5600},
        {"month": "2025-08", "mrr": 115000, "arr": 1380000, "churn_rate": 1.8, "new_customers": 75, "nrr": 113.2, "cac": 480, "ltv": 5850},
        {"month": "2025-09", "mrr": 122000, "arr": 1464000, "churn_rate": 1.8, "new_customers": 82, "nrr": 114.1, "cac": 460, "ltv": 6100},
        {"month": "2025-10", "mrr": 130000, "arr": 1560000, "churn_rate": 1.7, "new_customers": 90, "nrr": 115.0, "cac": 450, "ltv": 6300},
        {"month": "2025-11", "mrr": 139000, "arr": 1668000, "churn_rate": 1.6, "new_customers": 98, "nrr": 116.2, "cac": 435, "ltv": 6600},
        {"month": "2025-12", "mrr": 149500, "arr": 1794000, "churn_rate": 1.4, "new_customers": 115, "nrr": 117.8, "cac": 415, "ltv": 7000},
        {"month": "2026-01", "mrr": 158000, "arr": 1896000, "churn_rate": 1.5, "new_customers": 108, "nrr": 117.1, "cac": 405, "ltv": 7250},
        {"month": "2026-02", "mrr": 168200, "arr": 2018400, "churn_rate": 1.2, "new_customers": 126, "nrr": 119.3, "cac": 390, "ltv": 7800}
    ]'::jsonb),
    (v_dataset_ecom_id, v_org_id, v_ds_pg_id, v_job_pg_id, 'Global E-Commerce Sales', 'ecommerce_sales_daily',
    '[
        {"name": "region", "type": "string"},
        {"name": "category", "type": "string"},
        {"name": "sales", "type": "number"},
        {"name": "profit", "type": "number"},
        {"name": "orders", "type": "number"},
        {"name": "discount", "type": "number"}
    ]'::jsonb,
    8, 9800,
    '[
        {"region": "North America", "category": "Enterprise Software", "sales": 482000, "profit": 192800, "orders": 340, "discount": 8.5},
        {"region": "EMEA", "category": "Enterprise Software", "sales": 320000, "profit": 118400, "orders": 210, "discount": 10.0},
        {"region": "APAC", "category": "Cloud Infrastructure", "sales": 290000, "profit": 98600, "orders": 185, "discount": 12.0},
        {"region": "North America", "category": "Cloud Infrastructure", "sales": 540000, "profit": 226800, "orders": 410, "discount": 7.0}
    ]'::jsonb,
    '[
        {"region": "North America", "category": "Enterprise Software", "sales": 482000, "profit": 192800, "orders": 340, "discount": 8.5},
        {"region": "EMEA", "category": "Enterprise Software", "sales": 320000, "profit": 118400, "orders": 210, "discount": 10.0},
        {"region": "APAC", "category": "Cloud Infrastructure", "sales": 290000, "profit": 98600, "orders": 185, "discount": 12.0},
        {"region": "North America", "category": "Cloud Infrastructure", "sales": 540000, "profit": 226800, "orders": 410, "discount": 7.0},
        {"region": "LATAM", "category": "Analytics Tools", "sales": 145000, "profit": 46400, "orders": 95, "discount": 14.5},
        {"region": "EMEA", "category": "Security Suite", "sales": 260000, "profit": 104000, "orders": 160, "discount": 9.0},
        {"region": "North America", "category": "Security Suite", "sales": 410000, "profit": 176300, "orders": 290, "discount": 6.5},
        {"region": "APAC", "category": "Enterprise Software", "sales": 215000, "profit": 73100, "orders": 140, "discount": 11.0}
    ]'::jsonb);

    -- 8. Dashboards
    INSERT INTO dashboards (id, org_id, title, description, layout_config, is_default, is_public, created_by) VALUES
    (v_dash_exec_id, v_org_id, 'Executive SaaS Performance Dashboard', 'Real-time overview of ARR, MRR expansion, churn velocity, and unit economics', '{"cols": 12, "rowHeight": 90, "compactType": "vertical"}'::jsonb, true, true, v_user_admin_id),
    (v_dash_ecom_id, v_org_id, 'Global Sales & Regional Profitability Matrix', 'Deep-dive into sales channel performance, product categories, and margin breakdown', '{"cols": 12, "rowHeight": 90, "compactType": "vertical"}'::jsonb, false, false, v_user_editor_id);

    -- 9. Widgets
    INSERT INTO widgets (id, dashboard_id, org_id, dataset_id, title, type, grid_layout, query_config, visual_config, refresh_interval_seconds) VALUES
    -- Executive Dashboard Widgets
    ('40000000-0000-0000-0000-000000000001', v_dash_exec_id, v_org_id, v_dataset_saas_id, 'MRR Growth Trend ($)', 'line', 
    '{"x": 0, "y": 0, "w": 8, "h": 4, "minW": 4, "minH": 3}'::jsonb,
    '{"metrics": ["mrr"], "dimensions": ["month"], "filters": [], "sort": [{"field": "month", "direction": "ASC"}], "limit": 12}'::jsonb,
    '{"colors": ["#3B82F6"], "showLegend": true, "showGrid": true, "sparkline": false, "numberFormat": "currency"}'::jsonb, 0),

    ('40000000-0000-0000-0000-000000000002', v_dash_exec_id, v_org_id, v_dataset_saas_id, 'Net Revenue Retention (%)', 'gauge',
    '{"x": 8, "y": 0, "w": 4, "h": 4, "minW": 3, "minH": 3}'::jsonb,
    '{"metrics": ["nrr"], "dimensions": [], "filters": [], "limit": 1}'::jsonb,
    '{"gaugeMin": 90, "gaugeMax": 140, "threshold": 115, "colors": ["#10B981"], "numberFormat": "percentage"}'::jsonb, 0),

    ('40000000-0000-0000-0000-000000000003', v_dash_exec_id, v_org_id, v_dataset_saas_id, 'New Customers vs Churn Rate', 'bar',
    '{"x": 0, "y": 4, "w": 6, "h": 4, "minW": 4, "minH": 3}'::jsonb,
    '{"metrics": ["new_customers", "churn_rate"], "dimensions": ["month"], "filters": [], "limit": 12}'::jsonb,
    '{"colors": ["#10B981", "#EF4444"], "showLegend": true, "showGrid": true, "numberFormat": "standard"}'::jsonb, 0),

    ('40000000-0000-0000-0000-000000000004', v_dash_exec_id, v_org_id, v_dataset_saas_id, 'CAC vs LTV Unit Economics', 'area',
    '{"x": 6, "y": 4, "w": 6, "h": 4, "minW": 4, "minH": 3}'::jsonb,
    '{"metrics": ["cac", "ltv"], "dimensions": ["month"], "filters": [], "limit": 12}'::jsonb,
    '{"colors": ["#F59E0B", "#8B5CF6"], "showLegend": true, "showGrid": true, "numberFormat": "currency"}'::jsonb, 0),

    ('40000000-0000-0000-0000-000000000005', v_dash_exec_id, v_org_id, v_dataset_saas_id, 'Monthly SaaS Performance Ledger', 'table',
    '{"x": 0, "y": 8, "w": 12, "h": 4, "minW": 6, "minH": 3}'::jsonb,
    '{"metrics": ["mrr", "arr", "churn_rate", "new_customers", "nrr", "cac", "ltv"], "dimensions": ["month"], "filters": [], "limit": 50}'::jsonb,
    '{"showGrid": true, "numberFormat": "standard"}'::jsonb, 0),

    -- E-Commerce Matrix Widgets
    ('40000000-0000-0000-0000-000000000006', v_dash_ecom_id, v_org_id, v_dataset_ecom_id, 'Revenue by Geographic Region', 'pie',
    '{"x": 0, "y": 0, "w": 6, "h": 4, "minW": 4, "minH": 3}'::jsonb,
    '{"metrics": ["sales"], "dimensions": ["region"], "groupBy": ["region"], "limit": 10}'::jsonb,
    '{"colors": ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"], "showLegend": true, "numberFormat": "currency"}'::jsonb, 0),

    ('40000000-0000-0000-0000-000000000007', v_dash_ecom_id, v_org_id, v_dataset_ecom_id, 'Profit Margin by Product Category', 'bar',
    '{"x": 6, "y": 0, "w": 6, "h": 4, "minW": 4, "minH": 3}'::jsonb,
    '{"metrics": ["profit"], "dimensions": ["category"], "groupBy": ["category"], "limit": 10}'::jsonb,
    '{"colors": ["#10B981"], "showLegend": false, "showGrid": true, "numberFormat": "currency"}'::jsonb, 0),

    ('40000000-0000-0000-0000-000000000008', v_dash_ecom_id, v_org_id, v_dataset_ecom_id, 'Discount vs Profit Correlation', 'scatter',
    '{"x": 0, "y": 4, "w": 6, "h": 4, "minW": 4, "minH": 3}'::jsonb,
    '{"metrics": ["discount", "profit"], "dimensions": ["category"], "filters": [], "limit": 50}'::jsonb,
    '{"colors": ["#EC4899"], "showLegend": true, "showGrid": true, "numberFormat": "standard"}'::jsonb, 0),

    ('40000000-0000-0000-0000-000000000009', v_dash_ecom_id, v_org_id, v_dataset_ecom_id, 'D3.js Regional Sales Treemap Breakdown', 'treemap',
    '{"x": 6, "y": 4, "w": 6, "h": 4, "minW": 4, "minH": 3}'::jsonb,
    '{"metrics": ["sales"], "dimensions": ["category", "region"], "groupBy": ["category", "region"], "limit": 20}'::jsonb,
    '{"colors": ["#3B82F6", "#10B981", "#F59E0B"], "showLegend": true, "numberFormat": "currency"}'::jsonb, 0);

    -- 10. KPI Definitions
    INSERT INTO kpi_definitions (id, org_id, dataset_id, name, code, description, formula_type, metric_column, target_value, warning_threshold, critical_threshold, unit, format, period_type, is_active, created_by) VALUES
    (v_kpi_mrr_id, v_org_id, v_dataset_saas_id, 'Monthly Recurring Revenue', 'MRR', 'Predictable monthly revenue generated by active subscriptions', 'sum', 'mrr', 180000, 140000, 110000, '$', 'currency', 'monthly', true, v_user_admin_id),
    (v_kpi_arr_id, v_org_id, v_dataset_saas_id, 'Annual Recurring Revenue', 'ARR', 'Annualized recurring revenue run rate', 'sum', 'arr', 2160000, 1680000, 1320000, '$', 'currency', 'monthly', true, v_user_admin_id),
    (v_kpi_nrr_id, v_org_id, v_dataset_saas_id, 'Net Revenue Retention Rate', 'NRR', 'Percentage of recurring revenue retained from existing customers', 'avg', 'nrr', 120.0, 110.0, 100.0, '%', 'percentage', 'monthly', true, v_user_admin_id),
    (v_kpi_cac_id, v_org_id, v_dataset_saas_id, 'Customer Acquisition Cost', 'CAC', 'Average cost required to acquire a new paying customer', 'avg', 'cac', 350.0, 450.0, 550.0, '$', 'currency', 'monthly', true, v_user_admin_id),
    (v_kpi_churn_id, v_org_id, v_dataset_saas_id, 'Customer Churn Rate', 'CHURN', 'Monthly percentage of customer cancellations', 'avg', 'churn_rate', 1.0, 2.0, 3.5, '%', 'percentage', 'monthly', true, v_user_admin_id);

    -- 11. KPI Values (Time-Series partitioned by period_start)
    -- Insert 2025 and 2026 data
    INSERT INTO kpi_values (kpi_id, org_id, value, target_value, delta_previous, delta_percentage, status, period_type, period_start, period_end, calculated_at) VALUES
    -- MRR History
    (v_kpi_mrr_id, v_org_id, 131500, 130000, 9500, 7.78, 'healthy', 'monthly', '2025-11-01 00:00:00+00', '2025-11-30 23:59:59+00', CURRENT_TIMESTAMP),
    (v_kpi_mrr_id, v_org_id, 144000, 140000, 12500, 9.50, 'healthy', 'monthly', '2025-12-01 00:00:00+00', '2025-12-31 23:59:59+00', CURRENT_TIMESTAMP),
    (v_kpi_mrr_id, v_org_id, 153000, 150000, 9000, 6.25, 'healthy', 'monthly', '2026-01-01 00:00:00+00', '2026-01-31 23:59:59+00', CURRENT_TIMESTAMP),
    (v_kpi_mrr_id, v_org_id, 168200, 165000, 15200, 9.93, 'healthy', 'monthly', '2026-02-01 00:00:00+00', '2026-02-28 23:59:59+00', CURRENT_TIMESTAMP),

    -- ARR History
    (v_kpi_arr_id, v_org_id, 1578000, 1560000, 114000, 7.78, 'healthy', 'monthly', '2025-11-01 00:00:00+00', '2025-11-30 23:59:59+00', CURRENT_TIMESTAMP),
    (v_kpi_arr_id, v_org_id, 1728000, 1680000, 150000, 9.50, 'healthy', 'monthly', '2025-12-01 00:00:00+00', '2025-12-31 23:59:59+00', CURRENT_TIMESTAMP),
    (v_kpi_arr_id, v_org_id, 1836000, 1800000, 108000, 6.25, 'healthy', 'monthly', '2026-01-01 00:00:00+00', '2026-01-31 23:59:59+00', CURRENT_TIMESTAMP),
    (v_kpi_arr_id, v_org_id, 2018400, 1980000, 182400, 9.93, 'healthy', 'monthly', '2026-02-01 00:00:00+00', '2026-02-28 23:59:59+00', CURRENT_TIMESTAMP),

    -- NRR History
    (v_kpi_nrr_id, v_org_id, 115.8, 120.0, 1.7, 1.48, 'warning', 'monthly', '2025-11-01 00:00:00+00', '2025-11-30 23:59:59+00', CURRENT_TIMESTAMP),
    (v_kpi_nrr_id, v_org_id, 117.2, 120.0, 1.4, 1.20, 'warning', 'monthly', '2025-12-01 00:00:00+00', '2025-12-31 23:59:59+00', CURRENT_TIMESTAMP),
    (v_kpi_nrr_id, v_org_id, 116.9, 120.0, -0.3, -0.25, 'warning', 'monthly', '2026-01-01 00:00:00+00', '2026-01-31 23:59:59+00', CURRENT_TIMESTAMP),
    (v_kpi_nrr_id, v_org_id, 119.3, 120.0, 2.4, 2.05, 'healthy', 'monthly', '2026-02-01 00:00:00+00', '2026-02-28 23:59:59+00', CURRENT_TIMESTAMP),

    -- CAC History
    (v_kpi_cac_id, v_org_id, 440.0, 350.0, -20.0, -4.34, 'healthy', 'monthly', '2025-11-01 00:00:00+00', '2025-11-30 23:59:59+00', CURRENT_TIMESTAMP),
    (v_kpi_cac_id, v_org_id, 420.0, 350.0, -20.0, -4.54, 'healthy', 'monthly', '2025-12-01 00:00:00+00', '2025-12-31 23:59:59+00', CURRENT_TIMESTAMP),
    (v_kpi_cac_id, v_org_id, 410.0, 350.0, -10.0, -2.38, 'healthy', 'monthly', '2026-01-01 00:00:00+00', '2026-01-31 23:59:59+00', CURRENT_TIMESTAMP),
    (v_kpi_cac_id, v_org_id, 390.0, 350.0, -20.0, -4.87, 'healthy', 'monthly', '2026-02-01 00:00:00+00', '2026-02-28 23:59:59+00', CURRENT_TIMESTAMP),

    -- Churn History
    (v_kpi_churn_id, v_org_id, 1.6, 1.0, -0.1, -5.88, 'warning', 'monthly', '2025-11-01 00:00:00+00', '2025-11-30 23:59:59+00', CURRENT_TIMESTAMP),
    (v_kpi_churn_id, v_org_id, 1.4, 1.0, -0.2, -12.5, 'warning', 'monthly', '2025-12-01 00:00:00+00', '2025-12-31 23:59:59+00', CURRENT_TIMESTAMP),
    (v_kpi_churn_id, v_org_id, 1.5, 1.0, 0.1, 7.14, 'warning', 'monthly', '2026-01-01 00:00:00+00', '2026-01-31 23:59:59+00', CURRENT_TIMESTAMP),
    (v_kpi_churn_id, v_org_id, 1.2, 1.0, -0.3, -20.0, 'healthy', 'monthly', '2026-02-01 00:00:00+00', '2026-02-28 23:59:59+00', CURRENT_TIMESTAMP);

    -- 12. KPI Alerts
    INSERT INTO kpi_alerts (id, kpi_id, org_id, alert_type, message, current_value, threshold_value, status, channels, triggered_at) VALUES
    ('50000000-0000-0000-0000-000000000001', v_kpi_nrr_id, v_org_id, 'warning', 'Net Revenue Retention (116.9%) dropped below target threshold (120.0%) for January 2026', 116.9, 120.0, 'acknowledged', '["email", "webhook"]'::jsonb, CURRENT_TIMESTAMP - INTERVAL '15 days'),
    ('50000000-0000-0000-0000-000000000002', v_kpi_churn_id, v_org_id, 'warning', 'Monthly Churn Rate (1.5%) exceeded target goal (1.0%)', 1.5, 1.0, 'active', '["email"]'::jsonb, CURRENT_TIMESTAMP - INTERVAL '2 days');

    -- 13. Reports
    INSERT INTO reports (id, org_id, dashboard_id, name, description, format, schedule_cron, is_active, recipients, filter_config, last_generated_at, next_run_at, created_by) VALUES
    ('60000000-0000-0000-0000-000000000001', v_org_id, v_dash_exec_id, 'Weekly SaaS Performance Briefing', 'Automated PDF export of executive metrics sent every Monday morning', 'pdf', '0 9 * * 1', true, '["exec-team@apex.io", "board@apex.io"]'::jsonb, '{"dateRange": "last_30_days"}'::jsonb, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP + INTERVAL '2 days', v_user_admin_id),
    ('60000000-0000-0000-0000-000000000002', v_org_id, v_dash_ecom_id, 'Monthly Regional Profitability Matrix', 'Comprehensive Excel spreadsheet with regional breakdowns and discount margins', 'excel', '0 8 1 * *', true, '["finance@apex.io"]'::jsonb, '{"dateRange": "month_to_date"}'::jsonb, CURRENT_TIMESTAMP - INTERVAL '28 days', CURRENT_TIMESTAMP + INTERVAL '2 days', v_user_editor_id);

    -- 14. Report History
    INSERT INTO report_history (id, report_id, org_id, status, file_url, file_size_bytes, generated_at, duration_ms, recipients_sent, created_by) VALUES
    ('70000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', v_org_id, 'completed', '/exports/saas_weekly_2026_08_24.pdf', 1485200, CURRENT_TIMESTAMP - INTERVAL '5 days', 1840, '["exec-team@apex.io", "board@apex.io"]'::jsonb, v_user_admin_id);

    -- 15. Audit Logs
    INSERT INTO audit_logs (id, org_id, user_id, action, entity, entity_id, new_values, ip_address, user_agent) VALUES
    ('80000000-0000-0000-0000-000000000001', v_org_id, v_user_admin_id, 'CREATE_DASHBOARD', 'dashboards', v_dash_exec_id::text, '{"title": "Executive SaaS Performance Dashboard"}'::jsonb, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
    ('80000000-0000-0000-0000-000000000002', v_org_id, v_user_admin_id, 'RUN_IMPORT_JOB', 'import_jobs', v_job_csv_id::text, '{"rows": 24, "status": "completed"}'::jsonb, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');

    -- Refresh Materialized View
    REFRESH MATERIALIZED VIEW mv_kpi_monthly_aggregates;

END $$;
