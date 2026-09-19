import React, { useState, useEffect } from 'react';
import { getSocket } from '../services/socket';
import { CheckCircle2, Clock, AlertTriangle, ChevronRight, Terminal, ShieldCheck } from 'lucide-react';

const AGENTS = [
  { id: 'AGENT_01', name: 'Data Analysis Agent', step: '1-3', desc: 'Validates schema, cleans records, builds network topology' },
  { id: 'AGENT_02', name: 'Congestion Detection Agent', step: '4', desc: 'Classifies 5-tier conditions and anomaly z-scores' },
  { id: 'AGENT_03', name: 'Incident Analysis Agent', step: '5', desc: 'Strict evidence verification; withholds unconfirmed alerts' },
  { id: 'AGENT_04', name: 'Forecasting Agent', step: '6', desc: 'Multi-horizon 15/30/45/60 min confidence forecasting' },
  { id: 'AGENT_05', name: 'Advisory Agent', step: '7-8', desc: 'Simulates diversions, generates evidence-backed advisories' },
  { id: 'AGENT_06', name: 'Network Optimization Agent', step: '9-10', desc: 'Models lane addition BPR deltas & delay reduction' },
  { id: 'AGENT_07', name: 'Monitoring Agent', step: '11', desc: 'Audits lifecycle telemetry and feeds dashboard stream' }
];

export default function LiveAgentTimeline({ execution = null }) {
  const [pipelineProgress, setPipelineProgress] = useState({
    step: execution?.currentStep || 11,
    totalSteps: 11,
    activeAgent: execution?.activeAgent || 'Monitoring Agent',
    status: execution?.status || 'COMPLETED'
  });
  const [liveLogs, setLiveLogs] = useState([]);
  const [selectedEvidence, setSelectedEvidence] = useState(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleProgress = (data) => {
      setPipelineProgress(data);
    };

    const handleLog = (data) => {
      setLiveLogs(prev => [data, ...prev.slice(0, 49)]);
    };

    socket.on('pipeline:progress', handleProgress);
    socket.on('timeline:log', handleLog);

    return () => {
      socket.off('pipeline:progress', handleProgress);
      socket.off('timeline:log', handleLog);
    };
  }, []);

  return (
    <div className="glass-panel rounded-xl p-5 border border-surfaceBorder">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>AI Agent Lifecycle Timeline (11-Step Data Flow)</span>
          </h2>
          <p className="text-xs text-gray-400">Real-time Socket.IO execution telemetry across discrete agents</p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-300 font-mono">Step {pipelineProgress.step} / 11</span>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
            pipelineProgress.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
            pipelineProgress.status === 'RUNNING' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse' :
            'bg-slate-700 text-gray-300'
          }`}>
            {pipelineProgress.status}
          </span>
        </div>
      </div>

      {/* 7-Agent Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2 mb-4">
        {AGENTS.map((agent, index) => {
          const isDone = pipelineProgress.step >= (index + 1) * 1.5 || pipelineProgress.status === 'COMPLETED';
          const isCurrent = pipelineProgress.activeAgent?.includes(agent.name.split(' ')[0]) && pipelineProgress.status === 'RUNNING';

          return (
            <div
              key={agent.id}
              className={`p-2.5 rounded-lg border text-xs transition-all ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-gray-200'
                  : isCurrent
                  ? 'bg-blue-900/30 border-blue-500 text-blue-200 shadow-md animate-pulse'
                  : 'bg-slate-900/40 border-slate-800 text-gray-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[10px] font-bold text-gray-400">Agent 0{index + 1}</span>
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : isCurrent ? (
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-700"></span>
                )}
              </div>
              <p className="font-semibold text-xs leading-tight line-clamp-1">{agent.name}</p>
              <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">{agent.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Live Agent Terminal Stream */}
      <div className="bg-slate-950 rounded-lg border border-slate-800 p-3 font-mono text-xs">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-gray-400 text-[11px]">
          <div className="flex items-center space-x-2">
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span>Agent Telemetry Stream</span>
          </div>
          <span className="text-[10px] text-emerald-400 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Active Feed</span>
          </span>
        </div>

        <div className="h-28 overflow-y-auto space-y-1 text-[11px]">
          {liveLogs.length > 0 ? (
            liveLogs.map((log, i) => (
              <div key={i} className="flex items-start space-x-2 leading-relaxed">
                <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span className="text-blue-400 font-semibold">[{log.agentName}]</span>
                <span className={log.level === 'ERROR' ? 'text-red-400' : log.level === 'SUCCESS' ? 'text-emerald-400' : 'text-gray-300'}>
                  {log.message}
                </span>
              </div>
            ))
          ) : (
            <div className="text-gray-500 italic">
              [Monitoring Agent] System ready. All 7 discrete agents initialized in stand-by observation mode.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
