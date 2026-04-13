const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const { authLimiter } = require('../middlewares/rateLimiter.middleware');
const authController = require('../controllers/auth.controller');

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/logout', auth, authController.logout);
router.post('/logout-all', auth, authController.logoutAll);

module.exports = router;
