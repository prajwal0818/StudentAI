const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { redisClient } = require('../config/redis');

const BASE_OPTS = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
};

// Start with in-memory stores (safe at module load time)
let _apiLimiter = rateLimit({
  ...BASE_OPTS,
  max: 100,
  message: { message: 'Too many requests, please try again later.' },
});

let _authLimiter = rateLimit({
  ...BASE_OPTS,
  max: 20,
  message: { message: 'Too many auth attempts, please try again later.' },
});

// Wrapper functions so Express routes reference these, and the underlying
// limiter can be swapped to a Redis-backed one at runtime.
const apiLimiter = (req, res, next) => _apiLimiter(req, res, next);
const authLimiter = (req, res, next) => _authLimiter(req, res, next);

/**
 * Call AFTER Redis is connected to upgrade from MemoryStore to RedisStore.
 * Rate limit state then persists across restarts and scales across instances.
 */
const initRedisRateLimiters = () => {
  const sendCommand = (...args) => redisClient.sendCommand(args);

  _apiLimiter = rateLimit({
    ...BASE_OPTS,
    max: 100,
    store: new RedisStore({ sendCommand, prefix: 'rl:api:' }),
    message: { message: 'Too many requests, please try again later.' },
  });

  _authLimiter = rateLimit({
    ...BASE_OPTS,
    max: 20,
    store: new RedisStore({ sendCommand, prefix: 'rl:auth:' }),
    message: { message: 'Too many auth attempts, please try again later.' },
  });
};

module.exports = { apiLimiter, authLimiter, initRedisRateLimiters };
