import React, { useState } from 'react';
import { useAuth } from '../store/authContext';
import { useRouter } from 'next/router';
import { Activity, Shield, Lock, UserCheck, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, switchRole, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSwitch = async (role) => {
    await switchRole(role);
    router.push('/');
  };

  const demoAccounts = [
    { role: 'admin', label: 'Administrator', email: 'admin@traffic.ai', desc: 'Full infrastructure modification & system management' },
    { role: 'analyst', label: 'Traffic Analyst', email: 'analyst@traffic.ai', desc: 'Dataset upload, pipeline execution & ML forecasting' },
    { role: 'operator', label: 'TMC Operator', email: 'operator@traffic.ai', desc: 'Real-time diversion simulation & advisory acknowledgement' },
    { role: 'viewer', label: 'Public Observer', email: 'viewer@traffic.ai', desc: 'Read-only telemetry and congestion observation' }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 font-sans text-gray-100">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center mx-auto mb-3">
            <Activity className="w-6 h-6 text-blue-400 animate-pulse" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">AI Traffic Intelligence Platform</h1>
          <p className="text-xs text-gray-400 mt-1">
            Software Simulation & Road Network Decision-Support System
          </p>
        </div>

        {/* 1-Click Fast Role Evaluator */}
        <div className="glass-panel p-5 rounded-xl border border-surfaceBorder space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400 uppercase">
            <UserCheck className="w-4 h-4" />
            <span>Instant Role Evaluation Switcher</span>
          </div>
          <p className="text-[11px] text-gray-400">
            Select any role to immediately test permission gating and capability views:
          </p>

          <div className="grid grid-cols-1 gap-2 pt-1">
            {demoAccounts.map(acc => (
              <button
                key={acc.role}
                onClick={() => handleQuickSwitch(acc.role)}
                className="w-full p-2.5 rounded-lg bg-slate-900/80 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-500/40 flex items-center justify-between text-left transition group"
              >
                <div>
                  <span className="text-xs font-bold text-white capitalize block">{acc.label}</span>
                  <span className="text-[10px] text-gray-400 block">{acc.desc}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition" />
              </button>
            ))}
          </div>
        </div>

        {/* Standard Email Login Form */}
        <div className="glass-panel p-5 rounded-xl border border-surfaceBorder">
          <h2 className="text-xs font-bold text-gray-300 uppercase mb-3 flex items-center space-x-2">
            <Lock className="w-3.5 h-3.5 text-blue-400" />
            <span>Standard Credential Sign-In</span>
          </h2>

          {error && (
            <div className="mb-3 p-2.5 rounded bg-red-950/40 border border-red-800 text-red-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3 text-xs">
            <div>
              <label className="block text-gray-400 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="analyst@traffic.ai"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Safety Policy Notice */}
        <div className="text-center text-[10px] text-gray-500 flex items-center justify-center space-x-1">
          <Shield className="w-3 h-3 text-amber-500" />
          <span>Non-live environment. Software simulation and advisory output only.</span>
        </div>
      </div>
    </div>
  );
}
