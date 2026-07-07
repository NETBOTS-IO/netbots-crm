const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ success: false, error: 'User not found' });
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

const requireRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }
  next();
};

const requirePermission = (permission) => (req, res, next) => {
  // Admin bypass
  if (req.user.role === 'admin') return next();
  
  if (!req.user.permissions || !req.user.permissions[permission]) {
    return res.status(403).json({ success: false, error: `Access denied. Requires ${permission} permission.` });
  }
  next();
};

module.exports = { auth, requireRole, requirePermission };
