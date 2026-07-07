const mongoose = require('mongoose');

const PayoutSchema = new mongoose.Schema({
  weekLabel: { type: String, required: true },
  weekNumber: { type: String, required: true },
  totalAmount: { type: Number, default: 0 },
  totalRecipients: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['draft', 'approved', 'processing', 'completed'],
    default: 'draft'
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  completedAt: { type: Date },
  notes: { type: String },
  commissionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Commission' }]
}, { timestamps: true });

module.exports = mongoose.model('Payout', PayoutSchema);
