const crypto = require('crypto');
const { redisClient } = require('../config/redis');
const logger = require('./logger');

const SESSION_PREFIX = 'sess';
const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds (matches JWT expiry)

/**
 * Generate a unique session ID (used as JWT jti claim).
 */
const generateSessionId = () => crypto.randomUUID();

/**
 * Redis key for a session: sess:{userId}:{sessionId}
 */
const sessionKey = (userId, sessionId) =>
  `${SESSION_PREFIX}:${userId}:${sessionId}`;

/**
 * Create a new session in Redis.
 */
const createSession = async (userId, sessionId, metadata = {}) => {
  if (!redisClient.isReady) return;
  try {
    const key = sessionKey(userId, sessionId);
    const value = JSON.stringify({
      userId,
      sessionId,
      createdAt: Date.now(),
      ...metadata,
    });
    await redisClient.set(key, value, { EX: SESSION_TTL });
  } catch (err) {
    logger.warn('Session create error:', err.message);
  }
};

/**
 * Verify a session exists and hasn't been revoked.
 * Returns true if session is valid, false otherwise.
 * When Redis is down, returns true (graceful degradation — JWT still validates).
 */
const verifySession = async (userId, sessionId) => {
  if (!redisClient.isReady) return true; // degrade gracefully
  try {
    const exists = await redisClient.exists(sessionKey(userId, sessionId));
    return exists === 1;
  } catch (err) {
    logger.warn('Session verify error:', err.message);
    return true; // degrade gracefully
  }
};

/**
 * Destroy a specific session (logout).
 */
const destroySession = async (userId, sessionId) => {
  if (!redisClient.isReady) return;
  try {
    await redisClient.del(sessionKey(userId, sessionId));
  } catch (err) {
    logger.warn('Session destroy error:', err.message);
  }
};

/**
 * Destroy ALL sessions for a user (force logout everywhere).
 */
const destroyAllSessions = async (userId) => {
  if (!redisClient.isReady) return;
  try {
    const pattern = `${SESSION_PREFIX}:${userId}:*`;
    let cursor = 0;
    do {
      const result = await redisClient.scan(cursor, { MATCH: pattern, COUNT: 100 });
      cursor = result.cursor;
      if (result.keys.length) {
        await redisClient.del(result.keys);
      }
    } while (cursor !== 0);
  } catch (err) {
    logger.warn('Session destroyAll error:', err.message);
  }
};

module.exports = {
  generateSessionId,
  createSession,
  verifySession,
  destroySession,
  destroyAllSessions,
  SESSION_TTL,
};
