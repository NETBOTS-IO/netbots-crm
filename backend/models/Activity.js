const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['lead_submitted', 'stage_changed', 'score_changed', 'demo_booked', 'demo_held',
           'message_sent', 'email_sent', 'call_made', 'client_converted', 'commission_earned',
           'payout_processed', 'rank_upgraded', 'note_added', 'churn_risk_flagged',
           'retention_action', 'referral_sent', 'note', 'call', 'whatsapp', 'email', 'meeting', 'sms', 'social_media'],
    required: true
  },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: { type: String, required: true },
  notes: { type: String },
  oldValue: { type: String },
  newValue: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('Activity', ActivitySchema);
