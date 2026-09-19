const { createDualModel } = require('./modelHelper');

const agentMemorySchema = {
  agentId: { type: String, required: true },
  key: { type: String, required: true },
  value: { type: Object, required: true },
  context: { type: String },
  executionId: { type: String },
  updatedAt: { type: Date, default: Date.now }
};

module.exports = createDualModel('AgentMemory', agentMemorySchema);
