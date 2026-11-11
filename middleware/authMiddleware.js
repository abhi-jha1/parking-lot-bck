const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  if (!process.env.JWT_SECRET) {
    console.error('Authentication failed: JWT_SECRET is not configured');
    return res.status(500).json({ error: 'Authentication is not configured' });
  }

  const header = req.headers.authorization;
  const bearerToken = header?.startsWith('Bearer ') ? header.slice(7) : null;
  const token = req.cookies?.token || bearerToken;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next(); // Continue to the route handler
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;