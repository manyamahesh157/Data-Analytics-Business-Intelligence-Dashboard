import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAppStore } from '../../store/useAppStore';

export const AppLayout: React.FC = () => {
  const { isSidebarOpen } = useAppStore();

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarOpen ? 'md:ml-64' : 'md:ml-20'
        }`}
      >
        <Topbar />
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
