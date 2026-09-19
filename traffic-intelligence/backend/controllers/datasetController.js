const path = require('path');
const fs = require('fs');
const Dataset = require('../models/Dataset');
const AgentOrchestrator = require('../agents/agentOrchestrator');

exports.uploadDataset = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No dataset file uploaded.' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    const formatMap = {
      csv: 'CSV',
      json: 'JSON',
      geojson: 'GEOJSON',
      xlsx: 'EXCEL',
      xls: 'EXCEL'
    };

    const format = formatMap[ext] || 'CSV';
    const datasetName = req.body.name || path.basename(req.file.originalname, path.extname(req.file.originalname));

    const dataset = await Dataset.create({
      name: datasetName,
      format,
      originalFilename: req.file.originalname,
      filePath: req.file.path,
      status: 'UPLOADED',
      uploadedBy: req.user ? req.user.username : 'analyst'
    });

    return res.status(201).json({
      message: 'Dataset uploaded and registered successfully.',
      dataset
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.listDatasets = async (req, res) => {
  try {
    const datasets = await Dataset.find();
    return res.json(datasets);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getDatasetById = async (req, res) => {
  try {
    const dataset = await Dataset.findById(req.params.id);
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found.' });
    }
    return res.json(dataset);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Returns pre-bundled organizer sample datasets (CSV, GeoJSON, JSON, Excel)
exports.getSampleDatasets = async (req, res) => {
  const samplesDir = path.join(__dirname, '..', '..', 'data', 'samples');
  try {
    if (!fs.existsSync(samplesDir)) {
      return res.json([]);
    }

    const files = fs.readdirSync(samplesDir);
    const samples = files.map(file => {
      const ext = path.extname(file).toLowerCase();
      const stats = fs.statSync(path.join(samplesDir, file));
      return {
        filename: file,
        filePath: path.join(samplesDir, file),
        format: ext.replace('.', '').toUpperCase(),
        sizeBytes: stats.size,
        description: file.includes('corridor')
          ? 'Metropolitan arterial corridor traffic data with simulated congestion and incident signatures'
          : file.includes('urban_network')
          ? 'Spatial GeoJSON road network with coordinates, lane counts, and speed limits'
          : file.includes('peak_hour')
          ? 'JSON detector telemetry covering morning peak hour sensor readings'
          : 'Multi-sheet Excel workbook of highway arterials and baseline capacities'
      };
    });

    return res.json(samples);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
