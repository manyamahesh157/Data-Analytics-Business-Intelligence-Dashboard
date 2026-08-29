import React from 'react';
import { X, TrendingUp, AlertTriangle, CheckCircle2, Bell, Calendar } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import '../widgets/ChartSetup';
import { KPIDefinition, KPIAlert } from '../../types';

interface KpiDrillDownDrawerProps {
  kpi: KPIDefinition | null;
  alerts: KPIAlert[];
  onClose: () => void;
  onAcknowledgeAlert?: (alertId: string) => void;
  onResolveAlert?: (alertId: string) => void;
}

export const KpiDrillDownDrawer: React.FC<KpiDrillDownDrawerProps> = ({
  kpi,
  alerts,
  onClose,
  onAcknowledgeAlert,
  onResolveAlert,
}) => {
  if (!kpi) return null;

  const history = kpi.history || [];
  const relatedAlerts = alerts.filter((a) => a.kpi_id === kpi.id);

  const labels = history.map((h) => new Date(h.period_start).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }));
  const values = history.map((h) => Number(h.value));
  const targets = history.map(() => Number(kpi.target_value || 0));

  const chartData = {
    labels,
    datasets: [
      {
        label: `${kpi.code} Actual`,
        data: values,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.35,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#3B82F6',
      },
      {
        label: 'Target Goal',
        data: targets,
        borderColor: '#10B981',
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 0,
      },
    ],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#94A3B8' } },
      tooltip: { backgroundColor: '#1E293B' },
    },
    scales: {
      x: { grid: { color: 'rgba(51, 65, 85, 0.2)' }, ticks: { color: '#64748B' } },
      y: { grid: { color: 'rgba(51, 65, 85, 0.2)' }, ticks: { color: '#64748B' } },
    },
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 flex justify-end">
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/80">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono text-xs font-semibold border border-blue-500/20">
                {kpi.code}
              </span>
              <h2 className="text-lg font-bold text-slate-100">{kpi.name}</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">{kpi.description}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Key Metric Overview Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Current Value</span>
              <div className="text-xl font-bold font-mono text-slate-100 mt-1">
                {kpi.unit}
                {kpi.current_value?.toLocaleString()}
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Target Goal</span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {kpi.unit}
                {kpi.target_value?.toLocaleString() || 'N/A'}
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Period Trend</span>
              <div
                className={`text-xl font-bold font-mono mt-1 ${
                  (kpi.delta_percentage || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {(kpi.delta_percentage || 0) >= 0 ? '+' : ''}
                {kpi.delta_percentage?.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Time Series History Chart */}
          <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-blue-400" /> Historical Performance Trajectory
              </span>
              <span className="text-[11px] text-slate-500 font-mono">12-Month Partitioned Time-Series</span>
            </div>

            <div className="h-56 w-full">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Triggered Alerts Activity */}
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-amber-400" /> Triggered Alert Incidents ({relatedAlerts.length})
            </span>

            {relatedAlerts.length === 0 ? (
              <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
                No threshold breaches recorded for this KPI. Status is Healthy.
              </div>
            ) : (
              <div className="space-y-2.5">
                {relatedAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3.5 bg-slate-950/70 rounded-xl border border-amber-500/20 flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <span className="text-xs font-semibold text-amber-300 uppercase">{alert.alert_type} Alert</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(alert.triggered_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{alert.message}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                          alert.status === 'active'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {alert.status}
                      </span>

                      {alert.status === 'active' && onAcknowledgeAlert && (
                        <button
                          onClick={() => onAcknowledgeAlert(alert.id)}
                          className="text-xs font-medium text-blue-400 hover:text-blue-300 hover:underline"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
