const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: {
    type: String,
    enum: ['lead_gen', 'sales', 'technical_staff', 'admin'],
    required: true
  },
  permissions: {
    view_dashboard: { type: Boolean, default: true },
    can_view_leads: { type: Boolean, default: true },
    can_add_leads: { type: Boolean, default: true },
    can_edit_leads: { type: Boolean, default: false },
    can_delete_leads: { type: Boolean, default: false },
    manage_clients: { type: Boolean, default: false },
    manage_team: { type: Boolean, default: false },
    manage_permissions: { type: Boolean, default: false },
    view_commissions: { type: Boolean, default: true },
    manage_payouts: { type: Boolean, default: false },
    view_leaderboard: { type: Boolean, default: true },
    can_bulk_manage_leads: { type: Boolean, default: false }
  },
  designation: { type: [String], default: [] },
  archetype: {
    type: String,
    enum: ['lead_researcher', 'facebook_manager', 'reddit_specialist', 'sales_closer', 'ca_recruiter', null],
    default: null
  },
  rank: {
    type: String,
    enum: ['rookie', 'hunter', 'closer', 'elite_closer', 'gold_closer', 'champion'],
    default: 'rookie'
  },
  points: { type: Number, default: 0 },
  totalLeadsSubmitted: { type: Number, default: 0 },
  totalSQLs: { type: Number, default: 0 },
  totalCloses: { type: Number, default: 0 },
  totalCommissionEarned: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  activeStatus: {
    type: String,
    enum: ['online', 'offline', 'away', 'on_break'],
    default: 'offline'
  },
  profileImage: { type: String },
  joinedAt: { type: Date, default: Date.now },
  lastActivityAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date },
  partnerTier: {
    type: String,
    enum: ['silver', 'gold', 'platinum', 'elite', 'ambassador', null],
    default: null
  },
  referralCode: { type: String, unique: true, sparse: true },
  totalClientsReferred: { type: Number, default: 0 },
  agreementSigned: { type: Boolean, default: false },
  agreementSignedAt: { type: Date },
  agreementPdfPath: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
