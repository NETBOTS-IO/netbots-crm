const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Lead = require('../models/Lead');
const Client = require('../models/Client');
const Commission = require('../models/Commission');
const TimeLog = require('../models/TimeLog');
const EmailCampaign = require('../models/EmailCampaign');
const EmailAccount = require('../models/EmailAccount');
const EmailLog = require('../models/EmailLog');
const EmailSequence = require('../models/EmailSequence');
const SequenceEnrollment = require('../models/SequenceEnrollment');
const AuditLog = require('../models/AuditLog');
const Activity = require('../models/Activity');
const Payout = require('../models/Payout');
const { auth } = require('../middleware/auth');

// GET /api/dashboard/ceo
router.get('/ceo', auth, async (req, res) => {
    if (req.user.role !== 'ceo' && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Access denied' });
    }
    res.json({ success: true, message: 'CEO Dashboard data' });
});

// GET /api/dashboard/intern
router.get('/intern', auth, async (req, res) => {
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
        const totalLeads = await Lead.countDocuments({ submittedBy: userId });
        const warmLeads = await Lead.countDocuments({ submittedBy: userId, temperature: 'warm' });
        const sqlLeads = await Lead.countDocuments({ submittedBy: userId, temperature: 'sql' });
        const closedDeals = await Lead.countDocuments({
            $or: [{ submittedBy: userId }, { closerId: userId }],
            stage: 'onboard'
        });
        const commissions = await Commission.find({ earnedBy: userId })
            .populate('clientId', 'companyName')
            .sort('-createdAt')
            .limit(10);
        const activities = await Activity.find({ performedBy: userId })
            .sort('-createdAt')
            .limit(10);
        const team = await User.find({}, 'name role rank points designation profileImage')
            .sort('-points')
            .limit(10);
        const claimedLeads = await Lead.find({
            $or: [{ workingVerifier: userId }, { workingCloser: userId }]
        }).sort('-updatedAt').limit(20);

        res.json({
            success: true,
            data: {
                stats: {
                    totalLeads, warmLeads, sqlLeads, closedDeals,
                    points: req.user.points, rank: req.user.rank,
                    totalCommissionEarned: req.user.totalCommissionEarned || 0,
                    partnerTier: req.user.partnerTier,
                    referralCode: req.user.referralCode,
                    totalClientsReferred: req.user.totalClientsReferred || 0
                },
                commissions, activities, team, claimedLeads
            }
        });
    } catch (err) {
        console.error('Error fetching staff dashboard data:', err);
        res.status(500).json({ success: false, error: 'Server error loading dashboard' });
    }
});

