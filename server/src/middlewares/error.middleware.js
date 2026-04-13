const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(err.message, { stack: err.stack });

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'File too large. Maximum size is 10 MB.' });
  }

  // Multer file type error
  if (err.message && err.message.includes('Only PDF, TXT, and MD files')) {
    return res.status(400).json({ message: err.message });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: 'Validation error', errors: err.errors });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate entry' });
  }

  res.status(500).json({ message: 'Internal server error' });
};

module.exports = errorHandler;
