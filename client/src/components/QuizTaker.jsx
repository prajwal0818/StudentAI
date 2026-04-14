import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { submitQuiz } from '../services/quiz';

const QuizTaker = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const quiz = location.state?.quiz;

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [error, setError] = useState('');

  // Redirect if no quiz data
  useEffect(() => {
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      navigate('/dashboard');
    }
  }, [quiz, navigate]);

  // Auto-save to localStorage every 30 seconds
  useEffect(() => {
    if (!quiz) return;

    const interval = setInterval(() => {
      localStorage.setItem(`quiz_draft_${quiz.id}`, JSON.stringify(answers));
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [answers, quiz]);

  // Restore saved answers on mount
  useEffect(() => {
    if (!quiz) return;

    const saved = localStorage.getItem(`quiz_draft_${quiz.id}`);
    if (saved) {
      try {
        setAnswers(JSON.parse(saved));
      } catch (err) {
        console.error('Failed to restore saved answers:', err);
      }
    }
  }, [quiz]);

  if (!quiz) {
    return null; // Will redirect
  }

  const question = quiz.questions[currentQuestion];
  const totalQuestions = quiz.questions.length;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  const handleAnswerChange = (value) => {
    setAnswers({
      ...answers,
      [currentQuestion]: value
    });
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    setShowSubmitModal(false);
    setLoading(true);
    setError('');

    // Convert answers object to array
    const answersArray = [];
    for (let i = 0; i < totalQuestions; i++) {
      answersArray.push(answers[i] || '');
    }

    try {
      const response = await submitQuiz(quiz.id, answersArray);
      const results = response.data.data;

      // Clear saved draft
      localStorage.removeItem(`quiz_draft_${quiz.id}`);

      // Navigate to results page
      navigate('/quiz/results', { state: { results } });
    } catch (err) {
      console.error('Quiz submission error:', err);
      setError(err.response?.data?.message || 'Failed to submit quiz. Please try again.');
      setLoading(false);
    }
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).filter(key => answers[key] && answers[key].trim() !== '').length;
  };

  const renderQuestion = () => {
    switch (question.type) {
      case 'mcq':
        return (
          <div className="space-y-3">
            {question.options.map((option, idx) => (
              <label
                key={idx}
                className={`
                  flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all
                  ${
                    answers[currentQuestion] === option
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                  }
                `}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion}`}
                  value={option}
                  checked={answers[currentQuestion] === option}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-3 text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'true_false':
        return (
          <div className="flex space-x-4">
            {['True', 'False'].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleAnswerChange(option.toLowerCase())}
                className={`
                  flex-1 py-4 px-6 rounded-lg font-medium transition-all
                  ${
                    answers[currentQuestion] === option.toLowerCase()
                      ? 'bg-indigo-600 text-white ring-2 ring-offset-2 ring-indigo-400'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }
                `}
              >
                {option}
              </button>
            ))}
          </div>
        );

      case 'short_answer':
        return (
          <textarea
            value={answers[currentQuestion] || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Type your answer here..."
            rows={6}
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        );

      default:
        return <p className="text-red-500">Unknown question type</p>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Question {currentQuestion + 1} of {totalQuestions}
          </span>
          <span className="text-sm text-gray-600">
            {getAnsweredCount()} / {totalQuestions} answered
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Question Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {/* Question Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full uppercase">
              {question.type.replace('_', ' ')}
            </span>
            <span className="text-sm text-gray-500 capitalize">
              {question.difficulty}
            </span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">
            {question.question}
          </h2>
        </div>

        {/* Question Input */}
        {renderQuestion()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className={`
            py-2 px-6 rounded-lg font-medium transition-all
            ${
              currentQuestion === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }
          `}
        >
          Previous
        </button>

        <div className="flex space-x-3">
          {currentQuestion < totalQuestions - 1 ? (
            <button
              onClick={handleNext}
              className="py-2 px-6 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all"
            >
              Next
            </button>
          ) : (
            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={loading}
              className={`
                py-2 px-6 rounded-lg font-medium transition-all
                ${
                  loading
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }
              `}
            >
              {loading ? 'Submitting...' : 'Submit Quiz'}
            </button>
          )}
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Submit Quiz?
            </h3>
            <p className="text-gray-600 mb-6">
              You have answered {getAnsweredCount()} out of {totalQuestions} questions.
              {getAnsweredCount() < totalQuestions && (
                <span className="block mt-2 text-yellow-600 font-medium">
                  Warning: Some questions are unanswered and will be marked as incorrect.
                </span>
              )}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
              >
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizTaker;
