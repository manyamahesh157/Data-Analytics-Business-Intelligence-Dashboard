import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ArrowRight, Sparkles, Building2, UserCheck } from 'lucide-react';
import { api } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAppStore();

  const [email, setEmail] = useState('admin@apex.io');
  const [password, setPassword] = useState('Password123!');
  const [orgSlug, setOrgSlug] = useState('apex-analytics');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e?: React.FormEvent, customEmail?: string) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const targetEmail = customEmail || email;
      const res = await api.login({
        email: targetEmail,
        password: 'Password123!',
        orgSlug: 'apex-analytics',
      });

      setAuth(res.data.user, res.data.accessToken, res.data.organization);
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/25 mx-auto">
            ▲
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Apex Analytics Platform</h1>
          <p className="text-xs text-slate-400">Enterprise Business Intelligence & KPI Command Center</p>
        </div>

        {/* Quick Demo Role Selector */}
        <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-400" /> Quick Demo Role Switcher
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { role: 'Admin', email: 'admin@apex.io', color: 'border-blue-500/40 text-blue-400' },
              { role: 'Editor', email: 'editor@apex.io', color: 'border-amber-500/40 text-amber-400' },
              { role: 'Viewer', email: 'viewer@apex.io', color: 'border-emerald-500/40 text-emerald-400' },
            ].map((r) => (
              <button
                key={r.role}
                type="button"
                onClick={() => {
                  setEmail(r.email);
                  handleLogin(undefined, r.email);
                }}
                className={`py-1.5 px-2 rounded-xl text-xs font-semibold bg-slate-900 border ${r.color} hover:bg-slate-800 transition-all text-center`}
              >
                {r.role}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 text-xs"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isLoading ? 'Signing In...' : 'Sign In to Dashboard'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Need a new workspace?{' '}
          <Link to="/register" className="text-blue-400 hover:underline">
            Create an Organization
          </Link>
        </div>
      </div>
    </div>
  );
};
