const { z } = require('zod');
const quizService = require('../services/quiz');
const logger = require('../utils/logger');

// Validation schemas
const generateSchema = z.object({
  documentIds: z.array(z.string()).optional().default([]),
  questionCount: z.number().int().min(5).max(20),
  difficulty: z.enum(['easy', 'medium', 'hard', 'mixed'])
});

const submitSchema = z.object({
  answers: z.array(z.string())
});

const historySchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(50).optional().default(10),
  difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']).optional()
});

/**
 * Generate a new quiz.
 * POST /api/quiz/generate
 */
const generate = async (req, res) => {
  try {
    // Validate request body
    const validated = generateSchema.parse(req.body);

    const quiz = await quizService.createQuiz({
      userId: req.user.id,
      documentIds: validated.documentIds,
      questionCount: validated.questionCount,
      difficulty: validated.difficulty
    });

    res.status(201).json({
      success: true,
      data: quiz
    });
  } catch (error) {
    logger.error('Quiz generation error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    if (error.message.includes('No documents found')) {
      return res.status(400).json({
        success: false,
        message: 'No documents found. Please upload study materials first.'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate quiz'
    });
  }
};

/**
 * Submit quiz answers for grading.
 * POST /api/quiz/:id/submit
 */
const submit = async (req, res) => {
  try {
    const quizId = req.params.id;

    // Validate request body
    const validated = submitSchema.parse(req.body);

    const result = await quizService.submitQuiz({
      quizId,
      userId: req.user.id,
      answers: validated.answers
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Quiz submission error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('Unauthorized') || error.message.includes('does not belong')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to submit this quiz'
      });
    }

    if (error.message.includes('already submitted')) {
      return res.status(400).json({
        success: false,
        message: 'This quiz has already been submitted'
      });
    }

    if (error.message.includes('Expected')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit quiz'
    });
  }
};

/**
 * Get quiz history for the authenticated user.
 * GET /api/quiz/history
 */
const history = async (req, res) => {
  try {
    // Parse and validate query params
    const queryParams = {
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 10,
      difficulty: req.query.difficulty || undefined
    };

    const validated = historySchema.parse(queryParams);

    const result = await quizService.getQuizHistory({
      userId: req.user.id,
      ...validated
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Quiz history error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch quiz history'
    });
  }
};

/**
 * Get a single quiz by ID.
 * GET /api/quiz/:id
 */
const getOne = async (req, res) => {
  try {
    const quizId = req.params.id;

    const quiz = await quizService.getQuiz({
      quizId,
      userId: req.user.id
    });

    res.status(200).json({
      success: true,
      data: quiz
    });
  } catch (error) {
    logger.error('Get quiz error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    if (error.message.includes('Unauthorized') || error.message.includes('does not belong')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this quiz'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch quiz'
    });
  }
};

/**
 * Delete a quiz.
 * DELETE /api/quiz/:id
 */
const deleteQuiz = async (req, res) => {
  try {
    const quizId = req.params.id;

    await quizService.deleteQuiz({
      quizId,
      userId: req.user.id
    });

    res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully'
    });
  } catch (error) {
    logger.error('Delete quiz error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    if (error.message.includes('Unauthorized') || error.message.includes('does not belong')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this quiz'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete quiz'
    });
  }
};

module.exports = {
  generate,
  submit,
  history,
  getOne,
  deleteQuiz
};
