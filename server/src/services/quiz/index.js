const Quiz = require('../../models/Quiz');
const { generateQuiz } = require('./generator');
const { gradeQuiz } = require('./evaluator');
const cache = require('../../utils/cache');
const logger = require('../../utils/logger');

const CACHE_TTL = 3600; // 1 hour

/**
 * Create a new quiz for a user.
 * Checks cache first to avoid regenerating identical quizzes.
 *
 * @param {Object} params
 * @param {string} params.userId - User ID
 * @param {Array<string>} params.documentIds - Document IDs (optional, for metadata)
 * @param {number} params.questionCount - Number of questions (5-20)
 * @param {string} params.difficulty - Difficulty level
 * @returns {Promise<Object>} Quiz object with questions (answers hidden)
 */
const createQuiz = async ({ userId, documentIds = [], questionCount, difficulty }) => {
  // Build cache key
  const cacheData = JSON.stringify({
    documentIds: documentIds.sort(), // Sort to ensure consistent key
    questionCount,
    difficulty
  });
  const cacheKey = cache.buildKey(`quiz:${userId}`, cacheData);

  // Check cache
  const cached = await cache.get(cacheKey);
  if (cached) {
    logger.info(`Cache hit for quiz generation (user: ${userId})`);
    return cached;
  }

  // Generate new quiz
  logger.info(`Generating new quiz for user ${userId}`);
  const questions = await generateQuiz({ userId, questionCount, difficulty });

  // Calculate total points
  const totalPoints = questions.length;

  // Save to database
  const quiz = new Quiz({
    userId,
    documentIds,
    difficulty,
    questions,
    totalPoints,
    isSubmitted: false
  });

  await quiz.save();

  // Prepare response (hide correct answers and explanations)
  const response = {
    id: quiz._id.toString(),
    difficulty: quiz.difficulty,
    createdAt: quiz.createdAt,
    questions: quiz.questions.map((q, idx) => ({
      index: idx,
      type: q.type,
      question: q.question,
      difficulty: q.difficulty,
      options: q.type === 'mcq' ? q.options : undefined
      // Do NOT include: correctAnswer, acceptableAnswers, explanation, contextChunk
    }))
  };

  // Cache the response
  await cache.set(cacheKey, response, CACHE_TTL);

  logger.info(`Quiz created: ${quiz._id} (${questions.length} questions)`);
  return response;
};

/**
 * Submit quiz answers and grade them.
 *
 * @param {Object} params
 * @param {string} params.quizId - Quiz ID
 * @param {string} params.userId - User ID (for authorization)
 * @param {Array<string>} params.answers - User's answers
 * @returns {Promise<Object>} Graded quiz with results
 */
const submitQuiz = async ({ quizId, userId, answers }) => {
  // Find quiz
  const quiz = await Quiz.findById(quizId);

  if (!quiz) {
    throw new Error('Quiz not found');
  }

  // Verify ownership
  if (!quiz.belongsToUser(userId)) {
    throw new Error('Unauthorized: Quiz does not belong to this user');
  }

  // Check if already submitted
  if (quiz.isSubmitted) {
    throw new Error('Quiz already submitted');
  }

  // Validate answer count
  if (answers.length !== quiz.questions.length) {
    throw new Error(`Expected ${quiz.questions.length} answers, got ${answers.length}`);
  }

  // Grade the quiz
  const { results, score, pointsEarned, totalPoints } = await gradeQuiz(quiz, answers);

  // Update quiz document
  quiz.userAnswers = answers;
  quiz.results = results;
  quiz.score = score;
  quiz.pointsEarned = pointsEarned;
  quiz.totalPoints = totalPoints;
  quiz.isSubmitted = true;

  await quiz.save();

  logger.info(`Quiz submitted: ${quizId}, score: ${score}%`);

  // Return full results with correct answers and explanations
  return {
    id: quiz._id.toString(),
    score: quiz.score,
    pointsEarned: quiz.pointsEarned,
    totalPoints: quiz.totalPoints,
    isPassed: quiz.score >= 60,
    results: quiz.results,
    questions: quiz.questions.map((q, idx) => ({
      index: idx,
      type: q.type,
      question: q.question,
      difficulty: q.difficulty,
      options: q.type === 'mcq' ? q.options : undefined,
      userAnswer: quiz.userAnswers[idx],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      isCorrect: quiz.results[idx].isCorrect,
      feedback: quiz.results[idx].feedback
    })),
    submittedAt: quiz.updatedAt
  };
};

