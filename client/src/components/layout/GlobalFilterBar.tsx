import React from 'react';
import { Calendar, Filter, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const GlobalFilterBar: React.FC = () => {
  const { dateRange, setDateRange, dimensionFilters, setDimensionFilter, clearDimensionFilters } = useAppStore();

  const presets = [
    { id: 'today', label: 'Today' },
    { id: '7d', label: 'Last 7D' },
    { id: '30d', label: 'Last 30D' },
    { id: 'mtd', label: 'MTD' },
    { id: 'qtd', label: 'QTD' },
    { id: 'ytd', label: 'YTD' },
  ] as const;

  const hasActiveFilters = Object.keys(dimensionFilters).length > 0;

  return (
    <div className="flex items-center gap-3 overflow-x-auto py-1 text-xs">
      {/* Date Range Presets */}
      <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
        <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1.5" />
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => setDateRange({ preset: p.id })}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              dateRange.preset === p.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Region Slicer */}
      <div className="flex items-center gap-1.5">
        <select
          value={dimensionFilters['region'] || ''}
          onChange={(e) => setDimensionFilter('region', e.target.value)}
          className="bg-slate-950/80 border border-slate-800 text-slate-300 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
        >
          <option value="">All Regions</option>
          <option value="North America">North America</option>
          <option value="EMEA">EMEA</option>
          <option value="APAC">APAC</option>
          <option value="LATAM">LATAM</option>
        </select>
      </div>

      {/* Category Slicer */}
      <div className="flex items-center gap-1.5">
        <select
          value={dimensionFilters['category'] || ''}
          onChange={(e) => setDimensionFilter('category', e.target.value)}
          className="bg-slate-950/80 border border-slate-800 text-slate-300 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
        >
          <option value="">All Product Categories</option>
          <option value="Enterprise Software">Enterprise Software</option>
          <option value="Cloud Infrastructure">Cloud Infrastructure</option>
          <option value="Security Suite">Security Suite</option>
          <option value="Analytics Tools">Analytics Tools</option>
        </select>
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearDimensionFilters}
          className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 ml-1"
        >
          <X className="w-3 h-3" /> Reset
        </button>
      )}
    </div>
  );
};
