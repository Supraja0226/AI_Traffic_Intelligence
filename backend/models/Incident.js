const { createDualModel } = require('./modelHelper');

const incidentSchema = {
  incidentId: { type: String, required: true },
  datasetId: { type: String },
  edgeId: { type: String, required: true },
  roadName: { type: String },
  incidentType: { type: String, required: true },
  severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
  confidenceScore: { type: Number, default: 0.8 },
  supportingEvidence: { type: Object, default: {} },
  description: { type: String },
  status: { type: String, enum: ['ACTIVE', 'VERIFIED_BY_OPERATOR', 'RESOLVED', 'DISMISSED'], default: 'ACTIVE' },
  detectedAt: { type: Date, default: Date.now }
};

module.exports = createDualModel('Incident', incidentSchema);
