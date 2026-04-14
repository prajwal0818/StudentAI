const { PromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence } = require('@langchain/core/runnables');
const { getLLM } = require('../llm.service');
const logger = require('../../utils/logger');
const { SHORT_ANSWER_EVAL_TEMPLATE } = require('./promptTemplates');

/**
 * Normalize text for comparison: lowercase, trim, remove extra spaces.
 *
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
const normalize = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.,!?;:]/g, '');
};

/**
 * Calculate fuzzy match score using Levenshtein distance.
 * Returns a similarity score between 0 and 1.
 *
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score (0-1)
 */
const fuzzyMatchScore = (str1, str2) => {
  const s1 = normalize(str1);
  const s2 = normalize(str2);

  if (s1 === s2) return 1.0;

  // Simple containment check
  if (s1.includes(s2) || s2.includes(s1)) {
    const longer = Math.max(s1.length, s2.length);
    const shorter = Math.min(s1.length, s2.length);
    return shorter / longer;
  }

  // Levenshtein distance
  const matrix = [];
  const n = s1.length;
  const m = s2.length;

  for (let i = 0; i <= n; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= m; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const distance = matrix[n][m];
  const maxLen = Math.max(n, m);
  return maxLen === 0 ? 1.0 : 1 - distance / maxLen;
};

/**
 * Grade a Multiple Choice Question.
 *
 * @param {Object} question - Question object
 * @param {string} userAnswer - User's answer
 * @returns {{ isCorrect: boolean, pointsEarned: number, feedback: string }}
 */
const gradeMCQ = (question, userAnswer) => {
  const correctNorm = normalize(question.correctAnswer);
  const userNorm = normalize(userAnswer);

  const isCorrect = correctNorm === userNorm;

  return {
    isCorrect,
    pointsEarned: isCorrect ? 1 : 0,
    feedback: isCorrect
      ? `Correct! ${question.explanation}`
      : `Incorrect. The correct answer is: ${question.correctAnswer}. ${question.explanation}`
  };
};

/**
 * Grade a True/False Question.
 * Handles various input formats: "true", "t", "yes", "false", "f", "no".
 *
 * @param {Object} question - Question object
 * @param {string} userAnswer - User's answer
 * @returns {{ isCorrect: boolean, pointsEarned: number, feedback: string }}
 */
const gradeTrueFalse = (question, userAnswer) => {
  const userNorm = normalize(userAnswer);
  const correctNorm = normalize(question.correctAnswer);

  // Map various inputs to true/false
  const trueVariants = ['true', 't', 'yes', '1'];
  const falseVariants = ['false', 'f', 'no', '0'];

  let userValue;
  if (trueVariants.includes(userNorm)) {
    userValue = 'true';
  } else if (falseVariants.includes(userNorm)) {
    userValue = 'false';
  } else {
    userValue = userNorm;
  }

  const isCorrect = userValue === correctNorm;

  return {
    isCorrect,
    pointsEarned: isCorrect ? 1 : 0,
    feedback: isCorrect
      ? `Correct! ${question.explanation}`
      : `Incorrect. The correct answer is: ${question.correctAnswer}. ${question.explanation}`
  };
};

/**
 * Grade a Short Answer Question using multi-tier evaluation.
 * Tier 1: Exact match
 * Tier 2: Fuzzy match with acceptable answers
 * Tier 3: LLM-based semantic evaluation
 *
 * @param {Object} question - Question object
 * @param {string} userAnswer - User's answer
 * @returns {Promise<{ isCorrect: boolean, pointsEarned: number, feedback: string }>}
 */
const gradeShortAnswer = async (question, userAnswer) => {
  if (!userAnswer || !userAnswer.trim()) {
    return {
      isCorrect: false,
      pointsEarned: 0,
      feedback: 'No answer provided.'
    };
  }

  // Tier 1: Exact match with correct answer
  if (normalize(userAnswer) === normalize(question.correctAnswer)) {
    return {
      isCorrect: true,
      pointsEarned: 1,
      feedback: `Correct! ${question.explanation}`
    };
  }

  // Tier 2: Fuzzy match with acceptable answers
  const allAcceptable = [
    question.correctAnswer,
    ...(question.acceptableAnswers || [])
  ];

  for (const acceptable of allAcceptable) {
    const score = fuzzyMatchScore(userAnswer, acceptable);
    if (score >= 0.8) { // 80% similarity threshold
      return {
        isCorrect: true,
        pointsEarned: 1,
        feedback: `Correct! ${question.explanation}`
      };
    }
  }

  // Tier 3: LLM-based evaluation (only if exact and fuzzy fail)
  try {
    const evaluation = await evaluateWithLLM(question, userAnswer);
    return evaluation;
  } catch (error) {
    logger.error('LLM evaluation failed:', error.message);
    // Fallback: mark as incorrect if LLM fails
    return {
      isCorrect: false,
      pointsEarned: 0,
      feedback: `Your answer could not be automatically evaluated. Expected: ${question.correctAnswer}. ${question.explanation}`
    };
  }
};

/**
 * Use LLM to evaluate semantic equivalence of short answer.
 *
 * @param {Object} question - Question object
 * @param {string} userAnswer - User's answer
 * @returns {Promise<{ isCorrect: boolean, pointsEarned: number, feedback: string }>}
 */
const evaluateWithLLM = async (question, userAnswer) => {
  const prompt = PromptTemplate.fromTemplate(SHORT_ANSWER_EVAL_TEMPLATE);

  const chain = RunnableSequence.from([
    prompt,
    getLLM(),
    new StringOutputParser()
  ]);

  const response = await chain.invoke({
    question: question.question,
    correctAnswer: question.correctAnswer,
    userAnswer,
    contextChunk: question.contextChunk || 'N/A'
  });

  // Parse LLM response
  let evaluation;
  try {
    let cleaned = response.trim();

    // Remove markdown if present
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    // Extract JSON object
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in LLM response');
    }

    evaluation = JSON.parse(jsonMatch[0]);
  } catch (error) {
    logger.error('Failed to parse LLM evaluation:', error.message);
    throw error;
  }

  const isCorrect = evaluation.isCorrect === true;

  return {
    isCorrect,
    pointsEarned: isCorrect ? 1 : 0,
    feedback: isCorrect
      ? `Correct! ${evaluation.feedback}`
      : `Incorrect. ${evaluation.feedback} Expected: ${question.correctAnswer}.`
  };
};

