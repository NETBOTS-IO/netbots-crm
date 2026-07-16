const mongoose = require('mongoose');

const EmailLogSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailCampaign' },
  sequenceId: { type: mongoose.Schema.Types.ObjectId },
  sequenceStepId: { type: String },
  recipientEmail: { type: String, required: true, index: true },
  recipientName: { type: String },
  recipientType: { type: String, enum: ['lead', 'client', 'list_contact', 'manual'] },
  recipientId: { type: mongoose.Schema.Types.ObjectId },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailAccount' },
  fromEmail: { type: String },
  status: {
    type: String,
    enum: ['queued', 'sent', 'delivered', 'opened', 'clicked', 'replied',
           'bounced', 'soft_bounced', 'unsubscribed', 'complained', 'failed'],
    default: 'queued'
  },
  messageId: { type: String },
  openCount: { type: Number, default: 0 },
  firstOpenedAt: { type: Date },
  lastOpenedAt: { type: Date },
  clickCount: { type: Number, default: 0 },
  clickedLinks: [{ url: String, clickedAt: Date }],
  errorMessage: { type: String },
  bounceType: { type: String, enum: ['hard', 'soft', null] },
  sentAt: { type: Date },
  deliveredAt: { type: Date },
  replied: { type: Boolean, default: false },
  repliedAt: { type: Date },
  replyContent: { type: String },
  replyMessageId: { type: String }
}, { timestamps: true });

EmailLogSchema.index({ campaignId: 1, status: 1 });
EmailLogSchema.index({ recipientEmail: 1 });
EmailLogSchema.index({ sentAt: -1 });
EmailLogSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('EmailLog', EmailLogSchema);
