const mongoose = require('mongoose');

const EmailCampaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subject: { type: String, required: true },
  previewText: { type: String },
  fromAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailAccount' },
  replyTo: { type: String },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailTemplate' },
  htmlContent: { type: String },
  jsonContent: { type: Object },
  audienceType: {
    type: String,
    enum: ['all_leads', 'all_clients', 'segment', 'list', 'manual'],
    required: true
  },
  audienceFilters: { type: Object },
  listId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailList' },
  segmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailSegment' },
  manualRecipients: [{ type: String }],
  excludeUnsubscribed: { type: Boolean, default: true },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'paused', 'failed', 'cancelled'],
    default: 'draft'
  },
  scheduledAt: { type: Date },
  sentAt: { type: Date },
  completedAt: { type: Date },
  isAbTest: { type: Boolean, default: false },
  abVariants: [{
    subject: String,
    htmlContent: String,
    percentage: Number,
  }],
  abWinnerMetric: { type: String, enum: ['opens', 'clicks'], default: 'opens' },
  abTestDurationHours: { type: Number, default: 4 },
  stats: {
    totalRecipients: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    uniqueOpens: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    uniqueClicks: { type: Number, default: 0 },
    bounced: { type: Number, default: 0 },
    hardBounced: { type: Number, default: 0 },
    softBounced: { type: Number, default: 0 },
    unsubscribed: { type: Number, default: 0 },
    complained: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('EmailCampaign', EmailCampaignSchema);
