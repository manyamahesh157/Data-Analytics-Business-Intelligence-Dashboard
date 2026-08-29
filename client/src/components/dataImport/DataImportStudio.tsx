import React, { useState } from 'react';
import { Database, Plus, RefreshCw, FileText, CheckCircle, Clock, AlertTriangle, Table as TableIcon } from 'lucide-react';
import { useDataSources } from '../../hooks/useData';
import { IngestionWizardModal } from './IngestionWizardModal';

export const DataImportStudio: React.FC = () => {
  const { dataSources, datasets, importJobs, isLoading, uploadFile, ingestConnector } = useDataSources();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');

  const activeDataset = datasets.find((d: any) => d.id === (selectedDatasetId || datasets[0]?.id)) || datasets[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur p-4 rounded-2xl border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100">Data Connectors & Ingestion Studio</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Connect external databases, CSV/Excel uploads, REST APIs, and Google Sheets into queryable analytics datasets
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsWizardOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          New Ingestion Pipeline
        </button>
      </div>

      {/* Grid: Active Connectors & Import History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Connected Data Sources */}
        <div className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Configured Data Sources ({dataSources.length})
          </h2>

          <div className="space-y-3">
            {dataSources.map((ds: any) => (
              <div key={ds.id} className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-200">{ds.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {ds.type}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-400" /> {ds.status}
                  </span>
                  <span>Last synced: {new Date(ds.last_synced_at || ds.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Middle / Right Column: ETL Ingestion Jobs & Preview */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Recent ETL Ingestion Jobs
          </h2>

          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="p-3">Source Name</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Rows Processed</th>
                  <th className="p-3">Started At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {importJobs.map((job: any) => (
                  <tr key={job.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-medium text-slate-200">{job.data_source_name}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold ${
                          job.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : job.status === 'processing'
                            ? 'bg-blue-500/10 text-blue-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-300">
                      {job.processed_rows} / {job.total_rows}
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[11px]">
                      {new Date(job.created_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Dataset Schema & Data Preview */}
          {activeDataset && (
            <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3 mt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TableIcon className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-xs text-slate-200">
                    Dataset Preview: {activeDataset.name} ({activeDataset.row_count} total rows)
                  </span>
                </div>
                <select
                  value={activeDataset.id}
                  onChange={(e) => setSelectedDatasetId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                >
                  {datasets.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      {(activeDataset.schema_definition || []).map((col: any) => (
                        <th key={col.name} className="p-2.5 font-mono text-[11px]">
                          {col.name} <span className="text-[9px] text-slate-500">({col.type})</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {(activeDataset.data_preview || []).map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-800/30">
                        {(activeDataset.schema_definition || []).map((col: any) => (
                          <td key={col.name} className="p-2.5 font-mono text-slate-300 text-[11px]">
                            {typeof row[col.name] === 'number' ? row[col.name].toLocaleString() : String(row[col.name] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ingestion Wizard Modal */}
      <IngestionWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onUploadFile={uploadFile}
        onConnectorSync={ingestConnector}
      />
    </div>
  );
};
