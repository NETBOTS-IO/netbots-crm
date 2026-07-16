const mongoose = require('mongoose');

const EmailSegmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  filters: { type: Object, required: true }, // Filter rules configuration object
  recipientCount: { type: Number, default: 0 },
  lastCalculatedAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('EmailSegment', EmailSegmentSchema);
