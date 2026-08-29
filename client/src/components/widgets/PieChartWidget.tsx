import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import './ChartSetup';
import { Widget } from '../../types';

interface PieChartWidgetProps {
  widget: Widget;
}

export const PieChartWidget: React.FC<PieChartWidgetProps> = ({ widget }) => {
  const rows = widget.data?.rows || [];
  const metric = widget.query_config.metrics[0] || 'sales';
  const dimension = widget.query_config.dimensions[0] || 'region';
  const colors = widget.visual_config.colors || ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const labels = rows.map((r) => String(r[dimension] || ''));
  const values = rows.map((r) => Number(r[metric]) || 0);

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: '#111827',
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        display: widget.visual_config.showLegend ?? true,
        position: 'right',
        labels: { color: '#94A3B8', boxWidth: 12, font: { size: 11 } },
      },
      tooltip: {
        backgroundColor: '#1E293B',
        titleColor: '#F8FAFC',
        bodyColor: '#94A3B8',
        borderColor: '#334155',
        borderWidth: 1,
        callbacks: {
          label: (context: any) => {
            const val = context.parsed;
            const total = values.reduce((a, b) => a + b, 0);
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
            return ` ${context.label}: $${val.toLocaleString()} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="w-full h-full min-h-[180px] p-2 flex items-center justify-center">
      <Doughnut data={chartData} options={options} />
    </div>
  );
};
