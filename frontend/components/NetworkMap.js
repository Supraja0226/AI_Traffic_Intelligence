import React, { useState } from 'react';
import { AlertCircle, Eye, Info, Navigation } from 'lucide-react';

const NODE_POSITIONS = {
  NODE_A: { x: 90, y: 190, label: 'Node A (West Gateway)' },
  NODE_B: { x: 440, y: 190, label: 'Node B (Midtown Interchange)' },
  NODE_C: { x: 260, y: 70, label: 'Node C (North Junction)' },
  NODE_D: { x: 260, y: 310, label: 'Node D (Waterfront Basin)' },
  NODE_E: { x: 620, y: 190, label: 'Node E (East Terminal)' },
  NODE_F: { x: 500, y: 70, label: 'Node F (Perimeter Hub)' }
};

const EDGE_DEFINITIONS = [
  { edge_id: 'EDGE_101', name: 'Grand Avenue Express', from: 'NODE_A', to: 'NODE_B', path: 'M 90 190 L 440 190' },
  { edge_id: 'EDGE_102', name: 'North Ring Bypass', from: 'NODE_A', to: 'NODE_C', path: 'M 90 190 Q 150 100 260 70' },
  { edge_id: 'EDGE_103', name: 'Bypass Connector East', from: 'NODE_C', to: 'NODE_B', path: 'M 260 70 Q 370 100 440 190' },
  { edge_id: 'EDGE_104', name: 'South Waterfront Blvd', from: 'NODE_A', to: 'NODE_D', path: 'M 90 190 Q 150 280 260 310' },
  { edge_id: 'EDGE_105', name: 'Waterfront East Link', from: 'NODE_D', to: 'NODE_B', path: 'M 260 310 Q 370 280 440 190' },
  { edge_id: 'EDGE_106', name: 'Central Midtown Corridor', from: 'NODE_B', to: 'NODE_E', path: 'M 440 190 L 620 190' },
  { edge_id: 'EDGE_107', name: 'Metro Perimeter North', from: 'NODE_C', to: 'NODE_F', path: 'M 260 70 L 500 70' },
  { edge_id: 'EDGE_108', name: 'Suburban Linkway', from: 'NODE_F', to: 'NODE_E', path: 'M 500 70 Q 580 110 620 190' }
];

