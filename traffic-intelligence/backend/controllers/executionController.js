const AnalysisExecution = require('../models/AnalysisExecution');
const ExecutionLog = require('../models/ExecutionLog');
const Dataset = require('../models/Dataset');
const AgentOrchestrator = require('../agents/agentOrchestrator');
const path = require('path');

exports.triggerExecution = async (req, res) => {
  try {
    const { datasetId, sampleFilename } = req.body;
    let filePath = null;
    let fileType = null;
    let datasetName = 'Live Traffic Analysis';

    if (sampleFilename) {
      filePath = path.join(__dirname, '..', '..', 'data', 'samples', sampleFilename);
      datasetName = sampleFilename;
      fileType = path.extname(sampleFilename).replace('.', '');
    } else if (datasetId) {
      const dataset = await Dataset.findById(datasetId);
      if (!dataset) {
        return res.status(404).json({ error: 'Dataset not found.' });
      }
      filePath = dataset.filePath;
      datasetName = dataset.name;
      fileType = dataset.format.toLowerCase();
    } else {
      // Default to sample CSV
      filePath = path.join(__dirname, '..', '..', 'data', 'samples', 'metro_corridor_traffic.csv');
      datasetName = 'metro_corridor_traffic.csv';
      fileType = 'csv';
    }

    const executionId = `EXEC_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // Trigger asynchronous 11-step pipeline
    AgentOrchestrator.executeFullPipeline({
      executionId,
      datasetId: datasetId || 'sample',
      datasetName,
      filePath,
      fileType,
      triggeredBy: req.user ? req.user.username : 'analyst'
    }).catch(err => {
      console.error(`[ExecutionController] Background pipeline error:`, err);
    });

    return res.status(202).json({
      message: '11-Step AI Traffic Intelligence pipeline initiated.',
      executionId,
      status: 'RUNNING',
      datasetName
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.listExecutions = async (req, res) => {
  try {
    const executions = await AnalysisExecution.find();
    return res.json(executions);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getExecutionById = async (req, res) => {
  try {
    const execution = await AnalysisExecution.findOne({ executionId: req.params.id });
    if (!execution) {
      return res.status(404).json({ error: 'Execution not found.' });
    }
    return res.json(execution);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getExecutionLogs = async (req, res) => {
  try {
    const logs = await ExecutionLog.find({ executionId: req.params.id });
    return res.json(logs);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
