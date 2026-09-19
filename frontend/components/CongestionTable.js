import React from 'react';
import { ArrowUpRight, Gauge, Layers } from 'lucide-react';

export default function CongestionTable({ networkState = [], onSimulateDiversion, onSimulateExpansion }) {
  const getBadge = (lvl) => {
    switch (lvl) {
      case 'SEVERE': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'HEAVY': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'MODERATE': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'LIGHT': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    }
  };

  const getLosBadge = (los) => {
    if (los === 'A' || los === 'B') return 'text-emerald-400 bg-emerald-950/40 border-emerald-800';
    if (los === 'C' || los === 'D') return 'text-amber-400 bg-amber-950/40 border-amber-800';
    return 'text-red-400 bg-red-950/40 border-red-800 animate-pulse';
  };

  return (
    <div className="glass-panel rounded-xl p-5 border border-surfaceBorder">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <Gauge className="w-4 h-4 text-blue-400" />
            <span>Corridor-by-Corridor Telemetry & Capacity Saturation</span>
          </h2>
          <p className="text-xs text-gray-400">Bureau of Public Roads physics calculations and HCM classification</p>
        </div>
        <span className="text-xs text-gray-400 font-mono">{networkState.length} links monitored</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-300">
          <thead className="bg-slate-900/60 text-gray-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Corridor</th>
              <th className="py-3 px-3 text-center">LOS</th>
              <th className="py-3 px-3">Congestion</th>
              <th className="py-3 px-3">Speed (km/h)</th>
              <th className="py-3 px-3">Volume (veh/h)</th>
              <th className="py-3 px-3">V/C Ratio</th>
              <th className="py-3 px-3">Occupancy</th>
              <th className="py-3 px-4 text-right">Simulation Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {networkState.map((edge, idx) => {
              const eid = edge.edgeId || edge.edge_id;
              const name = edge.roadName || edge.road_name || eid;
              const lvl = edge.congestionLevel || (edge.congestion_score > 80 ? 'SEVERE' : edge.congestion_score > 60 ? 'HEAVY' : edge.congestion_score > 40 ? 'MODERATE' : 'FREE_FLOW');
              const los = edge.los || 'B';
              const spd = edge.avgSpeedKmh || edge.avg_speed_kmh || 55;
              const ffs = edge.freeFlowSpeedKmh || edge.free_flow_speed_kmh || 65;
              const vol = edge.volumeVehHr || edge.volume_veh_hr || 2000;
              const cap = edge.capacityVehHr || edge.capacity_veh_hr || 3000;
              const vc = edge.vcRatio || edge.vc_ratio || +(vol / cap).toFixed(2);
              const occ = edge.occupancyPct || edge.occupancy_pct || 25;

              return (
                <tr key={eid || idx} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-sans font-medium text-white flex items-center space-x-2">
                    <span className="text-[10px] text-gray-500 font-mono">[{eid}]</span>
                    <span>{name}</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${getLosBadge(los)}`}>
                      {los}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-sans">
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${getBadge(lvl)}`}>
                      {lvl}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={spd < ffs * 0.6 ? 'text-red-400 font-bold' : 'text-gray-200'}>
                      {spd}
                    </span>
                    <span className="text-[10px] text-gray-500 ml-1">/ {ffs}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span>{vol}</span>
                    <span className="text-[10px] text-gray-500 ml-1">/ {cap}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={vc >= 1.0 ? 'text-red-400 font-bold' : vc >= 0.85 ? 'text-amber-400' : 'text-gray-300'}>
                      {vc}
                    </span>
                  </td>
                  <td className="py-3 px-3">{occ}%</td>
                  <td className="py-3 px-4 text-right space-x-2 font-sans">
                    <button
                      onClick={() => onSimulateDiversion && onSimulateDiversion(eid)}
                      className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded text-[11px] transition"
                    >
                      Divert Flow
                    </button>
                    <button
                      onClick={() => onSimulateExpansion && onSimulateExpansion(eid)}
                      className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded text-[11px] transition"
                    >
                      +1 Lane
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
