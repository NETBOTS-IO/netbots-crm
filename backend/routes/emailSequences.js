const express = require('express');
const router = express.Router();
const EmailSequence = require('../models/EmailSequence');
const SequenceEnrollment = require('../models/SequenceEnrollment');
const Lead = require('../models/Lead');

const { auth } = require('../middleware/auth');

// GET /api/email-sequences
router.get('/', auth, async (req, res) => {
  try {
    const sequences = await EmailSequence.find({}).sort({ createdAt: -1 });
    res.json(sequences);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/email-sequences/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const sequence = await EmailSequence.findById(req.params.id);
    if (!sequence) return res.status(404).json({ error: 'Sequence workflow not found' });
    res.json(sequence);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/email-sequences
router.post('/', auth, async (req, res) => {
  try {
    const seq = new EmailSequence({
      ...req.body,
      createdBy: req.user?._id
    });
    await seq.save();
    res.status(201).json(seq);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/email-sequences/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const updated = await EmailSequence.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/email-sequences/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await EmailSequence.findByIdAndDelete(req.params.id);
    await SequenceEnrollment.deleteMany({ sequenceId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/email-sequences/:id/enroll
router.post('/:id/enroll', auth, async (req, res) => {
  try {
    const sequence = await EmailSequence.findById(req.params.id);
    if (!sequence) return res.status(404).json({ error: 'Sequence not found' });

    const { leadIds } = req.body;
    const leads = await Lead.find({ _id: { $in: leadIds }, email: { $exists: true, $ne: '' } });

    let enrolledCount = 0;
    const firstStep = sequence.steps.find(s => s.type !== 'trigger');

    for (const lead of leads) {
      try {
        const enroll = new SequenceEnrollment({
          sequenceId: sequence._id,
          leadId: lead._id,
          recipientEmail: lead.email,
          currentStepId: firstStep ? firstStep.stepId : null,
          nextActionAt: new Date(),
          status: 'active'
        });
        await enroll.save();
        enrolledCount++;
      } catch (err) {
        // Skip duplicate enrollment key errors silently
      }
    }

    sequence.stats.totalEnrolled += enrolledCount;
    sequence.stats.currentlyActive += enrolledCount;
    await sequence.save();

    res.json({ success: true, enrolledCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
