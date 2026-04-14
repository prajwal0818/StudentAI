const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const gmailController = require('../controllers/gmail.controller');

router.get('/status', auth, gmailController.status);
router.get('/connect', auth, gmailController.connect);
router.get('/callback', gmailController.callback); // No auth — Google browser redirect
router.post('/send', auth, gmailController.send);
router.post('/disconnect', auth, gmailController.disconnect);

module.exports = router;
