import { useState, useEffect, useRef, useCallback } from 'react';
import { uploadDocument, listDocuments, removeDocument } from '../services/documents';

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function DocumentUpload() {
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const loadDocs = useCallback(async () => {
    try {
      const { data } = await listDocuments();
      setDocs(data);
    } catch {
      setError('Failed to load documents');
    }
  }, []);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const handleUpload = async (file) => {
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      await uploadDocument(file);
      await loadDocs();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async (id) => {
    try {
      await removeDocument(id);
      setDocs((prev) => prev.filter((d) => d._id !== id));
    } catch {
      setError('Failed to delete document');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      {/* Upload area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <p className="text-gray-600 mb-3">
          {uploading ? 'Uploading...' : 'Drag & drop a file here, or click to browse'}
        </p>
        <p className="text-xs text-gray-400 mb-4">PDF, TXT, or MD — max 10 MB</p>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.txt,.md"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files[0])}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {uploading ? 'Processing...' : 'Choose file'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded">
          {error}
        </div>
      )}

      {/* Document list */}
      {docs.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Uploaded documents ({docs.length})
          </h3>
          <ul className="space-y-2">
            {docs.map((doc) => (
              <li
                key={doc._id}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-md px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {doc.originalName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatSize(doc.size)} &middot; {doc.chunkCount} chunks
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(doc._id)}
                  className="ml-4 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors flex-shrink-0"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {docs.length === 0 && !uploading && (
        <p className="text-center text-gray-400 text-sm">
          No documents yet. Upload study materials to get started.
        </p>
      )}
    </div>
  );
}
