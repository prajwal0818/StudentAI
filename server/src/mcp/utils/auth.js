const User = require('../../models/User');
const logger = require('../../utils/logger');

let cachedUserId = null;

/**
 * Get the MCP user ID from the MCP_USER_ID environment variable.
 * Caches after first read.
 */
function getUserId() {
  if (cachedUserId) return cachedUserId;

  const id = process.env.MCP_USER_ID;
  if (!id) {
    throw new Error('MCP_USER_ID environment variable is required');
  }

  cachedUserId = id;
  return id;
}

/**
 * Validate that the MCP_USER_ID corresponds to a real user in the database.
 * Should be called once at startup.
 */
async function validateUser() {
  const userId = getUserId();
  const user = await User.findById(userId);
  if (!user) {
    throw new Error(`MCP_USER_ID "${userId}" does not match any user in the database`);
  }
  logger.info(`MCP authenticated as user: ${user.email}`);
  return user;
}

module.exports = { getUserId, validateUser };
