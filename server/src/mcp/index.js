const path = require('path');

// Load environment variables from server/.env
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const winston = require('winston');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

const logger = require('../utils/logger');
const connectDB = require('../config/db');
const { connectRedis } = require('../config/redis');

const { validateUser } = require('./utils/auth');
const { registerDocumentTools } = require('./tools/documents');
const { registerChatTools } = require('./tools/chat');
const { registerQuizTools } = require('./tools/quiz');
const { registerEmailTools } = require('./tools/email');
const { registerGmailTools } = require('./tools/gmail');
const { registerDocumentResources } = require('./resources/documents');

/**
 * Redirect all Winston console transports to stderr.
 * Critical: STDIO transport uses stdout for JSON-RPC messages.
 * Any logging to stdout would corrupt the protocol.
 */
function redirectLoggerToStderr() {
  logger.transports.forEach((t) => {
    if (t.name === 'console') {
      t.stderrLevels = Object.keys(winston.config.npm.levels);
    }
  });
}

async function main() {
  // Redirect logging FIRST, before any log output
  redirectLoggerToStderr();

  logger.info('Starting StudentAI MCP server...');

  // Connect to MongoDB
  await connectDB();

  // Connect to Redis (optional, graceful fallback)
  try {
    await connectRedis();
  } catch (err) {
    logger.warn('Redis connection failed, continuing without cache:', err.message);
  }

  // Validate that MCP_USER_ID points to a real user
  await validateUser();

  // Create MCP server
  const server = new McpServer(
    { name: 'studentai', version: '1.0.0' },
    { capabilities: { resources: {}, tools: {} } }
  );

  // Register all tools
  registerDocumentTools(server);
  registerChatTools(server);
  registerQuizTools(server);
  registerEmailTools(server);
  registerGmailTools(server);

  // Register resources
  registerDocumentResources(server);

  // Start STDIO transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('StudentAI MCP server running on STDIO');
}

main().catch((err) => {
  // Must write to stderr since stdout is reserved for JSON-RPC
  process.stderr.write(`Fatal MCP server error: ${err.message}\n`);
  process.exit(1);
});
