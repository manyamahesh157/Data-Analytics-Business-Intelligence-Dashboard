import React from 'react';
import { MoreVertical, RefreshCw, Trash2, GripVertical, Clock } from 'lucide-react';
import { Widget } from '../../types';
import { WidgetRenderer } from '../widgets/WidgetRenderer';

interface WidgetCardProps {
  widget: Widget;
  isEditMode?: boolean;
  onRefresh?: (widgetId: string) => void;
  onDelete?: (widgetId: string) => void;
}

export const WidgetCard: React.FC<WidgetCardProps> = ({
  widget,
  isEditMode = false,
  onRefresh,
  onDelete,
}) => {
  return (
    <div className="h-full w-full flex flex-col bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl shadow-lg hover:border-slate-700/80 transition-all duration-200 overflow-hidden group">
      {/* Widget Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800/80 bg-slate-900/50">
        <div className="flex items-center gap-2 overflow-hidden">
          {isEditMode && (
            <div className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300">
              <GripVertical className="w-4 h-4" />
            </div>
          )}
          <h3 className="font-semibold text-xs tracking-wide text-slate-200 truncate">{widget.title}</h3>
        </div>

        <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
          {widget.data?.executionTimeMs !== undefined && (
            <span className="hidden md:inline-flex items-center gap-0.5 text-[10px] text-slate-500 font-mono">
              <Clock className="w-2.5 h-2.5" />
              {widget.data.executionTimeMs}ms
            </span>
          )}

          {onRefresh && (
            <button
              onClick={() => onRefresh(widget.id)}
              title="Refresh widget data"
              className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          {isEditMode && onDelete && (
            <button
              onClick={() => onDelete(widget.id)}
              title="Delete widget"
              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Widget Body */}
      <div className="flex-1 w-full p-2 overflow-hidden flex items-center justify-center">
        <WidgetRenderer widget={widget} />
      </div>
    </div>
  );
};
