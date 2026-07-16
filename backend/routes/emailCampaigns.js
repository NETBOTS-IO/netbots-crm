const express = require('express');
const router = express.Router();
const EmailCampaign = require('../models/EmailCampaign');
const EmailLog = require('../models/EmailLog');
const Lead = require('../models/Lead');
const Client = require('../models/Client');
const EmailList = require('../models/EmailList');
const { sendRotatedEmail } = require('../services/emailSender');

const { auth } = require('../middleware/auth');

// GET /api/email-campaigns
router.get('/', auth, async (req, res) => {
  try {
    const campaigns = await EmailCampaign.find({}).sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/email-campaigns/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const campaign = await EmailCampaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/email-campaigns
router.post('/', auth, async (req, res) => {
  try {
    const newCampaign = new EmailCampaign({
      ...req.body,
      createdBy: req.user?._id
    });
    await newCampaign.save();
    res.status(201).json(newCampaign);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/email-campaigns/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const updated = await EmailCampaign.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/email-campaigns/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await EmailCampaign.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/email-campaigns/:id/report
router.get('/:id/report', auth, async (req, res) => {
  try {
    const campaign = await EmailCampaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    const logs = await EmailLog.find({ campaignId: campaign._id });
    res.json({ campaign, logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/email-campaigns/:id/send
router.post('/:id/send', auth, async (req, res) => {
  try {
    const campaign = await EmailCampaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    campaign.status = 'sending';
    await campaign.save();

    // Fetch Recipients based on audienceType
    let recipients = [];
    if (campaign.audienceType === 'all_leads') {
      const filters = campaign.audienceFilters || {};
      const query = { email: { $exists: true, $ne: '' } };
      if (filters.stage) query.stage = filters.stage;
      if (filters.temperature) query.temperature = filters.temperature;
      recipients = await Lead.find(query);
    } else if (campaign.audienceType === 'segment') {
      const EmailSegment = require('../models/EmailSegment');
      const segment = await EmailSegment.findById(campaign.segmentId);
      if (segment && segment.filters) {
        const query = { email: { $exists: true, $ne: '' } };
        const f = segment.filters;
        if (f.stage && f.stage.length > 0) query.stage = { $in: f.stage };
        if (f.temperature && f.temperature.length > 0) query.temperature = { $in: f.temperature };
        if (f.priority && f.priority.length > 0) query.priority = { $in: f.priority };
        if (f.channel && f.channel.length > 0) query.channel = { $in: f.channel };
        recipients = await Lead.find(query);
      }
    } else if (campaign.audienceType === 'all_clients') {
      recipients = await Client.find({ email: { $exists: true, $ne: '' } });
    } else if (campaign.audienceType === 'list') {
      const list = await EmailList.findById(campaign.listId);
      if (list) {
        recipients = list.subscribers.filter(sub => sub.status === 'subscribed');
      }
    } else if (campaign.audienceType === 'manual') {
      recipients = campaign.manualRecipients.map(email => ({ email }));
    }

    campaign.stats.totalRecipients = recipients.length;
    await campaign.save();

    // Asynchronously trigger sending in background to avoid blocking the Express request
    setTimeout(async () => {
      let sentCount = 0;
      let failCount = 0;
      
      for (const rec of recipients) {
        if (!rec.email) continue;
        const res = await sendRotatedEmail({
          recipient: rec,
          subject: campaign.subject,
          htmlContent: campaign.htmlContent,
          campaignId: campaign._id
        });
        if (res.success) {
          sentCount++;
        } else {
          failCount++;
        }
      }

      campaign.status = 'sent';
      campaign.sentAt = new Date();
      campaign.stats.sent = sentCount;
      campaign.stats.failed = failCount;
      campaign.stats.delivered = sentCount;
      await campaign.save();
    }, 0);

    res.json({ success: true, message: 'Campaign sending started in the background.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
