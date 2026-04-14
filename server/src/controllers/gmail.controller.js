const { z } = require('zod');
const gmailService = require('../services/gmail.service');
const logger = require('../utils/logger');

const sendSchema = z.object({
  to: z.string().email(),
  cc: z.string().email().optional().or(z.literal('')),
  subject: z.string().min(1).max(500),
  body: z.string().min(1).max(50000),
});

const status = async (req, res, next) => {
  try {
    const result = await gmailService.getStatus(req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const connect = async (req, res, next) => {
  try {
    const url = gmailService.getAuthUrl(req.user.id);
    res.json({ url });
  } catch (err) {
    next(err);
  }
};

const callback = async (req, res) => {
  try {
    const { code, state: userId } = req.query;
    if (!code || !userId) {
      return res.redirect('/?gmailConnected=false');
    }
    await gmailService.handleCallback(code, userId);
    res.redirect('/?gmailConnected=true');
  } catch (err) {
    logger.error('Gmail OAuth callback error:', err);
    res.redirect('/?gmailConnected=false');
  }
};

const send = async (req, res, next) => {
  try {
    const data = sendSchema.parse(req.body);
    // Strip empty cc
    if (!data.cc) delete data.cc;
    const result = await gmailService.sendEmail(req.user.id, data);
    res.json({ message: 'Email sent', ...result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    next(err);
  }
};

const disconnect = async (req, res, next) => {
  try {
    await gmailService.disconnect(req.user.id);
    res.json({ message: 'Gmail disconnected' });
  } catch (err) {
    next(err);
  }
};

module.exports = { status, connect, callback, send, disconnect };
