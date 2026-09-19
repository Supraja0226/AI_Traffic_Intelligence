import React, { useState } from 'react';
import { simulationApi } from '../services/api';
import { Layers, ArrowRight, Check, X, Shield, PlusCircle, RefreshCw } from 'lucide-react';

export default function NetworkOptimizerModal({ isOpen, onClose, targetEdgeId, networkState = [] }) {
  const [lanesToAdd, setLanesToAdd] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await simulationApi.runModification({
        target_edge_id: targetEdgeId,
        lanes_to_add: Number(lanesToAdd)
      });
      setResult(res.data.simulation);
    } catch (err) {
      console.error('Modification simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PlusCircle className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Network Modification Simulator</h3>
              <p className="text-[11px] text-gray-400">Evaluate structural capacity additions on {targetEdgeId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
            <span className="text-gray-400 block mb-1">Target Road Corridor:</span>
            <span className="font-bold text-blue-400 font-mono text-sm">{targetEdgeId}</span>
          </div>

          <div>
            <label className="text-xs text-gray-300 block mb-1">Auxiliary Lanes to Add</label>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  onClick={() => setLanesToAdd(num)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                    lanesToAdd === num
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-800/60 border-slate-700 text-gray-400 hover:bg-slate-800'
                  }`}
                >
                  +{num} Lane{num > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSimulate}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 rounded-lg text-xs transition flex items-center justify-center space-x-2"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
            <span>{loading ? 'Evaluating BPR Travel Delay...' : 'Run Capacity Optimization'}</span>
          </button>

          {/* Results Delta */}
          {result && (
            <div className="bg-slate-950 p-4 rounded-lg border border-emerald-900/40 text-xs font-mono space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-emerald-400 font-bold">Simulated Outcome: {result.road_name}</span>
                <span className="text-gray-400 font-mono text-[11px]">{result.modification_type}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-gray-400 block font-sans">Speed Gain</span>
                  <span className="text-emerald-400 font-bold text-sm">+{result.delta.speed_gain_kmh} km/h</span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-gray-400 block font-sans">Delay Savings</span>
                  <span className="text-blue-400 font-bold text-sm">-{result.delta.travel_time_savings_sec}s / veh</span>
                </div>
              </div>

              <div className="bg-emerald-950/20 p-2.5 rounded border border-emerald-800/30">
                <span className="text-[10px] text-gray-400 block font-sans">Estimated Annualized Commuter Relief</span>
                <span className="text-emerald-300 font-bold font-mono">
                  ~{result.delta.annual_person_hours_saved.toLocaleString()} Person-Hours Saved
                </span>
              </div>

              {/* Assumptions */}
              <div className="text-[10px] text-gray-500 italic space-y-1 font-sans">
                <p className="font-semibold text-gray-400">Stated Simulation Assumptions:</p>
                {result.stated_assumptions?.map((asm, i) => (
                  <p key={i}>• {asm}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-gray-300 rounded-lg transition"
          >
            Close Sandbox
          </button>
        </div>
      </div>
    </div>
  );
}
