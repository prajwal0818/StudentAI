import { useState } from 'react';
import QuizGenerator from './QuizGenerator';
import QuizHistory from './QuizHistory';

const QuizDashboard = () => {
  const [activeTab, setActiveTab] = useState('generate');

  const TABS = [
    { key: 'generate', label: 'Generate New Quiz' },
    { key: 'history', label: 'Quiz History' }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-8">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === tab.key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'generate' && <QuizGenerator />}
        {activeTab === 'history' && <QuizHistory />}
      </div>
    </div>
  );
};

export default QuizDashboard;
