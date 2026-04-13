const path = require('path');
const fs = require('fs');
const { FaissStore } = require('@langchain/community/vectorstores/faiss');
const { getEmbeddings } = require('./embedding.service');
const logger = require('../utils/logger');

const VECTOR_DIR = path.join(__dirname, '..', '..', 'vectorstore');

// In-memory cache of loaded stores keyed by userId
const storeCache = new Map();

/**
 * Ensure the base vector store directory exists.
 */
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

/**
 * Path to a user's FAISS index on disk.
 */
const userDir = (userId) => path.join(VECTOR_DIR, String(userId));

/**
 * Load or create a FAISS store for a given user.
 */
const getStore = async (userId) => {
  const id = String(userId);
  if (storeCache.has(id)) {
    return storeCache.get(id);
  }

  const dir = userDir(id);
  const embeddings = getEmbeddings();
  let store;

  if (fs.existsSync(path.join(dir, 'faiss.index'))) {
    store = await FaissStore.load(dir, embeddings);
    logger.info(`Loaded FAISS index for user ${id}`);
  } else {
    // Create an empty store — FaissStore needs at least one doc to init,
    // so we return null and handle on first add.
    store = null;
  }

  storeCache.set(id, store);
  return store;
};

/**
 * Add LangChain documents to a user's vector store and persist.
 * @param {string} userId
 * @param {import('langchain/schema').Document[]} docs - chunked documents with metadata
 * @returns {Promise<number>} number of chunks added
 */
const addDocuments = async (userId, docs) => {
  if (!docs.length) return 0;

  const id = String(userId);
  const dir = userDir(id);
  ensureDir(dir);

  const embeddings = getEmbeddings();
  let store = await getStore(id);

  if (!store) {
    // First-time creation
    store = await FaissStore.fromDocuments(docs, embeddings);
  } else {
    await store.addDocuments(docs);
  }

  await store.save(dir);
  storeCache.set(id, store);

  logger.info(`Added ${docs.length} chunks to FAISS for user ${id}`);
  return docs.length;
};

/**
 * Similarity search against a user's vector store.
 * @param {string} userId
 * @param {string} query
 * @param {number} k - number of results
 * @returns {Promise<import('langchain/schema').Document[]>}
 */
const search = async (userId, query, k = 4) => {
  const store = await getStore(String(userId));
  if (!store) return [];
  return store.similaritySearch(query, k);
};

/**
 * Remove all chunks for a specific document from the user's store.
 *
 * FAISS does not support selective deletion, so we rebuild the index
 * from the remaining documents.
 */
const removeDocument = async (userId, documentId) => {
  const id = String(userId);
  const store = await getStore(id);
  if (!store) return;

  const dir = userDir(id);
  const embeddings = getEmbeddings();

  // Pull all docs out of the current store
  // FaissStore exposes the docstore which is a Map-like
  const docstore = store.docstore._docs;
  const remaining = [];
  for (const [, doc] of docstore) {
    if (doc.metadata.documentId !== String(documentId)) {
      remaining.push(doc);
    }
  }

  if (remaining.length === 0) {
    // No docs left — delete the index files
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true });
    }
    storeCache.delete(id);
    logger.info(`Cleared FAISS index for user ${id}`);
    return;
  }

  // Rebuild index from remaining docs
  const newStore = await FaissStore.fromDocuments(remaining, embeddings);
  await newStore.save(dir);
  storeCache.set(id, newStore);
  logger.info(`Rebuilt FAISS index for user ${id} after removing document ${documentId}`);
};

module.exports = { addDocuments, search, removeDocument };
