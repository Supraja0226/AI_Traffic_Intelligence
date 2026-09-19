const express = require('express');
const router = express.Router();
const datasetController = require('../controllers/datasetController');
const upload = require('../middleware/upload');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.post('/upload', upload.single('dataset'), datasetController.uploadDataset);
router.get('/', datasetController.listDatasets);
router.get('/samples', datasetController.getSampleDatasets);
router.get('/:id', datasetController.getDatasetById);

module.exports = router;
