import React from 'react';
import { Line } from 'react-chartjs-2';
import './ChartSetup';
import { Widget } from '../../types';

export const AreaChartWidget: React.FC<{ widget: Widget }> = ({ widget }) => {
  const rows = widget.data?.rows || [];
  const metrics = widget.query_config.metrics || [];
  const dimension = widget.query_config.dimensions[0] || 'month';
  const colors = widget.visual_config.colors || ['#F59E0B', '#8B5CF6'];

  const labels = rows.map((r) => String(r[dimension] || ''));

  const datasets = metrics.map((metric, idx) => {
    const color = colors[idx % colors.length];
    return {
      label: metric.toUpperCase().replace(/_/g, ' '),
      data: rows.map((r) => Number(r[metric]) || 0),
      fill: true,
      backgroundColor: color + '25',
      borderColor: color,
      tension: 0.4,
      pointRadius: 3,
      borderWidth: 2,
    };
  });

  const chartData = { labels, datasets };
  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: widget.visual_config.showLegend ?? true, position: 'top', labels: { color: '#94A3B8' } },
      tooltip: { backgroundColor: '#1E293B' },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#64748B' } },
      y: { grid: { color: 'rgba(51, 65, 85, 0.2)' }, ticks: { color: '#64748B' } },
    },
  };

  return (
    <div className="w-full h-full min-h-[180px] p-2">
      <Line data={chartData} options={options} />
    </div>
  );
};