/**
 * Get quiz history for a user with pagination.
 *
 * @param {Object} params
 * @param {string} params.userId - User ID
 * @param {number} params.page - Page number (1-indexed)
 * @param {number} params.limit - Items per page
 * @param {string} params.difficulty - Filter by difficulty (optional)
 * @returns {Promise<Object>} Paginated quiz history
 */
const getQuizHistory = async ({ userId, page = 1, limit = 10, difficulty = null }) => {
  const skip = (page - 1) * limit;

  const filter = { userId };
  if (difficulty) {
    filter.difficulty = difficulty;
  }

  const [quizzes, total] = await Promise.all([
    Quiz.find(filter)
      .select('-questions.contextChunk -questions.acceptableAnswers') // Exclude large fields
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Quiz.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    quizzes: quizzes.map(q => ({
      id: q._id.toString(),
      difficulty: q.difficulty,
      questionCount: q.questions.length,
      isSubmitted: q.isSubmitted,
      score: q.score,
      isPassed: q.score >= 60,
      createdAt: q.createdAt,
      submittedAt: q.isSubmitted ? q.updatedAt : null
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages
    }
  };
};

/**
 * Get a single quiz by ID.
 * Returns different data based on submission status.
 *
 * @param {Object} params
 * @param {string} params.quizId - Quiz ID
 * @param {string} params.userId - User ID (for authorization)
 * @returns {Promise<Object>} Quiz data
 */
const getQuiz = async ({ quizId, userId }) => {
  const quiz = await Quiz.findById(quizId);

  if (!quiz) {
    throw new Error('Quiz not found');
  }

  // Verify ownership
  if (!quiz.belongsToUser(userId)) {
    throw new Error('Unauthorized: Quiz does not belong to this user');
  }

  if (quiz.isSubmitted) {
    // Return full results
    return {
      id: quiz._id.toString(),
      difficulty: quiz.difficulty,
      isSubmitted: true,
      score: quiz.score,
      pointsEarned: quiz.pointsEarned,
      totalPoints: quiz.totalPoints,
      isPassed: quiz.score >= 60,
      createdAt: quiz.createdAt,
      submittedAt: quiz.updatedAt,
      results: quiz.results,
      questions: quiz.questions.map((q, idx) => ({
        index: idx,
        type: q.type,
        question: q.question,
        difficulty: q.difficulty,
        options: q.type === 'mcq' ? q.options : undefined,
        userAnswer: quiz.userAnswers[idx],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        isCorrect: quiz.results[idx].isCorrect,
        feedback: quiz.results[idx].feedback
      }))
    };
  } else {
    // Return questions without answers (for taking the quiz)
    return {
      id: quiz._id.toString(),
      difficulty: quiz.difficulty,
      isSubmitted: false,
      createdAt: quiz.createdAt,
      questions: quiz.questions.map((q, idx) => ({
        index: idx,
        type: q.type,
        question: q.question,
        difficulty: q.difficulty,
        options: q.type === 'mcq' ? q.options : undefined
      }))
    };
  }
};

/**
 * Delete a quiz.
 *
 * @param {Object} params
 * @param {string} params.quizId - Quiz ID
 * @param {string} params.userId - User ID (for authorization)
 * @returns {Promise<void>}
 */
const deleteQuiz = async ({ quizId, userId }) => {
  const quiz = await Quiz.findById(quizId);

  if (!quiz) {
    throw new Error('Quiz not found');
  }

  // Verify ownership
  if (!quiz.belongsToUser(userId)) {
    throw new Error('Unauthorized: Quiz does not belong to this user');
  }

  await Quiz.findByIdAndDelete(quizId);
  logger.info(`Quiz deleted: ${quizId}`);
};

module.exports = {
  createQuiz,
  submitQuiz,
  getQuizHistory,
  getQuiz,
  deleteQuiz
};
