const express = require('express');
const router = express.Router();
const EmailSegment = require('../models/EmailSegment');
const Lead = require('../models/Lead');
const Client = require('../models/Client');

// Helper to compile filters configuration into MongoDB query object
async function compileFiltersToQuery(filters) {
  const query = { email: { $exists: true, $ne: '' } };
  
  if (!filters) return query;

  if (filters.stage && filters.stage.length > 0) {
    query.stage = { $in: filters.stage };
  }
  if (filters.temperature && filters.temperature.length > 0) {
    query.temperature = { $in: filters.temperature };
  }
  if (filters.priority && filters.priority.length > 0) {
    query.priority = { $in: filters.priority };
  }
  if (filters.channel && filters.channel.length > 0) {
    query.channel = { $in: filters.channel };
  }
  if (filters.businessType && filters.businessType.length > 0) {
    query.businessType = { $in: filters.businessType };
  }
  if (filters.listId && filters.listId.length > 0) {
    const EmailList = require('../models/EmailList');
    const lists = await EmailList.find({ _id: { $in: filters.listId } });
    const leadIds = [];
    lists.forEach(list => {
      list.subscribers.forEach(sub => {
        if (sub.leadId && sub.status === 'subscribed') {
          leadIds.push(sub.leadId);
        }
      });
    });
    query._id = { $in: leadIds };
  }

  return query;
}

const { auth } = require('../middleware/auth');

// GET /api/email-segments
router.get('/', auth, async (req, res) => {
  try {
    const segments = await EmailSegment.find({}).sort({ createdAt: -1 });
    res.json(segments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/email-segments/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const segment = await EmailSegment.findById(req.params.id);
    if (!segment) return res.status(404).json({ error: 'Segment not found' });
    res.json(segment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/email-segments
router.post('/', auth, async (req, res) => {
  try {
    const query = await compileFiltersToQuery(req.body.filters);
    const count = await Lead.countDocuments(query);

    const segment = new EmailSegment({
      ...req.body,
      recipientCount: count,
      lastCalculatedAt: new Date(),
      createdBy: req.user?._id
    });
    await segment.save();
    res.status(201).json(segment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/email-segments/preview
router.post('/preview', auth, async (req, res) => {
  try {
    const query = await compileFiltersToQuery(req.body.filters);
    const count = await Lead.countDocuments(query);
    const sample = await Lead.find(query, 'companyName contactName email stage temperature').limit(5);
    res.json({ count, sample });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/email-segments/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await EmailSegment.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
