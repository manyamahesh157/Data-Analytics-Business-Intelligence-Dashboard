import React, { useState } from 'react';
import { X, Plus, BarChart3, LineChart, PieChart, Activity, Table, Gauge } from 'lucide-react';
import { ImportedDataset, WidgetType } from '../../types';

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasets: ImportedDataset[];
  onAddWidget: (widgetData: any) => Promise<void>;
}

export const AddWidgetModal: React.FC<AddWidgetModalProps> = ({
  isOpen,
  onClose,
  datasets,
  onAddWidget,
}) => {
  const [title, setTitle] = useState('');
  const [datasetId, setDatasetId] = useState(datasets[0]?.id || '');
  const [type, setType] = useState<WidgetType>('line');
  const [selectedMetric, setSelectedMetric] = useState('');
  const [selectedDimension, setSelectedDimension] = useState('');
  const [numberFormat, setNumberFormat] = useState<'standard' | 'currency' | 'percentage'>('standard');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentDataset = datasets.find((d) => d.id === datasetId) || datasets[0];
  const columns = currentDataset?.schema_definition || [];
  const numericCols = columns.filter((c) => c.type === 'number');
  const stringOrDateCols = columns.filter((c) => c.type === 'string' || c.type === 'date');

  const defaultMetric = selectedMetric || numericCols[0]?.name || '';
  const defaultDimension = selectedDimension || stringOrDateCols[0]?.name || '';

  const chartTypeOptions: { type: WidgetType; label: string; icon: any }[] = [
    { type: 'line', label: 'Line Chart', icon: LineChart },
    { type: 'bar', label: 'Bar Chart', icon: BarChart3 },
    { type: 'pie', label: 'Pie / Donut', icon: PieChart },
    { type: 'area', label: 'Area Chart', icon: Activity },
    { type: 'kpi_card', label: 'KPI Card', icon: Activity },
    { type: 'table', label: 'Data Table', icon: Table },
    { type: 'gauge', label: 'Gauge', icon: Gauge },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setIsSubmitting(true);
    try {
      await onAddWidget({
        title,
        dataset_id: datasetId,
        type,
        grid_layout: { x: 0, y: 0, w: type === 'table' ? 12 : type === 'gauge' || type === 'kpi_card' ? 4 : 6, h: 4 },
        query_config: {
          metrics: [defaultMetric],
          dimensions: defaultDimension ? [defaultDimension] : [],
          filters: [],
          limit: 20,
        },
        visual_config: {
          showLegend: true,
          showGrid: true,
          sparkline: true,
          numberFormat,
          colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
        },
        refresh_interval_seconds: 0,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Add New Dashboard Widget</h2>
            <p className="text-xs text-slate-400">Configure visual analytics from imported data sources</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Widget Title</label>
            <input
              type="text"
              required
              placeholder="e.g., Monthly ARR Velocity or Sales by Region"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Dataset Source</label>
              <select
                value={datasetId}
                onChange={(e) => setDatasetId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              >
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.row_count} rows)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Number Format</label>
              <select
                value={numberFormat}
                onChange={(e) => setNumberFormat(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="standard">Standard Number</option>
                <option value="currency">Currency ($)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Visualization Type</label>
            <div className="grid grid-cols-4 gap-2.5">
              {chartTypeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = type === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setType(opt.type)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-md shadow-blue-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1.5" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Metric Column (Y-Axis / Value)</label>
              <select
                value={defaultMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              >
                {numericCols.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Dimension Column (X-Axis / Group)</label>
              <select
                value={defaultDimension}
                onChange={(e) => setSelectedDimension(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              >
                {stringOrDateCols.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? 'Creating...' : 'Add Widget to Dashboard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
