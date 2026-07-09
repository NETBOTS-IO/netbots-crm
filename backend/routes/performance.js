const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const Client = require('../models/Client');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// GET /api/performance
router.get('/', auth, async (req, res) => {
  try {
    // 1. COLLECTORS PERFORMANCE
    const collectorsData = await Lead.aggregate([
      {
        $group: {
          _id: "$leadCollectedBy",
          totalCollected: { $sum: 1 }
        }
      }
    ]);

    // Format Collectors
    const collectors = [];
    for (const item of collectorsData) {
      if (!item._id || item._id === 'Unknown') continue;
      
      const total = item.totalCollected || 0;
      const totalClosed = await Lead.countDocuments({ leadCollectedBy: item._id, convertedToClient: true });
      const verified = await Lead.countDocuments({ 
        leadCollectedBy: item._id, 
        leadVerifiedBy: { $exists: true, $ne: null, $ne: "" } 
      });

      const verificationRatio = total > 0 ? (verified / total) * 100 : 0;
      const conversionRatio = total > 0 ? (totalClosed / total) * 100 : 0;

      // Suggest Commission (Up to 2% max)
      let suggestedCommission = 1.0; // base 1%
      if (verificationRatio > 75 && conversionRatio > 25) {
        suggestedCommission = 2.0;
      } else if (conversionRatio < 10) {
        suggestedCommission = 0.5;
      }

      collectors.push({
        name: item._id,
        totalCollected: total,
        verifiedCount: verified,
        closedCount: totalClosed,
        verificationRatio: parseFloat(verificationRatio.toFixed(1)),
        conversionRatio: parseFloat(conversionRatio.toFixed(1)),
        suggestedCommission: parseFloat(suggestedCommission.toFixed(2))
      });
    }

    // 2. VERIFIERS PERFORMANCE
    const verifiersData = await Lead.aggregate([
      {
        $match: {
          leadVerifiedBy: { $exists: true, $ne: null, $ne: "" }
        }
      },
      {
        $group: {
          _id: "$leadVerifiedBy",
          totalVerified: { $sum: 1 }
        }
      }
    ]);

    const verifiers = [];
    for (const item of verifiersData) {
      if (!item._id || item._id === 'System') continue;

      const total = item.totalVerified || 0;
      const closed = await Lead.countDocuments({ leadVerifiedBy: item._id, convertedToClient: true });
      const closeRatio = total > 0 ? (closed / total) * 100 : 0;

      // Suggest Commission (Up to 5% max)
      let suggestedCommission = 2.5; // base 2.5%
      if (closeRatio > 35) {
        suggestedCommission = 5.0;
      } else if (closeRatio < 15) {
        suggestedCommission = 1.0;
      }

      verifiers.push({
        name: item._id,
        totalVerified: total,
        closedCount: closed,
        closeRatio: parseFloat(closeRatio.toFixed(1)),
        suggestedCommission: parseFloat(suggestedCommission.toFixed(2))
      });
    }

    // 3. CLOSERS PERFORMANCE
    const closersData = await Client.aggregate([
      {
        $group: {
          _id: "$salesClosedBy",
          totalClosed: { $sum: 1 }
        }
      }
    ]);

    const closers = [];
    for (const item of closersData) {
      if (!item._id) continue;

      const closed = item.totalClosed || 0;
      // Suggest Commission (Up to 10% max)
      let suggestedCommission = 7.0; // base 7%
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

    res.json({
      success: true,
      data: {
        collectors,
        verifiers,
        closers
      }
    });

  } catch (err) {
    console.error("Performance API error:", err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
