import React, { useState } from 'react';
import { Bell, Sun, Moon, Sparkles, AlertTriangle, Check, Menu } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { GlobalFilterBar } from './GlobalFilterBar';
import { useKpis } from '../../hooks/useData';

export const Topbar: React.FC = () => {
  const { theme, toggleTheme, toggleSidebar, activeAlerts } = useAppStore();
  const { alerts } = useKpis();
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  const activeAlertList = alerts.filter((a: any) => a.status === 'active');

  return (
    <header className="h-16 bg-[#0f172a]/90 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20 gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Date & Dimension Filter Bar */}
        <GlobalFilterBar />
      </div>

      <div className="flex items-center gap-3">
        {/* Alerts Popover */}
        <div className="relative">
          <button
            onClick={() => setIsAlertsOpen(!isAlertsOpen)}
            className="relative p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors border border-slate-800"
          >
            <Bell className="w-4 h-4" />
            {activeAlertList.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900 animate-pulse" />
            )}
          </button>

          {isAlertsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Live KPI Threshold Alerts ({activeAlertList.length})
                </span>
                <button onClick={() => setIsAlertsOpen(false)} className="text-xs text-slate-500 hover:text-slate-300">
                  ✕
                </button>
              </div>

              {activeAlertList.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-500">All KPIs are operating within target thresholds.</div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {activeAlertList.map((a: any) => (
                    <div key={a.id} className="p-2.5 bg-slate-950/80 rounded-xl border border-rose-500/20 text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold text-rose-400">
                        <span className="flex items-center gap-1 font-mono">
                          <AlertTriangle className="w-3 h-3" /> {a.kpi_code}
                        </span>
                        <span className="text-[10px] text-slate-500">{new Date(a.triggered_at).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-tight">{a.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors border border-slate-800"
          title="Toggle Light / Dark mode"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
        </button>
      </div>
    </header>
  );
};
