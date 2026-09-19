import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import MetricsOverview from '../components/MetricsOverview';
import NetworkMap from '../components/NetworkMap';
import LiveAgentTimeline from '../components/LiveAgentTimeline';
import CongestionTable from '../components/CongestionTable';
import IncidentPanel from '../components/IncidentPanel';
import ForecastChart from '../components/ForecastChart';
import DiversionSimulator from '../components/DiversionSimulator';
import NetworkOptimizerModal from '../components/NetworkOptimizerModal';
import AdvisoryFeed from '../components/AdvisoryFeed';
import { trafficApi, advisoryApi, executionApi } from '../services/api';
import { Play, RefreshCw, Layers } from 'lucide-react';

export default function Dashboard() {
  const [networkState, setNetworkState] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [forecasts, setForecasts] = useState({});
  const [advisories, setAdvisories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [optimizerModalOpen, setOptimizerModalOpen] = useState(false);
  const [optimizerTargetEdge, setOptimizerTargetEdge] = useState('EDGE_101');
  const [activeDiversion, setActiveDiversion] = useState(null);
  const [runningAnalysis, setRunningAnalysis] = useState(false);

  const fetchData = async () => {
    try {
      const [stateRes, incRes, fcastRes, advRes] = await Promise.all([
        trafficApi.getNetworkState(),
        trafficApi.getIncidents(),
        trafficApi.getForecasts(),
        advisoryApi.list()
      ]);

      setNetworkState(stateRes.data || []);
      setIncidents(incRes.data || []);
      setAdvisories(advRes.data || []);

      // Group forecasts by edge
      const fcastMap = {};
      if (Array.isArray(fcastRes.data)) {
        fcastRes.data.forEach(f => {
          if (!fcastMap[f.edgeId]) fcastMap[f.edgeId] = [];
          fcastMap[f.edgeId].push(f);
        });
      }
      setForecasts(fcastMap);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTriggerAnalysis = async () => {
    setRunningAnalysis(true);
    try {
      await executionApi.trigger({ sampleFilename: 'metro_corridor_traffic.csv' });
      setTimeout(() => {
        fetchData();
        setRunningAnalysis(false);
      }, 5000);
    } catch (err) {
      console.error('Trigger analysis failed', err);
      setRunningAnalysis(false);
    }
  };

  const handleOpenExpansion = (edgeId) => {
    setOptimizerTargetEdge(edgeId);
    setOptimizerModalOpen(true);
  };

  const handleDiversionSimulated = (divResult) => {
    setActiveDiversion(divResult);
  };

  return (
    <Layout title="AI Traffic Intelligence Command Center">
      {/* Top Banner with Quick Trigger */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-white">Metropolitan Road Network Optimization Platform</h2>
          <p className="text-xs text-gray-400">
            Real-time multi-sensor telemetry, 15–60m forecasting, and evidence-traceable decision support.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchData}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-lg text-xs font-medium transition flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh State</span>
          </button>
          <button
            onClick={handleTriggerAnalysis}
            disabled={runningAnalysis}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 shadow-md disabled:opacity-50"
          >
            {runningAnalysis ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span>{runningAnalysis ? 'Executing 11-Step Pipeline...' : 'Run Analysis Pipeline'}</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <MetricsOverview
        networkState={networkState}
        incidents={incidents}
        advisories={advisories}
      />

      {/* Primary Map & Live Agent Timeline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <div className="lg:col-span-7 space-y-6">
          <NetworkMap
            networkState={networkState}
            incidents={incidents}
            activeDiversion={activeDiversion}
            onSelectEdge={(edge) => setOptimizerTargetEdge(edge.edgeId || edge.edge_id)}
          />
          <DiversionSimulator
            networkState={networkState}
            onDiversionApplied={handleDiversionSimulated}
          />
        </div>

        <div className="lg:col-span-5 space-y-6">
          <LiveAgentTimeline />
          <IncidentPanel incidents={incidents} />
          <ForecastChart forecasts={forecasts} networkState={networkState} />
        </div>
      </div>

      {/* Link-by-Link Telemetry Table & Advisories */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <CongestionTable
            networkState={networkState}
            onSimulateDiversion={(eid) => console.log('Divert', eid)}
            onSimulateExpansion={handleOpenExpansion}
          />
        </div>
        <div className="lg:col-span-5">
          <AdvisoryFeed
            advisories={advisories}
            onAdvisoryUpdated={fetchData}
          />
        </div>
      </div>

      {/* Network Modification Optimizer Modal */}
      <NetworkOptimizerModal
        isOpen={optimizerModalOpen}
        onClose={() => setOptimizerModalOpen(false)}
        targetEdgeId={optimizerTargetEdge}
        networkState={networkState}
      />
    </Layout>
  );
}
