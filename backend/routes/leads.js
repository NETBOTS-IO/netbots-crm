const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const User = require('../models/User');
const Client = require('../models/Client');
const { auth, requireRole } = require('../middleware/auth');
const { calculateCommissions } = require('../utils/commissionCalculator');
const { getPointsForEvent, calculateRank } = require('../utils/rankCalculator');

const maskLeadData = (lead) => {
    const masked = lead.toObject ? lead.toObject() : { ...lead };
    masked.companyName = '***';
    masked.email = '***';
    masked.phone = '***';
    masked.contactName = '***';
    masked.website = '***';
    return masked;
};

// Helper to validate locks for editing leads
const checkLeadLock = async (leadId, user) => {
    if (user.role === 'admin') return { allowed: true };

    const lead = await Lead.findById(leadId);
    if (!lead) return { allowed: false, error: 'Lead not found', status: 404 };

    const isVerifier = Array.isArray(user.designation) && user.designation.includes('LeadVerifier');
    const isCloser = Array.isArray(user.designation) && user.designation.includes('LeadCloser');

    const isAssignedVerifier = lead.workingVerifier && lead.workingVerifier.toString() === user._id.toString();
    const isAssignedCloser = lead.workingCloser && lead.workingCloser.toString() === user._id.toString();

    // If the user has locked it, they can edit.
    if (isAssignedVerifier || isAssignedCloser) return { allowed: true };

    // If it's locked by SOMEONE ELSE, block it immediately.
    const lockedByOtherVerifier = lead.workingVerifier && lead.workingVerifier.toString() !== user._id.toString();
    const lockedByOtherCloser = lead.workingCloser && lead.workingCloser.toString() !== user._id.toString();
    
    if (lockedByOtherVerifier || lockedByOtherCloser) {
        return { allowed: false, error: 'Action blocked: This lead is locked by another team member.', status: 403 };
    }

    // If it's NOT locked, but the user is a Verifier or Closer, they MUST claim it first.
    if (isVerifier || isCloser) {
        return { allowed: false, error: 'Access denied: You must claim this lead first before making edits.', status: 403 };
    }

    // Otherwise (e.g. Collector), fallback to their global edit permission
    if (!user.permissions || !user.permissions.can_edit_leads) {
        return { allowed: false, error: 'Access denied: You do not have permission to edit leads.', status: 403 };
    }

    return { allowed: true };
};