export default function NetworkMap({ networkState = [], incidents = [], onSelectEdge, activeDiversion = null }) {
  const [selectedEdge, setSelectedEdge] = useState(null);

  const edgeMap = {};
  networkState.forEach(item => {
    edgeMap[item.edgeId || item.edge_id] = item;
  });

  const incidentSet = new Set(incidents.map(i => i.edgeId || i.edge_id));

  const getColor = (edgeId) => {
    const data = edgeMap[edgeId];
    if (!data) return '#3B82F6';
    const lvl = data.congestionLevel || (data.congestion_score > 80 ? 'SEVERE' : data.congestion_score > 60 ? 'HEAVY' : data.congestion_score > 40 ? 'MODERATE' : 'FREE_FLOW');
    switch (lvl) {
      case 'SEVERE': return '#EF4444';
      case 'HEAVY': return '#F97316';
      case 'MODERATE': return '#F59E0B';
      case 'LIGHT': return '#3B82F6';
      case 'FREE_FLOW': return '#10B981';
      default: return '#10B981';
    }
  };

  const handleEdgeClick = (edge) => {
    const fullData = edgeMap[edge.edge_id] || edge;
    setSelectedEdge(fullData);
    if (onSelectEdge) onSelectEdge(fullData);
  };

  return (
    <div className="glass-panel rounded-xl p-5 border border-surfaceBorder relative">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <Navigation className="w-4 h-4 text-blue-400" />
            <span>Interactive Road Network Topology</span>
          </h2>
          <p className="text-xs text-gray-400">Click corridors to inspect live telemetry and BPR metrics</p>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-3 text-xs bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
          <div className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span><span className="text-gray-400">Free</span></div>
          <div className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span><span className="text-gray-400">Light</span></div>
          <div className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span><span className="text-gray-400">Moderate</span></div>
          <div className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span><span className="text-gray-400">Heavy</span></div>
          <div className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span><span className="text-gray-400">Severe</span></div>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="w-full h-80 bg-slate-950/60 rounded-lg relative overflow-hidden border border-slate-800/80 flex items-center justify-center">
        <svg viewBox="0 0 720 380" className="w-full h-full">
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>
          </defs>

          {/* Grid lines */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Edges (Road links) */}
          {EDGE_DEFINITIONS.map(edge => {
            const color = getColor(edge.edge_id);
            const isIncident = incidentSet.has(edge.edge_id);
            const isSelected = selectedEdge && (selectedEdge.edgeId === edge.edge_id || selectedEdge.edge_id === edge.edge_id);
            const isDiverted = activeDiversion && activeDiversion.congested_edge_id === edge.edge_id;

            return (
              <g key={edge.edge_id} onClick={() => handleEdgeClick(edge)} className="cursor-pointer group">
                {/* Outer halo */}
                <path
                  d={edge.path}
                  fill="none"
                  stroke={isSelected ? '#60A5FA' : color}
                  strokeWidth={isSelected ? 10 : 7}
                  strokeOpacity={isSelected ? 0.4 : 0.25}
                />
                {/* Core roadway */}
                <path
                  d={edge.path}
                  fill="none"
                  stroke={color}
                  strokeWidth={isSelected ? 4 : 3}
                  strokeDasharray={isDiverted ? '6 4' : 'none'}
                  className={isDiverted ? 'animate-[dash_1s_linear_infinite]' : ''}
                />

                {/* Incident marker */}
                {isIncident && (
                  <circle
                    cx={edge.edge_id === 'EDGE_101' ? 265 : 200}
                    cy={edge.edge_id === 'EDGE_101' ? 190 : 120}
                    r="8"
                    fill="#EF4444"
                    className="animate-ping"
                    opacity="0.75"
                  />
                )}
                {isIncident && (
                  <circle
                    cx={edge.edge_id === 'EDGE_101' ? 265 : 200}
                    cy={edge.edge_id === 'EDGE_101' ? 190 : 120}
                    r="5"
                    fill="#F87171"
                  />
                )}
              </g>
            );
          })}

          {/* Nodes (Intersections) */}
          {Object.entries(NODE_POSITIONS).map(([key, pos]) => (
            <g key={key}>
              <circle cx={pos.x} cy={pos.y} r="10" fill="#1E293B" stroke="#60A5FA" strokeWidth="2.5" />
              <circle cx={pos.x} cy={pos.y} r="4" fill="#93C5FD" />
              <text x={pos.x} y={pos.y - 14} textAnchor="middle" fill="#CBD5E1" fontSize="11" fontWeight="bold">
                {key}
              </text>
            </g>
          ))}
        </svg>

        {/* Selected Edge Overlay Card */}
        {selectedEdge && (
          <div className="absolute bottom-3 left-3 right-3 md:right-auto md:w-80 bg-slate-900/95 border border-blue-500/40 p-3 rounded-lg shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-blue-400">{selectedEdge.roadName || selectedEdge.road_name || selectedEdge.edge_id}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-300 font-mono">
                LOS {selectedEdge.los || 'B'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-300 mt-2">
              <div>
                <p className="text-[10px] text-gray-400">Speed</p>
                <p className="font-semibold">{selectedEdge.avgSpeedKmh || selectedEdge.avg_speed_kmh || 55} km/h</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">Volume</p>
                <p className="font-semibold">{selectedEdge.volumeVehHr || selectedEdge.volume_veh_hr || 2000} v/h</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">V/C Ratio</p>
                <p className="font-semibold">{selectedEdge.vcRatio || selectedEdge.vc_ratio || 0.65}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
