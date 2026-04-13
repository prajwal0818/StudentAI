const jwt = require('jsonwebtoken');
const { verifySession } = require('../utils/session');

const auth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check session hasn't been revoked in Redis
    const sessionValid = await verifySession(decoded.id, decoded.jti);
    if (!sessionValid) {
      return res.status(401).json({ message: 'Session expired or revoked' });
    }

    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = auth;
