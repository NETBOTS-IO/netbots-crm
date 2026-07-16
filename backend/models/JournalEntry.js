const mongoose = require('mongoose');

const journalEntrySchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  description: { type: String, required: true },
  source_type: { 
    type: String, 
    enum: ['Income', 'Expense', 'Asset', 'Liability', 'Manual', 'InvoicePayment'], 
    required: true 
  },
  source_id: { type: mongoose.Schema.Types.ObjectId, required: true }, // Ref to Income, Expense, etc.
  lines: [{
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 }
  }],
  is_locked: { type: Boolean, default: false }, // True if period is closed
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Pre-save validation to ensure Debits = Credits
journalEntrySchema.pre('save', function(next) {
  let totalDebit = 0;
  let totalCredit = 0;
  
  this.lines.forEach(line => {
    totalDebit += (line.debit || 0);
    totalCredit += (line.credit || 0);
  });
  
  // Floating point comparison safeguard
  if (Math.abs(totalDebit - totalCredit) > 0.001) {
    return next(new Error(`Journal Entry is unbalanced. Debits: ${totalDebit}, Credits: ${totalCredit}`));
  }
  
  next();
});

module.exports = mongoose.model('JournalEntry', journalEntrySchema);
