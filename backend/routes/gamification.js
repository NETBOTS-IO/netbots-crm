const express = require('express');
const router = express.Router();
const Gamification = require('../models/Gamification');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/gamification/challenges
router.get('/challenges', auth, async (req, res) => {
  try {
    const challenges = await Gamification.find({ isActive: true });
    res.json({ success: true, data: challenges });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
