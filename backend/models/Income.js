const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  category: { type: String, required: true }, // e.g., 'Service Revenue', 'Retainer'
  payment_method: { type: String, enum: ['Cash', 'Bank Transfer', 'Credit Card', 'Online'], required: true },
  notes: { type: String },
  journalEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' }, // Link to ledger
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Income', incomeSchema);
