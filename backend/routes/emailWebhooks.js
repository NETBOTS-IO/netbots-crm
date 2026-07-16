const express = require('express');
const router = express.Router();
const EmailLog = require('../models/EmailLog');
const EmailCampaign = require('../models/EmailCampaign');
const Unsubscribe = require('../models/Unsubscribe');

// GET /api/email-webhooks/open/:trackingId
// Renders a transparent 1x1 GIF tracking pixel and registers the open event
router.get('/open/:trackingId', async (req, res) => {
  try {
    const log = await EmailLog.findById(req.params.trackingId);
    if (log) {
      log.openCount += 1;
      log.status = 'opened';
      if (!log.firstOpenedAt) {
        log.firstOpenedAt = new Date();
      }
      log.lastOpenedAt = new Date();
      await log.save();

      // Denormalize stats on campaign
      if (log.campaignId) {
        const campaign = await EmailCampaign.findById(log.campaignId);
        if (campaign) {
          campaign.stats.opened += 1;
          if (log.openCount === 1) {
            campaign.stats.uniqueOpens += 1;
          }
          await campaign.save();
        }
      }
    }
  } catch (error) {
    console.error('Error tracking email open:', error.message);
  }

  // Return a transparent 1x1 pixel image
  const img = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );
  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Content-Length': img.length,
  });
  res.end(img);
});

// GET /api/email-webhooks/click/:trackingId/:linkIndex
// Redirects the recipient to the actual link destination and registers click
router.get('/click/:trackingId/:linkIndex', async (req, res) => {
  const { dest } = req.query;
  try {
    const log = await EmailLog.findById(req.params.trackingId);
    if (log) {
      log.clickCount += 1;
      log.status = 'clicked';
      log.clickedLinks.push({
        url: dest,
        clickedAt: new Date()
      });
      await log.save();

      // Denormalize click count in Campaign model
      if (log.campaignId) {
        const campaign = await EmailCampaign.findById(log.campaignId);
        if (campaign) {
          campaign.stats.clicked += 1;
          if (log.clickCount === 1) {
            campaign.stats.uniqueClicks += 1;
          }
          await campaign.save();
        }
      }
    }
  } catch (error) {
    console.error('Error tracking email click:', error.message);
  }

  // Redirect to original destination link
  res.redirect(dest || '/');
});

// GET /api/email-webhooks/unsubscribe/:trackingId
// Renders unsubscribe preference dashboard page
router.get('/unsubscribe/:trackingId', async (req, res) => {
  const trackingId = req.params.trackingId;
  res.send(`
    <html>
      <head>
        <title>Unsubscribe Preferences</title>
        <style>
          body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f8fafc; margin: 0; }
          .card { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
          h2 { color: #0f172a; margin-top: 0; }
          button { background: #ef4444; color: white; border: none; padding: 10px 20px; font-size: 14px; border-radius: 4px; cursor: pointer; transition: 0.2s; }
          button:hover { background: #dc2626; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Unsubscribe</h2>
          <p>We are sorry to see you go. Click below to stop receiving emails from us.</p>
          <form action="/api/email-webhooks/unsubscribe/${trackingId}" method="POST">
            <button type="submit">Unsubscribe Now</button>
          </form>
        </div>
      </body>
    </html>
  `);
});

// POST /api/email-webhooks/unsubscribe/:trackingId
// Processes unsubscribe request form post submission
router.post('/unsubscribe/:trackingId', async (req, res) => {
  try {
    const log = await EmailLog.findById(req.params.trackingId);
    if (log && log.recipientEmail) {
      // Register in global suppression registry
      const exists = await Unsubscribe.findOne({ email: log.recipientEmail.toLowerCase() });
      if (!exists) {
        const unsub = new Unsubscribe({
          email: log.recipientEmail.toLowerCase(),
          reason: 'link_click',
          sourceCampaignId: log.campaignId
        });
        await unsub.save();
      }

      // Update log
      log.status = 'unsubscribed';
      await log.save();

      // Update Campaign stats
      if (log.campaignId) {
        const campaign = await EmailCampaign.findById(log.campaignId);
        if (campaign) {
          campaign.stats.unsubscribed += 1;
          await campaign.save();
        }
      }
    }
  } catch (error) {
    console.error('Error tracking unsubscribe:', error.message);
  }

  res.send(`
    <html>
      <head>
        <title>Unsubscribed Success</title>
        <style>
          body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f8fafc; margin: 0; }
          .card { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center; }
          h2 { color: #10b981; margin-top: 0; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Successfully Unsubscribed</h2>
          <p>You have been removed from our mailing lists. You won't receive further campaign emails from us.</p>
        </div>
      </body>
    </html>
  `);
});

// GET /api/email-webhooks/suppression-list
// Fetch list of unsubscribed emails
router.get('/suppression-list', async (req, res) => {
  try {
    const list = await Unsubscribe.find({}).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/email-webhooks/suppression-list
// Manually add an email to suppression list
router.post('/suppression-list', async (req, res) => {
  try {
    const exists = await Unsubscribe.findOne({ email: req.body.email.toLowerCase() });
    if (exists) return res.status(400).json({ error: 'Email already suppressed' });

    const unsub = new Unsubscribe({
      email: req.body.email.toLowerCase(),
      reason: req.body.reason || 'manual',
      method: 'manual'
    });
    await unsub.save();
    res.status(201).json(unsub);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
