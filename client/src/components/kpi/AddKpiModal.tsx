import React, { useState } from 'react';
import { X, Plus, Target, AlertTriangle } from 'lucide-react';
import { ImportedDataset } from '../../types';

interface AddKpiModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasets: ImportedDataset[];
  onAddKpi: (kpiData: any) => Promise<void>;
}

export const AddKpiModal: React.FC<AddKpiModalProps> = ({
  isOpen,
  onClose,
  datasets,
  onAddKpi,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [datasetId, setDatasetId] = useState(datasets[0]?.id || '');
  const [metricColumn, setMetricColumn] = useState('');
  const [formulaType, setFormulaType] = useState('sum');
  const [targetValue, setTargetValue] = useState<number | ''>(100000);
  const [warningThreshold, setWarningThreshold] = useState<number | ''>(80000);
  const [criticalThreshold, setCriticalThreshold] = useState<number | ''>(60000);
  const [unit, setUnit] = useState('$');
  const [format, setFormat] = useState('currency');
  const [periodType, setPeriodType] = useState('monthly');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentDataset = datasets.find((d) => d.id === datasetId) || datasets[0];
  const numericCols = currentDataset?.schema_definition.filter((c) => c.type === 'number') || [];
  const activeMetric = metricColumn || numericCols[0]?.name || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    setIsSubmitting(true);
    try {
      await onAddKpi({
        name,
        code: code.toUpperCase(),
        description,
        dataset_id: datasetId,
        metric_column: activeMetric,
        formula_type: formulaType,
        target_value: Number(targetValue),
        warning_threshold: Number(warningThreshold),
        critical_threshold: Number(criticalThreshold),
        unit,
        format,
        period_type: periodType,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Define New Key Performance Indicator (KPI)</h2>
            <p className="text-xs text-slate-400">Configure aggregation formula, target goals, and automated threshold alerts</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">KPI Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Monthly Recurring Revenue"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Code / Acronym</label>
              <input
                type="text"
                required
                placeholder="e.g. MRR"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 uppercase font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Description</label>
            <input
              type="text"
              placeholder="Brief explanation of the business metric..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
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
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Metric Column</label>
              <select
                value={activeMetric}
                onChange={(e) => setMetricColumn(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              >
                {numericCols.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Formula</label>
              <select
                value={formulaType}
                onChange={(e) => setFormulaType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="sum">SUM</option>
                <option value="avg">AVG</option>
                <option value="count">COUNT</option>
                <option value="min">MIN</option>
                <option value="max">MAX</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Unit Symbol</label>
              <input
                type="text"
                placeholder="$, %, etc."
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Period</label>
              <select
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-blue-400" /> Targets & Automated Threshold Alerts
            </span>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Target Value</label>
                <input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-amber-400 mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Warning &lt;
                </label>
                <input
                  type="number"
                  value={warningThreshold}
                  onChange={(e) => setWarningThreshold(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-rose-400 mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Critical &lt;
                </label>
                <input
                  type="number"
                  value={criticalThreshold}
                  onChange={(e) => setCriticalThreshold(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-rose-300 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? 'Creating...' : 'Save & Track KPI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
