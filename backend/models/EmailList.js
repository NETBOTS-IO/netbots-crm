const mongoose = require('mongoose');

const EmailListSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['static', 'smart'], default: 'static' },
  smartFilters: { type: Object },
  subscribers: [{
    email: { type: String, required: true },
    name: { type: String },
    status: { type: String, enum: ['subscribed', 'unsubscribed', 'bounced'], default: 'subscribed' },
    source: { type: String },
    subscribedAt: { type: Date, default: Date.now },
    unsubscribedAt: { type: Date },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  }],
  stats: {
    totalSubscribers: { type: Number, default: 0 },
    activeSubscribers: { type: Number, default: 0 },
  },
  doubleOptIn: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('EmailList', EmailListSchema);
