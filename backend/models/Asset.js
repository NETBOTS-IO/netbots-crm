const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ['Equipment', 'Software/Digital', 'Furniture', 'Vehicles', 'Other'], required: true },
  purchase_date: { type: Date, required: true },
  purchase_value: { type: Number, required: true },
  depreciation_method: { type: String, enum: ['Straight-line', 'None'], default: 'Straight-line' },
  useful_life_years: { type: Number, default: 3 },
  current_book_value: { type: Number },
  status: { type: String, enum: ['Active', 'Disposed'], default: 'Active' },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  journalEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Pre-save to set initial book value
assetSchema.pre('save', function(next) {
  if (this.isNew && this.current_book_value === undefined) {
    this.current_book_value = this.purchase_value;
  }
  next();
});

module.exports = mongoose.model('Asset', assetSchema);