// GET /api/dashboard/super — comprehensive aggregation of all CRM schemas
router.get('/super', auth, async (req, res) => {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const users = await User.find({}, 'name rank points totalLeadsSubmitted totalSQLs totalCloses totalCommissionEarned activeStatus role designation');

        // ── LEADS ─────────────────────────────────────────────────────────────

        // 1. Leads by Stage
        const stageAgg = await Lead.aggregate([
            { $group: { _id: '$stage', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // 2. Leads by Temperature
        const tempAgg = await Lead.aggregate([
            { $group: { _id: '$temperature', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // 3. Monthly Lead Acquisitions (last 6 months)
        const monthlyAgg = await Lead.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                    count: { $sum: 1 },
                    verified: { $sum: { $cond: ['$isVerifiedByVerifier', 1, 0] } },
                    converted: { $sum: { $cond: ['$convertedToClient', 1, 0] } }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // 4. Leads by Priority
        const priorityAgg = await Lead.aggregate([
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]);

        // 5. Leads by Business Type (top 8)
        const businessTypeAgg = await Lead.aggregate([
            { $match: { businessType: { $ne: null } } },
            { $group: { _id: '$businessType', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 8 }
        ]);

        // 6. Leads Verification Funnel
        const totalLeads = await Lead.countDocuments();
        const verifiedLeads = await Lead.countDocuments({ isVerifiedByVerifier: true });
        const convertedLeads = await Lead.countDocuments({ convertedToClient: true });
        const demoBookedLeads = await Lead.countDocuments({ demoBooked: true });
        const rejectedLeads = await Lead.countDocuments({ stage: 'rejected' });
        const churnedLeads = await Lead.countDocuments({ isChurned: true });

        // 7. Follow-up health: overdue vs due today vs upcoming
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
        const overdueFollowups = await Lead.countDocuments({ followUpDate: { $lt: todayStart }, stage: { $nin: ['onboard', 'rejected'] } });
        const todayFollowups = await Lead.countDocuments({ followUpDate: { $gte: todayStart, $lte: todayEnd } });
        const upcomingFollowups = await Lead.countDocuments({ followUpDate: { $gt: todayEnd } });

        // 8. Lead Sources (channel breakdown)
        const channelAgg = await Lead.aggregate([
            { $match: { channel: { $ne: null, $ne: '' } } },
            { $group: { _id: '$channel', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 8 }
        ]);

        // 9. Target Services demanded by leads
        const targetServiceAgg = await Lead.aggregate([
            { $unwind: '$targetService' },
            { $group: { _id: '$targetService', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // 10. Lost reason breakdown
        const lostReasonAgg = await Lead.aggregate([
            { $match: { lostReason: { $ne: null } } },
            { $group: { _id: '$lostReason', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // ── TEAM / USERS ──────────────────────────────────────────────────────

        // 11. Contractor performance
        const contractorAgg = await Lead.aggregate([
            {
                $group: {
                    _id: '$submittedBy',
                    submitted: { $sum: 1 },
                    verified: { $sum: { $cond: ['$isVerifiedByVerifier', 1, 0] } },
                    closed: { $sum: { $cond: [{ $eq: ['$stage', 'onboard'] }, 1, 0] } },
                    rejected: { $sum: { $cond: [{ $eq: ['$stage', 'rejected'] }, 1, 0] } }
                }
            },
            { $sort: { submitted: -1 } },
            { $limit: 10 }
        ]);
        const contractorStats = contractorAgg.map(stat => {
            const u = users.find(u => u._id.toString() === stat._id?.toString());
            return { name: u ? u.name : 'Unknown', submitted: stat.submitted, verified: stat.verified, closed: stat.closed, rejected: stat.rejected };
        });

        // 12. Team points leaderboard (top 8)
        const teamLeaderboard = users
            .sort((a, b) => b.points - a.points)
            .slice(0, 8)
            .map(u => ({ name: u.name, points: u.points, rank: u.rank, closes: u.totalCloses, sqls: u.totalSQLs }));

        // 13. Team rank distribution
        const rankAgg = await User.aggregate([
            { $group: { _id: '$rank', count: { $sum: 1 } } }
        ]);

        // 14. User active status breakdown
        const activeStatusAgg = await User.aggregate([
            { $group: { _id: '$activeStatus', count: { $sum: 1 } } }
        ]);

        // 15. Time tracking hours (last 7 days)
        const timeAgg = await TimeLog.aggregate([
            { $match: { date: { $gte: sevenDaysAgo } } },
            { $group: { _id: '$userId', totalSeconds: { $sum: '$activeSeconds' } } },
            { $sort: { totalSeconds: -1 } },
            { $limit: 10 }
        ]);
        const timeTracking = timeAgg.map(t => {
            const u = users.find(u => u._id.toString() === t._id?.toString());
            return { name: u ? u.name : 'Unknown', hours: parseFloat((t.totalSeconds / 3600).toFixed(1)) };
        }).filter(t => t.hours > 0);

        // ── CLIENTS ───────────────────────────────────────────────────────────

        // 16. Clients by Deal Type
        const dealTypeAgg = await Client.aggregate([
            { $group: { _id: '$dealType', count: { $sum: 1 }, totalRevenue: { $sum: { $ifNull: ['$monthlyAmount', { $ifNull: ['$lifetimeAmount', 0] }] } } } },
            { $sort: { count: -1 } }
        ]);

        // 17. Clients by Plan Type
        const planTypeAgg = await Client.aggregate([
            { $match: { planType: { $ne: null } } },
            { $group: { _id: '$planType', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // 18. Churn risk distribution
        const activeClients = await Client.countDocuments({ isActive: true });
        const churnRiskClients = await Client.countDocuments({ isChurnRisk: true });
        const churnedClients = await Client.countDocuments({ isActive: false });

        // 19. Clients by Target Service
        const clientServiceAgg = await Client.aggregate([
            { $match: { targetService: { $ne: null } } },
            { $group: { _id: '$targetService', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // 20. Monthly client onboarding trend (last 6 months)
        const monthlyClientsAgg = await Client.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // ── COMMISSIONS & PAYOUTS ─────────────────────────────────────────────

        // 21. Commission by status (total amount)
        const commissionAgg = await Commission.aggregate([
            { $group: { _id: '$status', total: { $sum: '$commissionAmount' }, count: { $sum: 1 } } }
        ]);

        // 22. Commission by role type
        const commissionRoleAgg = await Commission.aggregate([
            { $group: { _id: '$commissionRole', total: { $sum: '$commissionAmount' }, count: { $sum: 1 } } },
            { $sort: { total: -1 } }
        ]);

        // 23. Payout batch status
        const payoutAgg = await Payout.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' } } }
        ]);

        // 24. Monthly commissions earned trend (last 6 months)
        const monthlyCommissionAgg = await Commission.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                    total: { $sum: '$commissionAmount' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // ── EMAIL MARKETING ───────────────────────────────────────────────────

        // 25. Campaign aggregate funnel
        const campaignAgg = await EmailCampaign.aggregate([
            {
                $group: {
                    _id: null,
                    sent: { $sum: '$stats.sent' },
                    delivered: { $sum: '$stats.delivered' },
                    opened: { $sum: '$stats.opened' },
                    uniqueOpens: { $sum: '$stats.uniqueOpens' },
                    clicked: { $sum: '$stats.clicked' },
                    uniqueClicks: { $sum: '$stats.uniqueClicks' },
                    bounced: { $sum: '$stats.bounced' },
                    unsubscribed: { $sum: '$stats.unsubscribed' },
                    complained: { $sum: '$stats.complained' }
                }
            }
        ]);
        const emailFunnel = campaignAgg[0] || {};

        // 26. Campaign status distribution
        const campaignStatusAgg = await EmailCampaign.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // 27. SMTP Account status distribution
        const smtpAgg = await EmailAccount.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 }, totalDailyLimit: { $sum: '$dailyLimit' }, totalSentToday: { $sum: '$sentToday' } } }
        ]);

        // 28. Email Log status breakdown (last 30 days)
        const emailLogAgg = await EmailLog.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // 29. Sequence enrollment status
        const sequenceEnrollAgg = await SequenceEnrollment.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // 30. Sequence status breakdown
        const sequenceStatusAgg = await EmailSequence.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // ── ACTIVITY & AUDIT ──────────────────────────────────────────────────

        // 31. Activity types breakdown (last 30 days)
        const activityAgg = await Activity.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: '$type', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // 32. Daily activity volume (last 14 days)
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        const dailyActivityAgg = await Activity.aggregate([
            { $match: { createdAt: { $gte: fourteenDaysAgo } } },
            {
                $group: {
                    _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        // 33. Audit top actions (last 30 days)
        const auditAgg = await AuditLog.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: '$action', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 8 }
        ]);

        // 34. Audit by role (last 30 days)
        const auditRoleAgg = await AuditLog.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: '$role', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.json({
            success: true,
            data: {
                // Lead intelligence
                stages: stageAgg,
                temperatures: tempAgg,
                monthly: monthlyAgg,
                priorities: priorityAgg,
                businessTypes: businessTypeAgg,
                leadFunnel: { totalLeads, verifiedLeads, demoBookedLeads, convertedLeads, rejectedLeads, churnedLeads },
                followupHealth: { overdueFollowups, todayFollowups, upcomingFollowups },
                channels: channelAgg,
                targetServices: targetServiceAgg,
                lostReasons: lostReasonAgg,
                // Team intelligence
                contractorStats,
                teamLeaderboard,
                rankDistribution: rankAgg,
                activeStatus: activeStatusAgg,
                timeTracking,
                // Client intelligence
                dealTypes: dealTypeAgg,
                planTypes: planTypeAgg,
                clientHealth: { activeClients, churnRiskClients, churnedClients },
                clientServices: clientServiceAgg,
                monthlyClients: monthlyClientsAgg,
                // Financial intelligence
                commissions: commissionAgg,
                commissionRoles: commissionRoleAgg,
                payouts: payoutAgg,
                monthlyCommissions: monthlyCommissionAgg,
                // Email intelligence
                emailFunnel,
                campaignStatus: campaignStatusAgg,
                smtpStatus: smtpAgg,
                emailLogStatus: emailLogAgg,
                sequenceEnrollments: sequenceEnrollAgg,
                sequenceStatus: sequenceStatusAgg,
                // Activity intelligence
                activityTypes: activityAgg,
                dailyActivity: dailyActivityAgg,
                audits: auditAgg,
                auditByRole: auditRoleAgg
            }
        });
    } catch (err) {
        console.error('Super dashboard load error:', err);
        res.status(500).json({ success: false, error: 'Server error loading super dashboard data' });
    }
});

module.exports = router;
