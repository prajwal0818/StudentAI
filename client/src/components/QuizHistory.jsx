import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuizHistory, getQuiz, deleteQuiz } from '../services/quiz';

const QuizHistory = () => {
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const LIMIT = 10;

  // Fetch quiz history
  const fetchHistory = async (pageNum = 1, difficulty = null) => {
    setLoading(true);
    setError('');

    try {
      const response = await getQuizHistory({
        page: pageNum,
        limit: LIMIT,
        difficulty
      });

      const data = response.data.data;
      setQuizzes(data.quizzes);
      setPage(data.pagination.page);
      setTotalPages(data.pagination.totalPages);
      setHasMore(data.pagination.hasMore);
    } catch (err) {
      console.error('Failed to fetch quiz history:', err);
      setError('Failed to load quiz history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(1, difficultyFilter);
  }, [difficultyFilter]);

  const handleViewResults = async (quizId) => {
    try {
      const response = await getQuiz(quizId);
      const quizData = response.data.data;

      if (quizData.isSubmitted) {
        navigate('/quiz/results', { state: { results: quizData } });
      } else {
        navigate('/quiz/take', { state: { quiz: quizData } });
      }
    } catch (err) {
      console.error('Failed to load quiz:', err);
      setError('Failed to load quiz. Please try again.');
    }
  };

  const handleDelete = async (quizId) => {
    try {
      await deleteQuiz(quizId);
      setDeleteConfirm(null);
      // Refresh the list
      fetchHistory(page, difficultyFilter);
    } catch (err) {
      console.error('Failed to delete quiz:', err);
      setError('Failed to delete quiz. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      hard: 'bg-red-100 text-red-700',
      mixed: 'bg-purple-100 text-purple-700'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header with Filters */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Quiz History</h2>

        {/* Difficulty Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Filter:</span>
          <select
            value={difficultyFilter || ''}
            onChange={(e) => setDifficultyFilter(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <svg className="animate-spin h-10 w-10 mx-auto text-indigo-600" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-gray-600 mt-3">Loading quiz history...</p>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">No quizzes found.</p>
          <p className="text-gray-500 text-sm mt-2">
            Generate your first quiz to get started!
          </p>
        </div>
      ) : (
        <>
          {/* Quiz Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <span
                    className={`
                      px-3 py-1 rounded-full text-xs font-semibold uppercase
                      ${getDifficultyColor(quiz.difficulty)}
                    `}
                  >
                    {quiz.difficulty}
                  </span>
                  {quiz.isSubmitted && (
                    <span
                      className={`
                        px-3 py-1 rounded-full text-xs font-semibold
                        ${
                          quiz.isPassed
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }
                      `}
                    >
                      {quiz.isPassed ? '✓ Passed' : '✗ Failed'}
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 text-sm">Questions:</span>
                    <span className="font-semibold text-gray-800">{quiz.questionCount}</span>
                  </div>
                  {quiz.isSubmitted && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">Score:</span>
                      <span className="font-bold text-lg text-indigo-600">
                        {quiz.score}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Date */}
                <p className="text-xs text-gray-500 mb-4">
                  {quiz.isSubmitted ? 'Submitted' : 'Created'}: {formatDate(quiz.submittedAt || quiz.createdAt)}
                </p>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewResults(quiz.id)}
                    className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all"
                  >
                    {quiz.isSubmitted ? 'View Results' : 'Continue Quiz'}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(quiz.id)}
                    className="py-2 px-4 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-3">
              <button
                onClick={() => fetchHistory(page - 1, difficultyFilter)}
                disabled={page === 1}
                className={`
                  py-2 px-4 rounded-lg font-medium transition-all
                  ${
                    page === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }
                `}
              >
                Previous
              </button>

              <span className="text-gray-600">
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => fetchHistory(page + 1, difficultyFilter)}
                disabled={!hasMore}
                className={`
                  py-2 px-4 rounded-lg font-medium transition-all
                  ${
                    !hasMore
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }
                `}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Delete Quiz?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this quiz? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizHistory;
