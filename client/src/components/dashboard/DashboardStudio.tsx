import React, { useState } from 'react';
import { Plus, LayoutGrid, Download, Share2, Edit3, Check, RefreshCw, Layers } from 'lucide-react';
import { useDashboard, useDashboards, useDataSources } from '../../hooks/useData';
import { WidgetCard } from './WidgetCard';
import { AddWidgetModal } from './AddWidgetModal';
import { useAppStore } from '../../store/useAppStore';

export const DashboardStudio: React.FC = () => {
  const { dashboards } = useDashboards();
  const [selectedDashboardId, setSelectedDashboardId] = useState<string>('');
  const activeDashboardId = selectedDashboardId || dashboards[0]?.id;

  const { dashboard, isLoading, refetch, createWidget, deleteWidget, updateLayouts } = useDashboard(activeDashboardId);
  const { datasets } = useDataSources();
  const { theme } = useAppStore();

  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const widgets = dashboard?.widgets || [];

  const handleAddWidget = async (widgetData: any) => {
    await createWidget(widgetData);
  };

  const handleDeleteWidget = async (widgetId: string) => {
    if (confirm('Are you sure you want to remove this widget?')) {
      await deleteWidget(widgetId);
    }
  };

  const handleExportDashboard = () => {
    setIsExporting(true);
    setTimeout(() => {
      window.print();
      setIsExporting(false);
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur p-4 rounded-2xl border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <select
                value={activeDashboardId}
                onChange={(e) => setSelectedDashboardId(e.target.value)}
                className="bg-transparent font-bold text-lg text-slate-100 focus:outline-none cursor-pointer border-b border-transparent hover:border-slate-700 pb-0.5"
              >
                {dashboards.map((d: any) => (
                  <option key={d.id} value={d.id} className="bg-slate-900 text-slate-100">
                    {d.title} {d.is_default ? '★ (Default)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{dashboard?.description || 'Real-time multi-source analytics dashboard'}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => refetch()}
            title="Refresh all widgets"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700/60 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>

          <button
            onClick={handleExportDashboard}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700/60 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            {isExporting ? 'Preparing...' : 'Export'}
          </button>

          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              isEditMode
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/60'
            }`}
          >
            {isEditMode ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            {isEditMode ? 'Done Editing' : 'Customize Layout'}
          </button>

          {isEditMode && (
            <button
              onClick={() => setIsAddWidgetOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Widget
            </button>
          )}
        </div>
      </div>

      {/* Grid Canvas */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-64 bg-slate-900/40 border border-slate-800/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : widgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl text-center">
          <Layers className="w-12 h-12 text-slate-600 mb-3" />
          <h4 className="text-base font-semibold text-slate-200">This dashboard has no widgets yet</h4>
          <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
            Add charts, summary KPI cards, data grids, and gauge meters to build your customized command center.
          </p>
          <button
            onClick={() => setIsAddWidgetOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            Add First Widget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 auto-rows-[220px]">
          {widgets.map((widget: any) => {
            const colSpan = widget.grid_layout?.w || 6;
            const rowSpan = widget.grid_layout?.h || 2;
            return (
              <div
                key={widget.id}
                style={{
                  gridColumn: `span ${colSpan} / span ${colSpan}`,
                  gridRow: `span ${rowSpan} / span ${rowSpan}`,
                }}
                className="w-full h-full"
              >
                <WidgetCard
                  widget={widget}
                  isEditMode={isEditMode}
                  onRefresh={() => refetch()}
                  onDelete={handleDeleteWidget}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Add Widget Modal */}
      <AddWidgetModal
        isOpen={isAddWidgetOpen}
        onClose={() => setIsAddWidgetOpen(false)}
        datasets={datasets}
        onAddWidget={handleAddWidget}
      />
    </div>
  );
};