// GET /api/leads
// get all leads with pagination, filtering, and stats
router.get('/', auth, async (req, res) => {
  try {
    const { 
        page = 1, 
        limit = 50, 
        search = '', 
        period = 'all', 
        cardFilter = 'all',
        priority = 'all',
        stage = 'all',
        temp = 'all',
        contact = 'all',
        workingVerifier = 'all',
        workingCloser = 'all',
        channel = 'all'
    } = req.query;

    let baseQuery = { 
        convertedToClient: { $ne: true },
        clientId: { $exists: false }
    };
    // Only restrict to own leads if user has NO can_view_leads permission AND is not admin/sales
    if (req.user.role !== 'admin' && req.user.role !== 'sales' && (!req.user.permissions || !req.user.permissions.can_view_leads)) {
      baseQuery.submittedBy = req.user._id;
    }

    // Helper to get date range for period
    const getPeriodRange = (p) => {
        const now = new Date();
        const start = new Date();
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        if (p === 'today') {
            start.setHours(0, 0, 0, 0);
            return { $gte: start, $lte: end };
        }
        if (p === 'week') {
            start.setDate(now.getDate() - 7);
            start.setHours(0, 0, 0, 0);
            return { $gte: start, $lte: end };
        }
        if (p === 'month') {
            start.setDate(now.getDate() - 30);
            start.setHours(0, 0, 0, 0);
            return { $gte: start, $lte: end };
        }
        if (p === 'year') {
            start.setDate(now.getDate() - 365);
            start.setHours(0, 0, 0, 0);
            return { $gte: start, $lte: end };
        }
        return null;
    };

    const periodRange = getPeriodRange(period);
    
    // Stats calculation query (pre-table filters)
    let statsQuery = { ...baseQuery };
    if (periodRange) {
        statsQuery.$or = [
            { createdAt: periodRange },
            { lastContactedAt: periodRange },
            { followUpDate: periodRange }
        ];
    }

    // High performance stats calculation using MongoDB Aggregation
    const statsResult = await Lead.aggregate([
      { $match: statsQuery },
      {
        $group: {
          _id: null,
          totalLeadsCount: { $sum: 1 },
          contactedCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$lastContactedAt", null] },
                    ...(periodRange ? [
                      { $gte: ["$lastContactedAt", periodRange.$gte] },
                      { $lte: ["$lastContactedAt", periodRange.$lte] }
                    ] : [])
                  ]
                },
                1,
                0
              ]
            }
          },
          commitmentsCount: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$temperature", "sql"] },
                    { $eq: ["$stage", "close"] }
                  ]
                },
                1,
                0
              ]
            }
          },
          followUpCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$followUpDate", null] },
                    ...(periodRange ? [
                      { $gte: ["$followUpDate", periodRange.$gte] },
                      { $lte: ["$followUpDate", periodRange.$lte] }
                    ] : [])
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const stats = statsResult[0] || {
      totalLeadsCount: 0,
      contactedCount: 0,
      commitmentsCount: 0,
      followUpCount: 0
    };
    const { totalLeadsCount, contactedCount, commitmentsCount, followUpCount } = stats;

    // Main Table Query
    let query = { ...statsQuery };

    // 1. Card filter
    if (cardFilter === 'contacted' && periodRange) {
        query.lastContactedAt = periodRange;
    } else if (cardFilter === 'commitments') {
        query.$or = [...(query.$or || []), { temperature: 'sql' }, { stage: 'close' }];
    } else if (cardFilter === 'followup' && periodRange) {
        query.followUpDate = periodRange;
    }

    // 2. Search filter
    if (search) {
        query.$and = query.$and || [];
        query.$and.push({
            $or: [
                { companyName: { $regex: search, $options: 'i' } },
                { contactName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ]
        });
    }

    // 3. Dropdown filters
    if (priority !== 'all') query.priority = priority;
    if (stage !== 'all') {
        query.stage = stage;
    } else {
        // By default, do not show rejected leads unless explicitly filtered
        query.stage = { $ne: 'rejected' };
    }
    if (temp !== 'all') query.temperature = temp;
    if (channel !== 'all') query.channel = channel;
    
    if (contact === 'contacted_today') {
        query.lastContactedAt = getPeriodRange('today');
    } else if (contact === 'needs_followup') {
        const todayStart = new Date(new Date().setHours(0,0,0,0));
        query.followUpDate = { $gte: todayStart };
    } else if (contact === 'commitments') {
        query.$or = [...(query.$or || []), { temperature: 'sql' }, { stage: 'close' }];
    }

    if (workingVerifier !== 'all') {
        if (workingVerifier === 'unassigned') {
            query.workingVerifier = null;
        } else {
            query.workingVerifier = workingVerifier;
        }
    }
    if (workingCloser !== 'all') {
        if (workingCloser === 'unassigned') {
            query.workingCloser = null;
        } else {
            query.workingCloser = workingCloser;
        }
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let leads = await Lead.find(query)
        .populate('submittedBy', 'name email')
        .populate('workingVerifier', 'name email')
        .populate('workingCloser', 'name email')
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum);
    
    const totalCount = await Lead.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limitNum);
    
    if (req.user.role !== 'admin' && (!req.user.permissions || !req.user.permissions.can_view_leads)) {
        leads = leads.map(maskLeadData);
    }

    res.json({ 
        success: true, 
        data: leads, 
        pagination: { total: totalCount, page: pageNum, pages: totalPages },
        stats: { totalLeadsCount, contactedCount, commitmentsCount, followUpCount }
    });
  } catch (err) {
    console.error("GET /api/leads error:", err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/leads/bulk-action
router.post('/bulk-action', auth, async (req, res) => {
    if (req.user.role !== 'admin' && (!req.user.permissions || !req.user.permissions.can_bulk_manage_leads)) {
        return res.status(403).json({ success: false, error: 'Access denied: Cannot bulk manage leads.' });
    }

    const { leadIds, action, payload } = req.body;
    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
        return res.status(400).json({ success: false, error: 'No leads selected.' });
    }

    try {
        // Concurrency lock validation for bulk operations
        const isVerifier = Array.isArray(req.user.designation) && req.user.designation.includes('LeadVerifier');
        const isCloser = Array.isArray(req.user.designation) && req.user.designation.includes('LeadCloser');
        if (req.user.role !== 'admin' && (isVerifier || isCloser)) {
            const lockedLeads = await Lead.find({
                _id: { $in: leadIds },
                $or: [
                    ...(isVerifier ? [{ workingVerifier: { $exists: true, $ne: null, $ne: req.user._id } }] : []),
                    ...(isCloser ? [{ workingCloser: { $exists: true, $ne: null, $ne: req.user._id } }] : [])
                ]
            });
            if (lockedLeads.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: `Action blocked: ${lockedLeads.length} lead(s) are locked by other team members.`
                });
            }
        }
        if (action === 'delete') {
            await Lead.deleteMany({ _id: { $in: leadIds } });
            await Activity.deleteMany({ leadId: { $in: leadIds } });
        } else if (action === 'updateStage') {
            const updateFields = { stage: payload.stage, stageEnteredAt: Date.now() };
            if (payload.stage === 'close') updateFields.temperature = 'sql';
            if (payload.stage === 'onboard') updateFields.temperature = 'closed';
            await Lead.updateMany({ _id: { $in: leadIds } }, { $set: updateFields });
        } else if (action === 'updatePriority') {
            await Lead.updateMany({ _id: { $in: leadIds } }, { $set: { priority: payload.priority } });
        } else if (action === 'updateTemperature') {
            await Lead.updateMany({ _id: { $in: leadIds } }, { $set: { temperature: payload.temperature } });
        } else {
            return res.status(400).json({ success: false, error: 'Invalid action.' });
        }

        res.json({ success: true, message: 'Bulk action applied successfully.' });
    } catch (err) {
        console.error("Bulk action error:", err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// POST /api/leads/public-webhook
// Secure webhook to submit website leads directly into CRM
router.post('/public-webhook', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== 'netbots_website_webhook_secret_key_2026') {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid API Key' });
  }

  try {
    const { companyName, contactName, email, phone, notes, priority, channel, website, targetService } = req.body;
    
    // Find the default submitter user (CEO Netbots)
    const ceoUser = await User.findOne({ email: 'ceo@netbots.io' });
    const submittedById = ceoUser ? ceoUser._id : '6a4f2775bb63089ec230a354';

    const lead = new Lead({
      companyName: companyName || contactName || 'Website Lead',
      contactName,
      email,
      phone,
      notes,
      priority: priority || 'high',
      channel: channel || 'Website',
      website,
      targetService,
      submittedBy: submittedById,
      leadCollectedBy: 'Website Form'
    });

    await lead.save();

    // Create an activity for the new website lead
    const activity = new Activity({
      leadId: lead._id,
      userId: submittedById,
      action: 'Lead Created',
      details: `Website lead auto-created from website form submission.`
    });
    await activity.save();

    res.json({ success: true, leadId: lead._id });
  } catch (err) {
    console.error("Public webhook lead creation error:", err);
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

// POST /api/leads
// submit new lead
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'admin' && (!req.user.permissions || !req.user.permissions.can_add_leads)) {
      return res.status(403).json({ success: false, error: 'Access denied: Cannot add leads.' });
  }
  try {
    const companyName = req.body.companyName || req.body.name;
    const lead = new Lead({
      ...req.body,
      companyName,
      submittedBy: req.user._id,
      leadCollectedBy: req.user.name || req.user.email
    });
    await lead.save();

    // Log activity
    const activity = new Activity({
      type: 'lead_submitted',
      leadId: lead._id,
      performedBy: req.user._id,
      description: `Lead submitted for ${companyName}`
    });
    await activity.save();

    // Update intern stats/points
    const pointsToAdd = getPointsForEvent('lead_submitted');
    const newPoints = (req.user.points || 0) + pointsToAdd;
    const newRank = calculateRank({
      points: newPoints,
      totalSQLs: req.user.totalSQLs || 0,
      totalCloses: req.user.totalCloses || 0
    });

    await User.updateOne(
      { _id: req.user._id },
      { 
        $inc: { totalLeadsSubmitted: 1, points: pointsToAdd },
        $set: { rank: newRank }
      }
    );

    res.json({ success: true, data: lead });
  } catch (err) {
    console.error("POST /api/leads error:", err);
    res.status(err.name === 'ValidationError' ? 400 : 500).json({ 
      success: false, 
      error: err.name === 'ValidationError' ? err.message : 'Server error' 
    });
  }
});

// GET /api/leads/followups
// get all leads that have a follow-up date and time set
router.get('/followups', auth, async (req, res) => {
  try {
    const isCloser = Array.isArray(req.user.designation) && req.user.designation.includes('LeadCloser');
    const hasAccess = req.user.role === 'admin' || req.user.role === 'sales' || isCloser;

    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Access denied: Requires Closer or Admin permissions.' });
    }

    const { priority = 'all', temp = 'all', search = '' } = req.query;

    let query = {
      followUpDate: { $exists: true, $ne: null },
      convertedToClient: { $ne: true }
    };

    if (priority !== 'all') query.priority = priority;
    if (temp !== 'all') query.temperature = temp;
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { contactName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const leads = await Lead.find(query)
      .populate('submittedBy', 'name email')
      .populate('workingVerifier', 'name email')
      .populate('workingCloser', 'name email')
      .populate('assignedCloser', 'name email')
      .sort({ followUpDate: 1 });

    res.json({ success: true, data: leads });
  } catch (err) {
    console.error("GET /api/leads/followups error:", err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/leads/:id
// get single lead + full activity timeline
router.get('/:id', auth, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).populate('submittedBy assignedCloser caPartner workingVerifier workingCloser');
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

    // Ownership check — users with can_view_leads bypass ownership restriction
    const hasViewPermission = req.user.role === 'admin' || req.user.role === 'sales' || (req.user.permissions && req.user.permissions.can_view_leads);
    if (!hasViewPermission) {
        const isOwner = lead.submittedBy?._id?.toString() === req.user._id.toString();
        const isAssigned = lead.assignedCloser?._id?.toString() === req.user._id.toString();
        const isPartner = lead.caPartner?._id?.toString() === req.user._id.toString();
        
        if (!isOwner && !isAssigned && !isPartner) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
    }

    let responseLead = lead;
    if (req.user.role !== 'admin' && (!req.user.permissions || !req.user.permissions.can_view_leads)) {
        responseLead = maskLeadData(lead);
    }

    const activities = await Activity.find({ leadId: lead._id }).populate('performedBy', 'name role').sort('-createdAt');
    res.json({ success: true, data: { lead: responseLead, activities } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/leads/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const lockCheck = await checkLeadLock(req.params.id, req.user);
    if (!lockCheck.allowed) {
      return res.status(lockCheck.status).json({ success: false, error: lockCheck.error });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

    const updateData = { ...req.body };
    updateData.contactedBy = req.user.name || req.user.email;
    
    // Auto-verify if temperature becomes warm or sql
    if (['warm', 'sql'].includes(updateData.temperature)) {
        if (!lead.leadVerifiedBy) {
            updateData.leadVerifiedBy = req.user.name || req.user.email;
            updateData.verifiedAt = Date.now();
        }
    }

    const updatedLead = await Lead.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ success: true, data: updatedLead });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/leads/:id/stage
router.put('/:id/stage', auth, async (req, res) => {
  const { stage, rejectedReason } = req.body;
  try {
    const lockCheck = await checkLeadLock(req.params.id, req.user);
    if (!lockCheck.allowed) {
      return res.status(lockCheck.status).json({ success: false, error: lockCheck.error });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

    const oldStage = lead.stage;
    lead.stage = stage;
    lead.stageEnteredAt = Date.now();
    
    if (stage === 'rejected' && rejectedReason) {
        lead.rejectedReason = rejectedReason;
    }
    
    // Auto temp update if stage is close or beyond
    if (stage === 'close') lead.temperature = 'sql';
    if (stage === 'onboard') lead.temperature = 'closed';

    // Auto-verify if temperature is warm or sql and verifier is empty
    if (['warm', 'sql'].includes(lead.temperature) && !lead.leadVerifiedBy) {
        lead.leadVerifiedBy = req.user.name || req.user.email;
        lead.verifiedAt = Date.now();
    }

    await lead.save();

    const activity = new Activity({
      type: 'stage_changed',
      leadId: lead._id,
      performedBy: req.user._id,
      description: `Stage changed from ${oldStage} to ${stage}`,
      oldValue: oldStage,
      newValue: stage
    });
    await activity.save();

    // Add points to submitter if it becomes SQL
    if (lead.temperature === 'sql' && lead.score < 7) {
        const submitter = await User.findById(lead.submittedBy);
        submitter.points += getPointsForEvent('lead_became_sql');
        submitter.totalSQLs += 1;
        submitter.rank = calculateRank(submitter);
        await submitter.save();
    }

    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/leads/:id/verify
// Mark lead as verified by the verifier
router.put('/:id/verify', auth, async (req, res) => {
  try {
    const lockCheck = await checkLeadLock(req.params.id, req.user);
    if (!lockCheck.allowed) {
      return res.status(lockCheck.status).json({ success: false, error: lockCheck.error });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

    lead.isVerifiedByVerifier = true;
    lead.leadVerifiedBy = req.user.name || req.user.email;
    lead.verifiedAt = Date.now();
    await lead.save();

    const activity = new Activity({
      type: 'lead_verified',
      leadId: lead._id,
      performedBy: req.user._id,
      description: `Lead verified by ${req.user.name}`
    });
    await activity.save();

    res.json({ success: true, data: lead });
  } catch (err) {
    console.error("Error in /verify:", err);
    res.status(500).json({ success: false, error: 'Server error: ' + err.message });
  }
});

// POST /api/leads/:id/convert
// Allow admin, sales, or anyone with manage_clients permission
router.post('/:id/convert', auth, async (req, res) => {
    let { 
        planType, 
        dealType, 
        monthlyAmount, 
        lifetimeAmount, 
        enterpriseAmount, 
        startDate, 
        closedBy,
        upfrontPaid,
        remainingAmount,
        engagedTeam
    } = req.body;

    if (req.user.role !== 'admin') {
        planType = 'monthly_growth';
        dealType = 'monthly_subscription';
        monthlyAmount = 0;
        lifetimeAmount = 0;
        enterpriseAmount = 0;
        upfrontPaid = 0;
        remainingAmount = 0;
        engagedTeam = [];
        closedBy = req.user._id;
    }
    try {
        const lead = await Lead.findById(req.params.id);
        if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

        const isAssignedCloser = lead.workingCloser && lead.workingCloser.toString() === req.user._id.toString();

        if (
          req.user.role !== 'admin' && 
          req.user.role !== 'sales' && 
          (!req.user.permissions || !req.user.permissions.manage_clients) && 
          !isAssignedCloser
        ) {
          return res.status(403).json({ success: false, error: 'Access denied: Cannot convert leads.' });
        }

        const lockCheck = await checkLeadLock(req.params.id, req.user);
        if (!lockCheck.allowed) {
            return res.status(lockCheck.status).json({ success: false, error: lockCheck.error });
        }
        
        const closerUser = await User.findById(closedBy || req.user._id);
        const salesClosedByName = closerUser ? closerUser.name : (req.user.name || req.user.email);

        lead.temperature = 'closed';
        lead.stage = 'onboard';
        lead.convertedToClient = true;
        lead.convertedAt = Date.now();
        lead.salesClosedBy = salesClosedByName;
        await lead.save();

        const client = new Client({
            leadId: lead._id,
            companyName: lead.companyName,
            contactName: lead.contactName,
            email: lead.email,
            phone: lead.phone,
            businessType: lead.businessType,
            city: lead.city,
            planType,
            dealType,
            monthlyAmount,
            lifetimeAmount,
            enterpriseAmount,
            startDate,
            closedBy: closedBy || req.user._id, // Default to current user (closer) if not specified
            submittedBy: lead.submittedBy,
            caPartner: lead.caPartner,
            instagram: lead.instagram,
            facebook: lead.facebook,
            twitter: lead.twitter,
            linkedin: lead.linkedin,
            yelp: lead.yelp,
            youtube: lead.youtube,
            placeId: lead.placeId,
            cid: lead.cid,
            category: lead.category,
            reviewCount: lead.reviewCount,
            averageRating: lead.averageRating,
            latitude: lead.latitude,
            longitude: lead.longitude,
            mondayHours: lead.mondayHours,
            tuesdayHours: lead.tuesdayHours,
            wednesdayHours: lead.wednesdayHours,
            thursdayHours: lead.thursdayHours,
            fridayHours: lead.fridayHours,
            saturdayHours: lead.saturdayHours,
            sundayHours: lead.sundayHours,
            upfrontPaid: parseFloat(upfrontPaid || 0),
            remainingAmount: parseFloat(remainingAmount || 0),
            engagedTeam: engagedTeam || [],
            
            // Tracked Fields copy
            targetService: lead.targetService,
            leadCollectedBy: lead.leadCollectedBy,
            leadVerifiedBy: lead.leadVerifiedBy || 'System',
            leadVerifiedAt: lead.verifiedAt || Date.now(),
            leadCreatedAt: lead.createdAt || Date.now(),
            contactedBy: lead.contactedBy,
            contactMethod: lead.contactMethod,
            contactedAt: lead.contactedAt,
            salesClosedBy: salesClosedByName
        });
        await client.save();
        
        lead.clientId = client._id;
        lead.convertedToClient = true;
        lead.convertedAt = Date.now();
        await lead.save();

        // Create Commission records for engaged team members
        if (engagedTeam && engagedTeam.length > 0) {
            const Commission = require('../models/Commission');
            const dealValue = parseFloat(monthlyAmount || lifetimeAmount || enterpriseAmount || 0);
            
            const commissions = engagedTeam.map(item => {
                const percentage = parseFloat(item.commissionPercentage || 0);
                const calculatedAmount = (dealValue * percentage) / 100;
                
                return {
                    earnedBy: item.user,
                    clientId: client._id,
                    leadId: lead._id,
                    commissionRole: 'sales_closer_onetime', // default role
                    dealType: dealType,
                    dealAmount: dealValue,
                    commissionRate: percentage / 100, // store as decimal
                    commissionAmount: calculatedAmount,
                    status: 'pending'
                };
            });
            await Commission.insertMany(commissions);
        }

        // Points for conversion
        if (lead.submittedBy) {
            const submitter = await User.findById(lead.submittedBy);
            if (submitter) {
                submitter.points += getPointsForEvent('deal_closed');
                submitter.rank = calculateRank(submitter);
                await submitter.save();
            }
        }

        const closerId = closedBy || req.user._id;
        if (closerId && closerId !== '') {
            const closer = await User.findById(closerId);
            if (closer) {
                closer.points += getPointsForEvent('deal_closed_closer');
                closer.totalCloses += 1;
                closer.rank = calculateRank(closer);
                await closer.save();
            }
        }

        // Trigger Commission Calculation (usually async, but here sync for simplicity or trigger via dedicated route)
        // For now, return client info. commissions logic will be in another route or triggered here.
        
        // Trigger congratulations emails to engaged team
        if (engagedTeam && engagedTeam.length > 0) {
            try {
                const userIds = engagedTeam.map(item => item.user);
                const users = await User.find({ _id: { $in: userIds } }).select('email');
                const emails = users.map(u => u.email).filter(Boolean);
                if (emails.length > 0) {
                    const { sendLeadConversionEmail } = require('../utils/mailer');
                    const dealValue = parseFloat(monthlyAmount || lifetimeAmount || enterpriseAmount || 0);
                    sendLeadConversionEmail(emails, lead.companyName, dealValue, planType).catch(err => {
                        console.error('Error sending congratulations email:', err);
                    });
                }
            } catch (mailErr) {
                console.error('Failed to prepare conversion email:', mailErr);
            }
        }
        
        res.json({ success: true, data: client });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// POST /api/leads/:id/activity
router.post('/:id/activity', auth, async (req, res) => {
    const { type, description, notes } = req.body;
    try {
        const lead = await Lead.findById(req.params.id);
        if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

        const lockCheck = await checkLeadLock(req.params.id, req.user);
        if (!lockCheck.allowed) {
            return res.status(lockCheck.status || 400).json({ success: false, error: lockCheck.error });
        }

        const activity = new Activity({
            type: type || 'note',
            leadId: lead._id,
            performedBy: req.user._id,
            description: description || 'Note added',
            notes: notes
        });
        await activity.save();

        // Update last contacted details for any logged activity
        lead.lastContactedAt = Date.now();
        lead.contactedBy = req.user.name || req.user.email;
        lead.contactMethod = type || 'note';
        lead.contactedAt = Date.now();
        await lead.save();

        res.json({ success: true, data: activity });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// DELETE /api/leads/:id
router.delete('/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin' && (!req.user.permissions || !req.user.permissions.can_delete_leads)) {
        return res.status(403).json({ success: false, error: 'Access denied: Cannot delete leads.' });
    }
    try {
        const lead = await Lead.findByIdAndDelete(req.params.id);
        if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });
        // Optionally delete associated activities
        await Activity.deleteMany({ leadId: lead._id });
        res.json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// PUT /api/leads/:id/lock-verifier
router.put('/:id/lock-verifier', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      const isVerifier = Array.isArray(req.user.designation) && req.user.designation.includes('LeadVerifier');
      if (!isVerifier) {
        return res.status(403).json({ success: false, error: 'You do not have the LeadVerifier designation to claim this lead.' });
      }
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

    if (lead.workingVerifier && lead.workingVerifier.toString() !== req.user._id.toString()) {
      return res.status(400).json({ success: false, error: 'Lead is already locked by another verifier' });
    }

    lead.workingVerifier = req.user._id;
    await lead.save();

    // Log activity
    const activity = new Activity({
      type: 'lead_locked_verifier',
      leadId: lead._id,
      performedBy: req.user._id,
      description: `Verifier lock claimed by ${req.user.name}`
    });
    await activity.save();

    const populatedLead = await Lead.findById(lead._id)
      .populate('submittedBy', 'name email')
      .populate('workingVerifier', 'name email')
      .populate('workingCloser', 'name email');

    res.json({ success: true, data: populatedLead });
  } catch (err) {
    console.error("Lock verifier error:", err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/leads/:id/unlock-verifier
router.put('/:id/unlock-verifier', auth, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

    if (lead.workingVerifier && lead.workingVerifier.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'You cannot unlock a lead locked by another verifier' });
    }

    lead.workingVerifier = null;
    await lead.save();

    // Log activity
    const activity = new Activity({
      type: 'lead_unlocked_verifier',
      leadId: lead._id,
      performedBy: req.user._id,
      description: `Verifier lock released by ${req.user.name}`
    });
    await activity.save();

    const populatedLead = await Lead.findById(lead._id)
      .populate('submittedBy', 'name email')
      .populate('workingVerifier', 'name email')
      .populate('workingCloser', 'name email');

    res.json({ success: true, data: populatedLead });
  } catch (err) {
    console.error("Unlock verifier error:", err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/leads/:id/lock-closer
router.put('/:id/lock-closer', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      const isCloser = Array.isArray(req.user.designation) && req.user.designation.includes('LeadCloser');
      if (!isCloser) {
        return res.status(403).json({ success: false, error: 'You do not have the LeadCloser designation to claim this lead.' });
      }
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

    if (lead.workingCloser && lead.workingCloser.toString() !== req.user._id.toString()) {
      return res.status(400).json({ success: false, error: 'Lead is already locked by another closer' });
    }

    lead.workingCloser = req.user._id;
    await lead.save();

    // Log activity
    const activity = new Activity({
      type: 'lead_locked_closer',
      leadId: lead._id,
      performedBy: req.user._id,
      description: `Closer lock claimed by ${req.user.name}`
    });
    await activity.save();

    const populatedLead = await Lead.findById(lead._id)
      .populate('submittedBy', 'name email')
      .populate('workingVerifier', 'name email')
      .populate('workingCloser', 'name email');

    res.json({ success: true, data: populatedLead });
  } catch (err) {
    console.error("Lock closer error:", err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/leads/:id/unlock-closer
router.put('/:id/unlock-closer', auth, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

    if (lead.workingCloser && lead.workingCloser.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'You cannot unlock a lead locked by another closer' });
    }

    lead.workingCloser = null;
    await lead.save();

    // Log activity
    const activity = new Activity({
      type: 'lead_unlocked_closer',
      leadId: lead._id,
      performedBy: req.user._id,
      description: `Closer lock released by ${req.user.name}`
    });
    await activity.save();

    const populatedLead = await Lead.findById(lead._id)
      .populate('submittedBy', 'name email')
      .populate('workingVerifier', 'name email')
      .populate('workingCloser', 'name email');

    res.json({ success: true, data: populatedLead });
  } catch (err) {
    console.error("Unlock closer error:", err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
