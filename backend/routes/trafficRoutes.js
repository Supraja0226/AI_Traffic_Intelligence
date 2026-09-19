const express = require('express');
const router = express.Router();
const trafficController = require('../controllers/trafficController');

router.get('/network-state', trafficController.getNetworkState);
router.get('/incidents', trafficController.getIncidents);
router.get('/forecasts', trafficController.getForecasts);
router.get('/road-network', trafficController.getRoadNetwork);

module.exports = router;
