const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: { type: String, required: true },
  role: { type: String },
  action: { type: String, required: true }, // e.g. CLICK, PAGE_VIEW, API_CALL
  target: { type: String }, // e.g. button label, url path, specific entity ID
  details: { type: mongoose.Schema.Types.Mixed }, // details about the action
  ipAddress: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
