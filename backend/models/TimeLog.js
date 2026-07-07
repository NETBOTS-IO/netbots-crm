const mongoose = require('mongoose');

const TimeLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    activeSeconds: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Ensure one log per user per day
TimeLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('TimeLog', TimeLogSchema);
