const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  amount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['Draft', 'Sent', 'Partial', 'Paid', 'Overdue', 'Cancelled'], default: 'Draft' },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  items: [{
    description: String,
    quantity: Number,
    rate: Number,
    total: Number
  }],
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