/**
 * Grade an entire quiz.
 *
 * @param {Object} quiz - Quiz document
 * @param {Array<string>} userAnswers - User's answers array
 * @returns {Promise<{ results: Array, score: number, pointsEarned: number, totalPoints: number }>}
 */
const gradeQuiz = async (quiz, userAnswers) => {
  const results = [];
  let pointsEarned = 0;
  const totalPoints = quiz.questions.length;

  // Grade each question
  for (let i = 0; i < quiz.questions.length; i++) {
    const question = quiz.questions[i];
    const userAnswer = userAnswers[i] || '';

    let result;

    switch (question.type) {
      case 'mcq':
        result = gradeMCQ(question, userAnswer);
        break;

      case 'true_false':
        result = gradeTrueFalse(question, userAnswer);
        break;

      case 'short_answer':
        result = await gradeShortAnswer(question, userAnswer);
        break;

      default:
        result = {
          isCorrect: false,
          pointsEarned: 0,
          feedback: 'Unknown question type'
        };
    }

    results.push({
      questionIndex: i,
      ...result
    });

    pointsEarned += result.pointsEarned;
  }

  // Calculate percentage score
  const score = totalPoints > 0 ? Math.round((pointsEarned / totalPoints) * 100) : 0;

  logger.info(`Quiz graded: ${pointsEarned}/${totalPoints} points (${score}%)`);

  return {
    results,
    score,
    pointsEarned,
    totalPoints
  };
};

module.exports = {
  gradeQuiz,
  gradeMCQ,
  gradeTrueFalse,
  gradeShortAnswer,
  normalize,
  fuzzyMatchScore
};
