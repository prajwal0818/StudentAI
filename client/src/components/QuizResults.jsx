import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const QuizResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const results = location.state?.results;

  const [expandedQuestions, setExpandedQuestions] = useState({});

  // Redirect if no results data
  useEffect(() => {
    if (!results) {
      navigate('/dashboard');
    }
  }, [results, navigate]);

  if (!results) {
    return null; // Will redirect
  }

  const toggleQuestion = (index) => {
    setExpandedQuestions({
      ...expandedQuestions,
      [index]: !expandedQuestions[index]
    });
  };

  const scoreColor = results.isPassed ? 'text-green-600' : 'text-red-600';
  const scoreBgColor = results.isPassed ? 'bg-green-100' : 'bg-red-100';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Score Card */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Quiz Results
          </h1>

          {/* Score Circle */}
          <div className="flex justify-center mb-6">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                  fill="none"
                />
                {/* Progress circle */}
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke={results.isPassed ? '#10b981' : '#ef4444'}
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${(results.score / 100) * 553} 553`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-5xl font-bold ${scoreColor}`}>
                  {results.score}%
                </span>
                <span className="text-gray-600 text-sm mt-1">
                  {results.pointsEarned}/{results.totalPoints} points
                </span>
              </div>
            </div>
          </div>

          {/* Pass/Fail Badge */}
          <div className="mb-6">
            <span
              className={`
                inline-block px-6 py-2 rounded-full font-bold text-lg
                ${scoreBgColor} ${scoreColor}
              `}
            >
              {results.isPassed ? '✓ Passed' : '✗ Failed'}
            </span>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {results.questions.filter(q => q.isCorrect).length}
              </p>
              <p className="text-sm text-gray-600">Correct</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {results.questions.filter(q => !q.isCorrect).length}
              </p>
              <p className="text-sm text-gray-600">Incorrect</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-700">
                {results.totalPoints}
              </p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Question Review */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Question Review
        </h2>

        <div className="space-y-3">
          {results.questions.map((question, idx) => (
            <div
              key={idx}
              className={`
                border-2 rounded-lg overflow-hidden transition-all
                ${
                  question.isCorrect
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }
              `}
            >
              {/* Question Header */}
              <button
                onClick={() => toggleQuestion(idx)}
                className="w-full p-4 flex items-center justify-between hover:opacity-75 transition-opacity"
              >
                <div className="flex items-center space-x-3 flex-1 text-left">
                  <span
                    className={`
                      flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white
                      ${question.isCorrect ? 'bg-green-500' : 'bg-red-500'}
                    `}
                  >
                    {question.isCorrect ? '✓' : '✗'}
                  </span>
                  <span className="font-medium text-gray-800">
                    Question {idx + 1}: {question.question.substring(0, 80)}
                    {question.question.length > 80 && '...'}
                  </span>
                </div>
                <svg
                  className={`
                    w-5 h-5 text-gray-500 transition-transform
                    ${expandedQuestions[idx] ? 'transform rotate-180' : ''}
                  `}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Question Details (Expanded) */}
              {expandedQuestions[idx] && (
                <div className="px-4 pb-4 space-y-4">
                  {/* Full Question */}
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Question:</p>
                    <p className="text-gray-800">{question.question}</p>
                  </div>

                  {/* MCQ Options */}
                  {question.type === 'mcq' && question.options && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Options:</p>
                      <ul className="space-y-1 text-sm">
                        {question.options.map((opt, optIdx) => (
                          <li
                            key={optIdx}
                            className={`
                              ${opt === question.correctAnswer ? 'text-green-700 font-medium' : 'text-gray-600'}
                            `}
                          >
                            {opt === question.correctAnswer && '✓ '}
                            {opt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* User Answer */}
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Your Answer:</p>
                    <p
                      className={`
                        ${question.isCorrect ? 'text-green-700' : 'text-red-700'}
                        font-medium
                      `}
                    >
                      {question.userAnswer || '(No answer provided)'}
                    </p>
                  </div>

                  {/* Correct Answer (if wrong) */}
                  {!question.isCorrect && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Correct Answer:</p>
                      <p className="text-green-700 font-medium">
                        {question.correctAnswer}
                      </p>
                    </div>
                  )}

                  {/* Explanation */}
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Explanation:</p>
                    <p className="text-gray-700 text-sm">
                      {question.explanation}
                    </p>
                  </div>

                  {/* Feedback */}
                  {question.feedback && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600 italic">
                        {question.feedback}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="py-3 px-6 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all"
        >
          Generate New Quiz
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="py-3 px-6 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-all"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default QuizResults;
