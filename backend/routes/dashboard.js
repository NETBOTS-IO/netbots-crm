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

const Activity = require('../models/Activity');

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

// GET /api/dashboard/staff
router.get('/staff', auth, async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Personal Stats
        const totalLeads = await Lead.countDocuments({ submittedBy: userId });
        const warmLeads = await Lead.countDocuments({ submittedBy: userId, temperature: 'warm' });
        const sqlLeads = await Lead.countDocuments({ submittedBy: userId, temperature: 'sql' });
        const closedDeals = await Lead.countDocuments({ 
            $or: [{ submittedBy: userId }, { closerId: userId }], 
            stage: 'onboard' 
        });

        // 2. Personal Commission Ledger
        const commissions = await Commission.find({ userId })
            .populate('clientId', 'companyName')
            .sort('-createdAt')
            .limit(10);

        // 3. Recent Activity Log
        const activities = await Activity.find({ performedBy: userId })
            .sort('-createdAt')
            .limit(10);

        // 4. Team Leaderboard / Coworkers
        const team = await User.find({}, 'name role rank points designation profileImage')
            .sort('-points')
            .limit(10);

        // 5. Active Claimed Leads
        const claimedLeads = await Lead.find({
            $or: [
                { workingVerifier: userId },
                { workingCloser: userId }
            ]
        }).sort('-updatedAt').limit(20);

        res.json({
            success: true,
            data: {
                stats: {
                    totalLeads,
                    warmLeads,
                    sqlLeads,
                    closedDeals,
                    points: req.user.points,
                    rank: req.user.rank,
                    totalCommissionEarned: req.user.totalCommissionEarned || 0,
                    partnerTier: req.user.partnerTier,
                    referralCode: req.user.referralCode,
                    totalClientsReferred: req.user.totalClientsReferred || 0
                },
                commissions,
                activities,
                team,
                claimedLeads
            }
        });
    } catch (err) {
        console.error('Error fetching staff dashboard data:', err);
        res.status(500).json({ success: false, error: 'Server error loading dashboard' });
    }
});

module.exports = router;
