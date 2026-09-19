const { createDualModel } = require('./modelHelper');

const simulationSchema = {
  simulationId: { type: String, required: true },
  name: { type: String, default: 'Traffic Simulation Scenario' },
  type: { type: String, enum: ['DIVERSION', 'NETWORK_MODIFICATION', 'CAPACITY_CHANGE'], required: true },
  targetEdgeId: { type: String },
  parameters: { type: Object, default: {} },
  results: { type: Object, default: {} },
  assumptions: { type: Array, default: [] },
  createdBy: { type: String, default: 'operator' }
};

module.exports = createDualModel('Simulation', simulationSchema);
