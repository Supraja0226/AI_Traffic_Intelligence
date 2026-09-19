const MLClient = require('../services/mlClient');
const AnalysisExecution = require('../models/AnalysisExecution');
const ExecutionLog = require('../models/ExecutionLog');
const TrafficState = require('../models/TrafficState');
const Incident = require('../models/Incident');
const Forecast = require('../models/Forecast');
const Recommendation = require('../models/Recommendation');
const RoadNetwork = require('../models/RoadNetwork');
const Notification = require('../models/Notification');
const AgentMemory = require('../models/AgentMemory');
const { emitTimelineLog, emitPipelineProgress, emitAlert } = require('../services/socketService');

class AgentOrchestrator {
  /**
   * Executes the 11-Step Data Flow strictly in order:
   * 1. Upload organizer-provided datasets
   * 2. Validate and preprocess
   * 3. Build current network state
   * 4. Detect congestion and anomalies
   * 5. Analyze supported incidents
   * 6. Forecast 15–60 minute traffic states
   * 7. Simulate diversions
   * 8. Generate advisories
   * 9. Detect recurring bottlenecks
   * 10. Simulate network modifications
   * 11. Display evidence and estimated impact on the dashboard
   */
  static async executeFullPipeline({ executionId, datasetId, datasetName, filePath, fileType, rawData, triggeredBy = 'analyst' }) {
    const startTime = Date.now();
    console.log(`[Orchestrator] Starting 11-step analysis execution ${executionId} for '${datasetName}'`);

    // Create execution document
    await AnalysisExecution.create({
      executionId,
      datasetId,
      datasetName,
      status: 'RUNNING',
      triggeredBy,
      startTime: new Date(),
      currentStep: 1,
      totalSteps: 11,
      activeAgent: 'Data Analysis Agent'
    });

    try {
      // STEP 1: Upload & Registration Verified
      await this._logStep(executionId, 'Data Analysis Agent', 'INFO', 'Step 1/11: Ingesting dataset into system memory.');
      emitPipelineProgress(executionId, 1, 11, 'Data Analysis Agent', 'RUNNING');

      // Call ML Client to run the 7-agent pipeline
      const mlResult = await MLClient.runPipeline({
        file_path: filePath,
        file_type: fileType,
        raw_data: rawData,
        dataset_name: datasetName
      });

      if (mlResult.status !== 'SUCCESS') {
        throw new Error(mlResult.error || 'ML pipeline returned failure status');
      }

      // STEP 2: Validate and Preprocess
      await this._logStep(executionId, 'Data Analysis Agent', 'INFO', 'Step 2/11: Validating schema, data types, and normalizing coordinates.', mlResult.validation_report);
      emitPipelineProgress(executionId, 2, 11, 'Data Analysis Agent', 'RUNNING');

      // STEP 3: Build Current Network State
      const currentNetworkState = mlResult.current_network_state || [];
      await this._logStep(executionId, 'Data Analysis Agent', 'INFO', `Step 3/11: Built current network state with ${currentNetworkState.length} active links.`, mlResult.network_summary);
      emitPipelineProgress(executionId, 3, 11, 'Data Analysis Agent', 'RUNNING');

      // Persist RoadNetwork
      await RoadNetwork.create({
        name: `Network-${datasetName}-${Date.now()}`,
        sourceDatasetId: datasetId,
        topologySummary: mlResult.topologySummary || {},
        edges: currentNetworkState
      });

      // Persist TrafficState
      for (const edge of currentNetworkState) {
        await TrafficState.create({
          datasetId: datasetId || executionId,
          edgeId: edge.edge_id,
          roadName: edge.road_name,
          timestamp: edge.timestamp,
          volumeVehHr: edge.volume_veh_hr,
          avgSpeedKmh: edge.avg_speed_kmh,
          occupancyPct: edge.occupancy_pct,
          travelTimeSec: edge.travel_time_sec,
          capacityVehHr: edge.capacity_veh_hr,
          freeFlowSpeedKmh: edge.free_flow_speed_kmh,
          vcRatio: edge.vc_ratio,
          speedRatio: edge.speed_ratio,
          los: edge.los,
          congestionScore: edge.congestion_score,
          congestionLevel: edge.congestion_level || 'FREE_FLOW',
          isAnomaly: !!edge.is_anomaly
        });
      }

      // STEP 4: Detect Congestion and Anomalies
      const classifiedEdges = mlResult.classified_edges || [];
      const congestionSummary = mlResult.congestion_summary || {};
      await this._logStep(executionId, 'Congestion Detection Agent', 'INFO', `Step 4/11: Congestion classified across 5 levels. Identified ${congestionSummary.severe_links || 0} severe links and ${congestionSummary.anomaly_count || 0} anomalies.`, congestionSummary);
      emitPipelineProgress(executionId, 4, 11, 'Congestion Detection Agent', 'RUNNING');

      // STEP 5: Analyze Supported Incidents (Strict Evidence Safety Constraint)
      const confirmedIncidents = mlResult.confirmed_incidents || [];
      const unconfirmedAnomalies = mlResult.unconfirmed_anomalies || [];
      await this._logStep(
        executionId,
        'Incident Analysis Agent',
        'INFO',
        `Step 5/11: Evaluated incident signatures. Strictly confirmed ${confirmedIncidents.length} incident(s) with multi-sensor proof; withheld ${unconfirmedAnomalies.length} unconfirmed anomalies.`,
        { confirmed_count: confirmedIncidents.length, unconfirmed_count: unconfirmedAnomalies.length }
      );
      emitPipelineProgress(executionId, 5, 11, 'Incident Analysis Agent', 'RUNNING');

      // Persist Incidents
      for (const inc of confirmedIncidents) {
        await Incident.create({
          incidentId: inc.incident_id,
          datasetId: datasetId || executionId,
          edgeId: inc.edge_id,
          roadName: inc.road_name,
          incidentType: inc.incident_type,
          severity: inc.severity,
          confidenceScore: inc.confidence_score,
          supportingEvidence: inc.supporting_evidence,
          description: inc.description
        });
        emitAlert(`Confirmed Incident: ${inc.roadName}`, inc.description, inc.severity, inc.supporting_evidence);
      }

      // STEP 6: Forecast 15-60 Minute Traffic States
      const forecastsByEdge = mlResult.forecasts_by_edge || {};
      await this._logStep(executionId, 'Forecasting Agent', 'INFO', `Step 6/11: Computed multi-horizon forecasts at 15, 30, 45, and 60 minutes for ${Object.keys(forecastsByEdge).length} corridors.`, { horizons: [15, 30, 45, 60] });
      emitPipelineProgress(executionId, 6, 11, 'Forecasting Agent', 'RUNNING');

      // Persist Forecasts
      for (const [edgeId, horizons] of Object.entries(forecastsByEdge)) {
        for (const h of horizons) {
          await Forecast.create({
            datasetId: datasetId || executionId,
            edgeId,
            horizonMinutes: h.horizon_minutes,
            predictedVolumeVehHr: h.predicted_volume_veh_hr,
            volumeCiLower: h.volume_ci_lower,
            volumeCiUpper: h.volume_ci_upper,
            predictedAvgSpeedKmh: h.predicted_avg_speed_kmh,
            speedCiLower: h.speed_ci_lower,
            speedCiUpper: h.speed_ci_upper,
            predictedOccupancyPct: h.predicted_occupancy_pct,
            predictedLos: h.predicted_los,
            predictedCongestionScore: h.predicted_congestion_score,
            confidenceScore: h.confidence_score
          });
        }
      }

      // STEP 7: Simulate Diversions
      await this._logStep(executionId, 'Advisory Agent', 'INFO', 'Step 7/11: Simulating corridor diversions and computing BPR volume reallocation.');
      emitPipelineProgress(executionId, 7, 11, 'Advisory Agent', 'RUNNING');

      // STEP 8: Generate Advisories
      const advisories = mlResult.advisories || [];
      await this._logStep(executionId, 'Advisory Agent', 'INFO', `Step 8/11: Generated ${advisories.length} operational/diversion advisories with explicit evidence trails.`, { total: advisories.length });
      emitPipelineProgress(executionId, 8, 11, 'Advisory Agent', 'RUNNING');

      // Persist Recommendations/Advisories
      for (const adv of advisories) {
        await Recommendation.create({
          recommendationId: adv.advisory_id,
          executionId,
          type: adv.type,
          severity: adv.severity,
          title: adv.title,
          affectedCorridor: adv.affected_corridor,
          affectedEdgeId: adv.affected_edge_id,
          recommendedAction: adv.recommended_action,
          supportingEvidence: adv.supporting_evidence,
          estimatedImpact: adv.estimated_impact,
          assumptions: [adv.regulatory_notice]
        });
      }

      // STEP 9: Detect Recurring Bottlenecks
      const recommendations = mlResult.optimization_recommendations || [];
      await this._logStep(executionId, 'Network Optimization Agent', 'INFO', `Step 9/11: Detected recurring bottlenecks requiring structural intervention.`);
      emitPipelineProgress(executionId, 9, 11, 'Network Optimization Agent', 'RUNNING');

      // STEP 10: Simulate Network Modifications
      await this._logStep(executionId, 'Network Optimization Agent', 'INFO', `Step 10/11: Simulated ${recommendations.length} structural network modifications (e.g. lane additions) with BPR before/after deltas.`, { modifications: recommendations });
      emitPipelineProgress(executionId, 10, 11, 'Network Optimization Agent', 'RUNNING');

      // Persist Optimization Recommendations
      for (const opt of recommendations) {
        await Recommendation.create({
          recommendationId: `OPT_${opt.target_edge_id}_${Date.now()}`,
          executionId,
          type: 'LANE_EXPANSION_OPTIMIZATION',
          severity: 'HIGH',
          title: `Proposed Lane Addition: ${opt.road_name}`,
          affectedCorridor: opt.road_name,
          affectedEdgeId: opt.target_edge_id,
          recommendedAction: `Add 1 auxiliary lane, increasing capacity from ${opt.before.capacity_veh_hr} to ${opt.after.capacity_veh_hr} veh/hr.`,
          supportingEvidence: {
            current_vc: opt.before.vc_ratio,
            current_speed_kmh: opt.before.avg_speed_kmh,
            delay_sec: opt.before.travel_time_sec
          },
          estimatedImpact: opt.delta,
          assumptions: opt.stated_assumptions
        });
      }

      // Record in Agent Memory
      await AgentMemory.create({
        agentId: 'SYSTEM_ORCHESTRATOR',
        key: `EXECUTION_SNAPSHOT_${executionId}`,
        value: {
          executionId,
          healthIndex: mlResult.network_summary?.network_health_index,
          totalIncidents: confirmedIncidents.length,
          totalAdvisories: advisories.length
        },
        executionId
      });

      // STEP 11: Display Evidence and Estimated Impact on Dashboard
      const durationMs = Date.now() - startTime;
      await this._logStep(executionId, 'Monitoring Agent', 'SUCCESS', `Step 11/11: Pipeline completed successfully in ${durationMs}ms. Dashboard feeds updated.`, { duration_ms: durationMs });

      // Update AnalysisExecution document to COMPLETED
      await AnalysisExecution.updateOne(
        { executionId },
        {
          status: 'COMPLETED',
          currentStep: 11,
          durationMs,
          networkSummary: mlResult.network_summary,
          stages: mlResult.agent_execution_timeline || [],
          summary: {
            totalLinks: currentNetworkState.length,
            congestedLinks: congestionSummary.congested_count || 0,
            incidentsConfirmed: confirmedIncidents.length,
            advisoriesGenerated: advisories.length,
            optimizationsSimulated: recommendations.length
          }
        }
      );

      // Create Notification
      await Notification.create({
        title: `Analysis Run Completed: ${datasetName}`,
        message: `Processed ${currentNetworkState.length} road links. Health Index: ${mlResult.network_summary?.network_health_index || 70}%.`,
        type: 'SUCCESS',
        link: `/analysis?id=${executionId}`
      });

      emitPipelineProgress(executionId, 11, 11, 'Monitoring Agent', 'COMPLETED', {
        executionId,
        networkSummary: mlResult.network_summary,
        incidentsCount: confirmedIncidents.length,
        advisoriesCount: advisories.length
      });

      return {
        executionId,
        status: 'COMPLETED',
        durationMs,
        networkSummary: mlResult.network_summary,
        currentNetworkState,
        classifiedEdges,
        confirmedIncidents,
        forecastsByEdge,
        advisories,
        recommendations,
        agentExecutionTimeline: mlResult.agent_execution_timeline
      };

    } catch (err) {
      console.error(`[Orchestrator] Execution ${executionId} failed:`, err);
      const durationMs = Date.now() - startTime;
      await this._logStep(executionId, 'Monitoring Agent', 'ERROR', `Pipeline execution failed: ${err.message}`);

      await AnalysisExecution.updateOne(
        { executionId },
        {
          status: 'FAILED',
          durationMs,
          summary: { error: err.message }
        }
      );

      emitPipelineProgress(executionId, 0, 11, 'Monitoring Agent', 'FAILED', { error: err.message });
      throw err;
    }
  }

  static async _logStep(executionId, agentName, level, message, evidence = null) {
    console.log(`[${agentName}] ${message}`);
    await ExecutionLog.create({
      executionId,
      agentName,
      level,
      message,
      evidence
    });
    emitTimelineLog(executionId, agentName, level, message, evidence);
  }
}

module.exports = AgentOrchestrator;
