const TrafficState = require('../models/TrafficState');
const RoadNetwork = require('../models/RoadNetwork');
const Incident = require('../models/Incident');
const Forecast = require('../models/Forecast');

exports.getNetworkState = async (req, res) => {
  try {
    const states = await TrafficState.find();
    // Return unique latest edge states
    const uniqueMap = new Map();
    states.forEach(s => uniqueMap.set(s.edgeId, s));
    return res.json(Array.from(uniqueMap.values()));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find();
    return res.json(incidents);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getForecasts = async (req, res) => {
  try {
    const edgeId = req.query.edgeId;
    const filter = edgeId ? { edgeId } : {};
    const forecasts = await Forecast.find(filter);
    return res.json(forecasts);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getRoadNetwork = async (req, res) => {
  try {
    const networks = await RoadNetwork.find();
    const latest = networks[networks.length - 1] || null;
    return res.json(latest);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
