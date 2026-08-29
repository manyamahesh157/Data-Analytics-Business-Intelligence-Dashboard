import { Pool } from 'pg';
import { env } from '../config/env';
import { logger } from '../config/logger';

let pool: Pool | null = null;
let isPgConnected = false;

// In-memory relational store fallback (for zero-config evaluation if local PG instance is not yet running)
class InMemoryStore {
  public organizations: any[] = [];
  public users: any[] = [];
  public roles: any[] = [];
  public permissions: any[] = [];
  public role_permissions: any[] = [];
  public user_roles: any[] = [];
  public audit_logs: any[] = [];
  public data_sources: any[] = [];
  public import_jobs: any[] = [];
  public imported_datasets: any[] = [];
  public dashboards: any[] = [];
  public widgets: any[] = [];
  public dashboard_permissions: any[] = [];
  public kpi_definitions: any[] = [];
  public kpi_values: any[] = [];
  public kpi_alerts: any[] = [];
  public reports: any[] = [];
  public report_history: any[] = [];

  constructor() {
    this.seedDefaults();
  }

  public seedDefaults() {
    const orgId = 'a0000000-0000-0000-0000-000000000001';
    const userIdAdmin = 'b0000000-0000-0000-0000-000000000001';
    const userIdEditor = 'b0000000-0000-0000-0000-000000000002';
    const userIdViewer = 'b0000000-0000-0000-0000-000000000003';

    this.organizations = [
      {
        id: orgId,
        name: 'Apex Global Analytics Inc.',
        slug: 'apex-analytics',
        plan: 'enterprise',
        settings: {
          theme: 'dark',
          timezone: 'America/New_York',
          currency: 'USD',
          dateFormat: 'YYYY-MM-DD',
          allowPublicDashboards: true,
          retentionDays: 730,
        },
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    this.roles = [
      { id: 'c0000000-0000-0000-0000-000000000001', org_id: orgId, name: 'Admin', description: 'Full access', is_system: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'c0000000-0000-0000-0000-000000000002', org_id: orgId, name: 'Editor', description: 'Can create and edit', is_system: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'c0000000-0000-0000-0000-000000000003', org_id: orgId, name: 'Viewer', description: 'Read-only access', is_system: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ];

    this.permissions = [
      { id: '30000000-0000-0000-0000-000000000001', code: 'dashboard:view', name: 'View Dashboards', category: 'dashboards', created_at: new Date().toISOString() },
      { id: '30000000-0000-0000-0000-000000000002', code: 'dashboard:create', name: 'Create Dashboards', category: 'dashboards', created_at: new Date().toISOString() },
      { id: '30000000-0000-0000-0000-000000000003', code: 'dashboard:edit', name: 'Edit Dashboards', category: 'dashboards', created_at: new Date().toISOString() },
      { id: '30000000-0000-0000-0000-000000000004', code: 'dashboard:delete', name: 'Delete Dashboards', category: 'dashboards', created_at: new Date().toISOString() },
      { id: '30000000-0000-0000-0000-000000000005', code: 'kpi:view', name: 'View KPIs', category: 'kpis', created_at: new Date().toISOString() },
      { id: '30000000-0000-0000-0000-000000000006', code: 'kpi:manage', name: 'Manage KPIs', category: 'kpis', created_at: new Date().toISOString() },
      { id: '30000000-0000-0000-0000-000000000007', code: 'data:import', name: 'Import Data', category: 'data_sources', created_at: new Date().toISOString() },
      { id: '30000000-0000-0000-0000-000000000008', code: 'reports:generate', name: 'Generate Reports', category: 'reports', created_at: new Date().toISOString() },
      { id: '30000000-0000-0000-0000-000000000009', code: 'org:admin', name: 'Organization Admin', category: 'settings', created_at: new Date().toISOString() },
    ];

    // Password is 'Password123!'
    const pwHash = '$2a$10$7EqJtq98hPqEX7fNZaFWoOZhB7eP42W5pM67M26A5sFf43X/hA56i';

    this.users = [
      {
        id: userIdAdmin,
        org_id: orgId,
        email: 'admin@apex.io',
        password_hash: pwHash,
        first_name: 'Sarah',
        last_name: 'Connor',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: userIdEditor,
        org_id: orgId,
        email: 'editor@apex.io',
        password_hash: pwHash,
        first_name: 'Marcus',
        last_name: 'Wright',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: userIdViewer,
        org_id: orgId,
        email: 'viewer@apex.io',
        password_hash: pwHash,
        first_name: 'Elena',
        last_name: 'Rostova',
        avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    this.user_roles = [
      { user_id: userIdAdmin, role_id: 'c0000000-0000-0000-0000-000000000001', org_id: orgId },
      { user_id: userIdEditor, role_id: 'c0000000-0000-0000-0000-000000000002', org_id: orgId },
      { user_id: userIdViewer, role_id: 'c0000000-0000-0000-0000-000000000003', org_id: orgId },
    ];

    this.data_sources = [
      {
        id: 'd0000000-0000-0000-0000-000000000001',
        org_id: orgId,
        name: 'SaaS Recurring Revenue 2025-2026',
        type: 'csv',
        status: 'connected',
        connection_settings: { filename: 'saas_metrics_2026.csv', delimiter: ',', hasHeader: true },
        last_synced_at: new Date().toISOString(),
        created_by: userIdAdmin,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'd0000000-0000-0000-0000-000000000002',
        org_id: orgId,
        name: 'E-Commerce Transactions DB',
        type: 'postgres',
        status: 'connected',
        connection_settings: { host: 'db.production.internal', port: 5432, database: 'ecom_sales', ssl: true },
        last_synced_at: new Date().toISOString(),
        created_by: userIdAdmin,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'd0000000-0000-0000-0000-000000000003',
        org_id: orgId,
        name: 'Stripe Billing Live Sync',
        type: 'rest_api',
        status: 'connected',
        connection_settings: { endpoint: 'https://api.stripe.com/v1/charges', authType: 'bearer' },
        last_synced_at: new Date().toISOString(),
        created_by: userIdEditor,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    this.import_jobs = [
      {
        id: 'e0000000-0000-0000-0000-000000000001',
        org_id: orgId,
        data_source_id: 'd0000000-0000-0000-0000-000000000001',
        status: 'completed',
        total_rows: 12,
        processed_rows: 12,
        error_count: 0,
        error_log: [],
        started_at: new Date(Date.now() - 3600000).toISOString(),
        completed_at: new Date(Date.now() - 3500000).toISOString(),
        created_by: userIdAdmin,
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ];

    this.imported_datasets = [
      {
        id: 'f0000000-0000-0000-0000-000000000001',
        org_id: orgId,
        data_source_id: 'd0000000-0000-0000-0000-000000000001',
        import_job_id: 'e0000000-0000-0000-0000-000000000001',
        name: 'SaaS Monthly Financials',
        table_name: 'saas_revenue_monthly',
        schema_definition: [
          { name: 'month', type: 'string' },
          { name: 'mrr', type: 'number' },
          { name: 'arr', type: 'number' },
          { name: 'churn_rate', type: 'number' },
          { name: 'new_customers', type: 'number' },
          { name: 'nrr', type: 'number' },
          { name: 'cac', type: 'number' },
          { name: 'ltv', type: 'number' },
        ],
        row_count: 12,
        size_bytes: 14200,
        data_preview: [
          { month: '2025-09', mrr: 115000, arr: 1380000, churn_rate: 1.9, new_customers: 72, nrr: 112.5, cac: 480, ltv: 5800 },
          { month: '2025-10', mrr: 122000, arr: 1464000, churn_rate: 1.8, new_customers: 85, nrr: 114.1, cac: 460, ltv: 6100 },
          { month: '2025-11', mrr: 131500, arr: 1578000, churn_rate: 1.6, new_customers: 94, nrr: 115.8, cac: 440, ltv: 6400 },
          { month: '2025-12', mrr: 144000, arr: 1728000, churn_rate: 1.4, new_customers: 110, nrr: 117.2, cac: 420, ltv: 6800 },
          { month: '2026-01', mrr: 153000, arr: 1836000, churn_rate: 1.5, new_customers: 105, nrr: 116.9, cac: 410, ltv: 7100 },
          { month: '2026-02', mrr: 168200, arr: 2018400, churn_rate: 1.2, new_customers: 126, nrr: 119.3, cac: 390, ltv: 7800 },
        ],
        raw_data: [
          { month: '2025-03', mrr: 82000, arr: 984000, churn_rate: 2.4, new_customers: 45, nrr: 108.2, cac: 540, ltv: 4800 },
          { month: '2025-04', mrr: 88000, arr: 1056000, churn_rate: 2.3, new_customers: 52, nrr: 109.0, cac: 525, ltv: 5000 },
          { month: '2025-05', mrr: 94500, arr: 1134000, churn_rate: 2.1, new_customers: 58, nrr: 110.1, cac: 510, ltv: 5200 },
          { month: '2025-06', mrr: 101000, arr: 1212000, churn_rate: 2.0, new_customers: 63, nrr: 111.4, cac: 500, ltv: 5450 },
          { month: '2025-07', mrr: 108000, arr: 1296000, churn_rate: 1.9, new_customers: 69, nrr: 112.0, cac: 490, ltv: 5600 },
          { month: '2025-08', mrr: 115000, arr: 1380000, churn_rate: 1.8, new_customers: 75, nrr: 113.2, cac: 480, ltv: 5850 },
          { month: '2025-09', mrr: 122000, arr: 1464000, churn_rate: 1.8, new_customers: 82, nrr: 114.1, cac: 460, ltv: 6100 },
          { month: '2025-10', mrr: 130000, arr: 1560000, churn_rate: 1.7, new_customers: 90, nrr: 115.0, cac: 450, ltv: 6300 },
          { month: '2025-11', mrr: 139000, arr: 1668000, churn_rate: 1.6, new_customers: 98, nrr: 116.2, cac: 435, ltv: 6600 },
          { month: '2025-12', mrr: 149500, arr: 1794000, churn_rate: 1.4, new_customers: 115, nrr: 117.8, cac: 415, ltv: 7000 },
          { month: '2026-01', mrr: 158000, arr: 1896000, churn_rate: 1.5, new_customers: 108, nrr: 117.1, cac: 405, ltv: 7250 },
          { month: '2026-02', mrr: 168200, arr: 2018400, churn_rate: 1.2, new_customers: 126, nrr: 119.3, cac: 390, ltv: 7800 },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'f0000000-0000-0000-0000-000000000002',
        org_id: orgId,
        data_source_id: 'd0000000-0000-0000-0000-000000000002',
        name: 'Global E-Commerce Sales',
        table_name: 'ecommerce_sales_daily',
        schema_definition: [
          { name: 'region', type: 'string' },
          { name: 'category', type: 'string' },
          { name: 'sales', type: 'number' },
          { name: 'profit', type: 'number' },
          { name: 'orders', type: 'number' },
          { name: 'discount', type: 'number' },
        ],
        row_count: 8,
        size_bytes: 9800,
        data_preview: [
          { region: 'North America', category: 'Enterprise Software', sales: 482000, profit: 192800, orders: 340, discount: 8.5 },
          { region: 'EMEA', category: 'Enterprise Software', sales: 320000, profit: 118400, orders: 210, discount: 10.0 },
        ],
        raw_data: [
          { region: 'North America', category: 'Enterprise Software', sales: 482000, profit: 192800, orders: 340, discount: 8.5 },
          { region: 'EMEA', category: 'Enterprise Software', sales: 320000, profit: 118400, orders: 210, discount: 10.0 },
          { region: 'APAC', category: 'Cloud Infrastructure', sales: 290000, profit: 98600, orders: 185, discount: 12.0 },
          { region: 'North America', category: 'Cloud Infrastructure', sales: 540000, profit: 226800, orders: 410, discount: 7.0 },
          { region: 'LATAM', category: 'Analytics Tools', sales: 145000, profit: 46400, orders: 95, discount: 14.5 },
          { region: 'EMEA', category: 'Security Suite', sales: 260000, profit: 104000, orders: 160, discount: 9.0 },
          { region: 'North America', category: 'Security Suite', sales: 410000, profit: 176300, orders: 290, discount: 6.5 },
          { region: 'APAC', category: 'Enterprise Software', sales: 215000, profit: 73100, orders: 140, discount: 11.0 },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    this.dashboards = [
      {
        id: '10000000-0000-0000-0000-000000000001',
        org_id: orgId,
        title: 'Executive SaaS Performance Dashboard',
        description: 'Real-time overview of ARR, MRR expansion, churn velocity, and unit economics',
        layout_config: { cols: 12, rowHeight: 90, compactType: 'vertical' },
        is_default: true,
        is_public: true,
        created_by: userIdAdmin,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '10000000-0000-0000-0000-000000000002',
        org_id: orgId,
        title: 'Global Sales & Regional Profitability Matrix',
        description: 'Deep-dive into sales channel performance, product categories, and margin breakdown',
        layout_config: { cols: 12, rowHeight: 90, compactType: 'vertical' },
        is_default: false,
        is_public: false,
        created_by: userIdEditor,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    this.widgets = [
      {
        id: '40000000-0000-0000-0000-000000000001',
        dashboard_id: '10000000-0000-0000-0000-000000000001',
        org_id: orgId,
        dataset_id: 'f0000000-0000-0000-0000-000000000001',
        title: 'MRR Growth Trend ($)',
        type: 'line',
        grid_layout: { x: 0, y: 0, w: 8, h: 4, minW: 4, minH: 3 },
        query_config: { metrics: ['mrr'], dimensions: ['month'], filters: [], sort: [{ field: 'month', direction: 'ASC' }], limit: 12 },
        visual_config: { colors: ['#3B82F6'], showLegend: true, showGrid: true, sparkline: false, numberFormat: 'currency' },
        refresh_interval_seconds: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '40000000-0000-0000-0000-000000000002',
        dashboard_id: '10000000-0000-0000-0000-000000000001',
        org_id: orgId,
        dataset_id: 'f0000000-0000-0000-0000-000000000001',
        title: 'Net Revenue Retention (%)',
        type: 'gauge',
        grid_layout: { x: 8, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
        query_config: { metrics: ['nrr'], dimensions: [], filters: [], limit: 1 },
        visual_config: { gaugeMin: 90, gaugeMax: 140, threshold: 115, colors: ['#10B981'], numberFormat: 'percentage' },
        refresh_interval_seconds: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '40000000-0000-0000-0000-000000000003',
        dashboard_id: '10000000-0000-0000-0000-000000000001',
        org_id: orgId,
        dataset_id: 'f0000000-0000-0000-0000-000000000001',
        title: 'New Customers vs Churn Rate',
        type: 'bar',
        grid_layout: { x: 0, y: 4, w: 6, h: 4, minW: 4, minH: 3 },
        query_config: { metrics: ['new_customers', 'churn_rate'], dimensions: ['month'], filters: [], limit: 12 },
        visual_config: { colors: ['#10B981', '#EF4444'], showLegend: true, showGrid: true, numberFormat: 'standard' },
        refresh_interval_seconds: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '40000000-0000-0000-0000-000000000004',
        dashboard_id: '10000000-0000-0000-0000-000000000001',
        org_id: orgId,
        dataset_id: 'f0000000-0000-0000-0000-000000000001',
        title: 'CAC vs LTV Unit Economics',
        type: 'area',
        grid_layout: { x: 6, y: 4, w: 6, h: 4, minW: 4, minH: 3 },
        query_config: { metrics: ['cac', 'ltv'], dimensions: ['month'], filters: [], limit: 12 },
        visual_config: { colors: ['#F59E0B', '#8B5CF6'], showLegend: true, showGrid: true, numberFormat: 'currency' },
        refresh_interval_seconds: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '40000000-0000-0000-0000-000000000005',
        dashboard_id: '10000000-0000-0000-0000-000000000001',
        org_id: orgId,
        dataset_id: 'f0000000-0000-0000-0000-000000000001',
        title: 'Monthly SaaS Performance Ledger',
        type: 'table',
        grid_layout: { x: 0, y: 8, w: 12, h: 4, minW: 6, minH: 3 },
        query_config: { metrics: ['mrr', 'arr', 'churn_rate', 'new_customers', 'nrr', 'cac', 'ltv'], dimensions: ['month'], filters: [], limit: 50 },
        visual_config: { showGrid: true, numberFormat: 'standard' },
        refresh_interval_seconds: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '40000000-0000-0000-0000-000000000006',
        dashboard_id: '10000000-0000-0000-0000-000000000002',
        org_id: orgId,
        dataset_id: 'f0000000-0000-0000-0000-000000000002',
        title: 'Revenue by Geographic Region',
        type: 'pie',
        grid_layout: { x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
        query_config: { metrics: ['sales'], dimensions: ['region'], groupBy: ['region'], limit: 10 },
        visual_config: { colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'], showLegend: true, numberFormat: 'currency' },
        refresh_interval_seconds: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '40000000-0000-0000-0000-000000000007',
        dashboard_id: '10000000-0000-0000-0000-000000000002',
        org_id: orgId,
        dataset_id: 'f0000000-0000-0000-0000-000000000002',
        title: 'Profit Margin by Product Category',
        type: 'bar',
        grid_layout: { x: 6, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
        query_config: { metrics: ['profit'], dimensions: ['category'], groupBy: ['category'], limit: 10 },
        visual_config: { colors: ['#10B981'], showLegend: false, showGrid: true, numberFormat: 'currency' },
        refresh_interval_seconds: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '40000000-0000-0000-0000-000000000008',
        dashboard_id: '10000000-0000-0000-0000-000000000002',
        org_id: orgId,
        dataset_id: 'f0000000-0000-0000-0000-000000000002',
        title: 'Discount vs Profit Correlation',
        type: 'scatter',
        grid_layout: { x: 0, y: 4, w: 12, h: 4, minW: 6, minH: 3 },
        query_config: { metrics: ['discount', 'profit'], dimensions: ['category'], filters: [], limit: 50 },
        visual_config: { colors: ['#EC4899'], showLegend: true, showGrid: true, numberFormat: 'standard' },
        refresh_interval_seconds: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    this.kpi_definitions = [
      {
        id: '20000000-0000-0000-0000-000000000001',
        org_id: orgId,
        dataset_id: 'f0000000-0000-0000-0000-000000000001',
        name: 'Monthly Recurring Revenue',
        code: 'MRR',
        description: 'Predictable monthly revenue generated by active subscriptions',
        formula_type: 'sum',
        metric_column: 'mrr',
        target_value: 180000,
        warning_threshold: 140000,
        critical_threshold: 110000,
        unit: '$',
        format: 'currency',
        period_type: 'monthly',
        is_active: true,
        created_by: userIdAdmin,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '20000000-0000-0000-0000-000000000002',
        org_id: orgId,
        dataset_id: 'f0000000-0000-0000-0000-000000000001',
        name: 'Annual Recurring Revenue',
        code: 'ARR',
        description: 'Annualized recurring revenue run rate',
        formula_type: 'sum',
        metric_column: 'arr',
        target_value: 2160000,
        warning_threshold: 1680000,
        critical_threshold: 1320000,
        unit: '$',
        format: 'currency',
        period_type: 'monthly',
        is_active: true,
        created_by: userIdAdmin,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '20000000-0000-0000-0000-000000000003',
        org_id: orgId,
        dataset_id: 'f0000000-0000-0000-0000-000000000001',
        name: 'Net Revenue Retention Rate',
        code: 'NRR',
        description: 'Percentage of recurring revenue retained from existing customers',
        formula_type: 'avg',
        metric_column: 'nrr',
        target_value: 120.0,
        warning_threshold: 110.0,
        critical_threshold: 100.0,
        unit: '%',
        format: 'percentage',
        period_type: 'monthly',
        is_active: true,
        created_by: userIdAdmin,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '20000000-0000-0000-0000-000000000004',
        org_id: orgId,
        dataset_id: 'f0000000-0000-0000-0000-000000000001',
        name: 'Customer Acquisition Cost',
        code: 'CAC',
        description: 'Average cost required to acquire a new paying customer',
        formula_type: 'avg',
        metric_column: 'cac',
        target_value: 350.0,
        warning_threshold: 450.0,
        critical_threshold: 550.0,
        unit: '$',
        format: 'currency',
        period_type: 'monthly',
        is_active: true,
        created_by: userIdAdmin,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '20000000-0000-0000-0000-000000000005',
        org_id: orgId,
        dataset_id: 'f0000000-0000-0000-0000-000000000001',
        name: 'Customer Churn Rate',
        code: 'CHURN',
        description: 'Monthly percentage of customer cancellations',
        formula_type: 'avg',
        metric_column: 'churn_rate',
        target_value: 1.0,
        warning_threshold: 2.0,
        critical_threshold: 3.5,
        unit: '%',
        format: 'percentage',
        period_type: 'monthly',
        is_active: true,
        created_by: userIdAdmin,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    this.kpi_values = [
      { id: '1', kpi_id: '20000000-0000-0000-0000-000000000001', org_id: orgId, value: 131500, target_value: 130000, delta_previous: 9500, delta_percentage: 7.78, status: 'healthy', period_type: 'monthly', period_start: '2025-11-01T00:00:00Z', period_end: '2025-11-30T23:59:59Z', calculated_at: new Date().toISOString() },
      { id: '2', kpi_id: '20000000-0000-0000-0000-000000000001', org_id: orgId, value: 144000, target_value: 140000, delta_previous: 12500, delta_percentage: 9.50, status: 'healthy', period_type: 'monthly', period_start: '2025-12-01T00:00:00Z', period_end: '2025-12-31T23:59:59Z', calculated_at: new Date().toISOString() },
      { id: '3', kpi_id: '20000000-0000-0000-0000-000000000001', org_id: orgId, value: 153000, target_value: 150000, delta_previous: 9000, delta_percentage: 6.25, status: 'healthy', period_type: 'monthly', period_start: '2026-01-01T00:00:00Z', period_end: '2026-01-31T23:59:59Z', calculated_at: new Date().toISOString() },
      { id: '4', kpi_id: '20000000-0000-0000-0000-000000000001', org_id: orgId, value: 168200, target_value: 165000, delta_previous: 15200, delta_percentage: 9.93, status: 'healthy', period_type: 'monthly', period_start: '2026-02-01T00:00:00Z', period_end: '2026-02-28T23:59:59Z', calculated_at: new Date().toISOString() },

      { id: '5', kpi_id: '20000000-0000-0000-0000-000000000002', org_id: orgId, value: 1578000, target_value: 1560000, delta_previous: 114000, delta_percentage: 7.78, status: 'healthy', period_type: 'monthly', period_start: '2025-11-01T00:00:00Z', period_end: '2025-11-30T23:59:59Z', calculated_at: new Date().toISOString() },
      { id: '6', kpi_id: '20000000-0000-0000-0000-000000000002', org_id: orgId, value: 1728000, target_value: 1680000, delta_previous: 150000, delta_percentage: 9.50, status: 'healthy', period_type: 'monthly', period_start: '2025-12-01T00:00:00Z', period_end: '2025-12-31T23:59:59Z', calculated_at: new Date().toISOString() },
      { id: '7', kpi_id: '20000000-0000-0000-0000-000000000002', org_id: orgId, value: 1836000, target_value: 1800000, delta_previous: 108000, delta_percentage: 6.25, status: 'healthy', period_type: 'monthly', period_start: '2026-01-01T00:00:00Z', period_end: '2026-01-31T23:59:59Z', calculated_at: new Date().toISOString() },
      { id: '8', kpi_id: '20000000-0000-0000-0000-000000000002', org_id: orgId, value: 2018400, target_value: 1980000, delta_previous: 182400, delta_percentage: 9.93, status: 'healthy', period_type: 'monthly', period_start: '2026-02-01T00:00:00Z', period_end: '2026-02-28T23:59:59Z', calculated_at: new Date().toISOString() },

      { id: '9', kpi_id: '20000000-0000-0000-0000-000000000003', org_id: orgId, value: 115.8, target_value: 120.0, delta_previous: 1.7, delta_percentage: 1.48, status: 'warning', period_type: 'monthly', period_start: '2025-11-01T00:00:00Z', period_end: '2025-11-30T23:59:59Z', calculated_at: new Date().toISOString() },
      { id: '10', kpi_id: '20000000-0000-0000-0000-000000000003', org_id: orgId, value: 117.2, target_value: 120.0, delta_previous: 1.4, delta_percentage: 1.20, status: 'warning', period_type: 'monthly', period_start: '2025-12-01T00:00:00Z', period_end: '2025-12-31T23:59:59Z', calculated_at: new Date().toISOString() },
      { id: '11', kpi_id: '20000000-0000-0000-0000-000000000003', org_id: orgId, value: 116.9, target_value: 120.0, delta_previous: -0.3, delta_percentage: -0.25, status: 'warning', period_type: 'monthly', period_start: '2026-01-01T00:00:00Z', period_end: '2026-01-31T23:59:59Z', calculated_at: new Date().toISOString() },
      { id: '12', kpi_id: '20000000-0000-0000-0000-000000000003', org_id: orgId, value: 119.3, target_value: 120.0, delta_previous: 2.4, delta_percentage: 2.05, status: 'healthy', period_type: 'monthly', period_start: '2026-02-01T00:00:00Z', period_end: '2026-02-28T23:59:59Z', calculated_at: new Date().toISOString() },

      { id: '13', kpi_id: '20000000-0000-0000-0000-000000000004', org_id: orgId, value: 440.0, target_value: 350.0, delta_previous: -20.0, delta_percentage: -4.34, status: 'healthy', period_type: 'monthly', period_start: '2025-11-01T00:00:00Z', period_end: '2025-11-30T23:59:59Z', calculated_at: new Date().toISOString() },
      { id: '14', kpi_id: '20000000-0000-0000-0000-000000000004', org_id: orgId, value: 420.0, target_value: 350.0, delta_previous: -20.0, delta_percentage: -4.54, status: 'healthy', period_type: 'monthly', period_start: '2025-12-01T00:00:00Z', period_end: '2025-12-31T23:59:59Z', calculated_at: new Date().toISOString() },
      { id: '15', kpi_id: '20000000-0000-0000-0000-000000000004', org_id: orgId, value: 410.0, target_value: 350.0, delta_previous: -10.0, delta_percentage: -2.38, status: 'healthy', period_type: 'monthly', period_start: '2026-01-01T00:00:00Z', period_end: '2026-01-31T23:59:59Z', calculated_at: new Date().toISOString() },
      { id: '16', kpi_id: '20000000-0000-0000-0000-000000000004', org_id: orgId, value: 390.0, target_value: 350.0, delta_previous: -20.0, delta_percentage: -4.87, status: 'healthy', period_type: 'monthly', period_start: '2026-02-01T00:00:00Z', period_end: '2026-02-28T23:59:59Z', calculated_at: new Date().toISOString() },

      { id: '17', kpi_id: '20000000-0000-0000-0000-000000000005', org_id: orgId, value: 1.6, target_value: 1.0, delta_previous: -0.1, delta_percentage: -5.88, status: 'warning', period_type: 'monthly', period_start: '2025-11-01T00:00:00Z', period_end: '2025-11-30T23:59:59Z', calculated_at: new Date().toISOString() },
      { id: '18', kpi_id: '20000000-0000-0000-0000-000000000005', org_id: orgId, value: 1.4, target_value: 1.0, delta_previous: -0.2, delta_percentage: -12.5, status: 'warning', period_type: 'monthly', period_start: '2025-12-01T00:00:00Z', period_end: '2025-12-31T23:59:59Z', calculated_at: new Date().toISOString() },
      { id: '19', kpi_id: '20000000-0000-0000-0000-000000000005', org_id: orgId, value: 1.5, target_value: 1.0, delta_previous: 0.1, delta_percentage: 7.14, status: 'warning', period_type: 'monthly', period_start: '2026-01-01T00:00:00Z', period_end: '2026-01-31T23:59:59Z', calculated_at: new Date().toISOString() },
      { id: '20', kpi_id: '20000000-0000-0000-0000-000000000005', org_id: orgId, value: 1.2, target_value: 1.0, delta_previous: -0.3, delta_percentage: -20.0, status: 'healthy', period_type: 'monthly', period_start: '2026-02-01T00:00:00Z', period_end: '2026-02-28T23:59:59Z', calculated_at: new Date().toISOString() },
    ];

    this.kpi_alerts = [
      {
        id: '50000000-0000-0000-0000-000000000001',
        kpi_id: '20000000-0000-0000-0000-000000000003',
        org_id: orgId,
        alert_type: 'warning',
        message: 'Net Revenue Retention (116.9%) dropped below target threshold (120.0%) for January 2026',
        current_value: 116.9,
        threshold_value: 120.0,
        status: 'acknowledged',
        channels: ['email', 'webhook'],
        triggered_at: new Date(Date.now() - 15 * 86400000).toISOString(),
        acknowledged_at: new Date(Date.now() - 14 * 86400000).toISOString(),
        kpi_name: 'Net Revenue Retention Rate',
        kpi_code: 'NRR',
      },
      {
        id: '50000000-0000-0000-0000-000000000002',
        kpi_id: '20000000-0000-0000-0000-000000000005',
        org_id: orgId,
        alert_type: 'warning',
        message: 'Monthly Churn Rate (1.5%) exceeded target goal (1.0%)',
        current_value: 1.5,
        threshold_value: 1.0,
        status: 'active',
        channels: ['email'],
        triggered_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        kpi_name: 'Customer Churn Rate',
        kpi_code: 'CHURN',
      },
    ];

    this.reports = [
      {
        id: '60000000-0000-0000-0000-000000000001',
        org_id: orgId,
        dashboard_id: '10000000-0000-0000-0000-000000000001',
        name: 'Weekly SaaS Performance Briefing',
        description: 'Automated PDF export of executive metrics sent every Monday morning',
        format: 'pdf',
        schedule_cron: '0 9 * * 1',
        is_active: true,
        recipients: ['exec-team@apex.io', 'board@apex.io'],
        filter_config: { dateRange: 'last_30_days' },
        last_generated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
        next_run_at: new Date(Date.now() + 2 * 86400000).toISOString(),
        created_by: userIdAdmin,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '60000000-0000-0000-0000-000000000002',
        org_id: orgId,
        dashboard_id: '10000000-0000-0000-0000-000000000002',
        name: 'Monthly Regional Profitability Matrix',
        description: 'Comprehensive Excel spreadsheet with regional breakdowns and discount margins',
        format: 'excel',
        schedule_cron: '0 8 1 * *',
        is_active: true,
        recipients: ['finance@apex.io'],
        filter_config: { dateRange: 'month_to_date' },
        last_generated_at: new Date(Date.now() - 28 * 86400000).toISOString(),
        next_run_at: new Date(Date.now() + 2 * 86400000).toISOString(),
        created_by: userIdEditor,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    this.report_history = [
      {
        id: '70000000-0000-0000-0000-000000000001',
        report_id: '60000000-0000-0000-0000-000000000001',
        org_id: orgId,
        status: 'completed',
        file_url: '/exports/saas_weekly_2026_08_24.pdf',
        file_size_bytes: 1485200,
        generated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
        duration_ms: 1840,
        recipients_sent: ['exec-team@apex.io', 'board@apex.io'],
        created_by: userIdAdmin,
      },
    ];

    this.audit_logs = [
      {
        id: '80000000-0000-0000-0000-000000000001',
        org_id: orgId,
        user_id: userIdAdmin,
        action: 'CREATE_DASHBOARD',
        entity: 'dashboards',
        entity_id: '10000000-0000-0000-0000-000000000001',
        new_values: { title: 'Executive SaaS Performance Dashboard' },
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
  }
}

export const memoryDb = new InMemoryStore();

export async function initDatabase(): Promise<{ isPg: boolean; pool?: Pool }> {
  try {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      connectionTimeoutMillis: 3000,
    });

    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();

    isPgConnected = true;
    logger.info('Connected successfully to PostgreSQL database instance.');
    return { isPg: true, pool };
  } catch (err: any) {
    logger.warn(`PostgreSQL not reachable at ${env.DATABASE_URL}. Operating with fast High-Performance In-Memory relational engine: ${err.message}`);
    isPgConnected = false;
    return { isPg: false };
  }
}

export function getDbPool(): Pool | null {
  return pool;
}

export function isUsingPostgres(): boolean {
  return isPgConnected;
}
