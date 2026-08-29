import React from 'react';
import { Widget } from '../../types';
import { LineChartWidget } from './LineChartWidget';
import { BarChartWidget } from './BarChartWidget';
import { PieChartWidget } from './PieChartWidget';
import { AreaChartWidget } from './AreaChartWidget';
import { ScatterChartWidget } from './ScatterChartWidget';
import { KpiCardWidget } from './KpiCardWidget';
import { DataTableWidget } from './DataTableWidget';
import { GaugeWidget } from './GaugeWidget';

interface WidgetRendererProps {
  widget: Widget;
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({ widget }) => {
  switch (widget.type) {
    case 'line':
      return <LineChartWidget widget={widget} />;
    case 'bar':
      return <BarChartWidget widget={widget} />;
    case 'pie':
      return <PieChartWidget widget={widget} />;
    case 'area':
      return <AreaChartWidget widget={widget} />;
    case 'scatter':
      return <ScatterChartWidget widget={widget} />;
    case 'kpi_card':
      return <KpiCardWidget widget={widget} />;
    case 'table':
      return <DataTableWidget widget={widget} />;
    case 'gauge':
      return <GaugeWidget widget={widget} />;
    default:
      return <div className="p-4 text-xs text-slate-500">Unsupported widget type: {widget.type}</div>;
  }
};
