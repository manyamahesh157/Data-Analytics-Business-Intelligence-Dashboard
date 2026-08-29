import React, { useState } from 'react';
import { FileText, Plus, Download, Play, Clock, CheckCircle2, Calendar, Mail, FileSpreadsheet } from 'lucide-react';
import { useReports, useDashboards } from '../../hooks/useData';
import { ScheduledReportModal } from './ScheduledReportModal';

export const ReportsStudio: React.FC = () => {
  const { reports, reportHistory, isLoading, createReport, generateNow } = useReports();
  const { dashboards } = useDashboards();
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const handleGenerateNow = async (reportId: string) => {
    setGeneratingId(reportId);
    try {
      const result = await generateNow(reportId);
      alert(`Report generated successfully! Export file ready: ${result.data?.filename}`);
    } catch (err: any) {
      alert(`Failed to generate report: ${err.message}`);
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur p-4 rounded-2xl border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100">Automated Reporting & Export Studio</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Scheduled and on-demand generation of executive PDF briefings, CSV datasets, and formatted Excel workbooks
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsScheduleOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          Schedule Report
        </button>
      </div>

      {/* Grid: Scheduled Reports & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scheduled Reports List */}
        <div className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Active Scheduled Reports ({reports.length})
          </h2>

          <div className="space-y-3">
            {reports.map((r: any) => (
              <div key={r.id} className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-xs text-slate-100">{r.name}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{r.dashboard_title || 'Executive Dashboard'}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {r.format}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>Cron: {r.schedule_cron || 'Manual'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-slate-500" />
                    <span>{r.recipients?.length || 0} Recipients</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    Next run: {r.next_run_at ? new Date(r.next_run_at).toLocaleDateString() : 'On Demand'}
                  </span>

                  <button
                    onClick={() => handleGenerateNow(r.id)}
                    disabled={generatingId === r.id}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white text-xs font-medium border border-blue-500/20 transition-all disabled:opacity-50"
                  >
                    <Play className="w-3 h-3" />
                    {generatingId === r.id ? 'Generating...' : 'Run Now'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Report History Logs */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Generated Report Archive & Downloads
          </h2>

          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="p-3">Report Name</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Generated At</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3 text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {reportHistory.map((h: any) => (
                  <tr key={h.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-medium text-slate-200">{h.report_name}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> {h.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[11px]">
                      {new Date(h.generated_at).toLocaleString()}
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[11px]">{h.duration_ms || 1200}ms</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => alert(`Downloading report artifact from: ${h.file_url}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                      >
                        <Download className="w-3 h-3" /> Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ScheduledReportModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        dashboards={dashboards}
        onCreateReport={async (data) => {
          await createReport(data);
        }}
      />
    </div>
  );
};
