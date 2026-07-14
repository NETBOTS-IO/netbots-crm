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

const TEMPLATES = {
    Supervisor: {
        view_dashboard: true, can_view_leads: true, can_add_leads: true, can_edit_leads: true,
        can_delete_leads: true, manage_clients: true, manage_team: true, manage_permissions: true,
        view_commissions: true, manage_payouts: true, view_leaderboard: true, can_bulk_manage_leads: true
    },
    LeadCollector: {
        view_dashboard: true, can_view_leads: true, can_add_leads: true, can_edit_leads: false,
        can_delete_leads: false, manage_clients: false, manage_team: false, manage_permissions: false,
        view_commissions: true, manage_payouts: false, view_leaderboard: true, can_bulk_manage_leads: false
    },
    LeadVerifier: {
        view_dashboard: true, can_view_leads: true, can_add_leads: false, can_edit_leads: true,
        can_delete_leads: false, manage_clients: false, manage_team: false, manage_permissions: false,
        view_commissions: true, manage_payouts: false, view_leaderboard: true, can_bulk_manage_leads: false
    },
    LeadCloser: {
        view_dashboard: true, can_view_leads: true, can_edit_leads: true, can_add_leads: false,
        can_delete_leads: false, manage_clients: true, manage_team: false, manage_permissions: false,
        view_commissions: true, manage_payouts: false, view_leaderboard: true, can_bulk_manage_leads: false
    },
    Reset: {
        view_dashboard: false, can_view_leads: false, can_add_leads: false, can_edit_leads: false,
        can_delete_leads: false, manage_clients: false, manage_team: false, manage_permissions: false,
        view_commissions: false, manage_payouts: false, view_leaderboard: false, can_bulk_manage_leads: false
    }
};

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
    
    // Calculate merged permissions from designations array
    let mergedPermissions = { ...TEMPLATES.Reset };
    const designationArray = Array.isArray(designation) ? designation : (designation ? [designation] : []);
    
    if (designationArray.length > 0) {
        designationArray.forEach(desig => {
            const template = TEMPLATES[desig];
            if (template) {
                Object.keys(template).forEach(key => {
                    if (template[key]) mergedPermissions[key] = true;
                });
            }
        });
    } else {
        // Fallback for generic roles if no designation selected
        mergedPermissions = { view_dashboard: true, can_view_leads: true, can_add_leads: true, can_edit_leads: false, can_delete_leads: false, manage_clients: false, manage_team: false, manage_permissions: false, view_commissions: true, manage_payouts: false, view_leaderboard: true, can_bulk_manage_leads: false };
    }
    
    user = new User({ name, email, password: hashedPassword, role, archetype, phone, designation: designationArray, rank, permissions: mergedPermissions });
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
    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (password) updates.password = await bcrypt.hash(password, 10);

    await User.findByIdAndUpdate(req.user._id, { $set: updates });
    res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
