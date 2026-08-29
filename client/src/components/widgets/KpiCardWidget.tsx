import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import './ChartSetup';
import { Widget } from '../../types';

export const KpiCardWidget: React.FC<{ widget: Widget }> = ({ widget }) => {
  const rows = widget.data?.rows || [];
  const metric = widget.query_config.metrics[0] || 'mrr';
  const latestRow = rows[rows.length - 1] || {};
  const prevRow = rows[rows.length - 2] || {};

  const currentValue = Number(latestRow[metric]) || 0;
  const prevValue = Number(prevRow[metric]) || 0;
  const delta = currentValue - prevValue;
  const deltaPct = prevValue !== 0 ? (delta / prevValue) * 100 : 0;
  const isPositive = delta >= 0;

  // Mini sparkline data
  const sparklineData = {
    labels: rows.map(() => ''),
    datasets: [
      {
        data: rows.map((r) => Number(r[metric]) || 0),
        borderColor: isPositive ? '#10B981' : '#EF4444',
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
    <div className="w-full h-full flex flex-col justify-between p-4 bg-slate-900/40 rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{widget.title}</span>
        <span
          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${
            isPositive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}
        >
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(deltaPct).toFixed(1)}%
        </span>
      </div>

      <div className="my-2 flex items-baseline justify-between">
        <div className="text-3xl font-bold text-slate-100 font-mono tracking-tight">
          {widget.visual_config.numberFormat === 'currency'
            ? '$' + currentValue.toLocaleString()
            : widget.visual_config.numberFormat === 'percentage'
            ? currentValue.toFixed(1) + '%'
            : currentValue.toLocaleString()}
        </div>
      </div>

      {/* Mini Sparkline Footer */}
      {widget.visual_config.sparkline !== false && rows.length > 2 && (
        <div className="h-10 w-full mt-1">
          <Line data={sparklineData} options={sparklineOptions} />
        </div>
      )}
    </div>
  );
};
