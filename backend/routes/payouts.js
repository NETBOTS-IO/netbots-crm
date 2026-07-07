const express = require('express');
const router = express.Router();
const Payout = require('../models/Payout');
const Commission = require('../models/Commission');
const { auth, requirePermission } = require('../middleware/auth');

// GET /api/payouts
router.get('/', auth, requirePermission('manage_payouts'), async (req, res) => {
  try {
    const payouts = await Payout.find().sort('-createdAt');
    res.json({ success: true, data: payouts });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/payouts
// create weekly payout batch
router.post('/', auth, requirePermission('manage_payouts'), async (req, res) => {
  const { weekLabel, weekNumber } = req.body;
  try {
    const pendingCommissions = await Commission.find({ status: 'pending' });
    if (pendingCommissions.length === 0) return res.status(400).json({ success: false, error: 'No pending commissions' });

    const totalAmount = pendingCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);
    const recipients = new Set(pendingCommissions.map(c => c.earnedBy.toString())).size;

    const payout = new Payout({
      weekLabel,
      weekNumber,
      totalAmount,
      totalRecipients: recipients,
      commissionIds: pendingCommissions.map(c => c._id),
      createdBy: req.user._id,
      status: 'processing'
    });
    await payout.save();

    // Mark commissions as processing
    await Commission.updateMany(
      { _id: { $in: payout.commissionIds } },
      { $set: { status: 'processing', payoutBatchId: payout._id } }
    );
    
    res.json({ success: true, data: payout });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/payouts/:id/status
router.put('/:id/status', auth, requirePermission('manage_payouts'), async (req, res) => {
    const { status } = req.body;
    try {
        const payout = await Payout.findById(req.params.id);
        if (!payout) return res.status(404).json({ success: false, error: 'Payout not found' });

        payout.status = status;
        if (status === 'completed') payout.completedAt = Date.now();
        await payout.save();

        if (status === 'completed' || status === 'processing') {
            await Commission.updateMany(
                { _id: { $in: payout.commissionIds } },
                { $set: { status: status } }
            );
        }

        res.json({ success: true, data: payout });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// DELETE /api/payouts/:id
router.delete('/:id', auth, requirePermission('manage_payouts'), async (req, res) => {
    try {
        const payout = await Payout.findById(req.params.id);
        if (!payout) return res.status(404).json({ success: false, error: 'Payout not found' });

        // Revert commissions back to pending
        await Commission.updateMany(
            { _id: { $in: payout.commissionIds } },
            { $set: { status: 'pending' }, $unset: { payoutBatchId: "" } }
        );

        await Payout.findByIdAndDelete(req.params.id);

        res.json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
