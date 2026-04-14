import api from './api';

/**
 * Generate a new quiz.
 *
 * @param {Object} params
 * @param {number} params.questionCount - Number of questions (5-20)
 * @param {string} params.difficulty - Difficulty level
 * @param {Array<string>} params.documentIds - Optional document IDs
 * @returns {Promise} Quiz data with questions
 */
export const generateQuiz = ({ questionCount, difficulty, documentIds = [] }) =>
  api.post('/quiz/generate', { questionCount, difficulty, documentIds });

/**
 * Submit quiz answers for grading.
 *
 * @param {string} quizId - Quiz ID
 * @param {Array<string>} answers - User's answers
 * @returns {Promise} Graded quiz results
 */
export const submitQuiz = (quizId, answers) =>
  api.post(`/quiz/${quizId}/submit`, { answers });

/**
 * Get quiz history with pagination.
 *
 * @param {Object} params
 * @param {number} params.page - Page number (1-indexed)
 * @param {number} params.limit - Items per page
 * @param {string} params.difficulty - Filter by difficulty (optional)
 * @returns {Promise} Paginated quiz history
 */
export const getQuizHistory = ({ page = 1, limit = 10, difficulty = null }) => {
  const params = { page, limit };
  if (difficulty) params.difficulty = difficulty;
  return api.get('/quiz/history', { params });
};

/**
 * Get a single quiz by ID.
 *
 * @param {string} quizId - Quiz ID
 * @returns {Promise} Quiz data
 */
export const getQuiz = (quizId) =>
  api.get(`/quiz/${quizId}`);

/**
 * Delete a quiz.
 *
 * @param {string} quizId - Quiz ID
 * @returns {Promise} Deletion confirmation
 */
export const deleteQuiz = (quizId) =>
  api.delete(`/quiz/${quizId}`);
