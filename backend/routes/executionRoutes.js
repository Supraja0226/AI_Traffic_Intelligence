const express = require('express');
const router = express.Router();
const executionController = require('../controllers/executionController');

router.post('/trigger', executionController.triggerExecution);
router.get('/', executionController.listExecutions);
router.get('/:id', executionController.getExecutionById);
router.get('/:id/logs', executionController.getExecutionLogs);

module.exports = router;
