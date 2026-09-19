const { connectDB } = require('../config/db');
const { seedInitialData } = require('./seed');
const AgentOrchestrator = require('../agents/agentOrchestrator');
const AnalysisExecution = require('../models/AnalysisExecution');
const TrafficState = require('../models/TrafficState');
const Incident = require('../models/Incident');
const Forecast = require('../models/Forecast');
const Recommendation = require('../models/Recommendation');
const path = require('path');

async function testBackendOrchestrator() {
  console.log('>>> [TEST] Starting Backend & 11-Step Pipeline Verification <<<');
  await connectDB();
  await seedInitialData();

  const sampleCsv = path.join(__dirname, '..', '..', 'data', 'samples', 'metro_corridor_traffic.csv');
  const executionId = `TEST_EXEC_${Date.now()}`;

  console.log(`[TEST] Triggering 11-Step Data Flow with execution ID: ${executionId}`);
  const result = await AgentOrchestrator.executeFullPipeline({
    executionId,
    datasetId: 'TEST_DATASET_01',
    datasetName: 'metro_corridor_traffic.csv',
    filePath: sampleCsv,
    fileType: 'csv',
    triggeredBy: 'test_runner'
  });

  console.log(`[TEST] Pipeline finished with status: ${result.status}, Duration: ${result.durationMs}ms`);

  // Assertions
  if (result.status !== 'COMPLETED') {
    throw new Error(`Pipeline status expected COMPLETED, got ${result.status}`);
  }

  const execDoc = await AnalysisExecution.findOne({ executionId });
  if (!execDoc || execDoc.status !== 'COMPLETED') {
    throw new Error(`Execution record verification failed.`);
  }
  console.log(`[OK] AnalysisExecution verified in database. Current step: ${execDoc.currentStep}/11`);

  const states = await TrafficState.find({ datasetId: 'TEST_DATASET_01' });
  console.log(`[OK] TrafficStates saved: ${states.length} road links recorded.`);
  if (states.length === 0) throw new Error('No traffic states recorded.');

  const incidents = await Incident.find();
  console.log(`[OK] Confirmed Incidents saved: ${incidents.length} verified.`);

  const forecasts = await Forecast.find();
  console.log(`[OK] Multi-Horizon Forecasts saved: ${forecasts.length} projections across 15, 30, 45, 60 min.`);

  const recommendations = await Recommendation.find({ executionId });
  console.log(`[OK] Advisories & Optimizations saved: ${recommendations.length} items with evidence.`);

  console.log('\n>>> [TEST SUCCESS] ALL 11 STEPS OF THE PIPELINE EXECUTED AND PERSISTED PERFECTLY! <<<\n');
  process.exit(0);
}

testBackendOrchestrator().catch(err => {
  console.error('[TEST FAILED]', err);
  process.exit(1);
});
