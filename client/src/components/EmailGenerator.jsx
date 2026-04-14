import { useState, useEffect } from 'react';
import { generateEmail } from '../services/email';
import {
  getGmailStatus,
  getGmailConnectUrl,
  sendViaGmail,
  disconnectGmail,
} from '../services/gmail';

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'formal', label: 'Formal' },
  { value: 'friendly', label: 'Friendly' },
];

function parseSubjectFromEmail(text) {
  const match = text.match(/^Subject:\s*(.+)$/im);
  return match ? match[1].trim() : '';
}

function parseBodyFromEmail(text) {
  // Remove the Subject: line and everything before the body
  const subjectIdx = text.search(/^Subject:\s*.+$/im);
  if (subjectIdx === -1) return text;
  const afterSubject = text.slice(subjectIdx).replace(/^Subject:\s*.+$/im, '').replace(/^\s*\n/, '');
  return afterSubject.trim();
}

export default function EmailGenerator() {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('professional');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Gmail state
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailAddress, setGmailAddress] = useState('');
  const [gmailLoading, setGmailLoading] = useState(true);
  const [showSendForm, setShowSendForm] = useState(false);
  const [sendTo, setSendTo] = useState('');
  const [sendCc, setSendCc] = useState('');
  const [sendSubject, setSendSubject] = useState('');
  const [sendBody, setSendBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState('');

  // Check Gmail connection status on mount
  useEffect(() => {
    fetchGmailStatus();
    handleOAuthReturn();
  }, []);

  const fetchGmailStatus = async () => {
    try {
      const { data } = await getGmailStatus();
      setGmailConnected(data.connected);
      setGmailAddress(data.gmailAddress || '');
    } catch {
      // Not connected or error
    } finally {
      setGmailLoading(false);
    }
  };

  const handleOAuthReturn = () => {
    const params = new URLSearchParams(window.location.search);
    const gmailParam = params.get('gmailConnected');
    if (gmailParam) {
      if (gmailParam === 'true') {
        fetchGmailStatus();
      }
      // Clean URL
      const url = new URL(window.location);
      url.searchParams.delete('gmailConnected');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  };

  const handleConnectGmail = async () => {
    try {
      const { data } = await getGmailConnectUrl();
      window.location.href = data.url;
    } catch {
      setError('Failed to start Gmail connection');
    }
  };

  const handleDisconnectGmail = async () => {
    try {
      await disconnectGmail();
      setGmailConnected(false);
      setGmailAddress('');
      setShowSendForm(false);
    } catch {
      setError('Failed to disconnect Gmail');
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    setError('');
    setResult(null);
    setShowSendForm(false);
    setSendStatus('');
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

  const handleOpenSendForm = () => {
    if (!result?.email) return;
    setSendSubject(parseSubjectFromEmail(result.email));
    setSendBody(parseBodyFromEmail(result.email));
    setSendTo('');
    setSendCc('');
    setSendStatus('');
    setShowSendForm(true);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!sendTo.trim() || !sendSubject.trim() || !sendBody.trim()) return;
    setSending(true);
    setSendStatus('');
    try {
      await sendViaGmail(sendTo, sendCc, sendSubject, sendBody);
      setSendStatus('sent');
      setShowSendForm(false);
    } catch (err) {
      setSendStatus(err.response?.data?.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      {/* Gmail status bar */}
      {!gmailLoading && (
        <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
          {gmailConnected ? (
            <>
              <span className="text-sm text-gray-700">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2" />
                Connected: <span className="font-medium">{gmailAddress}</span>
              </span>
              <button
                onClick={handleDisconnectGmail}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Disconnect
              </button>
            </>
          ) : (
            <>
              <span className="text-sm text-gray-500">Gmail not connected</span>
              <button
                onClick={handleConnectGmail}
                className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 font-medium"
              >
                Connect Gmail
              </button>
            </>
          )}
        </div>
      )}

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

      {sendStatus === 'sent' && (
        <div className="bg-green-50 text-green-700 text-sm px-4 py-2 rounded">
          Email sent successfully!
        </div>
      )}

      {sendStatus && sendStatus !== 'sent' && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded">
          {sendStatus}
        </div>
      )}

      {result && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
            <span className="text-xs font-medium text-gray-500 uppercase">
              Generated email
            </span>
            <div className="flex items-center gap-3">
              {gmailConnected && (
                <button
                  onClick={handleOpenSendForm}
                  className="text-xs text-green-600 hover:text-green-700 font-medium"
                >
                  Send via Gmail
                </button>
              )}
              <button
                onClick={handleCopy}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
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

      {/* Inline send form */}
      {showSendForm && (
        <form onSubmit={handleSend} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Send via Gmail</h3>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To *</label>
            <input
              type="email"
              required
              value={sendTo}
              onChange={(e) => setSendTo(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">CC</label>
            <input
              type="email"
              value={sendCc}
              onChange={(e) => setSendCc(e.target.value)}
              placeholder="cc@example.com (optional)"
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Subject *</label>
            <input
              type="text"
              required
              value={sendSubject}
              onChange={(e) => setSendSubject(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Body *</label>
            <textarea
              required
              value={sendBody}
              onChange={(e) => setSendBody(e.target.value)}
              rows={6}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={sending}
              className="bg-green-600 text-white text-sm px-4 py-1.5 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
            <button
              type="button"
              onClick={() => setShowSendForm(false)}
              className="bg-gray-100 text-gray-700 text-sm px-4 py-1.5 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
