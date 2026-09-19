const { createDualModel } = require('./modelHelper');

const datasetSchema = {
  name: { type: String, required: true },
  format: { type: String, enum: ['CSV', 'JSON', 'EXCEL', 'GEOJSON'], required: true },
  originalFilename: { type: String },
  filePath: { type: String },
  recordCount: { type: Number, default: 0 },
  validationReport: { type: Object, default: {} },
  status: { type: String, enum: ['UPLOADED', 'VALIDATED', 'PROCESSING', 'ANALYZED', 'FAILED'], default: 'UPLOADED' },
  uploadedBy: { type: String, default: 'system' }
};

module.exports = createDualModel('Dataset', datasetSchema);
