const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const TimeLog = require('../models/TimeLog');
const User = require('../models/User');

// Helper to get start of day in UTC
const getStartOfDay = () => {
    const d = new Date();
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

// @route   POST /api/time-tracking/ping
// @desc    Increment active time for the current user for today
// @access  Private
router.post('/ping', auth, async (req, res) => {
    try {
        const { incrementSeconds } = req.body;
        if (!incrementSeconds || incrementSeconds <= 0) {
            return res.status(400).json({ success: false, error: 'Invalid increment' });
        }

        const date = getStartOfDay();
        
        // Upsert the timelog for today
        const timeLog = await TimeLog.findOneAndUpdate(
            { userId: req.user._id, date },
            { $inc: { activeSeconds: incrementSeconds } },
            { new: true, upsert: true }
        );

        // Also update User's lastActivityAt and activeStatus for presence tracking
        await User.findByIdAndUpdate(req.user._id, {
            lastActivityAt: new Date(),
            activeStatus: 'online'
        });

        res.status(200).json({ success: true, activeSeconds: timeLog.activeSeconds });
    } catch (error) {
        console.error('Ping error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

// @route   GET /api/time-tracking/me
// @desc    Get today's active time for current user
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const date = getStartOfDay();
        const timeLog = await TimeLog.findOne({ userId: req.user._id, date });
        
        res.status(200).json({ 
            success: true, 
            activeSeconds: timeLog ? timeLog.activeSeconds : 0 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

// @route   GET /api/time-tracking/stats
// @desc    Get aggregated stats for all users (Admin/CEO only)
// @access  Private
router.get('/stats', auth, requireRole(['admin', 'ceo']), async (req, res) => {
    try {
        const users = await User.find().select('name email role');
        
        const now = new Date();
        // Today
        const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        
        // Start of this week (assuming Monday is start)
        const day = now.getUTCDay();
        const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        const startOfWeek = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff));

        // Start of this month
        const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

        // Start of this year
        const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

        const logs = await TimeLog.find({ date: { $gte: startOfYear } });

        const stats = users.map(user => {
            const userLogs = logs.filter(l => l.userId.toString() === user._id.toString());

            let today = 0, week = 0, month = 0, year = 0;

            userLogs.forEach(log => {
                const logTime = log.date.getTime();
                
                if (logTime >= startOfToday.getTime()) today += log.activeSeconds;
                if (logTime >= startOfWeek.getTime()) week += log.activeSeconds;
                if (logTime >= startOfMonth.getTime()) month += log.activeSeconds;
                if (logTime >= startOfYear.getTime()) year += log.activeSeconds;
            });

            return {
                user: { _id: user._id, name: user.name, role: user.role, email: user.email },
                today,
                week,
                month,
                year
            };
        });

        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

module.exports = router;
