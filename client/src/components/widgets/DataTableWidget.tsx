import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Widget } from '../../types';

export const DataTableWidget: React.FC<{ widget: Widget }> = ({ widget }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const rows = widget.data?.rows || [];
  const columns = widget.data?.columns || (rows.length > 0 ? Object.keys(rows[0]) : []);

  const filteredRows = rows.filter((r) =>
    columns.some((c) => String(r[c] || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="w-full h-full flex flex-col justify-between overflow-hidden p-2 text-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="relative w-48">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
          <input
            type="text"
            placeholder="Search rows..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-md pl-8 pr-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>
        <span className="text-[11px] text-slate-400 font-mono">{filteredRows.length} rows</span>
      </div>

      <div className="flex-1 overflow-auto rounded border border-slate-800/80">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
              {columns.map((c) => (
                <th key={c} className="p-2 whitespace-nowrap uppercase tracking-wider text-[10px]">
                  {c.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {paginatedRows.map((r, i) => (
              <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                {columns.map((c) => (
                  <td key={c} className="p-2 whitespace-nowrap text-slate-300 font-mono text-[11px]">
                    {typeof r[c] === 'number' ? r[c].toLocaleString() : String(r[c] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-slate-400">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
