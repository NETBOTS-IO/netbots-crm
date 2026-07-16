const mongoose = require('mongoose');

const EmailAccountSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  smtpHost: { type: String, default: 'smtp.hostinger.com' },
  smtpPort: { type: Number, default: 465 },
  smtpSecure: { type: Boolean, default: true },
  smtpUser: { type: String, required: true },
  smtpPass: { type: String, required: true },
  fromName: { type: String, default: 'NetBots' },
  replyTo: { type: String },
  dailyLimit: { type: Number, default: 300 },
  sentToday: { type: Number, default: 0 },
  lastSentAt: { type: Date },
  lastResetAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['active', 'paused', 'error', 'exhausted', 'warming_up'],
    default: 'active'
  },
  lastHealthCheck: { type: Date },
  healthCheckResult: { type: String },
  consecutiveErrors: { type: Number, default: 0 },
  isWarmingUp: { type: Boolean, default: false },
  warmUpDayCount: { type: Number, default: 0 },
  warmUpDailyTarget: { type: Number, default: 20 },
  tags: [{ type: String }],
  priority: { type: Number, default: 1 },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('EmailAccount', EmailAccountSchema);
