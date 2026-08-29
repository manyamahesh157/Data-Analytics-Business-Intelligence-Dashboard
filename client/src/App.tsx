import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from './store/useAppStore';
import { connectSocket, getSocket } from './services/socket';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardStudio } from './components/dashboard/DashboardStudio';
import { KpiMonitoringHub } from './components/kpi/KpiMonitoringHub';
import { DataImportStudio } from './components/dataImport/DataImportStudio';
import { ReportsStudio } from './components/reports/ReportsStudio';
import { AuditLogViewer } from './components/audit/AuditLogViewer';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30s
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAppStore();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export const App: React.FC = () => {
  const { token, addAlert } = useAppStore();

  useEffect(() => {
    if (token) {
      const socket = connectSocket(token);

      socket.on('alert:triggered', (data: any) => {
        if (data.alert) {
          addAlert(data.alert);
        }
      });

      socket.on('kpi:updated', () => {
        queryClient.invalidateQueries({ queryKey: ['kpis'] });
      });

      socket.on('dashboard:refresh', () => {
        queryClient.invalidateQueries({ queryKey: ['dashboards'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      });
    }
  }, [token, addAlert]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardStudio />} />
            <Route path="kpis" element={<KpiMonitoringHub />} />
            <Route path="data-sources" element={<DataImportStudio />} />
            <Route path="reports" element={<ReportsStudio />} />
            <Route path="audit-logs" element={<AuditLogViewer />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
