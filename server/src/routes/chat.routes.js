const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const chatController = require('../controllers/chat.controller');

router.post('/ask', auth, chatController.ask);
router.get('/history', auth, chatController.history);
router.delete('/:id', auth, chatController.remove);

module.exports = router;
