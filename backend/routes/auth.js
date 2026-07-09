const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');

// POST /api/auth/login
// login, returns JWT
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ success: true, data: { token, user: { id: user._id, name: user.name, role: user.role, designation: user.designation, permissions: user.permissions, agreementSigned: user.agreementSigned, agreementPdfPath: user.agreementPdfPath } } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/auth/register
// CEO creates new intern/partner accounts
router.post('/register', auth, requireRole(['ceo', 'admin']), async (req, res) => {
  const { name, email, password, role, archetype, phone, designation, rank } = req.body;
  if (!email || !email.toLowerCase().endsWith('@netbots.io')) {
      return res.status(400).json({ success: false, error: 'Only emails with the @netbots.io domain are allowed.' });
  }
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ success: false, error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ name, email, password: hashedPassword, role, archetype, phone, designation, rank });
    await user.save();
    res.json({ success: true, message: 'User created' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

// GET /api/auth/me
// get current user profile
router.get('/me', auth, (req, res) => {
  res.json({ success: true, data: req.user });
});

// PUT /api/auth/me
// update own profile/password
router.put('/me', auth, async (req, res) => {
  const { name, phone, password } = req.body;
  try {
    if (name) req.user.name = name;
    if (phone) req.user.phone = phone;
    if (password) req.user.password = await bcrypt.hash(password, 10);
    await req.user.save();
    res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
