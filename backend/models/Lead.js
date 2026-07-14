const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  contactName: { type: String },
  phone: { type: String },
  email: { type: String },
  businessType: {
    type: String,
    enum: ['pharmacy', 'hotel', 'restaurant', 'retail_shop', 'retail', 'distribution', 'trader', 'ngo', 'ca_firm',
           'freelancer', 'ecommerce', 'manufacturing', 'services', 'other']
  },
  channel: { type: String },
  website: { type: String },
  linkedInUrl: { type: String },
  secondaryPhone: { type: String },
  address: { type: String },
  industry: { type: String },
  temperature: {
    type: String,
    enum: ['cold', 'warm', 'sql', 'closed', 'retained'],
    default: 'cold'
  },
  score: { type: Number, default: 1 },
  stage: {
    type: String,
    enum: ['identify', 'qualify', 'nurture', 'close', 'onboard', 'retain', 'refer', 'rejected'],
    default: 'identify'
  },
  currentSoftware: {
    type: String,
    enum: ['excel', 'manual_register', 'quickbooks', 'other_software', 'nothing', 'unknown'],
    default: 'unknown'
  },
  employeeCount: { type: Number },
  monthlyRevenue: { type: String },
  budgetRange: { type: String },
  decisionMaker: { type: Boolean, default: false },
  timelineToClose: { type: String },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedCloser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  caPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referralCode: { type: String },
  demoBooked: { type: Boolean, default: false },
  demoDate: { type: Date },
  demoNotes: { type: String },
  demosCount: { type: Number, default: 0 },
  convertedToClient: { type: Boolean, default: false },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  convertedAt: { type: Date },
  isChurned: { type: Boolean, default: false },
  followUpDate: { type: Date },
  lastContactedAt: { type: Date },
  lostReason: {
    type: String,
    enum: ['price', 'features', 'competitor', 'no_response', 'timing', 'other', null],
    default: null
  },
  rejectedReason: { type: String },
  notes: { type: String },
  internalNotes: { type: String },
  stageEnteredAt: { type: Date, default: Date.now },
  daysInCurrentStage: { type: Number, default: 0 },
  
  // New Local Business and Social Media Fields
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
  sundayHours: { type: String },
  
  // Robust Tracking Fields
  targetService: [{
    type: String,
    enum: ['google_business_seo', 'website_seo', 'social_media_management_marketing', 'designing', 'software_development', 'website_development', 'saas_product']
  }],
  leadCollectedBy: { type: String },
  leadVerifiedBy: { type: String },
  isVerifiedByVerifier: { type: Boolean, default: false },
  verifiedAt: { type: Date },
  contactedBy: { type: String },
  contactMethod: { type: String },
  contactedAt: { type: Date },
  salesClosedBy: { type: String },
  workingVerifier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  workingCloser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  followUpReminderSent: { type: Boolean, default: false }
}, { timestamps: true });

LeadSchema.index({ convertedToClient: 1, clientId: 1 });
LeadSchema.index({ submittedBy: 1 });
LeadSchema.index({ createdAt: -1 });
LeadSchema.index({ lastContactedAt: -1 });
LeadSchema.index({ followUpDate: 1 });
LeadSchema.index({ workingVerifier: 1 });
LeadSchema.index({ workingCloser: 1 });
LeadSchema.index({ priority: 1 });
LeadSchema.index({ stage: 1 });
LeadSchema.index({ temperature: 1 });

LeadSchema.pre('save', function(next) {
  const scoreMap = { cold: 1, warm: 3, sql: 7, closed: 20, retained: 30 };
  this.score = scoreMap[this.temperature] || 1;

  if (this.isModified('followUpDate')) {
    this.followUpReminderSent = false;
  }
  next();
});

module.exports = mongoose.model('Lead', LeadSchema);
