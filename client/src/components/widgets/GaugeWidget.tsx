import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import './ChartSetup';
import { Widget } from '../../types';

export const GaugeWidget: React.FC<{ widget: Widget }> = ({ widget }) => {
  const rows = widget.data?.rows || [];
  const metric = widget.query_config.metrics[0] || 'nrr';
  const latestRow = rows[rows.length - 1] || {};
  const value = Number(latestRow[metric]) || 119.3;

  const min = widget.visual_config.gaugeMin ?? 0;
  const max = widget.visual_config.gaugeMax ?? 150;
  const threshold = widget.visual_config.threshold ?? 100;

  const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);

  const chartData = {
    labels: ['Actual', 'Remaining'],
    datasets: [
      {
        data: [percentage, 100 - percentage],
        backgroundColor: [value >= threshold ? '#10B981' : '#EF4444', 'rgba(51, 65, 85, 0.25)'],
        borderColor: '#111827',
        borderWidth: 0,
        circumference: 180,
        rotation: 270,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-2 relative">
      <div className="w-full h-32 relative flex items-center justify-center">
        <Doughnut data={chartData} options={options} />
        <div className="absolute top-16 flex flex-col items-center">
          <span className="text-2xl font-bold font-mono text-slate-100">{value.toFixed(1)}%</span>
          <span className="text-[10px] uppercase font-semibold text-slate-400">Target: {threshold}%</span>
        </div>
      </div>
      <div className="w-full flex justify-between px-6 text-[10px] text-slate-500 font-mono">
        <span>{min}%</span>
        <span>{max}%</span>
      </div>
    </div>
  );
};
