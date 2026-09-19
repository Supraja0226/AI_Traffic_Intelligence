const { createDualModel } = require('./modelHelper');

const analysisExecutionSchema = {
  executionId: { type: String, required: true },
  datasetId: { type: String },
  datasetName: { type: String },
  status: { type: String, enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'], default: 'PENDING' },
  triggeredBy: { type: String, default: 'analyst' },
  durationMs: { type: Number, default: 0 },
  currentStep: { type: Number, default: 1 },
  totalSteps: { type: Number, default: 11 },
  activeAgent: { type: String },
  networkSummary: { type: Object, default: {} },
  stages: { type: Array, default: [] },
  summary: { type: Object, default: {} }
};

module.exports = createDualModel('AnalysisExecution', analysisExecutionSchema);
