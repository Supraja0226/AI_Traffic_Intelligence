import React, { useState } from 'react';
import { TrendingUp, Clock, AlertCircle } from 'lucide-react';

export default function ForecastChart({ forecasts = {}, networkState = [] }) {
  const edgeIds = Object.keys(forecasts).length > 0 ? Object.keys(forecasts) : ['EDGE_101', 'EDGE_102', 'EDGE_106'];
  const [selectedEdgeId, setSelectedEdgeId] = useState(edgeIds[0] || 'EDGE_101');

  const edgeForecasts = forecasts[selectedEdgeId] || [
    { horizon_minutes: 15, confidence_score: 0.93, predicted_avg_speed_kmh: 13.8, speed_ci_lower: 11.2, speed_ci_upper: 16.4, predicted_volume_veh_hr: 4200, volume_ci_lower: 3900, volume_ci_upper: 4500, predicted_los: 'F', predicted_congestion_score: 91.2 },
    { horizon_minutes: 30, confidence_score: 0.87, predicted_avg_speed_kmh: 15.2, speed_ci_lower: 12.0, speed_ci_upper: 18.5, predicted_volume_veh_hr: 4050, volume_ci_lower: 3650, volume_ci_upper: 4450, predicted_los: 'F', predicted_congestion_score: 88.0 },
    { horizon_minutes: 45, confidence_score: 0.81, predicted_avg_speed_kmh: 22.4, speed_ci_lower: 16.0, speed_ci_upper: 28.0, predicted_volume_veh_hr: 3700, volume_ci_lower: 3200, volume_ci_upper: 4200, predicted_los: 'E', predicted_congestion_score: 75.4 },
    { horizon_minutes: 60, confidence_score: 0.74, predicted_avg_speed_kmh: 38.0, speed_ci_lower: 29.0, speed_ci_upper: 47.0, predicted_volume_veh_hr: 3100, volume_ci_lower: 2500, volume_ci_upper: 3700, predicted_los: 'D', predicted_congestion_score: 52.0 }
  ];

  return (
    <div className="glass-panel rounded-xl p-5 border border-surfaceBorder">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span>Multi-Horizon Predictive Forecasting (15 - 60 Min)</span>
          </h2>
          <p className="text-xs text-gray-400">Time-series momentum & BPR physics with confidence bounds</p>
        </div>

        {/* Edge Selector */}
        <select
          value={selectedEdgeId}
          onChange={(e) => setSelectedEdgeId(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-3 py-1.5 text-gray-200 focus:outline-none focus:border-blue-500"
        >
          {edgeIds.map(eid => (
            <option key={eid} value={eid}>Corridor: {eid}</option>
          ))}
        </select>
      </div>

      {/* 4 Horizon Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {edgeForecasts.map((f, i) => {
          const h = f.horizon_minutes || f.horizonMinutes;
          const spd = f.predicted_avg_speed_kmh || f.predictedAvgSpeedKmh || 40;
          const spdLow = f.speed_ci_lower || f.speedCiLower || (spd - 4);
          const spdHigh = f.speed_ci_upper || f.speedCiUpper || (spd + 4);
          const vol = f.predicted_volume_veh_hr || f.predictedVolumeVehHr || 2500;
          const los = f.predicted_los || f.predictedLos || 'C';
          const conf = Math.round((f.confidence_score || f.confidenceScore || 0.85) * 100);

          return (
            <div key={i} className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-400 font-mono">+{h} Minutes</span>
                  <span className="text-[10px] font-mono text-gray-400 bg-slate-800 px-1.5 py-0.5 rounded">
                    {conf}% Conf
                  </span>
                </div>

                <div className="flex items-baseline justify-between mt-2">
                  <div>
                    <span className="text-xl font-bold text-white font-mono">{spd}</span>
                    <span className="text-[10px] text-gray-400 ml-1">km/h</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    los === 'F' ? 'bg-red-950 text-red-400 border border-red-800' :
                    los === 'E' ? 'bg-orange-950 text-orange-400 border border-orange-800' :
                    'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  }`}>
                    LOS {los}
                  </span>
                </div>

                <p className="text-[10px] text-gray-500 font-mono mt-1">
                  95% CI: [{spdLow} - {spdHigh}] km/h
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-gray-400 flex justify-between font-mono">
                <span>Demand:</span>
                <span className="text-gray-200">{vol} veh/h</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
