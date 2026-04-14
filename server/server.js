const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const logger = require('./src/utils/logger');
const errorHandler = require('./src/middlewares/error.middleware');
const { apiLimiter, initRedisRateLimiters } = require('./src/middlewares/rateLimiter.middleware');
const { connectRedis } = require('./src/config/redis');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// --------------- Middleware ---------------
app.use(cors());
app.use(express.json());
app.use('/api', apiLimiter);

// --------------- Routes ---------------
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/documents', require('./src/routes/document.routes'));
app.use('/api/chat', require('./src/routes/chat.routes'));
app.use('/api/email', require('./src/routes/email.routes'));
app.use('/api/gmail', require('./src/routes/gmail.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// --------------- Serve frontend static files ---------------
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  // SPA fallback — serve index.html for non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

// --------------- Error Handler (must be last) ---------------
app.use(errorHandler);

// --------------- Start ---------------
const start = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Redis is optional — server works without it (caching degrades gracefully)
    try {
      await connectRedis();
      initRedisRateLimiters();
      logger.info('Redis rate limiters upgraded to RedisStore');
    } catch (err) {
      logger.warn('Redis not available, caching disabled:', err.message);
    }

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Startup error:', err);
    process.exit(1);
  }
};

start();

module.exports = app;
