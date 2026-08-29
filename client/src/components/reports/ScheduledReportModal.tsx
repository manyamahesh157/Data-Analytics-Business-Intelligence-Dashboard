import React, { useState } from 'react';
import { X, Plus, Calendar, Mail, FileText } from 'lucide-react';
import { Dashboard, Report } from '../../types';

interface ScheduledReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dashboards: Dashboard[];
  onCreateReport: (reportData: any) => Promise<void>;
}

export const ScheduledReportModal: React.FC<ScheduledReportModalProps> = ({
  isOpen,
  onClose,
  dashboards,
  onCreateReport,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dashboardId, setDashboardId] = useState(dashboards[0]?.id || '');
  const [format, setFormat] = useState<Report['format']>('pdf');
  const [cronExpression, setCronExpression] = useState('0 9 * * 1'); // Monday 9am
  const [recipientsText, setRecipientsText] = useState('exec-team@apex.io, board@apex.io');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const recipients = recipientsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setIsSubmitting(true);
    try {
      await onCreateReport({
        name,
        description,
        dashboard_id: dashboardId,
        format,
        schedule_cron: cronExpression,
        recipients,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Schedule Automated Executive Report</h2>
            <p className="text-xs text-slate-400">Configure recurring PDF / Excel briefing deliveries via email</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Report Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Weekly SaaS Performance Briefing"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Source Dashboard</label>
              <select
                value={dashboardId}
                onChange={(e) => setDashboardId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              >
                {dashboards.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="pdf">PDF Document</option>
                <option value="excel">Excel Workbook (.xlsx)</option>
                <option value="csv">CSV Spreadsheet</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Schedule Frequency</label>
            <select
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value="0 9 * * 1">Every Monday at 9:00 AM (Weekly)</option>
              <option value="0 8 1 * *">1st of Every Month at 8:00 AM (Monthly)</option>
              <option value="0 8 * * *">Daily at 8:00 AM</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Recipient Emails (comma-separated)</label>
            <input
              type="text"
              required
              value={recipientsText}
              onChange={(e) => setRecipientsText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? 'Scheduling...' : 'Save & Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
