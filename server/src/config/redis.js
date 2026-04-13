const { createClient } = require('redis');
const logger = require('../utils/logger');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis: max reconnection attempts reached');
        return new Error('Redis max retries reached');
      }
      const delay = Math.min(retries * 200, 5000);
      logger.warn(`Redis: reconnecting in ${delay}ms (attempt ${retries})`);
      return delay;
    },
  },
});

redisClient.on('error', (err) => logger.error('Redis error:', err.message));
redisClient.on('connect', () => logger.info('Redis connected'));
redisClient.on('reconnecting', () => logger.info('Redis reconnecting...'));

const connectRedis = async () => {
  await redisClient.connect();
};

// Graceful shutdown
const disconnectRedis = async () => {
  if (redisClient.isReady) {
    await redisClient.quit();
    logger.info('Redis disconnected gracefully');
  }
};

process.on('SIGTERM', disconnectRedis);
process.on('SIGINT', disconnectRedis);

module.exports = { redisClient, connectRedis, disconnectRedis };
