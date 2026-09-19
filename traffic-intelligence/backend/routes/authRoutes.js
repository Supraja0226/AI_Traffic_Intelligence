const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/me', authenticateToken, authController.getMe);
router.get('/quick-switch/:role', authController.quickSwitchRole);

module.exports = router;
