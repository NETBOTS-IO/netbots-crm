const express = require('express');
const router = express.Router();
const EmailCampaign = require('../models/EmailCampaign');
const EmailLog = require('../models/EmailLog');
const EmailAccount = require('../models/EmailAccount');

// GET /api/email-analytics/overview
router.get('/overview', async (req, res) => {
  try {
    const totalSentLogs = await EmailLog.countDocuments({ status: 'sent' });
    const totalDeliveredLogs = await EmailLog.countDocuments({ status: { $in: ['sent', 'delivered'] } });
    const totalOpenedLogs = await EmailLog.countDocuments({ status: 'opened', openCount: { $gt: 0 } });
    
    // Aggregation of unique opens across all logs
    const uniqueOpened = await EmailLog.countDocuments({ openCount: { $gt: 0 } });
    const clickLogs = await EmailLog.countDocuments({ clickCount: { $gt: 0 } });
    const bounced = await EmailLog.countDocuments({ status: 'bounced' });

    res.json({
      totalSent: totalSentLogs,
      totalDelivered: totalDeliveredLogs,
      uniqueOpens: uniqueOpened,
      totalClicks: clickLogs,
      totalBounced: bounced
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/email-analytics/smtp-utilization
router.get('/smtp-utilization', async (req, res) => {
  try {
    const accounts = await EmailAccount.find({}, 'name email sentToday dailyLimit status');
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
