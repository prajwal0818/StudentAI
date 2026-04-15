const { PromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence } = require('@langchain/core/runnables');
const { getLLM } = require('../llm.service');
const vectorStore = require('../vectorStore.service');
const logger = require('../../utils/logger');
const { QUIZ_GENERATION_TEMPLATE } = require('./promptTemplates');

/**
 * Retrieve relevant context from user's documents for quiz generation.
 * Uses a generic query to get diverse content from the documents.
 *
 * @param {string} userId - User ID
 * @param {number} questionCount - Number of questions to generate
 * @returns {Promise<string>} Concatenated context from retrieved chunks
 */
const retrieveQuizContext = async (userId, questionCount) => {
  // Retrieve 2x question count for diversity, cap at 12 to avoid token limits
  const k = Math.min(questionCount * 2, 12);

  // Generic query to get broad coverage of document content
  const query = 'key concepts main topics important information definitions processes explanations';

  const chunks = await vectorStore.search(userId, query, k);

  if (chunks.length === 0) {
    throw new Error('No documents found. Please upload study materials first.');
  }

  // Join chunks with clear separators
  const context = chunks.map(doc => doc.pageContent).join('\n\n---\n\n');

  logger.info(`Retrieved ${chunks.length} chunks for quiz generation (user: ${userId})`);
  return context;
};

/**
 * Calculate distribution of question types based on total count.
 * Ensures at least one of each type when possible.
 *
 * @param {number} questionCount - Total questions
 * @param {string} difficulty - Difficulty level
 * @returns {{ mcqCount: number, shortAnswerCount: number, trueFalseCount: number }}
 */
const calculateQuestionDistribution = (questionCount, difficulty) => {
  if (questionCount < 3) {
    // For very small quizzes, just do MCQs
    return {
      mcqCount: questionCount,
      shortAnswerCount: 0,
      trueFalseCount: 0
    };
  }

  // Distribution ratios: 50% MCQ, 30% Short Answer, 20% True/False
  const mcqCount = Math.ceil(questionCount * 0.5);
  const shortAnswerCount = Math.ceil(questionCount * 0.3);
  const trueFalseCount = questionCount - mcqCount - shortAnswerCount;

  return {
    mcqCount: Math.max(1, mcqCount),
    shortAnswerCount: Math.max(1, shortAnswerCount),
    trueFalseCount: Math.max(0, trueFalseCount)
  };
};

/**
 * Parse LLM response to extract JSON array of questions.
 * Handles markdown code blocks and other formatting.
 *
 * @param {string} response - Raw LLM response
 * @returns {Array} Parsed questions array
 */
const parseQuizResponse = (response) => {
  let cleaned = response.trim();

  // Remove markdown code blocks if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  }

  // Find JSON array in the response
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to parse quiz response: No JSON array found');
  }

  try {
    const questions = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Parsed response is not a valid questions array');
    }

    return questions;
  } catch (error) {
    logger.error('Quiz parsing error:', error.message);
    logger.error('Raw response:', response.substring(0, 500));
    throw new Error('Failed to parse quiz questions from LLM response');
  }
};

/**
 * Validate generated questions meet requirements.
 *
 * @param {Array} questions - Generated questions
 * @param {number} expectedCount - Expected question count
 * @throws {Error} If validation fails
 */
const validateQuestions = (questions, expectedCount) => {
  if (questions.length !== expectedCount) {
    logger.warn(`Expected ${expectedCount} questions, got ${questions.length}`);
    // Allow some tolerance (within 1-2 questions)
    if (Math.abs(questions.length - expectedCount) > 2) {
      throw new Error(`Question count mismatch: expected ${expectedCount}, got ${questions.length}`);
    }
  }

  // Validate each question has required fields
  questions.forEach((q, idx) => {
    if (!q.type || !q.question || !q.correctAnswer || !q.explanation || !q.contextChunk) {
      throw new Error(`Question ${idx + 1} missing required fields`);
    }

    if (q.type === 'mcq' && (!q.options || q.options.length !== 4)) {
      throw new Error(`Question ${idx + 1}: MCQ must have exactly 4 options`);
    }

    if (q.type === 'true_false' && !['true', 'false'].includes(q.correctAnswer.toLowerCase())) {
      throw new Error(`Question ${idx + 1}: True/False must have 'true' or 'false' as answer`);
    }
  });
};

/**
 * Generate quiz questions using LLM and RAG context.
 *
 * @param {Object} params
 * @param {string} params.userId - User ID
 * @param {number} params.questionCount - Number of questions (5-20)
 * @param {string} params.difficulty - Difficulty level
 * @returns {Promise<Array>} Generated questions
 */
const generateQuiz = async ({ userId, questionCount, difficulty }) => {
  // Retrieve context from user's documents
  const context = await retrieveQuizContext(userId, questionCount);

  // Calculate question type distribution
  const { mcqCount, shortAnswerCount, trueFalseCount } =
    calculateQuestionDistribution(questionCount, difficulty);

  logger.info(`Generating quiz: ${questionCount} questions (${mcqCount} MCQ, ${shortAnswerCount} SA, ${trueFalseCount} T/F)`);

  // Build prompt
  const prompt = PromptTemplate.fromTemplate(QUIZ_GENERATION_TEMPLATE);

  // Create LLM chain
  const chain = RunnableSequence.from([
    prompt,
    getLLM(),
    new StringOutputParser()
  ]);

  // Invoke LLM
  const response = await chain.invoke({
    questionCount: questionCount.toString(),
    difficulty,
    mcqCount: mcqCount.toString(),
    shortAnswerCount: shortAnswerCount.toString(),
    trueFalseCount: trueFalseCount.toString(),
    context
  });

  // Parse and validate response
  const questions = parseQuizResponse(response);
  validateQuestions(questions, questionCount);

  logger.info(`Successfully generated ${questions.length} quiz questions for user ${userId}`);
  return questions;
};

module.exports = {
  generateQuiz,
  retrieveQuizContext,
  calculateQuestionDistribution,
  parseQuizResponse,
  validateQuestions
};
