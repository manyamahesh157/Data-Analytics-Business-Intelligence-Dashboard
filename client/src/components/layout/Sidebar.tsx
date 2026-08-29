import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  Database,
  FileText,
  ShieldCheck,
  Building2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const Sidebar: React.FC = () => {
  const { user, organization, isSidebarOpen, toggleSidebar, logout } = useAppStore();

  const navItems = [
    { to: '/', label: 'Dashboards', icon: LayoutDashboard },
    { to: '/kpis', label: 'KPI Center', icon: Target },
    { to: '/data-sources', label: 'Data Sources & ETL', icon: Database },
    { to: '/reports', label: 'Reports & Exports', icon: FileText },
    { to: '/audit-logs', label: 'Audit Logs', icon: ShieldCheck },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-[#0f172a] border-r border-slate-800 transition-all duration-300 ${
        isSidebarOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Brand & Organization Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/25 flex-shrink-0">
            ▲
          </div>
          {isSidebarOpen && (
            <div className="overflow-hidden">
              <span className="font-bold text-sm text-slate-100 block truncate">Apex Analytics</span>
              <span className="text-[11px] text-blue-400 font-medium block truncate flex items-center gap-1">
                <Building2 className="w-3 h-3" /> {organization?.name || 'Apex Global Inc.'}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={toggleSidebar}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
        >
          {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {isSidebarOpen && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
              alt="Avatar"
              className="w-8 h-8 rounded-lg object-cover flex-shrink-0 ring-1 ring-slate-700"
            />
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-slate-200 truncate">
                  {user?.first_name} {user?.last_name}
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">{user?.roles?.[0] || 'Admin'}</div>
              </div>
            )}
          </div>

          {isSidebarOpen && (
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
