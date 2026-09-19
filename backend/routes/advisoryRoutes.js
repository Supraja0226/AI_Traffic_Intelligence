const express = require('express');
const router = express.Router();
const advisoryController = require('../controllers/advisoryController');

router.get('/', advisoryController.getAdvisories);
router.put('/:id/status', advisoryController.updateAdvisoryStatus);
router.get('/audit-report', advisoryController.getAuditReport);

module.exports = router;
