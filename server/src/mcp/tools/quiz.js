const { z } = require('zod');
const quizService = require('../../services/quiz');
const { getUserId } = require('../utils/auth');
const { success, error } = require('../utils/response');
const logger = require('../../utils/logger');

function registerQuizTools(server) {
  server.tool(
    'generate_quiz',
    'Generate a quiz from your uploaded study materials',
    {
      questionCount: z.number().min(5).max(20).describe('Number of questions (5-20)'),
      difficulty: z.enum(['easy', 'medium', 'hard']).describe('Difficulty level'),
    },
    async ({ questionCount, difficulty }) => {
      try {
        const userId = getUserId();
        const quiz = await quizService.createQuiz({ userId, questionCount, difficulty });
        return success(quiz);
      } catch (err) {
        logger.error('MCP generate_quiz error:', err.message);
        return error(err.message);
      }
    }
  );

  server.tool(
    'submit_quiz',
    'Submit answers for a quiz and get graded results',
    {
      quizId: z.string().describe('The quiz ID'),
      answers: z.array(z.string()).describe('Array of answers in order matching the questions'),
    },
    async ({ quizId, answers }) => {
      try {
        const userId = getUserId();
        const result = await quizService.submitQuiz({ quizId, userId, answers });
        return success(result);
      } catch (err) {
        logger.error('MCP submit_quiz error:', err.message);
        return error(err.message);
      }
    }
  );

  server.tool(
    'get_quiz',
    'Get a specific quiz by ID. Returns questions without answers if not yet submitted, or full results if submitted.',
    {
      quizId: z.string().describe('The quiz ID'),
    },
    async ({ quizId }) => {
      try {
        const userId = getUserId();
        const quiz = await quizService.getQuiz({ quizId, userId });
        return success(quiz);
      } catch (err) {
        logger.error('MCP get_quiz error:', err.message);
        return error(err.message);
      }
    }
  );

  server.tool(
    'get_quiz_history',
    'Get paginated quiz history with optional difficulty filter',
    {
      page: z.number().optional().default(1).describe('Page number (1-indexed)'),
      limit: z.number().optional().default(10).describe('Items per page (default: 10)'),
      difficulty: z.enum(['easy', 'medium', 'hard']).optional().describe('Filter by difficulty'),
    },
    async ({ page, limit, difficulty }) => {
      try {
        const userId = getUserId();
        const result = await quizService.getQuizHistory({
          userId,
          page,
          limit,
          difficulty: difficulty || null,
        });
        return success(result);
      } catch (err) {
        logger.error('MCP get_quiz_history error:', err.message);
        return error(err.message);
      }
    }
  );
}

module.exports = { registerQuizTools };
