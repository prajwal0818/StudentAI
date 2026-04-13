const { PromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence } = require('@langchain/core/runnables');
const { getLLM } = require('./llm.service');
const { chunkText } = require('./chunking.service');
const vectorStore = require('./vectorStore.service');
const logger = require('../utils/logger');

const QA_TEMPLATE = `You are a helpful study assistant. Use the following context from the student's uploaded documents to answer their question. If the context doesn't contain enough information, say so honestly.

Context:
{context}

Question: {question}

Answer:`;

const qaPrompt = PromptTemplate.fromTemplate(QA_TEMPLATE);

/**
 * Ingest a document: chunk text → generate embeddings → store in vector DB.
 * @param {{ documentId: string, userId: string, originalName: string, text: string }} params
 * @returns {Promise<number>} number of chunks stored
 */
const ingestDocument = async ({ documentId, userId, originalName, text }) => {
  if (!text || !text.trim()) {
    logger.warn(`Empty text for document ${documentId}, skipping ingestion`);
    return 0;
  }

  const docs = await chunkText(text, { documentId, userId, originalName });
  const count = await vectorStore.addDocuments(userId, docs);

  logger.info(`Ingested document ${documentId}: ${count} chunks`);
  return count;
};

/**
 * Query the RAG pipeline: embed question → retrieve chunks → LLM answer.
 * @param {string} query
 * @param {string} userId
 * @returns {Promise<{ answer: string, sources: string[] }>}
 */
const queryDocuments = async (query, userId) => {
  const relevantDocs = await vectorStore.search(userId, query, 4);

  if (relevantDocs.length === 0) {
    return {
      answer: 'I couldn\'t find any relevant information in your uploaded documents. Please upload study materials first.',
      sources: [],
    };
  }

  const context = relevantDocs.map((doc) => doc.pageContent).join('\n\n---\n\n');
  const sources = [...new Set(relevantDocs.map((doc) => doc.metadata.source))];

  const chain = RunnableSequence.from([
    qaPrompt,
    getLLM(),
    new StringOutputParser(),
  ]);

  const answer = await chain.invoke({ context, question: query });

  logger.info(`RAG query by user ${userId}: "${query.substring(0, 50)}..."`);
  return { answer, sources };
};

/**
 * Remove a document's chunks from the vector store.
 */
const removeDocument = async (userId, documentId) => {
  await vectorStore.removeDocument(userId, documentId);
};

module.exports = { ingestDocument, queryDocuments, removeDocument };
