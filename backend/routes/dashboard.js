const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Lead = require('../models/Lead');
const Client = require('../models/Client');
const Commission = require('../models/Commission');
const TimeLog = require('../models/TimeLog');
const EmailCampaign = require('../models/EmailCampaign');
const EmailAccount = require('../models/EmailAccount');
const AuditLog = require('../models/AuditLog');
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

// GET /api/dashboard/super
router.get('/super', auth, async (req, res) => {
    try {
        // 1. Leads by Stage
        const stageAgg = await Lead.aggregate([
            { $group: { _id: "$stage", count: { $sum: 1 } } }
        ]);

        // 2. Leads by Temperature
        const tempAgg = await Lead.aggregate([
            { $group: { _id: "$temperature", count: { $sum: 1 } } }
        ]);

        // 3. Monthly acquisitions (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const monthlyAgg = await Lead.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // 4. Leads by Priority
        const priorityAgg = await Lead.aggregate([
            { $group: { _id: "$priority", count: { $sum: 1 } } }
        ]);

        // 5. Contractor performance
        const contractorAgg = await Lead.aggregate([
            {
                $group: {
                    _id: "$submittedBy",
                    submitted: { $sum: 1 },
                    verified: { $sum: { $cond: [{ $eq: ["$isVerifiedByVerifier", true] }, 1, 0] } },
                    closed: { $sum: { $cond: [{ $eq: ["$stage", "onboard"] }, 1, 0] } }
                }
            }
        ]);
        const users = await User.find({}, 'name');
        const contractorStats = contractorAgg.map(stat => {
            const userObj = users.find(u => u._id.toString() === stat._id?.toString());
            return {
                name: userObj ? userObj.name : 'Unknown',
                submitted: stat.submitted,
                verified: stat.verified,
                closed: stat.closed
            };
        });

        // 6. Time tracking hours (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const timeAgg = await TimeLog.aggregate([
            { $match: { date: { $gte: sevenDaysAgo } } },
            { $group: { _id: "$userId", totalSeconds: { $sum: "$activeSeconds" } } }
        ]);
        const timeTracking = timeAgg.map(t => {
            const userObj = users.find(u => u._id.toString() === t._id?.toString());
            return {
                name: userObj ? userObj.name : 'Unknown',
                hours: parseFloat((t.totalSeconds / 3600).toFixed(1))
            };
        });

        // 7. Email campaign metrics
        const campaignAgg = await EmailCampaign.aggregate([
            {
                $group: {
                    _id: null,
                    sent: { $sum: "$stats.sent" },
                    opened: { $sum: "$stats.opened" },
                    clicked: { $sum: "$stats.clicked" },
                    bounced: { $sum: "$stats.bounced" }
                }
            }
        ]);
        const emailFunnel = campaignAgg[0] || { sent: 0, opened: 0, clicked: 0, bounced: 0 };

        // 8. SMTP health status
        const smtpAgg = await EmailAccount.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        // 9. Commission payout
        const commissionAgg = await Commission.aggregate([
            { $group: { _id: "$status", total: { $sum: "$amount" } } }
        ]);

        // 10. Pricing packages popularity
        const packageAgg = await Client.aggregate([
            { $group: { _id: "$planType", count: { $sum: 1 } } }
        ]);

        // 11. Audit events top actions
        const auditAgg = await AuditLog.aggregate([
            { $group: { _id: "$action", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 6 }
        ]);

        res.json({
            success: true,
            data: {
                stages: stageAgg,
                temperatures: tempAgg,
                monthly: monthlyAgg,
                priorities: priorityAgg,
                contractorStats,
                timeTracking,
                emailFunnel,
                smtpStatus: smtpAgg,
                commissions: commissionAgg,
                packages: packageAgg,
                audits: auditAgg
            }
        });
    } catch (err) {
        console.error('Super dashboard load error:', err);
        res.status(500).json({ success: false, error: 'Server error loading super dashboard data' });
    }
});

module.exports = router;
