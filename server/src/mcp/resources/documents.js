const { ResourceTemplate } = require('@modelcontextprotocol/sdk/server/mcp.js');
const Document = require('../../models/Document');
const { getUserId } = require('../utils/auth');
const logger = require('../../utils/logger');

function registerDocumentResources(server) {
  // List all documents (static resource)
  server.resource(
    'documents-list',
    'studentai://documents',
    { description: 'List of all uploaded documents', mimeType: 'application/json' },
    async () => {
      try {
        const userId = getUserId();
        const docs = await Document.find({ userId })
          .select('originalName mimeType size chunkCount createdAt')
          .sort({ createdAt: -1 })
          .lean();

        const result = docs.map((d) => ({
          id: d._id.toString(),
          name: d.originalName,
          mimeType: d.mimeType,
          size: d.size,
          chunkCount: d.chunkCount,
          createdAt: d.createdAt,
        }));

        return {
          contents: [
            {
              uri: 'studentai://documents',
              mimeType: 'application/json',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err) {
        logger.error('MCP documents resource error:', err.message);
        throw err;
      }
    }
  );

  // Individual document content (resource template)
  server.resource(
    'document-content',
    new ResourceTemplate('studentai://documents/{documentId}', {}),
    { description: 'Extracted text content of a specific document', mimeType: 'text/plain' },
    async (uri, { documentId }) => {
      try {
        const userId = getUserId();
        const doc = await Document.findOne({ _id: documentId, userId }).lean();

        if (!doc) {
          throw new Error('Document not found');
        }

        return {
          contents: [
            {
              uri: uri.href,
              mimeType: 'text/plain',
              text: doc.extractedText || '(No extracted text available)',
            },
          ],
        };
      } catch (err) {
        logger.error('MCP document content resource error:', err.message);
        throw err;
      }
    }
  );
}

module.exports = { registerDocumentResources };
