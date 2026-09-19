import React, { useState } from 'react';
import { datasetApi, executionApi } from '../services/api';
import { UploadCloud, CheckCircle2, FileText, AlertCircle, Play, RefreshCw } from 'lucide-react';

export default function DatasetUploader({ onUploaded, onExecutionStarted }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const handleUpload = async (autoExecute = false) => {
    if (!file) return;
    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('dataset', file);
    formData.append('name', file.name);

    try {
      const res = await datasetApi.upload(formData);
      const dataset = res.data.dataset;
      setMessage({ type: 'success', text: `Uploaded and validated ${file.name} successfully.` });
      if (onUploaded) onUploaded(dataset);

      if (autoExecute) {
        const execRes = await executionApi.trigger({ datasetId: dataset._id });
        if (onExecutionStarted) onExecutionStarted(execRes.data.executionId);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || err.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass-panel rounded-xl p-5 border border-surfaceBorder">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <UploadCloud className="w-4 h-4 text-blue-400" />
            <span>Upload Organizer-Provided Datasets</span>
          </h2>
          <p className="text-xs text-gray-400">Supported Formats: CSV, JSON, XLSX/Excel, GeoJSON</p>
        </div>
      </div>

      <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-xl p-6 text-center transition bg-slate-900/30">
        <input
          type="file"
          id="datasetFileInput"
          accept=".csv,.json,.geojson,.xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />
        <label htmlFor="datasetFileInput" className="cursor-pointer block">
          <UploadCloud className="w-8 h-8 text-blue-400 mx-auto mb-2 opacity-80" />
          <span className="text-xs font-semibold text-gray-200">
            {file ? file.name : 'Choose a file or drag & drop here'}
          </span>
          <p className="text-[11px] text-gray-500 mt-1">
            CSV, GeoJSON coordinates, Peak JSON sensors, or Excel workbooks
          </p>
        </label>
      </div>

      {file && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-3 rounded-lg border border-slate-800">
          <div className="flex items-center space-x-2 text-xs text-gray-300">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span className="font-medium truncate max-w-xs">{file.name}</span>
            <span className="text-gray-500 text-[10px]">({Math.round(file.size / 1024)} KB)</span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={() => handleUpload(false)}
              disabled={uploading}
              className="flex-1 sm:flex-initial px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-200 rounded-lg text-xs font-medium transition disabled:opacity-50"
            >
              Register Only
            </button>
            <button
              onClick={() => handleUpload(true)}
              disabled={uploading}
              className="flex-1 sm:flex-initial px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition disabled:opacity-50"
            >
              {uploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              <span>{uploading ? 'Processing...' : 'Upload & Run Pipeline'}</span>
            </button>
          </div>
        </div>
      )}

      {message && (
        <div className={`mt-3 p-3 rounded-lg text-xs flex items-center space-x-2 ${
          message.type === 'success' ? 'bg-emerald-950/30 border border-emerald-800 text-emerald-300' : 'bg-red-950/30 border border-red-800 text-red-300'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
}
