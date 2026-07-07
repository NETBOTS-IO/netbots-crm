const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  companyName: { type: String, required: true },
  contactName: { type: String },
  email: { type: String },
  phone: { type: String },
  businessType: { type: String },
  city: { type: String },
  country: { type: String, default: 'Pakistan' },
  billingAddress: { type: String },
  taxId: { type: String },
  planType: {
    type: String,
    enum: ['monthly_starter', 'monthly_growth', 'monthly_pro', 'lifetime_deal', 'enterprise', 'annual'],
    required: true
  },
  dealType: {
    type: String,
    enum: ['monthly_subscription', 'lifetime_deal', 'enterprise'],
    required: true
  },
  monthlyAmount: { type: Number },
  lifetimeAmount: { type: Number },
  enterpriseAmount: { type: Number },
  startDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  contractEndDate: { type: Date },
  autoRenew: { type: Boolean, default: true },
  churnDate: { type: Date },
  churnReason: { type: String },
  monthsActive: { type: Number, default: 0 },
  lastLoginDate: { type: Date },
  isChurnRisk: { type: Boolean, default: false },
  atRiskNotes: { type: String },
  featuresUsed: [String],
  closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  caPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  growthHacker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referralCode: { type: String },
  referralLinkSent: { type: Boolean, default: false },
  referralLinkSentAt: { type: Date },
  clientsReferred: { type: Number, default: 0 },
  upfrontPaid: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },
  engagedTeam: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    commissionAmount: { type: Number, default: 0 }
  }],

  // New Google Maps, Social Media & Working Hours fields (synced with Lead)
  instagram: { type: String },
  facebook: { type: String },
  twitter: { type: String },
  linkedin: { type: String },
  yelp: { type: String },
  youtube: { type: String },
  placeId: { type: String },
  cid: { type: String },
  category: { type: String },
  reviewCount: { type: Number },
  averageRating: { type: Number },
  latitude: { type: Number },
  longitude: { type: Number },
  mondayHours: { type: String },
  tuesdayHours: { type: String },
  wednesdayHours: { type: String },
  thursdayHours: { type: String },
  fridayHours: { type: String },
  saturdayHours: { type: String },
  sundayHours: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Client', ClientSchema);
