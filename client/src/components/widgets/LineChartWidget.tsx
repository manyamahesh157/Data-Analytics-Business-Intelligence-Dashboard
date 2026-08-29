import React from 'react';
import { Line } from 'react-chartjs-2';
import './ChartSetup';
import { Widget } from '../../types';

interface LineChartWidgetProps {
  widget: Widget;
}

export const LineChartWidget: React.FC<LineChartWidgetProps> = ({ widget }) => {
  const rows = widget.data?.rows || [];
  const metrics = widget.query_config.metrics || [];
  const dimension = widget.query_config.dimensions[0] || 'month';
  const colors = widget.visual_config.colors || ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  const labels = rows.map((r) => String(r[dimension] || ''));

  const datasets = metrics.map((metric, idx) => {
    const color = colors[idx % colors.length];
    return {
      label: metric.toUpperCase().replace(/_/g, ' '),
      data: rows.map((r) => Number(r[metric]) || 0),
      borderColor: color,
      backgroundColor: color + '20',
      tension: 0.35,
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2.5,
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
        labels: { color: '#94A3B8', font: { size: 11, family: 'Inter' } },
      },
      tooltip: {
        backgroundColor: '#1E293B',
        titleColor: '#F8FAFC',
        bodyColor: '#94A3B8',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 10,
      },
    },
    scales: {
      x: {
        grid: { display: widget.visual_config.showGrid ?? true, color: 'rgba(51, 65, 85, 0.2)' },
        ticks: { color: '#64748B', font: { size: 11 } },
      },
      y: {
        grid: { display: widget.visual_config.showGrid ?? true, color: 'rgba(51, 65, 85, 0.2)' },
        ticks: {
          color: '#64748B',
          font: { size: 11 },
          callback: (value: any) => {
            if (widget.visual_config.numberFormat === 'currency') {
              return '$' + Number(value).toLocaleString();
            }
            return Number(value).toLocaleString();
          },
        },
      },
    },
  };

  return (
    <div className="w-full h-full min-h-[180px] p-2">
      <Line data={chartData} options={options} />
    </div>
  );
};
