const { createDualModel } = require('./modelHelper');

const forecastSchema = {
  datasetId: { type: String, required: true },
  edgeId: { type: String, required: true },
  horizonMinutes: { type: Number, required: true },
  predictedVolumeVehHr: { type: Number },
  volumeCiLower: { type: Number },
  volumeCiUpper: { type: Number },
  predictedAvgSpeedKmh: { type: Number },
  speedCiLower: { type: Number },
  speedCiUpper: { type: Number },
  predictedOccupancyPct: { type: Number },
  predictedLos: { type: String },
  predictedCongestionScore: { type: Number },
  confidenceScore: { type: Number }
};

module.exports = createDualModel('Forecast', forecastSchema);
