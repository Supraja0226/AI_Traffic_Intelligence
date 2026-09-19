const { createDualModel } = require('./modelHelper');

const executionLogSchema = {
  executionId: { type: String, required: true },
  agentId: { type: String },
  agentName: { type: String },
  level: { type: String, enum: ['INFO', 'WARN', 'ERROR', 'SUCCESS'], default: 'INFO' },
  message: { type: String, required: true },
  evidence: { type: Object }
};

module.exports = createDualModel('ExecutionLog', executionLogSchema);
