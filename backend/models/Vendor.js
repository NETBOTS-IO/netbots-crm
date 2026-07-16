const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String }, // e.g., Software, Freelancer, Supplier
  contactEmail: { type: String },
  contactPhone: { type: String },
  address: { type: String },
  taxId: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Vendor', vendorSchema);
