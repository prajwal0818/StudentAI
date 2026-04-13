const crypto = require('crypto');
const { redisClient } = require('../config/redis');
const logger = require('./logger');

/**
 * Build a deterministic cache key from a prefix and arbitrary data.
 * Uses SHA-256 so keys are fixed-length and collision-resistant.
 */
const buildKey = (prefix, data) => {
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  return `${prefix}:${hash}`;
};

/**
 * Get a cached value. Returns null on miss or if Redis is unavailable.
 */
const get = async (key) => {
  if (!redisClient.isReady) return null;
  try {
    const raw = await redisClient.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    logger.warn('Cache get error:', err.message);
    return null;
  }
};

/**
 * Set a cached value with TTL (seconds).
 */
const set = async (key, value, ttl) => {
  if (!redisClient.isReady) return;
  try {
    await redisClient.set(key, JSON.stringify(value), { EX: ttl });
  } catch (err) {
    logger.warn('Cache set error:', err.message);
  }
};

/**
 * Delete a single cache key.
 */
const del = async (key) => {
  if (!redisClient.isReady) return;
  try {
    await redisClient.del(key);
  } catch (err) {
    logger.warn('Cache del error:', err.message);
  }
};

/**
 * Invalidate all keys matching a glob pattern, e.g. "chat:userId:*".
 * Uses SCAN so it never blocks the server on large keyspaces.
 */
const invalidatePattern = async (pattern) => {
  if (!redisClient.isReady) return;
  try {
    let cursor = 0;
    do {
      const result = await redisClient.scan(cursor, { MATCH: pattern, COUNT: 100 });
      cursor = result.cursor;
      if (result.keys.length) {
        await redisClient.del(result.keys);
      }
    } while (cursor !== 0);
  } catch (err) {
    logger.warn('Cache invalidatePattern error:', err.message);
  }
};

module.exports = { buildKey, get, set, del, invalidatePattern };
