import React, { useState } from 'react';
import { Zap, ShieldCheck, ChevronDown, ChevronUp, Check, X, AlertCircle } from 'lucide-react';
import { advisoryApi } from '../services/api';
import { useAuth } from '../store/authContext';

export default function AdvisoryFeed({ advisories = [], onAdvisoryUpdated }) {
  const { hasPermission } = useAuth();
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleStatus = async (id, status) => {
    try {
      await advisoryApi.updateStatus(id, status);
      if (onAdvisoryUpdated) onAdvisoryUpdated();
    } catch (e) {
      console.error('Failed to update status', e);
    }
  };

  return (
    <div className="glass-panel rounded-xl p-5 border border-surfaceBorder">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span>Evidence-Based Operational & Diversion Advisories</span>
          </h2>
          <p className="text-xs text-gray-400">All advisories are traceable to underlying detector evidence</p>
        </div>

        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
          Advisory / Simulated
        </span>
      </div>

      <div className="space-y-3">
        {advisories.length === 0 ? (
          <div className="p-5 text-center text-xs text-gray-400 bg-slate-900/40 rounded-lg border border-slate-800">
            No active operational advisories. System observing normal baseline parameters.
          </div>
        ) : (
          advisories.map((adv, idx) => {
            const id = adv.recommendationId || adv.advisory_id || `adv_${idx}`;
            const isExpanded = expandedId === id;
            const ev = adv.supportingEvidence || adv.supporting_evidence || {};
            const imp = adv.estimatedImpact || adv.estimated_impact || {};

            return (
              <div key={id} className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden transition">
                <div className="p-4 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white">{adv.title}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        adv.severity === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-800' :
                        adv.severity === 'HIGH' ? 'bg-orange-950 text-orange-400 border border-orange-800' :
                        'bg-blue-950 text-blue-400 border border-blue-800'
                      }`}>
                        {adv.severity || 'HIGH'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 font-sans">{adv.recommendedAction || adv.recommended_action}</p>
                    <p className="text-[11px] text-gray-400">Corridor: <span className="text-gray-200 font-semibold">{adv.affectedCorridor || adv.affected_corridor}</span></p>
                  </div>

                  <button
                    onClick={() => toggleExpand(id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white transition flex items-center space-x-1 text-xs"
                  >
                    <span>{isExpanded ? 'Hide Evidence' : 'Inspect Evidence'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Evidence Drawer */}
                {isExpanded && (
                  <div className="p-4 bg-slate-950/80 border-t border-slate-800 text-xs font-mono space-y-3">
                    <div>
                      <span className="text-[10px] text-indigo-400 uppercase font-bold block mb-1 font-sans">
                        Supporting Evidence Trail
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {Object.entries(ev).slice(0, 4).map(([k, v]) => (
                          <div key={k} className="p-2 bg-slate-900 rounded border border-slate-800">
                            <span className="text-[9px] text-gray-500 block truncate font-sans">{k.replace(/_/g, ' ')}</span>
                            <span className="text-gray-200 font-bold">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {imp && Object.keys(imp).length > 0 && (
                      <div>
                        <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1 font-sans">
                          Estimated Before / After Impact
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {Object.entries(imp).slice(0, 4).map(([k, v]) => (
                            <div key={k} className="p-2 bg-slate-900 rounded border border-emerald-950">
                              <span className="text-[9px] text-gray-500 block truncate font-sans">{k.replace(/_/g, ' ')}</span>
                              <span className="text-emerald-400 font-bold">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Operator Decision Actions */}
                    {hasPermission('operator') && (
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-sans">
                        <span className="text-[11px] text-gray-400">Operator Review Status: <span className="font-semibold text-gray-200">{adv.status || 'PROPOSED'}</span></span>
                        <div className="space-x-2">
                          <button
                            onClick={() => handleStatus(id, 'ACCEPTED')}
                            className="px-3 py-1 rounded bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 text-xs font-medium"
                          >
                            Acknowledge Advisory
                          </button>
                          <button
                            onClick={() => handleStatus(id, 'REJECTED')}
                            className="px-3 py-1 rounded bg-slate-800 text-gray-400 hover:text-gray-200 text-xs font-medium"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
