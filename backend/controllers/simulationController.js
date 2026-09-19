const fs = require('fs');
const path = require('path');
const Simulation = require('../models/Simulation');
const TrafficState = require('../models/TrafficState');
const MLClient = require('../services/mlClient');

exports.runDiversionSimulation = async (req, res) => {
  try {
    const { congested_edge_id, diversion_pct = 15, alternate_edge_ids } = req.body;
    if (!congested_edge_id) {
      return res.status(400).json({ error: 'congested_edge_id is required for diversion simulation.' });
    }

    // Fetch latest traffic state snapshot
    const states = await TrafficState.find();
    const networkState = states.map(s => ({
      edge_id: s.edgeId,
      road_name: s.roadName,
      volume_veh_hr: s.volumeVehHr,
      avg_speed_kmh: s.avgSpeedKmh,
      capacity_veh_hr: s.capacityVehHr,
      free_flow_speed_kmh: s.freeFlowSpeedKmh,
      travel_time_sec: s.travelTimeSec,
      lanes: 3
    }));

    const simResult = await MLClient.runDiversionSimulation({
      congested_edge_id,
      diversion_pct: Number(diversion_pct),
      alternate_edge_ids,
      network_state: networkState
    });

    const simulationId = `SIM_DIV_${Date.now()}`;
    const simulationDoc = await Simulation.create({
      simulationId,
      name: `Diversion Analysis on ${congested_edge_id} (${diversion_pct}%)`,
      type: 'DIVERSION',
      targetEdgeId: congested_edge_id,
      parameters: { diversion_pct, alternate_edge_ids },
      results: simResult,
      assumptions: simResult.assumptions,
      createdBy: req.user ? req.user.username : 'operator'
    });

    return res.json({
      simulationId,
      ...simResult
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.runModificationSimulation = async (req, res) => {
  try {
    const { target_edge_id, lanes_to_add = 1 } = req.body;
    if (!target_edge_id) {
      return res.status(400).json({ error: 'target_edge_id is required for network modification simulation.' });
    }

    const states = await TrafficState.find();
    const networkState = states.map(s => ({
      edge_id: s.edgeId,
      road_name: s.roadName,
      volume_veh_hr: s.volumeVehHr,
      avg_speed_kmh: s.avgSpeedKmh,
      capacity_veh_hr: s.capacityVehHr,
      free_flow_speed_kmh: s.freeFlowSpeedKmh,
      travel_time_sec: s.travelTimeSec,
      lanes: 2
    }));

    const simResult = await MLClient.runModificationSimulation({
      target_edge_id,
      lanes_to_add: Number(lanes_to_add),
      network_state: networkState
    });

    const simulationId = `SIM_MOD_${Date.now()}`;
    await Simulation.create({
      simulationId,
      name: `Lane Addition on ${target_edge_id} (+${lanes_to_add} Lane)`,
      type: 'NETWORK_MODIFICATION',
      targetEdgeId: target_edge_id,
      parameters: { lanes_to_add },
      results: simResult.simulation,
      assumptions: simResult.simulation?.stated_assumptions || [],
      createdBy: req.user ? req.user.username : 'operator'
    });

    return res.json({
      simulationId,
      ...simResult
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.listSimulations = async (req, res) => {
  try {
    const sims = await Simulation.find();
    return res.json(sims);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getTemplates = async (req, res) => {
  const templatesDir = path.join(__dirname, '..', '..', 'simulations', 'templates');
  try {
    if (!fs.existsSync(templatesDir)) return res.json([]);
    const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'));
    const templates = files.map(f => {
      const content = fs.readFileSync(path.join(templatesDir, f), 'utf-8');
      return JSON.parse(content);
    });
    return res.json(templates);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
