const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/audit-logs
// Get paginated audit logs (Admin only)
router.get('/', auth, requireRole(['admin']), async (req, res) => {
  try {
    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 50);
    const skip = (page - 1) * limit;

    const logs = await AuditLog.find()
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email role');

    const total = await AuditLog.countDocuments();
    
    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/audit-logs
// Create a new audit log entry (from frontend click tracking/events)
router.post('/', auth, async (req, res) => {
  try {
    const { action, target, details } = req.body;
    const log = new AuditLog({
      userId: req.user._id,
      username: req.user.name,
      role: req.user.role,
      action,
      target,
      details,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
    });
    await log.save();
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
