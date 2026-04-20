const jwt = require('jsonwebtoken');

// Verify JWT token
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { user_id, name, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// Only allow drivers
function requireDriver(req, res, next) {
  if (req.user.role !== 'driver') {
    return res.status(403).json({ error: 'Only drivers can perform this action.' });
  }
  next();
}

// Only allow passengers
function requirePassenger(req, res, next) {
  if (req.user.role !== 'passenger') {
    return res.status(403).json({ error: 'Only passengers can perform this action.' });
  }
  next();
}

module.exports = { authenticate, requireDriver, requirePassenger };
