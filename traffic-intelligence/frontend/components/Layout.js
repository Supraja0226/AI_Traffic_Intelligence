import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../store/authContext';
import { getSocket } from '../services/socket';
import {
  Activity,
  Layers,
  Cpu,
  GitFork,
  FileCheck,
  Shield,
  Radio,
  Bell,
  UserCheck,
  Menu,
  X,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';

export default function Layout({ children, title = 'Traffic Command Center' }) {
  const router = useRouter();
  const { user, switchRole } = useAuth();
  const [socketConnected, setSocketConnected] = useState(false);
  const [alertsCount, setAlertsCount] = useState(1);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      if (socket.connected) setSocketConnected(true);
      socket.on('connect', () => setSocketConnected(true));
      socket.on('disconnect', () => setSocketConnected(false));
      socket.on('system:alert', () => setAlertsCount(prev => prev + 1));
    }
  }, []);

  const navItems = [
    { name: 'Command Center', href: '/', icon: Activity },
    { name: 'Datasets', href: '/datasets', icon: Layers },
    { name: 'Agent Analysis', href: '/analysis', icon: Cpu },
    { name: 'Simulations', href: '/simulations', icon: GitFork },
    { name: 'Advisories & Evidence', href: '/advisories', icon: FileCheck },
  ];

  const roles = ['admin', 'analyst', 'operator', 'viewer'];

  return (
    <div className="min-h-screen flex bg-background text-gray-100 antialiased font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-surface/90 border-r border-surfaceBorder select-none">
        <div className="p-5 border-b border-surfaceBorder flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-400 animate-pulse" />
            </div>
            <div>
              <span className="font-bold text-base tracking-wide bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
                TrafficIntel AI
              </span>
              <p className="text-[10px] text-gray-400 tracking-wider uppercase">Road Network Engine</p>
            </div>
          </div>
        </div>

        {/* Safety Disclaimer in Sidebar */}
        <div className="mx-3 mt-3 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-md">
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>Advisory Mode Only</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 leading-tight">
            Software simulation only. No direct municipal signal or hardware actuation.
          </p>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = router.pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-blue-400' : 'text-gray-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Live Socket Status */}
        <div className="p-4 border-t border-surfaceBorder/80 bg-black/20 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${socketConnected ? 'bg-emerald-500 shadow-[0_0_8px_#10B981]' : 'bg-rose-500'}`} />
            <span className="text-gray-300">{socketConnected ? 'Live Stream Active' : 'Connecting Stream...'}</span>
          </div>
          <Radio className="w-3.5 h-3.5 text-gray-400" />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header className="h-16 px-6 border-b border-surfaceBorder flex items-center justify-between bg-surface/50 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-lg font-semibold tracking-tight text-white">{title}</h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Regulatory Badge */}
            <div className="hidden lg:flex items-center space-x-2 bg-blue-950/40 border border-blue-800/40 px-3 py-1 rounded-full text-xs text-blue-300">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              <span>Observe → Analyze → Forecast → Simulate → Advise</span>
            </div>

            {/* Role Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition"
              >
                <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span className="capitalize text-gray-200">{user?.role || 'analyst'}</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 z-50">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-gray-400 border-b border-slate-800">
                    Switch Active Role
                  </div>
                  {roles.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        switchRole(r);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-blue-600/20 hover:text-blue-300 ${
                        user?.role === r ? 'text-blue-400 font-semibold bg-blue-950/40' : 'text-gray-300'
                      }`}
                    >
                      <span className="capitalize">{r}</span>
                      {user?.role === r && <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <Link href="/advisories" className="relative p-2 rounded-lg bg-slate-800/60 border border-slate-700 hover:text-white text-gray-400 transition">
              <Bell className="w-4 h-4" />
              {alertsCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              )}
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-slate-800"
              >
                {item.name}
              </Link>
            ))}
          </div>
        )}

        {/* Body Container */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
