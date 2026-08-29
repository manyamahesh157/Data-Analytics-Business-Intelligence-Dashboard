import React, { useState } from 'react';
import { Target, Plus, ArrowUpRight, ArrowDownRight, AlertTriangle, CheckCircle2, RefreshCw, Filter, Sparkles } from 'lucide-react';
import { useKpis, useDataSources } from '../../hooks/useData';
import { KPIDefinition } from '../../types';
import { Line } from 'react-chartjs-2';
import '../widgets/ChartSetup';
import { AddKpiModal } from './AddKpiModal';
import { KpiDrillDownDrawer } from './KpiDrillDownDrawer';

export const KpiMonitoringHub: React.FC = () => {
  const { kpis, alerts, isLoading, refetch, createKpi, acknowledgeAlert, resolveAlert } = useKpis();
  const { datasets } = useDataSources();

  const [filterStatus, setFilterStatus] = useState<'all' | 'healthy' | 'warning' | 'critical'>('all');
  const [selectedKpi, setSelectedKpi] = useState<KPIDefinition | null>(null);
  const [isAddKpiOpen, setIsAddKpiOpen] = useState(false);

  const filteredKpis = kpis.filter((k: any) => (filterStatus === 'all' ? true : k.status === filterStatus));
  const activeAlertsCount = alerts.filter((a: any) => a.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur p-4 rounded-2xl border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Key Performance Indicator (KPI) Monitoring Center
              {activeAlertsCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">
                  <AlertTriangle className="w-3 h-3" /> {activeAlertsCount} Active Breaches
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Live time-series KPI tracking with Period-over-Period comparisons and automated threshold alerts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {(['all', 'healthy', 'warning', 'critical'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-lg capitalize font-medium transition-colors ${
                  filterStatus === st
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60"
            title="Refresh KPIs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsAddKpiOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            Define KPI
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-44 bg-slate-900/40 border border-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredKpis.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl">
          <p className="text-sm text-slate-400">No KPIs found matching filter "{filterStatus}".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredKpis.map((kpi: any) => {
            const isPositive = (kpi.delta_percentage || 0) >= 0;
            const history = kpi.history || [];

            const sparklineData = {
              labels: history.map(() => ''),
              datasets: [
                {
                  data: history.map((h: any) => Number(h.value)),
                  borderColor: kpi.status === 'critical' ? '#EF4444' : kpi.status === 'warning' ? '#F59E0B' : '#10B981',
                  borderWidth: 2,
                  pointRadius: 0,
                  tension: 0.3,
                },
              ],
            };

            const sparklineOptions: any = {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false }, tooltip: { enabled: false } },
              scales: { x: { display: false }, y: { display: false } },
            };

            return (
              <div
                key={kpi.id}
                onClick={() => setSelectedKpi(kpi)}
                className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-5 shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono text-[10px] font-semibold border border-blue-500/20">
                        {kpi.code}
                      </span>
                      <span className="text-xs font-semibold text-slate-200 truncate">{kpi.name}</span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        kpi.status === 'critical'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : kpi.status === 'warning'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {kpi.status}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mt-2">
                    <div className="text-3xl font-bold font-mono text-slate-100 tracking-tight">
                      {kpi.unit}
                      {kpi.current_value?.toLocaleString()}
                    </div>

                    <div
                      className={`inline-flex items-center gap-0.5 text-xs font-semibold font-mono ${
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {Math.abs(kpi.delta_percentage || 0).toFixed(1)}% MoM
                    </div>
                  </div>

                  {kpi.target_value && (
                    <div className="text-[11px] text-slate-400 mt-1">
                      Target: <span className="text-slate-300 font-mono">{kpi.unit}{Number(kpi.target_value).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Sparkline Graph */}
                <div className="h-12 w-full mt-4 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="h-full flex-1 mr-3">
                    <Line data={sparklineData} options={sparklineOptions} />
                  </div>
                  <span className="text-[10px] text-slate-500 group-hover:text-blue-400 transition-colors font-medium">
                    Drill-down →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drill-down Drawer */}
      <KpiDrillDownDrawer
        kpi={selectedKpi}
        alerts={alerts}
        onClose={() => setSelectedKpi(null)}
        onAcknowledgeAlert={(id) => { acknowledgeAlert(id); }}
        onResolveAlert={(id) => { resolveAlert(id); }}
      />

      {/* Add KPI Modal */}
      <AddKpiModal
        isOpen={isAddKpiOpen}
        onClose={() => setIsAddKpiOpen(false)}
        datasets={datasets}
        onAddKpi={async (data) => {
          await createKpi(data);
        }}
      />
    </div>
  );
};
