import { useState, useEffect } from 'react';
import { generateQuiz } from '../services/quiz';
import { listDocuments } from '../services/documents';
import { useNavigate } from 'react-router-dom';

const QuizGenerator = () => {
  const navigate = useNavigate();

  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [documentIds, setDocumentIds] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingDocs, setLoadingDocs] = useState(true);

  const DIFFICULTIES = [
    { value: 'easy', label: 'Easy', color: 'bg-green-500 hover:bg-green-600' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-500 hover:bg-yellow-600' },
    { value: 'hard', label: 'Hard', color: 'bg-red-500 hover:bg-red-600' },
    { value: 'mixed', label: 'Mixed', color: 'bg-purple-500 hover:bg-purple-600' }
  ];

  // Fetch documents on mount
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const response = await listDocuments();
        setDocuments(response.data || []);
      } catch (err) {
        console.error('Failed to fetch documents:', err);
        setError('Failed to load documents. Please try again.');
      } finally {
        setLoadingDocs(false);
      }
    };

    fetchDocs();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');

    if (documents.length === 0) {
      setError('Please upload study materials before generating a quiz.');
      return;
    }

    setLoading(true);

    try {
      const response = await generateQuiz({
        questionCount,
        difficulty,
        documentIds: documentIds.length > 0 ? documentIds : []
      });

      // Navigate to quiz taker with the generated quiz
      const quizData = response.data.data;
      navigate('/quiz/take', { state: { quiz: quizData } });
    } catch (err) {
      console.error('Quiz generation error:', err);
      setError(err.response?.data?.message || 'Failed to generate quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Generate New Quiz
        </h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-6">
          {/* Difficulty Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Difficulty Level
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {DIFFICULTIES.map((diff) => (
                <button
                  key={diff.value}
                  type="button"
                  onClick={() => setDifficulty(diff.value)}
                  className={`
                    py-3 px-4 rounded-lg font-medium text-white transition-all
                    ${
                      difficulty === diff.value
                        ? `${diff.color} ring-2 ring-offset-2 ring-gray-400`
                        : 'bg-gray-300 hover:bg-gray-400'
                    }
                  `}
                >
                  {diff.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question Count Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Number of Questions: <span className="text-indigo-600 font-bold">{questionCount}</span>
            </label>
            <input
              type="range"
              min="5"
              max="20"
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5</span>
              <span>10</span>
              <span>15</span>
              <span>20</span>
            </div>
          </div>

          {/* Document Selection (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Documents (Optional - leave empty to use all)
            </label>
            {loadingDocs ? (
              <div className="text-gray-500">Loading documents...</div>
            ) : documents.length === 0 ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  No documents uploaded yet. Please upload study materials first.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {documents.map((doc) => (
                  <label
                    key={doc._id}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={documentIds.includes(doc._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setDocumentIds([...documentIds, doc._id]);
                        } else {
                          setDocumentIds(documentIds.filter(id => id !== doc._id));
                        }
                      }}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700 flex-1">
                      {doc.originalName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {doc.chunkCount || 0} chunks
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            type="submit"
            disabled={loading || documents.length === 0}
            className={`
              w-full py-3 px-6 rounded-lg font-medium text-white transition-all
              ${
                loading || documents.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
              }
            `}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
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
                Generating Quiz...
              </span>
            ) : (
              'Generate Quiz'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuizGenerator;
