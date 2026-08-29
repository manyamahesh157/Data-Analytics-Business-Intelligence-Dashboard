import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAppStore();

  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await api.register({
        orgName,
        orgSlug: orgSlug || orgName.toLowerCase().replace(/\s+/g, '-'),
        firstName,
        lastName,
        email,
        password,
      });

      setAuth(res.data.user, res.data.accessToken, res.data.organization);
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/25 mx-auto">
            ▲
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Create BI Organization</h1>
          <p className="text-xs text-slate-400">Launch a multi-tenant analytics workspace</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Company / Org Name</label>
            <input
              type="text"
              required
              placeholder="Acme Corp"
              value={orgName}
              onChange={(e) => {
                setOrgName(e.target.value);
                setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">First Name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Last Name</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Work Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
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
            {isLoading ? 'Creating Workspace...' : 'Launch Workspace'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
