import { ApiResponse } from '../types';

const API_BASE_URL = '/api';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok || data.success === false) {
      throw new Error(data.error?.message || 'API request failed');
    }

    return data;
  }

  // Auth
  public async login(body: any) {
    return this.request('/auth/login', { method: 'POST', body: JSON.stringify(body) });
  }

  public async register(body: any) {
    return this.request('/auth/register', { method: 'POST', body: JSON.stringify(body) });
  }

  public async getProfile() {
    return this.request('/auth/me');
  }

  // Dashboards
  public async getDashboards() {
    return this.request('/dashboards');
  }

  public async getDashboardById(id: string) {
    return this.request(`/dashboards/${id}`);
  }

  public async createDashboard(body: any) {
    return this.request('/dashboards', { method: 'POST', body: JSON.stringify(body) });
  }

  public async updateDashboard(id: string, body: any) {
    return this.request(`/dashboards/${id}`, { method: 'PUT', body: JSON.stringify(body) });
  }

  public async deleteDashboard(id: string) {
    return this.request(`/dashboards/${id}`, { method: 'DELETE' });
  }

  // Widgets
  public async createWidget(dashboardId: string, body: any) {
    return this.request(`/dashboards/${dashboardId}/widgets`, { method: 'POST', body: JSON.stringify(body) });
  }

  public async updateWidget(dashboardId: string, widgetId: string, body: any) {
    return this.request(`/dashboards/${dashboardId}/widgets/${widgetId}`, { method: 'PUT', body: JSON.stringify(body) });
  }

  public async deleteWidget(dashboardId: string, widgetId: string) {
    return this.request(`/dashboards/${dashboardId}/widgets/${widgetId}`, { method: 'DELETE' });
  }

  public async updateLayouts(dashboardId: string, layouts: any[]) {
    return this.request(`/dashboards/${dashboardId}/layouts`, { method: 'POST', body: JSON.stringify({ layouts }) });
  }

  public async previewQuery(body: any) {
    return this.request('/dashboards/query/preview', { method: 'POST', body: JSON.stringify(body) });
  }

  // KPIs
  public async getKpis() {
    return this.request('/kpis');
  }

  public async getKpiById(id: string) {
    return this.request(`/kpis/${id}`);
  }

  public async createKpi(body: any) {
    return this.request('/kpis', { method: 'POST', body: JSON.stringify(body) });
  }

  public async recalculateKpi(id: string) {
    return this.request(`/kpis/${id}/recalculate`, { method: 'POST' });
  }

  public async getAlerts() {
    return this.request('/kpis/alerts/all');
  }

  public async acknowledgeAlert(id: string) {
    return this.request(`/kpis/alerts/${id}/acknowledge`, { method: 'PATCH' });
  }

  public async resolveAlert(id: string) {
    return this.request(`/kpis/alerts/${id}/resolve`, { method: 'PATCH' });
  }

  // Data Sources & ETL
  public async getDataSources() {
    return this.request('/data-sources');
  }

  public async getImportJobs() {
    return this.request('/data-sources/jobs/history');
  }

  public async getDatasets() {
    return this.request('/data-sources/datasets/all');
  }

  public async uploadDatasetFile(formData: FormData) {
    return this.request('/data-sources/ingest/upload', { method: 'POST', body: formData });
  }

  public async ingestConnector(body: any) {
    return this.request('/data-sources/ingest/connector', { method: 'POST', body: JSON.stringify(body) });
  }

  // Reports
  public async getReports() {
    return this.request('/reports');
  }

  public async getReportHistory() {
    return this.request('/reports/history/all');
  }

  public async createReport(body: any) {
    return this.request('/reports', { method: 'POST', body: JSON.stringify(body) });
  }

  public async generateReportNow(id: string) {
    return this.request(`/reports/${id}/generate`, { method: 'POST' });
  }

  // Audit Logs
  public async getAuditLogs() {
    return this.request('/audit-logs');
  }
}

export const api = new ApiClient();
