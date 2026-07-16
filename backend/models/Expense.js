const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }, // if billable
  category: { type: String, required: true }, // e.g., 'Rent Expense', 'Marketing Expense'
  payment_method: { type: String, enum: ['Cash', 'Bank Transfer', 'Credit Card', 'Online', 'On Credit'], required: true },
  is_recurring: { type: Boolean, default: false },
  is_billable: { type: Boolean, default: false },
  notes: { type: String },
  receiptUrl: { type: String },
  journalEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' }, // Link to ledger
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
