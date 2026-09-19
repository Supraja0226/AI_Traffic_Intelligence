const { createDualModel } = require('./modelHelper');

const recommendationSchema = {
  recommendationId: { type: String, required: true },
  executionId: { type: String },
  type: {
    type: String,
    enum: ['INCIDENT_DIVERSION_RECOMMENDATION', 'CONGESTION_MITIGATION_ADVISORY', 'LANE_EXPANSION_OPTIMIZATION', 'SIGNAL_TIMING_ADVISORY'],
    required: true
  },
  severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
  title: { type: String, required: true },
  affectedCorridor: { type: String },
  affectedEdgeId: { type: String },
  recommendedAction: { type: String, required: true },
  supportingEvidence: { type: Object, default: {} },
  estimatedImpact: { type: Object, default: {} },
  assumptions: { type: Array, default: [] },
  status: { type: String, enum: ['PROPOSED', 'ACCEPTED', 'REJECTED', 'SUPERSEDED'], default: 'PROPOSED' }
};

module.exports = createDualModel('Recommendation', recommendationSchema);
