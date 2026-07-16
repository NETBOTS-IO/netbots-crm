const mongoose = require('mongoose');

const EmailSequenceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'archived'],
    default: 'draft'
  },
  trigger: {
    type: {
      type: String,
      enum: ['lead_created', 'stage_changed', 'tag_added', 'form_submitted',
             'manual', 'date_based', 'no_activity', 'lead_converted'],
      required: true
    },
    conditions: { type: Object }
  },
  steps: [{
    stepId: { type: String, required: true },
    type: {
      type: String,
      enum: ['send_email', 'wait', 'condition', 'action', 'exit'],
      required: true
    },
    label: { type: String },
    config: { type: Object },
    nextStepId: { type: String },
    branchTrueStepId: { type: String },
    branchFalseStepId: { type: String },
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 }
    }
  }],
  stats: {
    totalEnrolled: { type: Number, default: 0 },
    currentlyActive: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    exited: { type: Number, default: 0 },
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('EmailSequence', EmailSequenceSchema);
