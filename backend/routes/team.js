const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Lead = require('../models/Lead');
const Commission = require('../models/Commission');
const { auth, requireRole } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// GET /api/team
router.get('/', auth, async (req, res) => {
  try {
    const team = await User.find({}).sort('-points');
    res.json({ success: true, data: team });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/team/leaderboard
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const topPerformers = await User.find({ role: { $ne: 'ceo' } })
      .sort('-points')
      .limit(10);
    res.json({ success: true, data: topPerformers });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/team/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/team/:id
router.put('/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { name, email, role, designation, phone, rank } = req.body;
    if (email && !email.toLowerCase().endsWith('@netbots.io')) {
        return res.status(400).json({ success: false, error: 'Only emails with the @netbots.io domain are allowed.' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { name, email, role, designation, phone, rank } },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/team/:id/reset-password
// Reset a team member's password - Admin only
router.put('/:id/reset-password', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.trim().length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { password: hashedPassword } },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, message: 'Password reset successful.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/team/:id
router.delete('/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    // Optionally remove user references, but for now just delete the user
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/team/:id/permissions
router.put('/:id/permissions', auth, requireRole(['admin', 'ceo']), async (req, res) => {
  try {
    const { permissions } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { permissions } },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    console.error('Error updating permissions:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});
// POST /api/team/:id/impersonate
// Admin can generate a temporary JWT for any user to view the system as them.
// The original admin token is saved by the frontend to allow switching back.
router.post('/:id/impersonate', auth, requireRole(['admin']), async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const targetUser = await User.findById(req.params.id).select('-password');
    if (!targetUser) return res.status(404).json({ success: false, error: 'User not found' });

    // Prevent impersonating another admin (safety measure)
    if (targetUser.role === 'admin' && targetUser._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, error: 'Cannot impersonate another admin account.' });
    }

    // Generate a short-lived impersonation token (2 hours)
    const token = jwt.sign(
        { id: targetUser._id, role: targetUser.role, impersonatedBy: req.user._id },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }
    );

    res.json({
        success: true,
        data: {
            token,
            user: targetUser,
            impersonatedBy: {
                id: req.user._id,
                name: req.user.name
            }
        }
    });
  } catch (err) {
    console.error('Impersonate error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
