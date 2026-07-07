const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Lead = require('../models/Lead');
const Commission = require('../models/Commission');
const { auth, requireRole } = require('../middleware/auth');

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
    const { name, email, role, designation, phone } = req.body;
    if (email && !email.toLowerCase().endsWith('@netbots.io')) {
        return res.status(400).json({ success: false, error: 'Only emails with the @netbots.io domain are allowed.' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { name, email, role, designation, phone } },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: user });
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

module.exports = router;
