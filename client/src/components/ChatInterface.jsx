import { useState, useEffect, useRef, useCallback } from 'react';
import { askQuestion, getChatHistory, deleteChat } from '../services/chat';

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef();

  const loadHistory = useCallback(async () => {
    try {
      const { data } = await getChatHistory(1, 50);
      const history = data.chats
        .reverse()
        .flatMap((c) => [
          { role: 'user', text: c.question, chatId: c._id },
          { role: 'ai', text: c.answer, sources: c.sources, chatId: c._id },
        ]);
      setMessages(history);
    } catch {
      // ignore — start with empty chat
    } finally {
      setHistoryLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setLoading(true);

    try {
      const { data } = await askQuestion(question);
      setMessages((prev) => {
        // Attach the chat ID to the user message we just added
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], chatId: data.id };
        return [
          ...updated,
          { role: 'ai', text: data.answer, sources: data.sources, chatId: data.id },
        ];
      });
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: err.response?.data?.message || 'Something went wrong. Please try again.',
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (chatId) => {
    if (!chatId || !window.confirm('Delete this Q&A pair?')) return;
    try {
      await deleteChat(chatId);
      setMessages((prev) => prev.filter((m) => m.chatId !== chatId));
    } catch {
      // ignore — message stays if delete fails
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {!historyLoaded && (
          <p className="text-center text-gray-400 text-sm py-8">Loading...</p>
        )}

        {historyLoaded && messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-16">
            <p className="text-lg mb-2">Ask a question about your documents</p>
            <p>Upload study materials in the Documents tab first.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`group flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`relative max-w-[75%] rounded-lg px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : msg.isError
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-white text-gray-800 border border-gray-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              {msg.sources?.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-400">
                    Sources: {msg.sources.join(', ')}
                  </p>
                </div>
              )}
              {msg.role === 'user' && msg.chatId && (
                <button
                  onClick={() => handleDelete(msg.chatId)}
                  className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                  title="Delete this Q&A"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
              <div className="flex space-x-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="border-t border-gray-200 bg-white p-4 flex gap-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your study materials..."
          className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
