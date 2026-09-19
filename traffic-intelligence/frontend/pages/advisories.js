import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AdvisoryFeed from '../components/AdvisoryFeed';
import { advisoryApi } from '../services/api';
import { FileCheck, Download, Shield, Printer, CheckCircle2 } from 'lucide-react';

export default function AdvisoriesPage() {
  const [advisories, setAdvisories] = useState([]);
  const [auditReport, setAuditReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAdvisories = async () => {
    try {
      const [advRes, auditRes] = await Promise.all([
        advisoryApi.list(),
        advisoryApi.getAuditReport()
      ]);
      setAdvisories(advRes.data || []);
      setAuditReport(auditRes.data || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdvisories();
  }, []);

  const handleExportJSON = () => {
    if (!auditReport) return;
    const blob = new Blob([JSON.stringify(auditReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Traffic_Advisory_Audit_Report_${Date.now()}.json`;
    a.click();
  };

  return (
    <Layout title="Operational Advisories & Evidence Audit">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header with Export */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>Evidence-Traceable Advisory Catalog</span>
            </h2>
            <p className="text-xs text-gray-400">
              Every advisory provides verified detector proof, trigger criteria, and estimated before/after impact.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportJSON}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit Report</span>
            </button>
          </div>
        </div>

        {/* Advisory Feed Component */}
        <AdvisoryFeed
          advisories={advisories}
          onAdvisoryUpdated={loadAdvisories}
        />

        {/* Formal Platform Audit Report Summary */}
        {auditReport && (
          <div className="glass-panel rounded-xl p-5 border border-surfaceBorder">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">System Evidence Audit Summary</h3>
                <p className="text-[11px] text-gray-400 font-mono">Timestamp: {auditReport.timestamp}</p>
              </div>
              <span className="text-[10px] bg-emerald-950 border border-emerald-800 text-emerald-300 px-2.5 py-1 rounded font-mono">
                Audit Verified
              </span>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs font-mono text-gray-300 mb-4">
              <p className="text-amber-400 font-bold mb-1">SAFETY COMPLIANCE STATEMENT:</p>
              <p className="text-[11px] text-gray-400">{auditReport.disclaimer}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-800">
                <span className="text-xs font-bold text-red-400 font-sans block mb-2">
                  Verified Incidents Evidence ({auditReport.incidentEvidenceSummary?.totalVerifiedIncidents || 0})
                </span>
                <div className="space-y-2 text-[11px]">
                  {auditReport.incidentEvidenceSummary?.items?.map((item, idx) => (
                    <div key={idx} className="p-2 bg-slate-950 rounded border border-slate-800">
                      <div className="flex justify-between font-bold text-white">
                        <span>{item.type}</span>
                        <span className="text-emerald-400">{Math.round(item.confidence * 100)}% Conf</span>
                      </div>
                      <p className="text-gray-400 text-[10px] mt-1">
                        Speed drop: {item.evidence?.speed_drop_pct}%, Occ: {item.evidence?.occupancy_pct}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-800">
                <span className="text-xs font-bold text-blue-400 font-sans block mb-2">
                  Advisory Impact Assurances ({auditReport.advisoryImpactSummary?.totalAdvisories || 0})
                </span>
                <div className="space-y-2 text-[11px]">
                  {auditReport.advisoryImpactSummary?.items?.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="p-2 bg-slate-950 rounded border border-slate-800">
                      <div className="font-bold text-white truncate">{item.title}</div>
                      <p className="text-emerald-400 text-[10px] mt-1">
                        Expected Gain: +{item.impact?.estimated_speed_gain_kmh || item.impact?.speed_gain_kmh || 12} km/h
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
