import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export function useDashboards() {
  const queryClient = useQueryClient();

  const dashboardsQuery = useQuery({
    queryKey: ['dashboards'],
    queryFn: async () => {
      const res = await api.getDashboards();
      return res.data;
    },
  });

  const createDashboardMutation = useMutation({
    mutationFn: (body: any) => api.createDashboard(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboards'] }),
  });

  const updateDashboardMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => api.updateDashboard(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboards'] }),
  });

  const deleteDashboardMutation = useMutation({
    mutationFn: (id: string) => api.deleteDashboard(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboards'] }),
  });

  return {
    dashboards: dashboardsQuery.data || [],
    isLoading: dashboardsQuery.isLoading,
    error: dashboardsQuery.error,
    createDashboard: createDashboardMutation.mutateAsync,
    updateDashboard: updateDashboardMutation.mutateAsync,
    deleteDashboard: deleteDashboardMutation.mutateAsync,
  };
}

export function useDashboard(id?: string) {
  const queryClient = useQueryClient();

  const dashboardQuery = useQuery({
    queryKey: ['dashboard', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.getDashboardById(id);
      return res.data;
    },
    enabled: !!id,
  });

  const createWidgetMutation = useMutation({
    mutationFn: (body: any) => api.createWidget(id!, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard', id] }),
  });

  const updateWidgetMutation = useMutation({
    mutationFn: ({ widgetId, body }: { widgetId: string; body: any }) => api.updateWidget(id!, widgetId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard', id] }),
  });

  const deleteWidgetMutation = useMutation({
    mutationFn: (widgetId: string) => api.deleteWidget(id!, widgetId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard', id] }),
  });

  const updateLayoutsMutation = useMutation({
    mutationFn: (layouts: any[]) => api.updateLayouts(id!, layouts),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard', id] }),
  });

  return {
    dashboard: dashboardQuery.data,
    isLoading: dashboardQuery.isLoading,
    refetch: dashboardQuery.refetch,
    createWidget: createWidgetMutation.mutateAsync,
    updateWidget: updateWidgetMutation.mutateAsync,
    deleteWidget: deleteWidgetMutation.mutateAsync,
    updateLayouts: updateLayoutsMutation.mutateAsync,
  };
}

export function useKpis() {
  const queryClient = useQueryClient();

  const kpisQuery = useQuery({
    queryKey: ['kpis'],
    queryFn: async () => {
      const res = await api.getKpis();
      return res.data;
    },
  });

  const alertsQuery = useQuery({
    queryKey: ['kpi-alerts'],
    queryFn: async () => {
      const res = await api.getAlerts();
      return res.data;
    },
  });

  const createKpiMutation = useMutation({
    mutationFn: (body: any) => api.createKpi(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      queryClient.invalidateQueries({ queryKey: ['kpi-alerts'] });
    },
  });

  const acknowledgeAlertMutation = useMutation({
    mutationFn: (alertId: string) => api.acknowledgeAlert(alertId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kpi-alerts'] }),
  });

  const resolveAlertMutation = useMutation({
    mutationFn: (alertId: string) => api.resolveAlert(alertId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kpi-alerts'] }),
  });

  return {
    kpis: kpisQuery.data || [],
    alerts: alertsQuery.data || [],
    isLoading: kpisQuery.isLoading,
    refetch: kpisQuery.refetch,
    createKpi: createKpiMutation.mutateAsync,
    acknowledgeAlert: acknowledgeAlertMutation.mutateAsync,
    resolveAlert: resolveAlertMutation.mutateAsync,
  };
}

export function useDataSources() {
  const queryClient = useQueryClient();

  const dataSourcesQuery = useQuery({
    queryKey: ['data-sources'],
    queryFn: async () => {
      const res = await api.getDataSources();
      return res.data;
    },
  });

  const datasetsQuery = useQuery({
    queryKey: ['datasets'],
    queryFn: async () => {
      const res = await api.getDatasets();
      return res.data;
    },
  });

  const jobsQuery = useQuery({
    queryKey: ['import-jobs'],
    queryFn: async () => {
      const res = await api.getImportJobs();
      return res.data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => api.uploadDatasetFile(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-sources'] });
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] });
    },
  });

  const connectorMutation = useMutation({
    mutationFn: (body: any) => api.ingestConnector(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-sources'] });
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] });
    },
  });

  return {
    dataSources: dataSourcesQuery.data || [],
    datasets: datasetsQuery.data || [],
    importJobs: jobsQuery.data || [],
    isLoading: dataSourcesQuery.isLoading || datasetsQuery.isLoading,
    uploadFile: uploadMutation.mutateAsync,
    ingestConnector: connectorMutation.mutateAsync,
  };
}

export function useReports() {
  const queryClient = useQueryClient();

  const reportsQuery = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const res = await api.getReports();
      return res.data;
    },
  });

  const historyQuery = useQuery({
    queryKey: ['report-history'],
    queryFn: async () => {
      const res = await api.getReportHistory();
      return res.data;
    },
  });

  const createReportMutation = useMutation({
    mutationFn: (body: any) => api.createReport(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports'] }),
  });

  const generateNowMutation = useMutation({
    mutationFn: (id: string) => api.generateReportNow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['report-history'] });
    },
  });

  return {
    reports: reportsQuery.data || [],
    reportHistory: historyQuery.data || [],
    isLoading: reportsQuery.isLoading,
    createReport: createReportMutation.mutateAsync,
    generateNow: generateNowMutation.mutateAsync,
  };
}

export function useAuditLogs() {
  return useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const res = await api.getAuditLogs();
      return res.data;
    },
  });
}
