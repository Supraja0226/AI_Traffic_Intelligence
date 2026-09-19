import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import LiveAgentTimeline from '../components/LiveAgentTimeline';
import { executionApi } from '../services/api';
import { useRouter } from 'next/router';
import { Cpu, Play, RefreshCw, CheckCircle2, Clock, Terminal } from 'lucide-react';

export default function AnalysisPage() {
  const router = useRouter();
  const { id } = router.query;

  const [executions, setExecutions] = useState([]);
  const [currentExecution, setCurrentExecution] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  const loadExecutions = async () => {
    try {
      const res = await executionApi.list();
      setExecutions(res.data || []);

      if (id) {
        const execRes = await executionApi.getById(id);
        setCurrentExecution(execRes.data);
        const logsRes = await executionApi.getLogs(id);
        setLogs(logsRes.data || []);
      } else if (res.data && res.data.length > 0) {
        const latest = res.data[res.data.length - 1];
        setCurrentExecution(latest);
        const logsRes = await executionApi.getLogs(latest.executionId);
        setLogs(logsRes.data || []);
      }
    } catch (e) {
      console.error('Failed to load executions', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExecutions();
  }, [id]);

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      const res = await executionApi.trigger({ sampleFilename: 'metro_corridor_traffic.csv' });
      router.push(`/analysis?id=${res.data.executionId}`);
    } catch (e) {
      console.error(e);
    } finally {
      setTriggering(false);
    }
  };

  return (
    <Layout title="AI Agent Orchestration & Pipeline Execution">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>11-Step Continuous Agent Flow</span>
            </h2>
            <p className="text-xs text-gray-400">Observe → Analyze → Forecast → Simulate → Advise → Evaluate</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadExecutions}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-lg text-xs font-medium transition flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleTrigger}
              disabled={triggering}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 shadow-md disabled:opacity-50"
            >
              {triggering ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              <span>{triggering ? 'Initiating Pipeline...' : 'Trigger New Analysis'}</span>
            </button>
          </div>
        </div>

        {/* Live Timeline Component */}
        <LiveAgentTimeline execution={currentExecution} />

        {/* Execution Summary & Stage Metrics */}
        {currentExecution && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel p-4 rounded-xl border border-surfaceBorder">
              <span className="text-xs text-gray-400 font-sans">Pipeline Execution Status</span>
              <p className="text-lg font-bold text-white font-mono mt-1">{currentExecution.status}</p>
              <p className="text-[11px] text-gray-400 mt-1 font-mono">
                Duration: {currentExecution.durationMs ? `${currentExecution.durationMs}ms` : 'In Progress'}
              </p>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-surfaceBorder">
              <span className="text-xs text-gray-400 font-sans">Network Health Index</span>
              <p className="text-lg font-bold text-emerald-400 font-mono mt-1">
                {currentExecution.networkSummary?.network_health_index || 70}%
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                HCM Level of Service: Stable Network
              </p>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-surfaceBorder">
              <span className="text-xs text-gray-400 font-sans">Executed Pipeline ID</span>
              <p className="text-xs font-mono font-bold text-blue-400 mt-1 truncate">{currentExecution.executionId}</p>
              <p className="text-[11px] text-gray-400 mt-1 font-mono">Dataset: {currentExecution.datasetName}</p>
            </div>
          </div>
        )}

        {/* Execution History Table */}
        <div className="glass-panel rounded-xl p-5 border border-surfaceBorder">
          <h2 className="text-sm font-bold text-white mb-3">Analysis Run History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-slate-900 text-gray-400 uppercase text-[10px] font-mono border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Execution ID</th>
                  <th className="py-2.5 px-3">Dataset</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Triggered By</th>
                  <th className="py-2.5 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {executions.map((ex, i) => (
                  <tr key={ex.executionId || i} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 text-blue-400 font-bold">{ex.executionId}</td>
                    <td className="py-2.5 px-3 font-sans text-gray-200">{ex.datasetName || 'Corridor Stream'}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ex.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        'bg-blue-950 text-blue-400 border border-blue-800'
                      }`}>
                        {ex.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">{ex.durationMs ? `${ex.durationMs}ms` : '4.8s'}</td>
                    <td className="py-2.5 px-3 font-sans">{ex.triggeredBy || 'analyst'}</td>
                    <td className="py-2.5 px-4 text-right font-sans">
                      <button
                        onClick={() => router.push(`/analysis?id=${ex.executionId}`)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-gray-200 rounded text-xs"
                      >
                        View Telemetry
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
