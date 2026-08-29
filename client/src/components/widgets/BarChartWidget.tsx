import React from 'react';
import { Bar } from 'react-chartjs-2';
import './ChartSetup';
import { Widget } from '../../types';

interface BarChartWidgetProps {
  widget: Widget;
}

export const BarChartWidget: React.FC<BarChartWidgetProps> = ({ widget }) => {
  const rows = widget.data?.rows || [];
  const metrics = widget.query_config.metrics || [];
  const dimension = widget.query_config.dimensions[0] || 'category';
  const colors = widget.visual_config.colors || ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

  const labels = rows.map((r) => String(r[dimension] || ''));

  const datasets = metrics.map((metric, idx) => {
    const color = colors[idx % colors.length];
    return {
      label: metric.toUpperCase().replace(/_/g, ' '),
      data: rows.map((r) => Number(r[metric]) || 0),
      backgroundColor: color + 'CC',
      borderColor: color,
      borderWidth: 1.5,
      borderRadius: 4,
    };
  });

  const chartData = { labels, datasets };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: widget.visual_config.showLegend ?? true,
        position: 'top',
        labels: { color: '#94A3B8', font: { size: 11 } },
      },
      tooltip: {
        backgroundColor: '#1E293B',
        titleColor: '#F8FAFC',
        bodyColor: '#94A3B8',
        borderColor: '#334155',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748B', font: { size: 11 } },
      },
      y: {
        grid: { display: widget.visual_config.showGrid ?? true, color: 'rgba(51, 65, 85, 0.2)' },
        ticks: {
          color: '#64748B',
          font: { size: 11 },
          callback: (val: any) => (widget.visual_config.numberFormat === 'currency' ? '$' + Number(val).toLocaleString() : Number(val).toLocaleString()),
        },
      },
    },
  };

  return (
    <div className="w-full h-full min-h-[180px] p-2">
      <Bar data={chartData} options={options} />
    </div>
  );
};
