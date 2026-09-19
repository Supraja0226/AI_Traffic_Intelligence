import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import DatasetUploader from '../components/DatasetUploader';
import { datasetApi, executionApi } from '../services/api';
import { Layers, FileText, Play, CheckCircle2, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/router';

export default function DatasetsPage() {
  const router = useRouter();
  const [datasets, setDatasets] = useState([]);
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [executingFile, setExecutingFile] = useState(null);

  const loadDatasets = async () => {
    try {
      const [dsRes, samplesRes] = await Promise.all([
        datasetApi.list(),
        datasetApi.getSamples()
      ]);
      setDatasets(dsRes.data || []);
      setSamples(samplesRes.data || []);
    } catch (err) {
      console.error('Failed to load datasets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatasets();
  }, []);

  const handleRunSample = async (sample) => {
    setExecutingFile(sample.filename);
    try {
      const res = await executionApi.trigger({ sampleFilename: sample.filename });
      router.push(`/analysis?id=${res.data.executionId}`);
    } catch (err) {
      console.error('Failed to run sample', err);
      setExecutingFile(null);
    }
  };

  return (
    <Layout title="Dataset Ingestion & Management">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Upload Component */}
        <DatasetUploader
          onUploaded={loadDatasets}
          onExecutionStarted={(execId) => router.push(`/analysis?id=${execId}`)}
        />

        {/* Pre-bundled Sample Datasets */}
        <div className="glass-panel rounded-xl p-5 border border-surfaceBorder">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Pre-Bundled Sample Datasets (Multi-Format)</span>
              </h2>
              <p className="text-xs text-gray-400">Ready-to-analyze benchmark datasets for instant evaluation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {samples.map((sample, i) => (
              <div key={i} className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-white font-mono">{sample.filename}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-300">
                      {sample.format}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1">{sample.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-mono">{Math.round(sample.sizeBytes / 1024)} KB</span>
                  <button
                    onClick={() => handleRunSample(sample)}
                    disabled={executingFile === sample.filename}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-50"
                  >
                    {executingFile === sample.filename ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    <span>{executingFile === sample.filename ? 'Dispatching...' : 'Run Pipeline'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Registered Datasets Catalog Table */}
        <div className="glass-panel rounded-xl p-5 border border-surfaceBorder">
          <h2 className="text-sm font-bold text-white mb-3">Registered Catalog Datasets</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-slate-900 text-gray-400 uppercase text-[10px] font-mono border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Dataset Name</th>
                  <th className="py-2.5 px-3">Format</th>
                  <th className="py-2.5 px-3">Records</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {datasets.map((ds, idx) => (
                  <tr key={ds._id || idx} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 font-sans font-medium text-white">{ds.name}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-gray-300">
                        {ds.format}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">{ds.recordCount || '31+'}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-emerald-400 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span className="text-[11px]">{ds.status || 'VALIDATED'}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-sans">
                      <button
                        onClick={() => router.push(`/analysis?datasetId=${ds._id}`)}
                        className="px-2.5 py-1 bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 rounded text-xs"
                      >
                        Analyze
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
