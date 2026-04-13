const { z } = require('zod');
const Chat = require('../models/Chat');
const ragService = require('../services/rag.service');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

const askSchema = z.object({
  question: z.string().min(1).max(2000),
});

const CHAT_CACHE_TTL = 60 * 60; // 1 hour

const ask = async (req, res, next) => {
  try {
    const { question } = askSchema.parse(req.body);
    const userId = req.user.id;

    // Check cache
    const cacheKey = cache.buildKey(`chat:${userId}`, question);
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.info(`Chat cache hit for user ${userId}`);
      return res.json(cached);
    }

    // RAG query
    const { answer, sources } = await ragService.queryDocuments(question, userId);

    // Persist to MongoDB
    const chat = await Chat.create({ userId, question, answer, sources });

    const response = {
      id: chat._id,
      question,
      answer,
      sources,
      createdAt: chat.createdAt,
    };

    // Cache response
    await cache.set(cacheKey, response, CHAT_CACHE_TTL);

    res.json(response);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    next(err);
  }
};

const history = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [chats, total] = await Promise.all([
      Chat.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('question answer sources createdAt'),
      Chat.countDocuments({ userId: req.user.id }),
    ]);

    res.json({
      chats,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { ask, history };
