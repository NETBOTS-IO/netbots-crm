const express = require('express');
const router = express.Router();
const EmailList = require('../models/EmailList');

const { auth } = require('../middleware/auth');

// GET /api/email-lists
router.get('/', auth, async (req, res) => {
  try {
    const lists = await EmailList.find({}).sort({ createdAt: -1 });
    res.json(lists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/email-lists/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const list = await EmailList.findById(req.params.id);
    if (!list) return res.status(404).json({ error: 'Mailing list not found' });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/email-lists
router.post('/', auth, async (req, res) => {
  try {
    const newList = new EmailList({
      ...req.body,
      createdBy: req.user?._id
    });
    newList.stats.totalSubscribers = newList.subscribers ? newList.subscribers.length : 0;
    newList.stats.activeSubscribers = newList.subscribers ? newList.subscribers.filter(s => s.status === 'subscribed').length : 0;
    await newList.save();
    res.status(201).json(newList);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/email-lists/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const updated = await EmailList.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (updated) {
      updated.stats.totalSubscribers = updated.subscribers ? updated.subscribers.length : 0;
      updated.stats.activeSubscribers = updated.subscribers ? updated.subscribers.filter(s => s.status === 'subscribed').length : 0;
      await updated.save();
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/email-lists/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await EmailList.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
