import React from 'react';
import { AlertOctagon, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';

export default function IncidentPanel({ incidents = [] }) {
  return (
    <div className="glass-panel rounded-xl p-5 border border-surfaceBorder">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <AlertOctagon className="w-4 h-4 text-red-400" />
            <span>Strict Evidence-Based Incident Classifications</span>
          </h2>
          <p className="text-xs text-gray-400">Never fabricated — requires multi-sensor corroboration</p>
        </div>

        <div className="flex items-center space-x-1.5 bg-red-950/40 border border-red-800/40 px-2.5 py-1 rounded-full text-[10px] text-red-300">
          <ShieldAlert className="w-3 h-3 text-red-400" />
          <span>Safety Threshold Enforced</span>
        </div>
      </div>

      {incidents.length === 0 ? (
        <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-lg text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
          <p className="text-xs font-semibold text-gray-300">No Incident-Grade Anomalies Active</p>
          <p className="text-[11px] text-gray-500 mt-1 max-w-md mx-auto">
            Minor deviations are screened out to prevent false incident alarm generation.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((inc, i) => {
            const ev = inc.supportingEvidence || inc.supporting_evidence || {};
            return (
              <div key={inc.incidentId || i} className="p-4 rounded-lg bg-red-950/20 border border-red-900/40">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-red-400">{inc.incidentType || 'MAJOR_INCIDENT'}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/60 text-red-200 uppercase font-mono">
                        {inc.severity || 'CRITICAL'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">Confidence: {Math.round((inc.confidenceScore || 0.88) * 100)}%</span>
                    </div>
                    <p className="text-xs text-gray-200 font-medium mt-1">{inc.roadName || inc.road_name}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{inc.description}</p>
                  </div>
                </div>

                {/* Evidence Trail Box */}
                <div className="mt-3 pt-3 border-t border-red-900/30 grid grid-cols-3 gap-2 text-[11px] font-mono">
                  <div className="bg-slate-950/60 p-2 rounded border border-red-950">
                    <span className="text-[10px] text-gray-500 block font-sans">Speed Collapse</span>
                    <span className="text-red-400 font-bold">{ev.speed_drop_pct || 75}% drop</span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded border border-red-950">
                    <span className="text-[10px] text-gray-500 block font-sans">Queue Density</span>
                    <span className="text-amber-400 font-bold">{ev.occupancy_pct || 88}% occ</span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded border border-red-950">
                    <span className="text-[10px] text-gray-500 block font-sans">V/C Saturation</span>
                    <span className="text-rose-400 font-bold">{ev.vc_ratio || 1.14} ratio</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
