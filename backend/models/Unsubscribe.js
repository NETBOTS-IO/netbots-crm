const mongoose = require('mongoose');

const UnsubscribeSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  reason: { type: String },
  sourceCampaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailCampaign' },
  sourceSequenceId: { type: mongoose.Schema.Types.ObjectId },
  unsubscribedAt: { type: Date, default: Date.now },
  method: { type: String, enum: ['link_click', 'manual', 'admin', 'bounce', 'complaint'], default: 'link_click' }
}, { timestamps: true });

module.exports = mongoose.model('Unsubscribe', UnsubscribeSchema);
