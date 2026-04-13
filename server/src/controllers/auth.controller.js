const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const User = require('../models/User');
const { generateSessionId, createSession, destroySession, destroyAllSessions } = require('../utils/session');
const logger = require('../utils/logger');

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const signToken = (user, sessionId) => {
  return jwt.sign(
    { id: user._id, email: user.email, jti: sessionId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const register = async (req, res, next) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    const sessionId = generateSessionId();
    const token = signToken(user, sessionId);

    await createSession(String(user._id), sessionId, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const sessionId = generateSessionId();
    const token = signToken(user, sessionId);

    await createSession(String(user._id), sessionId, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    await destroySession(req.user.id, req.user.jti);
    logger.info(`User ${req.user.id} logged out`);
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
};

const logoutAll = async (req, res, next) => {
  try {
    await destroyAllSessions(req.user.id);
    logger.info(`User ${req.user.id} logged out from all devices`);
    res.json({ message: 'Logged out from all devices' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, logout, logoutAll };
