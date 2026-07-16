const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  type: { 
    type: String, 
    enum: ['Asset', 'Liability', 'Equity', 'Income', 'Expense'], 
    required: true 
  },
  parent_account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null },
  description: { type: String },
  isSystem: { type: Boolean, default: false } // System accounts cannot be deleted
}, { timestamps: true });

module.exports = mongoose.model('Account', accountSchema);
