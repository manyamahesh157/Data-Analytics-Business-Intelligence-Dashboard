import React from 'react';
import { Scatter } from 'react-chartjs-2';
import './ChartSetup';
import { Widget } from '../../types';

export const ScatterChartWidget: React.FC<{ widget: Widget }> = ({ widget }) => {
  const rows = widget.data?.rows || [];
  const xMetric = widget.query_config.metrics[0] || 'discount';
  const yMetric = widget.query_config.metrics[1] || 'profit';

  const scatterPoints = rows.map((r) => ({
    x: Number(r[xMetric]) || 0,
    y: Number(r[yMetric]) || 0,
  }));

  const chartData = {
    datasets: [
      {
        label: `${xMetric.toUpperCase()} vs ${yMetric.toUpperCase()}`,
        data: scatterPoints,
        backgroundColor: '#EC4899',
        borderColor: '#BE185D',
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, labels: { color: '#94A3B8' } },
      tooltip: { backgroundColor: '#1E293B' },
    },
    scales: {
      x: {
        title: { display: true, text: xMetric.toUpperCase(), color: '#64748B' },
        grid: { color: 'rgba(51, 65, 85, 0.2)' },
        ticks: { color: '#64748B' },
      },
      y: {
        title: { display: true, text: yMetric.toUpperCase(), color: '#64748B' },
        grid: { color: 'rgba(51, 65, 85, 0.2)' },
        ticks: { color: '#64748B' },
      },
    },
  };

  return (
    <div className="w-full h-full min-h-[180px] p-2">
      <Scatter data={chartData} options={options} />
    </div>
  );
};
