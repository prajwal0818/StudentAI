const { z } = require('zod');
const { generateEmail } = require('../../services/email.service');
const { getUserId } = require('../utils/auth');
const { success, error } = require('../utils/response');
const logger = require('../../utils/logger');

function registerEmailTools(server) {
  server.tool(
    'generate_email',
    'Generate an email draft using AI, optionally based on your uploaded study materials',
    {
      prompt: z.string().describe('What the email should be about'),
      tone: z.enum(['formal', 'friendly', 'professional']).optional().default('professional').describe('Email tone (default: professional)'),
    },
    async ({ prompt, tone }) => {
      try {
        const userId = getUserId();
        const result = await generateEmail({ prompt, tone, userId });
        return success(result);
      } catch (err) {
        logger.error('MCP generate_email error:', err.message);
        return error(err.message);
      }
    }
  );
}

module.exports = { registerEmailTools };
