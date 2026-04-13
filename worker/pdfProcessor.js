const dotenv = require('dotenv');
const path = require('path');

// Load env from server directory
dotenv.config({ path: path.join(__dirname, '..', 'server', '.env') });

const { createClient } = require('redis');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { chunkText } = require('../server/src/services/chunking.service');
const vectorStore = require('../server/src/services/vectorStore.service');
const Document = require('../server/src/models/Document');
const mongoose = require('mongoose');
const logger = require('../server/src/utils/logger');

const QUEUE_NAME = 'pdf-processing';

const processJob = async (job) => {
  const { filePath, documentId, userId } = JSON.parse(job);

  logger.info(`Processing PDF: ${filePath} (doc: ${documentId})`);

  // 1. Extract text
  const ext = path.extname(filePath).toLowerCase();
  let text = '';

  if (ext === '.pdf') {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    text = data.text;
  } else {
    text = fs.readFileSync(filePath, 'utf-8');
  }

  if (!text.trim()) {
    logger.warn(`Empty text for document ${documentId}, skipping`);
    return;
  }

  // 2. Chunk text
  const doc = await Document.findById(documentId);
  const originalName = doc ? doc.originalName : path.basename(filePath);
  const chunks = await chunkText(text, { documentId, userId, originalName });

  // 3. Embed and store in vector DB
  const count = await vectorStore.addDocuments(userId, chunks);

  // 4. Update document metadata
  if (doc) {
    doc.extractedText = text;
    doc.chunkCount = count;
    await doc.save();
  }

  logger.info(`Finished processing document ${documentId}: ${count} chunks`);
};

const startWorker = async () => {
  // Connect MongoDB
  await mongoose.connect(process.env.MONGODB_URI);
  logger.info('Worker connected to MongoDB');

  // Connect Redis
  const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });
  await client.connect();
  logger.info('PDF worker connected to Redis');

  // Block-pop from queue
  while (true) {
    const result = await client.brPop(QUEUE_NAME, 0);
    if (result) {
      try {
        await processJob(result.element);
      } catch (err) {
        logger.error('Job processing error:', err);
      }
    }
  }
};

startWorker().catch((err) => {
  logger.error('Worker failed to start:', err);
  process.exit(1);
});
