const mongoose = require('mongoose');

const GamificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['sprint_challenge', 'team_milestone', 'monthly_bonus', 'hall_of_fame'],
    required: true
  },
  title: { type: String, required: true },
  description: { type: String },
  targetMetric: { type: String },
  targetValue: { type: Number },
  reward: { type: String },
  rewardAmount: { type: Number },
  startDate: { type: Date },
  endDate: { type: Date },
  isActive: { type: Boolean, default: true },
  winners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  teamSQLTarget: { type: Number },
  currentTeamSQLs: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Gamification', GamificationSchema);
