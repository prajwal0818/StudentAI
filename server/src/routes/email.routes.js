const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const emailController = require('../controllers/email.controller');

router.post('/generate', auth, emailController.generate);

module.exports = router;
