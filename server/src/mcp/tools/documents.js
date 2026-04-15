const { z } = require('zod');
const Document = require('../../models/Document');
const vectorStore = require('../../services/vectorStore.service');
const { ingestDocument, removeDocument } = require('../../services/rag.service');
const { getUserId } = require('../utils/auth');
const { success, error } = require('../utils/response');
const logger = require('../../utils/logger');

function registerDocumentTools(server) {
  server.tool(
    'list_documents',
    'List all uploaded documents for the current user',
    {},
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

        return success(result);
      } catch (err) {
        logger.error('MCP list_documents error:', err.message);
        return error(err.message);
      }
    }
  );

  server.tool(
    'get_document',
    'Get details and extracted text of a specific document',
    { documentId: z.string().describe('The document ID') },
    async ({ documentId }) => {
      try {
        const userId = getUserId();
        const doc = await Document.findOne({ _id: documentId, userId }).lean();

        if (!doc) {
          return error('Document not found');
        }

        return success({
          id: doc._id.toString(),
          name: doc.originalName,
          filename: doc.filename,
          mimeType: doc.mimeType,
          size: doc.size,
          chunkCount: doc.chunkCount,
          extractedText: doc.extractedText,
          createdAt: doc.createdAt,
        });
      } catch (err) {
        logger.error('MCP get_document error:', err.message);
        return error(err.message);
      }
    }
  );

  server.tool(
    'search_documents',
    'Semantic search across uploaded documents using vector similarity',
    {
      query: z.string().describe('The search query'),
      numResults: z.number().optional().default(4).describe('Number of results to return (default: 4)'),
    },
    async ({ query, numResults }) => {
      try {
        const userId = getUserId();
        const results = await vectorStore.search(userId, query, numResults);

        const formatted = results.map((doc) => ({
          content: doc.pageContent,
          source: doc.metadata.source,
          documentId: doc.metadata.documentId,
        }));

        return success(formatted);
      } catch (err) {
        logger.error('MCP search_documents error:', err.message);
        return error(err.message);
      }
    }
  );

  server.tool(
    'upload_text_document',
    'Upload a text document by providing its name and content directly (no file upload needed)',
    {
      name: z.string().describe('Document name (e.g., "lecture-notes.txt")'),
      content: z.string().describe('The text content of the document'),
    },
    async ({ name, content }) => {
      try {
        const userId = getUserId();

        const doc = new Document({
          userId,
          filename: name,
          originalName: name,
          mimeType: 'text/plain',
          size: Buffer.byteLength(content, 'utf8'),
          extractedText: content,
        });
        await doc.save();

        const chunkCount = await ingestDocument({
          documentId: doc._id.toString(),
          userId,
          originalName: name,
          text: content,
        });

        doc.chunkCount = chunkCount;
        await doc.save();

        return success({
          id: doc._id.toString(),
          name: doc.originalName,
          size: doc.size,
          chunkCount,
        });
      } catch (err) {
        logger.error('MCP upload_text_document error:', err.message);
        return error(err.message);
      }
    }
  );

  server.tool(
    'delete_document',
    'Delete a document and remove its chunks from the vector store',
    { documentId: z.string().describe('The document ID to delete') },
    async ({ documentId }) => {
      try {
        const userId = getUserId();
        const doc = await Document.findOneAndDelete({ _id: documentId, userId });

        if (!doc) {
          return error('Document not found');
        }

        await removeDocument(userId, documentId);

        return success({ deleted: true, id: documentId });
      } catch (err) {
        logger.error('MCP delete_document error:', err.message);
        return error(err.message);
      }
    }
  );
}

module.exports = { registerDocumentTools };
