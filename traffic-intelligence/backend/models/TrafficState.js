const { createDualModel } = require('./modelHelper');

const trafficStateSchema = {
  datasetId: { type: String, required: true },
  edgeId: { type: String, required: true },
  roadName: { type: String },
  timestamp: { type: String },
  volumeVehHr: { type: Number, default: 0 },
  avgSpeedKmh: { type: Number, default: 0 },
  occupancyPct: { type: Number, default: 0 },
  travelTimeSec: { type: Number, default: 0 },
  capacityVehHr: { type: Number, default: 2000 },
  freeFlowSpeedKmh: { type: Number, default: 60 },
  vcRatio: { type: Number, default: 0 },
  speedRatio: { type: Number, default: 1.0 },
  los: { type: String, enum: ['A', 'B', 'C', 'D', 'E', 'F'], default: 'A' },
  congestionScore: { type: Number, default: 0 },
  congestionLevel: { type: String, enum: ['FREE_FLOW', 'LIGHT', 'MODERATE', 'HEAVY', 'SEVERE'], default: 'FREE_FLOW' },
  isAnomaly: { type: Boolean, default: false }
};

module.exports = createDualModel('TrafficState', trafficStateSchema);
