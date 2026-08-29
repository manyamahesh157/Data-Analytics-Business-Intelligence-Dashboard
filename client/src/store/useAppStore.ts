import { create } from 'zustand';
import { User, Organization, KPIAlert } from '../types';

export interface DateRangeFilter {
  preset: 'today' | '7d' | '30d' | 'mtd' | 'qtd' | 'ytd' | 'custom';
  startDate: string;
  endDate: string;
}

interface AppState {
  user: User | null;
  token: string | null;
  organization: Organization | null;
  theme: 'light' | 'dark';
  dateRange: DateRangeFilter;
  dimensionFilters: Record<string, string>;
  activeAlerts: KPIAlert[];
  isSidebarOpen: boolean;

  setAuth: (user: User, token: string, org: Organization) => void;
  logout: () => void;
  toggleTheme: () => void;
  setDateRange: (range: Partial<DateRangeFilter>) => void;
  setDimensionFilter: (key: string, value: string) => void;
  clearDimensionFilters: () => void;
  addAlert: (alert: KPIAlert) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  organization: null,
  theme: 'dark',
  dateRange: {
    preset: '30d',
    startDate: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  },
  dimensionFilters: {},
  activeAlerts: [],
  isSidebarOpen: true,

  setAuth: (user, token, org) => {
    localStorage.setItem('token', token);
    set({ user, token, organization: org });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, organization: null });
  },

  toggleTheme: () => {
    set((state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { theme: nextTheme };
    });
  },

  setDateRange: (range) => {
    set((state) => ({
      dateRange: { ...state.dateRange, ...range },
    }));
  },

  setDimensionFilter: (key, value) => {
    set((state) => ({
      dimensionFilters: { ...state.dimensionFilters, [key]: value },
    }));
  },

  clearDimensionFilters: () => {
    set({ dimensionFilters: {} });
  },

  addAlert: (alert) => {
    set((state) => ({
      activeAlerts: [alert, ...state.activeAlerts.slice(0, 9)],
    }));
  },

  toggleSidebar: () => {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
  },
}));
