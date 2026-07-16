const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const Client = require('../models/Client');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// GET /api/performance
// Root cause fix: leadVerifiedBy and leadCollectedBy are STRING fields (name-based),
// while workingVerifier / workingCloser are ObjectId refs.
// Performance stats must use the same fields consistently.
// We now match by User name to correctly link collectors/verifiers to their stats.
router.get('/', auth, async (req, res) => {
  try {
    // 1. COLLECTORS PERFORMANCE
    // leadCollectedBy is a string (name), group by it
    const collectorsData = await Lead.aggregate([
      { $match: { leadCollectedBy: { $exists: true, $ne: null, $ne: '' } } },
      {
        $group: {
          _id: '$leadCollectedBy',
          totalCollected: { $sum: 1 }
        }
      },
      { $sort: { totalCollected: -1 } }
    ]);

    const collectors = [];
    for (const item of collectorsData) {
      if (!item._id || item._id === 'Unknown') continue;

      const total = item.totalCollected || 0;

      // closedCount: leads by this collector that became clients
      const closedCount = await Lead.countDocuments({
        leadCollectedBy: item._id,
        convertedToClient: true
      });

      // verifiedCount: leads by this collector that were verified (isVerifiedByVerifier flag)
      const verifiedCount = await Lead.countDocuments({
        leadCollectedBy: item._id,
        isVerifiedByVerifier: true
      });

      const verificationRatio = total > 0 ? (verifiedCount / total) * 100 : 0;
      const conversionRatio = total > 0 ? (closedCount / total) * 100 : 0;

      // Suggest Commission (Up to 2% max)
      let suggestedCommission = 1.0;
      if (verificationRatio > 75 && conversionRatio > 25) {
        suggestedCommission = 2.0;
      } else if (conversionRatio < 10) {
        suggestedCommission = 0.5;
      }

      collectors.push({
        name: item._id,
        totalCollected: total,
        verifiedCount,
        closedCount,
        verificationRatio: parseFloat(verificationRatio.toFixed(1)),
        conversionRatio: parseFloat(conversionRatio.toFixed(1)),
        suggestedCommission: parseFloat(suggestedCommission.toFixed(2))
      });
    }

    // 2. VERIFIERS PERFORMANCE
    // leadVerifiedBy is a string (name), group by it
    // Use isVerifiedByVerifier: true to only count actually verified leads
    const verifiersData = await Lead.aggregate([
      {
        $match: {
          isVerifiedByVerifier: true,
          leadVerifiedBy: { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$leadVerifiedBy',
          totalVerified: { $sum: 1 }
        }
      },
      { $sort: { totalVerified: -1 } }
    ]);

    const verifiers = [];
    for (const item of verifiersData) {
      if (!item._id || item._id === 'System') continue;

      const total = item.totalVerified || 0;

      // Leads verified by this verifier that subsequently became clients
      const closedCount = await Lead.countDocuments({
        leadVerifiedBy: item._id,
        isVerifiedByVerifier: true,
        convertedToClient: true
      });

      const closeRatio = total > 0 ? (closedCount / total) * 100 : 0;

      // Suggest Commission (Up to 5% max)
      let suggestedCommission = 2.5;
      if (closeRatio > 35) {
        suggestedCommission = 5.0;
      } else if (closeRatio < 15) {
        suggestedCommission = 1.0;
      }

      verifiers.push({
        name: item._id,
        totalVerified: total,
        closedCount,
        closeRatio: parseFloat(closeRatio.toFixed(1)),
        suggestedCommission: parseFloat(suggestedCommission.toFixed(2))
      });
    }

    // 3. CLOSERS PERFORMANCE
    // salesClosedBy is a string (name) on Lead/Client — use Client model
    const closersData = await Client.aggregate([
      { $match: { salesClosedBy: { $exists: true, $ne: null, $ne: '' } } },
      {
        $group: {
          _id: '$salesClosedBy',
          totalClosed: { $sum: 1 }
        }
      },
      { $sort: { totalClosed: -1 } }
    ]);

    const closers = [];
    for (const item of closersData) {
      if (!item._id) continue;

      const closed = item.totalClosed || 0;
      // Suggest Commission (Up to 10% max)
      let suggestedCommission = 7.0;
      if (closed >= 5) {
        suggestedCommission = 10.0;
      } else if (closed <= 1) {
        suggestedCommission = 5.0;
      }

      closers.push({
        name: item._id,
        totalClosed: closed,
        suggestedCommission: parseFloat(suggestedCommission.toFixed(2))
      });
    }

    // 4. SUMMARY STATS — single source of truth numbers for the dashboard cards
    const totalLeads = await Lead.countDocuments({
      convertedToClient: { $ne: true },
      clientId: { $exists: false }
    });
    const totalVerifiedLeads = await Lead.countDocuments({ isVerifiedByVerifier: true });
    const totalConvertedClients = await Client.countDocuments({});

    res.json({
      success: true,
      data: {
        collectors,
        verifiers,
        closers,
        summary: {
          totalLeads,
          totalVerifiedLeads,
          totalConvertedClients
        }
      }
    });

  } catch (err) {
    console.error('Performance API error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
