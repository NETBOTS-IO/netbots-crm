const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Lead = require('../models/Lead');
const Client = require('../models/Client');
const Commission = require('../models/Commission');
const { auth } = require('../middleware/auth');

// GET /api/dashboard/ceo
router.get('/ceo', auth, async (req, res) => {
    if (req.user.role !== 'ceo' && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Access denied' });
    }
    // High level stats for CEO
    res.json({ success: true, message: 'CEO Dashboard data' }); // Implement full stats here
});

// GET /api/dashboard/intern
router.get('/intern', auth, async (req, res) => {
    // Stats for authenticated intern
    res.json({
        success: true,
        data: {
            rank: req.user.rank,
            points: req.user.points,
            leads: req.user.totalLeadsSubmitted,
            commissions: req.user.totalCommissionEarned
        }
    });
});

module.exports = router;
