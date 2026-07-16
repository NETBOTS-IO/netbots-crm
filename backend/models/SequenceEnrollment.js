const mongoose = require('mongoose');

const SequenceEnrollmentSchema = new mongoose.Schema({
  sequenceId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailSequence', required: true },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  recipientEmail: { type: String, required: true },
  currentStepId: { type: String },
  status: {
    type: String,
    enum: ['active', 'completed', 'exited', 'paused'],
    default: 'active'
  },
  enrolledAt: { type: Date, default: Date.now },
  nextActionAt: { type: Date, default: Date.now },
  stepHistory: [{
    stepId: { type: String },
    action: { type: String },
    executedAt: { type: Date, default: Date.now },
    result: { type: Object }
  }]
}, { timestamps: true });

SequenceEnrollmentSchema.index({ sequenceId: 1, leadId: 1 }, { unique: true });
SequenceEnrollmentSchema.index({ nextActionAt: 1, status: 1 });

module.exports = mongoose.model('SequenceEnrollment', SequenceEnrollmentSchema);
