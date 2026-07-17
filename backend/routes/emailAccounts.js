const express = require('express');
const router = express.Router();
const EmailAccount = require('../models/EmailAccount');
const { checkAccountHealth, checkAllAccountsHealth } = require('../services/smtpHealthCheck');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied: Admin only' });
  }
};

// GET /api/email-accounts
router.get('/', async (req, res) => {
  try {
    const accounts = await EmailAccount.find({}).sort({ createdAt: -1 });
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/email-accounts
router.post('/', async (req, res) => {
  try {
    const newAccount = new EmailAccount(req.body);
    await newAccount.save();
    res.status(201).json(newAccount);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/email-accounts/:id
router.put('/:id', async (req, res) => {
  try {
    const updated = await EmailAccount.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/email-accounts/:id
router.delete('/:id', async (req, res) => {
  try {
    await EmailAccount.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/email-accounts/:id/test
router.post('/:id/test', async (req, res) => {
  try {
    const result = await checkAccountHealth(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/email-accounts/test-all
router.post('/test-all', async (req, res) => {
  try {
    const results = await checkAllAccountsHealth();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
