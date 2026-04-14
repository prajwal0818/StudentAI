const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const quizController = require('../controllers/quiz.controller');

// Generate a new quiz
router.post('/generate', auth, quizController.generate);

// Submit quiz answers for grading
router.post('/:id/submit', auth, quizController.submit);

// Get quiz history (paginated)
router.get('/history', auth, quizController.history);

// Get a single quiz by ID
router.get('/:id', auth, quizController.getOne);

// Delete a quiz
router.delete('/:id', auth, quizController.deleteQuiz);

module.exports = router;
