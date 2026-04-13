const { z } = require('zod');
const emailService = require('../services/email.service');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

const generateSchema = z.object({
  prompt: z.string().min(1).max(2000),
  tone: z.enum(['formal', 'friendly', 'professional']).default('professional'),
});

const EMAIL_CACHE_TTL = 60 * 60; // 1 hour

const generate = async (req, res, next) => {
  try {
    const { prompt, tone } = generateSchema.parse(req.body);
    const userId = req.user.id;

    // Check cache
    const cacheKey = cache.buildKey(`email:${userId}`, `${tone}:${prompt}`);
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.info(`Email cache hit for user ${userId}`);
      return res.json(cached);
    }

    const { email, sources } = await emailService.generateEmail({
      prompt,
      tone,
      userId,
    });

    const response = { email, sources };

    // Cache response
    await cache.set(cacheKey, response, EMAIL_CACHE_TTL);

    res.json(response);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    next(err);
  }
};

module.exports = { generate };
