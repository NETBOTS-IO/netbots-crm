const express = require('express');
const router = express.Router();
const Commission = require('../models/Commission');
const Client = require('../models/Client');
const Lead = require('../models/Lead');
const { auth, requireRole } = require('../middleware/auth');
const { calculateCommissions } = require('../utils/commissionCalculator');

// GET /api/commissions
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'ceo' && req.user.role !== 'admin') {
      query.earnedBy = req.user._id;
    }
    const commissions = await Commission.find(query).populate('earnedBy clientId').sort('-createdAt');
    res.json({ success: true, data: commissions });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/commissions/calculate
router.post('/calculate/:clientId', auth, requireRole(['ceo', 'admin']), async (req, res) => {
  try {
    const client = await Client.findById(req.params.clientId);
    const lead = await Lead.findById(client.leadId);
    
    // Remove existing pending commissions for this client to avoid duplicates if re-calculating
    await Commission.deleteMany({ clientId: client._id, status: 'pending' });

    const commissionData = calculateCommissions(client, lead);
    const commissions = commissionData.map(c => ({
        ...c,
        clientId: client._id,
        leadId: lead._id,
        weekNumber: `${new Date().getFullYear()}-W${getWeekNumber(new Date())}`
    }));

    await Commission.insertMany(commissions);
    res.json({ success: true, message: 'Commissions calculated' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/commissions
router.post('/', auth, requireRole(['admin']), async (req, res) => {
  try {
    const commission = new Commission({ ...req.body, status: 'pending' });
    await commission.save();
    res.json({ success: true, data: commission });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/commissions/:id
router.put('/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    const commission = await Commission.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { returnDocument: 'after', runValidators: true }
    );
    if (!commission) return res.status(404).json({ success: false, error: 'Commission not found' });
    res.json({ success: true, data: commission });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/commissions/:id
router.delete('/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    const commission = await Commission.findByIdAndDelete(req.params.id);
    if (!commission) return res.status(404).json({ success: false, error: 'Commission not found' });
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

module.exports = router;
