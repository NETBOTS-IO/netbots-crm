const mongoose = require('mongoose');

const liabilitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['Loan', 'Payable', 'Credit Card'], required: true },
  principal_amount: { type: Number, required: true },
  outstanding_balance: { type: Number, required: true },
  interest_rate: { type: Number, default: 0 },
  start_date: { type: Date, default: Date.now },
  installments: { type: Number, default: 1 },
  repayment_schedule: [{
    dueDate: Date,
    principal: Number,
    interest: Number,
    total: Number,
    status: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' }
  }],
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  journalEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Liability', liabilitySchema);
