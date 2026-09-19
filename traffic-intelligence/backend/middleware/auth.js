const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'traffic_intel_jwt_super_secret_key_2026';

// Role hierarchy: admin > analyst > operator > viewer
const ROLE_HIERARCHY = {
  admin: ['admin', 'analyst', 'operator', 'viewer'],
  analyst: ['analyst', 'operator', 'viewer'],
  operator: ['operator', 'viewer'],
  viewer: ['viewer']
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired authentication token.' });
  }
};

const requireRole = (minRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const userRole = req.user.role || 'viewer';
    const allowedRoles = ROLE_HIERARCHY[userRole] || [];

    if (allowedRoles.includes(minRole)) {
      return next();
    }

    return res.status(403).json({
      error: `Forbidden: Requires role '${minRole}'. Your role '${userRole}' does not possess sufficient privileges.`
    });
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  JWT_SECRET
};
