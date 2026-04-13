import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import DocumentUpload from '../components/DocumentUpload';
import ChatInterface from '../components/ChatInterface';
import EmailGenerator from '../components/EmailGenerator';

const TABS = [
  { key: 'documents', label: 'Documents' },
  { key: 'chat', label: 'Chat' },
  { key: 'email', label: 'Email' },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('chat');
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">StudentAI</h1>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full text-left px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="text-sm text-gray-700 font-medium truncate mb-2">
            {user?.name}
          </div>
          <div className="text-xs text-gray-500 truncate mb-3">{user?.email}</div>
          <button
            onClick={logout}
            className="w-full text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors text-left"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {TABS.find((t) => t.key === activeTab)?.label}
          </h2>
        </header>

        <div className="flex-1 overflow-auto">
          {activeTab === 'documents' && <DocumentUpload />}
          {activeTab === 'chat' && <ChatInterface />}
          {activeTab === 'email' && <EmailGenerator />}
        </div>
      </main>
    </div>
  );
}
