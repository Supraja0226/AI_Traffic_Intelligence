import React from 'react';
import { ShieldCheck, Zap, AlertTriangle, TrendingUp, Navigation } from 'lucide-react';

export default function MetricsOverview({ networkState = [], incidents = [], advisories = [] }) {
  const totalLinks = networkState.length || 6;
  const avgSpeed = networkState.length
    ? Math.round(networkState.reduce((acc, curr) => acc + (curr.avgSpeedKmh || curr.avg_speed_kmh || 50), 0) / networkState.length)
    : 48;

  const congestedLinks = networkState.filter(s => (s.congestionScore || s.congestion_score || 0) >= 65).length;
  const healthIndex = networkState.length
    ? Math.max(0, Math.round(100 - (networkState.reduce((acc, curr) => acc + (curr.congestionScore || curr.congestion_score || 30), 0) / networkState.length)))
    : 72;

  const cards = [
    {
      title: 'Network Health Index',
      value: `${healthIndex}%`,
      subtitle: `${congestedLinks} links under heavy/severe delay`,
      icon: ShieldCheck,
      color: healthIndex >= 70 ? 'text-emerald-400' : 'text-amber-400',
      bg: healthIndex >= 70 ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-amber-950/20 border-amber-800/40'
    },
    {
      title: 'Average Network Velocity',
      value: `${avgSpeed} km/h`,
      subtitle: 'Free-flow baseline: 65 km/h',
      icon: TrendingUp,
      color: 'text-blue-400',
      bg: 'bg-blue-950/20 border-blue-800/40'
    },
    {
      title: 'Verified Incidents',
      value: incidents.length,
      subtitle: 'Strict multi-sensor evidence only',
      icon: AlertTriangle,
      color: incidents.length > 0 ? 'text-red-400' : 'text-gray-400',
      bg: incidents.length > 0 ? 'bg-red-950/20 border-red-800/40' : 'bg-slate-900/40 border-slate-800'
    },
    {
      title: 'Operational Advisories',
      value: advisories.length,
      subtitle: 'Evidence-backed decision support',
      icon: Zap,
      color: 'text-indigo-400',
      bg: 'bg-indigo-950/20 border-indigo-800/40'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div key={i} className={`p-4 rounded-xl border ${c.bg} transition-all hover:scale-[1.01]`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">{c.title}</span>
              <Icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold tracking-tight text-white">{c.value}</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">{c.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
}
