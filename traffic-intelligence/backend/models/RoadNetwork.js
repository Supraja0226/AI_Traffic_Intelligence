const { createDualModel } = require('./modelHelper');

const roadNetworkSchema = {
  name: { type: String, required: true },
  description: { type: String },
  nodes: { type: Array, default: [] },
  edges: { type: Array, default: [] },
  topologySummary: { type: Object, default: {} },
  sourceDatasetId: { type: String }
};

module.exports = createDualModel('RoadNetwork', roadNetworkSchema);
