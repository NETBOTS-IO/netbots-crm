const express = require('express');
const router = express.Router();
const EmailTemplate = require('../models/EmailTemplate');

const { auth } = require('../middleware/auth');

// GET /api/email-templates
router.get('/', auth, async (req, res) => {
  try {
    const templates = await EmailTemplate.find({}).sort({ createdAt: -1 });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/email-templates/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/email-templates
router.post('/', auth, async (req, res) => {
  try {
    const newTemplate = new EmailTemplate({
      ...req.body,
      createdBy: req.user?._id
    });
    await newTemplate.save();
    res.status(201).json(newTemplate);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/email-templates/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const updated = await EmailTemplate.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/email-templates/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await EmailTemplate.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
