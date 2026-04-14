const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');
const documentController = require('../controllers/document.controller');

router.post('/', auth, upload.single('file'), documentController.upload);
router.get('/', auth, documentController.list);
router.get('/:id', auth, documentController.getById);
router.delete('/:id', auth, documentController.remove);

module.exports = router;
