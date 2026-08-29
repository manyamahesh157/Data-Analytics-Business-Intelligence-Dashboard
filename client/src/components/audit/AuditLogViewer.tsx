import React, { useState } from 'react';
import { ShieldCheck, Search, Eye, Filter } from 'lucide-react';
import { useAuditLogs } from '../../hooks/useData';
import { AuditLog } from '../../types';

export const AuditLogViewer: React.FC = () => {
  const { data: logs = [], isLoading } = useAuditLogs();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = logs.filter(
    (l: AuditLog) =>
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.user_email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur p-4 rounded-2xl border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100">Enterprise Security & Mutation Audit Logs</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Immutable audit ledger capturing all data mutations, administrative actions, and access events
            </p>
          </div>
        </div>

        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search action, entity, user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <th className="p-3">Action</th>
              <th className="p-3">Entity Target</th>
              <th className="p-3">User Actor</th>
              <th className="p-3">IP Address</th>
              <th className="p-3">Timestamp</th>
              <th className="p-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredLogs.map((log: AuditLog) => (
              <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded font-mono text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {log.action}
                  </span>
                </td>
                <td className="p-3 text-slate-300 font-medium">{log.entity}</td>
                <td className="p-3 text-slate-300">{log.user_email || 'system'}</td>
                <td className="p-3 text-slate-400 font-mono text-[11px]">{log.ip_address || '127.0.0.1'}</td>
                <td className="p-3 text-slate-400 font-mono text-[11px]">{new Date(log.created_at).toLocaleString()}</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => setSelectedLog(log)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Log Payload JSON Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-sm">Audit Payload Inspection</h3>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-blue-300 overflow-auto max-h-72">
              <pre>{JSON.stringify(selectedLog.new_values || { info: 'No custom payload recorded' }, null, 2)}</pre>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
