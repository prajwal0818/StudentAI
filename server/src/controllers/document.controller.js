const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const Document = require('../models/Document');
const ragService = require('../services/rag.service');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

const upload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { originalname, filename, mimetype, size, path: filePath } = req.file;

    // Extract text
    let extractedText = '';
    const ext = path.extname(originalname).toLowerCase();

    if (ext === '.pdf') {
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      extractedText = data.text;
    } else {
      extractedText = fs.readFileSync(filePath, 'utf-8');
    }

    // Save document metadata to MongoDB
    const doc = await Document.create({
      userId: req.user.id,
      filename,
      originalName: originalname,
      mimeType: mimetype,
      size,
      extractedText,
    });

    // Ingest into vector store (chunk → embed → store)
    const chunkCount = await ragService.ingestDocument({
      documentId: String(doc._id),
      userId: req.user.id,
      originalName: originalname,
      text: extractedText,
    });

    doc.chunkCount = chunkCount;
    await doc.save();

    // Invalidate cached LLM responses — context has changed
    await cache.invalidatePattern(`chat:${req.user.id}:*`);
    await cache.invalidatePattern(`email:${req.user.id}:*`);

    logger.info(`Document uploaded and ingested: ${doc._id} (${chunkCount} chunks)`);

    res.status(201).json({
      id: doc._id,
      originalName: doc.originalName,
      size: doc.size,
      chunkCount,
      createdAt: doc.createdAt,
    });
  } catch (err) {
    next(err);
  }
};

const list = async (req, res, next) => {
  try {
    const docs = await Document.find({ userId: req.user.id })
      .select('originalName size mimeType chunkCount createdAt')
      .sort({ createdAt: -1 });

    res.json(docs);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const doc = await Document.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Remove from vector store
    await ragService.removeDocument(req.user.id, String(doc._id));

    // Remove file from disk
    const filePath = path.join('uploads', doc.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Invalidate cached LLM responses — context has changed
    await cache.invalidatePattern(`chat:${req.user.id}:*`);
    await cache.invalidatePattern(`email:${req.user.id}:*`);

    logger.info(`Document deleted: ${doc._id} by user ${req.user.id}`);
    res.json({ message: 'Document deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { upload, list, remove };
