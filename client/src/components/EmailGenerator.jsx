import { useState } from 'react';
import { generateEmail } from '../services/email';

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'formal', label: 'Formal' },
  { value: 'friendly', label: 'Friendly' },
];

export default function EmailGenerator() {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('professional');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const { data } = await generateEmail(prompt, tone);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate email');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.email) return;
    try {
      await navigator.clipboard.writeText(result.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <form onSubmit={handleGenerate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What kind of email do you need?
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="e.g., Write an email to my professor requesting a deadline extension for the research paper..."
            className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tone
          </label>
          <div className="flex gap-2">
            {TONES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTone(t.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  tone === t.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="bg-indigo-600 text-white text-sm px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Generating...' : 'Generate email'}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
            <span className="text-xs font-medium text-gray-500 uppercase">
              Generated email
            </span>
            <button
              onClick={handleCopy}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="p-4 text-sm text-gray-800 whitespace-pre-wrap font-sans">
            {result.email}
          </pre>
          {result.sources?.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Context from: {result.sources.join(', ')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
