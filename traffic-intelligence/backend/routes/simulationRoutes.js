const express = require('express');
const router = express.Router();
const simulationController = require('../controllers/simulationController');

router.post('/diversion', simulationController.runDiversionSimulation);
router.post('/modification', simulationController.runModificationSimulation);
router.get('/', simulationController.listSimulations);
router.get('/templates', simulationController.getTemplates);

module.exports = router;
