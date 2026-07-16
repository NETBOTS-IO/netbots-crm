const mongoose = require('mongoose');

const EmailTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ['welcome', 'newsletter', 'promotional', 'follow_up', 'announcement',
           'transactional', 're_engagement', 'custom'],
    default: 'custom'
  },
  subject: { type: String },
  previewText: { type: String },
  htmlContent: { type: String, required: true },
  jsonContent: { type: Object },
  thumbnail: { type: String },
  tags: [{ type: String }],
  isSystem: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('EmailTemplate', EmailTemplateSchema);
