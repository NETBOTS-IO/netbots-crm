const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const Commission = require('../models/Commission');
const { auth, requireRole, requirePermission } = require('../middleware/auth');

// GET /api/clients - Admin or users with manage_clients permission
router.get('/', auth, requirePermission('manage_clients'), async (req, res) => {
  try {
    const clients = await Client.find({})
      .populate('closedBy submittedBy caPartner engagedTeam.user')
      .sort('-createdAt');
    res.json({ success: true, data: clients });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/clients/:id - Admin or users with manage_clients permission
router.get('/:id', auth, requirePermission('manage_clients'), async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate('closedBy submittedBy caPartner engagedTeam.user');
    if (!client) return res.status(404).json({ success: false, error: 'Client not found' });
    res.json({ success: true, data: client });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/clients - Create manually (Admin or manage_clients)
router.post('/', auth, requirePermission('manage_clients'), async (req, res) => {
  try {
    const client = new Client({
      ...req.body,
      submittedBy: req.user._id
    });
    await client.save();
    
    // Create/update commissions for engagedTeam members
    if (client.engagedTeam && client.engagedTeam.length > 0) {
      const commissions = client.engagedTeam.map(item => ({
        earnedBy: item.user,
        clientId: client._id,
        commissionRole: 'sales_closer_onetime',
        dealType: client.dealType,
        dealAmount: parseFloat(client.monthlyAmount || client.lifetimeAmount || client.enterpriseAmount || 0),
        commissionRate: parseFloat(client.monthlyAmount || client.lifetimeAmount || client.enterpriseAmount || 0) > 0 ? (parseFloat(item.commissionAmount) / parseFloat(client.monthlyAmount || client.lifetimeAmount || client.enterpriseAmount || 1)) : 0,
        commissionAmount: parseFloat(item.commissionAmount || 0),
        status: 'pending'
      }));
      await Commission.insertMany(commissions);
    }

    res.json({ success: true, data: client });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/clients/:id - Update client (Admin or manage_clients)
router.put('/:id', auth, requirePermission('manage_clients'), async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!client) return res.status(404).json({ success: false, error: 'Client not found' });

    // Sync commissions for engagedTeam
    if (req.body.engagedTeam) {
      // Delete old commissions for this client to rebuild
      await Commission.deleteMany({ clientId: client._id, status: 'pending' });
      
      const commissions = req.body.engagedTeam.map(item => ({
        earnedBy: item.user,
        clientId: client._id,
        commissionRole: 'sales_closer_onetime',
        dealType: client.dealType,
        dealAmount: parseFloat(client.monthlyAmount || client.lifetimeAmount || client.enterpriseAmount || 0),
        commissionRate: parseFloat(client.monthlyAmount || client.lifetimeAmount || client.enterpriseAmount || 0) > 0 ? (parseFloat(item.commissionAmount) / parseFloat(client.monthlyAmount || client.lifetimeAmount || client.enterpriseAmount || 1)) : 0,
        commissionAmount: parseFloat(item.commissionAmount || 0),
        status: 'pending'
      }));
      await Commission.insertMany(commissions);
    }

    res.json({ success: true, data: client });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/clients/:id - Delete client (Admin only - destructive operation)
router.delete('/:id', auth, requireRole(['ceo', 'admin']), async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) return res.status(404).json({ success: false, error: 'Client not found' });
    
    // Clean up commissions
    await Commission.deleteMany({ clientId: client._id });
    res.json({ success: true, message: 'Client and associated commissions deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
