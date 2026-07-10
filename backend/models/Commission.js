const mongoose = require('mongoose');

const CommissionSchema = new mongoose.Schema({
  earnedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  commissionRole: {
    type: String,
    enum: ['lead_researcher', 'sales_closer_recurring', 'sales_closer_onetime',
           'ca_partner', 'growth_hacker', 'retention_bonus'],
    required: true
  },
  dealType: {
    type: String,
    enum: ['monthly_subscription', 'lifetime_deal', 'enterprise', 'one_time', 'weekly', 'monthly', 'annual'],
    required: true
  },
  dealAmount: { type: Number, required: true },
  commissionRate: { type: Number, required: true },
  commissionAmount: { type: Number, required: true },
  isRecurring: { type: Boolean, default: false },
  recurringMonth: { type: Number },
  recurringEndMonth: { type: Number },
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid', 'disputed'],
    default: 'pending'
  },
  payoutBatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payout' },
  paidAt: { type: Date },
  paymentMethod: { type: String },
  paymentReference: { type: String },
  weekNumber: { type: String },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Commission', CommissionSchema);
