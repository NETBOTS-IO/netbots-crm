const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Client = require('../models/Client');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/partners
router.get('/', auth, requireRole(['ceo', 'admin']), async (req, res) => {
  try {
    const partners = await User.find({ role: 'ca_partner' }).sort('-totalClientsReferred');
    res.json({ success: true, data: partners });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/partners/:id/clients
router.get('/:id/clients', auth, async (req, res) => {
    try {
        const clients = await Client.find({ caPartner: req.params.id }).sort('-createdAt');
        res.json({ success: true, data: clients });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
