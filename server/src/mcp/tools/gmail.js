const { z } = require('zod');
const gmailService = require('../../services/gmail.service');
const { getUserId } = require('../utils/auth');
const { success, error } = require('../utils/response');
const logger = require('../../utils/logger');

function registerGmailTools(server) {
  server.tool(
    'gmail_status',
    'Check whether Gmail is connected for sending emails',
    {},
    async () => {
      try {
        const userId = getUserId();
        const status = await gmailService.getStatus(userId);
        return success(status);
      } catch (err) {
        logger.error('MCP gmail_status error:', err.message);
        return error(err.message);
      }
    }
  );

  server.tool(
    'send_gmail',
    'Send an email via Gmail (requires Gmail to be connected via OAuth)',
    {
      to: z.string().describe('Recipient email address'),
      subject: z.string().describe('Email subject line'),
      body: z.string().describe('Email body text'),
      cc: z.string().optional().describe('CC email address (optional)'),
    },
    async ({ to, subject, body, cc }) => {
      try {
        const userId = getUserId();
        const result = await gmailService.sendEmail(userId, { to, cc, subject, body });
        return success(result);
      } catch (err) {
        logger.error('MCP send_gmail error:', err.message);
        return error(err.message);
      }
    }
  );
}

module.exports = { registerGmailTools };
