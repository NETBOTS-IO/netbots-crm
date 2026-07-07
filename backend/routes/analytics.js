const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const Client = require('../models/Client');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/analytics/overview
router.get('/overview', auth, requireRole(['admin', 'sales', 'lead_gen']), async (req, res) => {
  try {
    const { period = 'all' } = req.query;

    const getDateRange = (p) => {
        const now = new Date();
        let startDate = new Date();
        let endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        
        if (p === 'day') {
            startDate.setHours(0, 0, 0, 0);
        } else if (p === 'week') {
            startDate.setDate(now.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
        } else if (p === 'month') {
            startDate.setDate(now.getDate() - 30);
            startDate.setHours(0, 0, 0, 0);
        } else if (p === 'year') {
            startDate.setDate(now.getDate() - 365);
            startDate.setHours(0, 0, 0, 0);
        } else {
            startDate = new Date(0); // All time
        }
        return { $gte: startDate, $lte: endDate };
    };

    const dateRange = getDateRange(period);

    // Queries using the exact same date range
    const totalLeads = await Lead.countDocuments({ createdAt: dateRange });
    
    const Activity = require('../models/Activity');
    const totalCalls = await Activity.countDocuments({ 
        type: 'call', 
        createdAt: dateRange 
    });

    const closedLeads = await Lead.countDocuments({ 
        stage: 'onboard', 
        convertedAt: dateRange 
    });

    const rejectedLeads = await Lead.countDocuments({ 
        $or: [
            { lostReason: { $ne: null } },
            { stage: 'refer' }
        ],
        updatedAt: dateRange // Using updatedAt for status changes in period
    });

    const commitmentLeads = await Lead.countDocuments({ 
        $or: [
            { stage: 'close' },
            { temperature: 'sql' }
        ],
        updatedAt: dateRange
    });

    const totalSales = await Client.countDocuments({ startDate: dateRange });

    const revenueAggregation = await Client.aggregate([
        { $match: { startDate: dateRange } },
        {
            $group: {
                _id: null,
                totalAmount: {
                    $sum: {
                        $add: [
                            { $ifNull: ["$monthlyAmount", 0] },
                            { $ifNull: ["$lifetimeAmount", 0] },
                            { $ifNull: ["$enterpriseAmount", 0] }
                        ]
                    }
                },
                totalUpfront: { $sum: { $ifNull: ["$upfrontPaid", 0] } },
                totalRemaining: { $sum: { $ifNull: ["$remainingAmount", 0] } }
            }
        }
    ]);

    const revenueStats = revenueAggregation[0] || { totalAmount: 0, totalUpfront: 0, totalRemaining: 0 };

    res.json({
        success: true,
        data: {
            totalLeads,
            totalCalls,
            closedLeads,
            rejectedLeads,
            commitmentLeads,
            totalSales,
            salesAmount: revenueStats.totalAmount,
            totalUpfront: revenueStats.totalUpfront,
            totalRemaining: revenueStats.totalRemaining
        }
    });
  } catch (err) {
    console.error("Analytics Overview error:", err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/analytics/funnel
router.get('/funnel', auth, requireRole(['admin', 'sales', 'lead_gen']), async (req, res) => {
    try {
        const stages = ['identify', 'qualify', 'nurture', 'close', 'onboard', 'retain', 'refer'];
        const funnel = await Promise.all(stages.map(async stage => ({
            stage,
            count: await Lead.countDocuments({ stage })
        })));
        res.json({ success: true, data: funnel });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// GET /api/analytics/closer-performance (Admin only)
router.get('/closer-performance', auth, requireRole(['admin']), async (req, res) => {
    try {
        const performance = await Client.aggregate([
            {
                $group: {
                    _id: "$closedBy",
                    salesCount: { $sum: 1 },
                    totalRevenue: { 
                        $sum: { 
                            $add: [
                                { $ifNull: ["$monthlyAmount", 0] }, 
                                { $ifNull: ["$enterpriseAmount", 0] }, 
                                { $ifNull: ["$lifetimeAmount", 0] }
                            ] 
                        } 
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "closer"
                }
            },
            { $unwind: "$closer" },
            {
                $project: {
                    _id: 1,
                    salesCount: 1,
                    totalRevenue: 1,
                    closerName: "$closer.name"
                }
            }
        ]);
        res.json({ success: true, data: performance });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// GET /api/analytics/my-performance (Sales/Admin)
router.get('/my-performance', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        
        // This aggregation gets daily sales for the current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const daily = await Client.aggregate([
            { $match: { closedBy: userId, startDate: { $gte: startOfMonth } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$startDate" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Weekly (Last 8 weeks)
        const weekly = await Client.aggregate([
            { $match: { closedBy: userId } },
            {
                $group: {
                    _id: { $isoWeek: "$startDate" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } },
            { $limit: 8 }
        ]);

        // Monthly
        const monthly = await Client.aggregate([
            { $match: { closedBy: userId } },
            {
                $group: {
                    _id: { $month: "$startDate" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Yearly
        const yearly = await Client.countDocuments({ closedBy: userId });

        res.json({
            success: true,
            data: { daily, weekly, monthly, yearlyTotal: yearly }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
