import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import DiversionSimulator from '../components/DiversionSimulator';
import NetworkOptimizerModal from '../components/NetworkOptimizerModal';
import { simulationApi, trafficApi } from '../services/api';
import { GitFork, Layers, PlusCircle, History, Shield, CheckCircle2 } from 'lucide-react';

export default function SimulationsPage() {
  const [networkState, setNetworkState] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [history, setHistory] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTargetEdge, setModalTargetEdge] = useState('EDGE_101');

  const loadData = async () => {
    try {
      const [stateRes, tmplRes, histRes] = await Promise.all([
        trafficApi.getNetworkState(),
        simulationApi.getTemplates(),
        simulationApi.list()
      ]);
      setNetworkState(stateRes.data || []);
      setTemplates(tmplRes.data || []);
      setHistory(histRes.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <Layout title="Simulation Sandbox & Optimization Studio">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Safety Disclaimer Banner */}
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start space-x-3">
          <Shield className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-gray-300">
            <span className="font-bold text-amber-300 block text-sm">Non-Production Simulation Environment</span>
            All alternate routes, volume diversions, and structural roadway modifications are mathematical simulations evaluated using the Bureau of Public Roads (BPR) volume-delay formulation. No municipal traffic signals or signs are actuated.
          </div>
        </div>

        {/* Interactive Diversion Sandbox */}
        <DiversionSimulator
          networkState={networkState}
          onDiversionApplied={loadData}
        />

        {/* Structural Network Optimization Card */}
        <div className="glass-panel rounded-xl p-5 border border-surfaceBorder">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Physical Road Network Modification Studio</span>
              </h2>
              <p className="text-xs text-gray-400">Simulate adding auxiliary lanes and capacity enhancements</p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Simulate Infrastructure Modification</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tmpl, i) => (
              <div key={i} className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">{tmpl.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-blue-300">
                      {tmpl.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300">{tmpl.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-mono">Template: {tmpl.scenario_id}</span>
                  <button
                    onClick={() => {
                      setModalTargetEdge(tmpl.target_edge_id || tmpl.congested_edge_id || 'EDGE_101');
                      setModalOpen(true);
                    }}
                    className="px-3 py-1 bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 rounded text-xs font-medium"
                  >
                    Load Scenario
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Simulation History Log */}
        <div className="glass-panel rounded-xl p-5 border border-surfaceBorder">
          <div className="flex items-center space-x-2 mb-3">
            <History className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-bold text-white">Scenario Evaluation Audit Log</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-slate-900 text-gray-400 uppercase text-[10px] font-mono border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Scenario ID</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Target Corridor</th>
                  <th className="py-2.5 px-3">Calculated Impact</th>
                  <th className="py-2.5 px-4 text-right">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {history.map((s, i) => (
                  <tr key={s.simulationId || i} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 text-blue-400 font-bold">{s.simulationId}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-gray-300">
                        {s.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-white font-sans">{s.targetEdgeId || 'EDGE_101'}</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">
                      {s.results?.primary_corridor?.net_speed_gain_kmh
                        ? `+${s.results.primary_corridor.net_speed_gain_kmh} km/h speed gain`
                        : s.results?.delta?.speed_gain_kmh
                        ? `+${s.results.delta.speed_gain_kmh} km/h speed gain`
                        : 'BPR Evaluated'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-sans text-gray-400">{s.createdBy || 'operator'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <NetworkOptimizerModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          targetEdgeId={modalTargetEdge}
          networkState={networkState}
        />
      </div>
    </Layout>
  );
}
