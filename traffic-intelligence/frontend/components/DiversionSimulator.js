import React, { useState } from 'react';
import { simulationApi } from '../services/api';
import { GitFork, ArrowRight, Shield, Check, Play, RefreshCw } from 'lucide-react';

export default function DiversionSimulator({ networkState = [], onDiversionApplied }) {
  const [congestedEdgeId, setCongestedEdgeId] = useState('EDGE_101');
  const [diversionPct, setDiversionPct] = useState(15);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleRunSimulation = async () => {
    setLoading(true);
    try {
      const res = await simulationApi.runDiversion({
        congested_edge_id: congestedEdgeId,
        diversion_pct: Number(diversionPct)
      });
      setResult(res.data);
      if (onDiversionApplied) onDiversionApplied(res.data);
    } catch (err) {
      console.error('Diversion simulation failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-xl p-5 border border-surfaceBorder">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <GitFork className="w-4 h-4 text-blue-400" />
            <span>Interactive Route & Diversion Simulator</span>
          </h2>
          <p className="text-xs text-gray-400">Reallocates link flow across alternate paths and recalculates BPR travel delays</p>
        </div>
        <span className="text-[10px] bg-blue-950 border border-blue-800 text-blue-300 px-2 py-0.5 rounded font-mono">
          BPR Physics Engine
        </span>
      </div>

      {/* Control Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 bg-slate-900/60 p-4 rounded-lg border border-slate-800">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Target Congested Corridor</label>
          <select
            value={congestedEdgeId}
            onChange={(e) => setCongestedEdgeId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-xs rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
          >
            {networkState.map(e => (
              <option key={e.edgeId || e.edge_id} value={e.edgeId || e.edge_id}>
                {e.edgeId || e.edge_id} - {e.roadName || e.road_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-gray-400">Diversion Percentage</label>
            <span className="text-xs font-bold text-blue-400 font-mono">{diversionPct}% Shifted</span>
          </div>
          <input
            type="range"
            min="5"
            max="35"
            step="1"
            value={diversionPct}
            onChange={(e) => setDiversionPct(e.target.value)}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 mt-2"
          />
          <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-1">
            <span>5% (Cautious)</span>
            <span>20% (Standard)</span>
            <span>35% (Aggressive)</span>
          </div>
        </div>

        <div className="flex items-end">
          <button
            onClick={handleRunSimulation}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition shadow-md disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span>{loading ? 'Simulating BPR Reallocation...' : 'Execute Diversion Sandbox'}</span>
          </button>
        </div>
      </div>

      {/* Results Comparison Display */}
      {result && result.primary_corridor && (
        <div className="bg-slate-950/80 rounded-lg p-4 border border-blue-900/40">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <div>
              <span className="text-xs font-bold text-white">Simulation Impact: {result.primary_corridor.road_name}</span>
              <p className="text-[11px] text-gray-400 font-mono">Diverted {result.diverted_volume_veh_hr} veh/hr to alternate bypass routes</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-400 font-mono">+{result.primary_corridor.net_speed_gain_kmh} km/h Gain</span>
              <p className="text-[10px] text-gray-400 font-mono">Saved {result.primary_corridor.net_travel_time_saved_sec}s travel delay</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
              <span className="text-[10px] text-gray-400 block font-sans">Corridor Speed</span>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-red-400 line-through">{result.primary_corridor.before.avg_speed_kmh}</span>
                <ArrowRight className="w-3 h-3 text-gray-500" />
                <span className="text-emerald-400 font-bold">{result.primary_corridor.after.avg_speed_kmh} km/h</span>
              </div>
            </div>

            <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
              <span className="text-[10px] text-gray-400 block font-sans">Corridor Volume</span>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-gray-400">{result.primary_corridor.before.volume}</span>
                <ArrowRight className="w-3 h-3 text-gray-500" />
                <span className="text-white font-bold">{result.primary_corridor.after.volume} v/h</span>
              </div>
            </div>

            <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
              <span className="text-[10px] text-gray-400 block font-sans">V/C Saturation Ratio</span>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-red-400">{result.primary_corridor.before.vc_ratio}</span>
                <ArrowRight className="w-3 h-3 text-gray-500" />
                <span className="text-emerald-400 font-bold">{result.primary_corridor.after.vc_ratio}</span>
              </div>
            </div>

            <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
              <span className="text-[10px] text-gray-400 block font-sans">Travel Time</span>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-gray-400">{result.primary_corridor.before.travel_time_sec}s</span>
                <ArrowRight className="w-3 h-3 text-gray-500" />
                <span className="text-white font-bold">{result.primary_corridor.after.travel_time_sec}s</span>
              </div>
            </div>
          </div>

          {/* Alternate Corridors Breakdown */}
          {result.alternate_corridors && result.alternate_corridors.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-800/80">
              <span className="text-[10px] text-gray-400 uppercase font-mono block mb-2">Alternate Route Absorption</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                {result.alternate_corridors.map((alt, i) => (
                  <div key={i} className="p-2 bg-slate-900/60 rounded border border-slate-800 flex justify-between">
                    <div>
                      <span className="text-white font-sans font-semibold">{alt.road_name}</span>
                      <p className="text-[10px] text-gray-400">+{alt.volume_added_veh_hr} veh/hr absorbed</p>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-300 font-bold">{alt.after.avg_speed_kmh} km/h</span>
                      <p className="text-[10px] text-gray-500">Speed impact: {alt.speed_impact_kmh} km/h</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stated Assumptions Disclaimer */}
          <div className="mt-3 text-[10px] text-gray-500 italic flex items-center space-x-1">
            <Shield className="w-3 h-3 text-amber-500 flex-shrink-0" />
            <span>Simulated advisory only. Real-time implementation requires transportation engineer validation.</span>
          </div>
        </div>
      )}
    </div>
  );
}
