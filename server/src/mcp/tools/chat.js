const { z } = require('zod');
const Chat = require('../../models/Chat');
const { queryDocuments } = require('../../services/rag.service');
const cache = require('../../utils/cache');
const { getUserId } = require('../utils/auth');
const { success, error } = require('../utils/response');
const logger = require('../../utils/logger');

const CACHE_TTL = 3600; // 1 hour

function registerChatTools(server) {
  server.tool(
    'ask_question',
    'Ask a question about your uploaded study materials using RAG (Retrieval-Augmented Generation)',
    {
      question: z.string().describe('The question to ask about your documents'),
    },
    async ({ question }) => {
      try {
        const userId = getUserId();

        // Check cache
        const cacheKey = cache.buildKey(`chat:${userId}`, question);
        const cached = await cache.get(cacheKey);
        if (cached) {
          return success(cached);
        }

        // Query RAG pipeline
        const { answer, sources } = await queryDocuments(question, userId);

        // Save to chat history
        await Chat.create({ userId, question, answer, sources });

        const result = { answer, sources };

        // Cache the response
        await cache.set(cacheKey, result, CACHE_TTL);

        return success(result);
      } catch (err) {
        logger.error('MCP ask_question error:', err.message);
        return error(err.message);
      }
    }
  );

  server.tool(
    'get_chat_history',
    'Get recent chat history (questions and answers)',
    {
      page: z.number().optional().default(1).describe('Page number (1-indexed)'),
      limit: z.number().optional().default(20).describe('Items per page (default: 20)'),
    },
    async ({ page, limit }) => {
      try {
        const userId = getUserId();
        const skip = (page - 1) * limit;

        const [chats, total] = await Promise.all([
          Chat.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
          Chat.countDocuments({ userId }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return success({
          chats: chats.map((c) => ({
            id: c._id.toString(),
            question: c.question,
            answer: c.answer,
            sources: c.sources,
            createdAt: c.createdAt,
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasMore: page < totalPages,
          },
        });
      } catch (err) {
        logger.error('MCP get_chat_history error:', err.message);
        return error(err.message);
      }
    }
  );
}

module.exports = { registerChatTools };
