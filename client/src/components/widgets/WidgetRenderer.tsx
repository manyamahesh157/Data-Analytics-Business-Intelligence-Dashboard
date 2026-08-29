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
import { D3TreemapWidget } from './D3TreemapWidget';

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
    case 'treemap': {
      const rows = Array.isArray(widget.data) ? widget.data : widget.data?.rows || [];
      return (
        <D3TreemapWidget
          data={rows}
          config={{
            categoryField: widget.query_config?.dimensions?.[0] || 'category',
            valueField: widget.query_config?.metrics?.[0] || 'revenue',
            labelField: widget.query_config?.dimensions?.[0] || 'category',
          }}
        />
      );
    }
    default:
      return <div className="p-4 text-xs text-slate-500">Unsupported widget type: {widget.type}</div>;
  }
};
