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
        contact = 'all'
    } = req.query;

    let baseQuery = {};
    if (req.user.role === 'lead_gen') {
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

    // Calculate stats
    const periodLeads = await Lead.find(statsQuery).select('lastContactedAt temperature stage followUpDate');
    const totalLeadsCount = periodLeads.length;
    let contactedCount = 0;
    let commitmentsCount = 0;
    let followUpCount = 0;

    const isWithinPeriodBackend = (dateVal, pRange) => {
        if (!dateVal) return false;
        if (!pRange) return true; // 'all'
        return dateVal >= pRange.$gte && dateVal <= (pRange.$lte || new Date());
    };

    periodLeads.forEach(l => {
        if (isWithinPeriodBackend(l.lastContactedAt, periodRange)) contactedCount++;
        if (l.temperature === 'sql' || l.stage === 'close') commitmentsCount++;
        if (l.followUpDate && isWithinPeriodBackend(l.followUpDate, periodRange)) followUpCount++;
    });

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
    if (stage !== 'all') query.stage = stage;
    if (temp !== 'all') query.temperature = temp;
    
    if (contact === 'contacted_today') {
        query.lastContactedAt = getPeriodRange('today');
    } else if (contact === 'needs_followup') {
        const todayStart = new Date(new Date().setHours(0,0,0,0));
        query.followUpDate = { $gte: todayStart };
    } else if (contact === 'commitments') {
        query.$or = [...(query.$or || []), { temperature: 'sql' }, { stage: 'close' }];
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let leads = await Lead.find(query)
        .populate('submittedBy', 'name email')
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
      submittedBy: req.user._id
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
    req.user.totalLeadsSubmitted += 1;
    req.user.points += getPointsForEvent('lead_submitted');
    req.user.rank = calculateRank(req.user);
    await req.user.save();

    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/leads/:id
// get single lead + full activity timeline
router.get('/:id', auth, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).populate('submittedBy assignedCloser caPartner');
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

    // Ownership check
    if (req.user.role !== 'admin' && req.user.role !== 'sales') {
        const isOwner = lead.submittedBy?._id.toString() === req.user._id.toString();
        const isAssigned = lead.assignedCloser?._id.toString() === req.user._id.toString();
        const isPartner = lead.caPartner?._id.toString() === req.user._id.toString();
        
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
  if (req.user.role !== 'admin' && (!req.user.permissions || !req.user.permissions.can_edit_leads)) {
      return res.status(403).json({ success: false, error: 'Access denied: Cannot edit leads.' });
  }
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/leads/:id/stage
router.put('/:id/stage', auth, async (req, res) => {
  if (req.user.role !== 'admin' && (!req.user.permissions || !req.user.permissions.can_edit_leads)) {
      return res.status(403).json({ success: false, error: 'Access denied: Cannot edit lead stages.' });
  }
  const { stage } = req.body;
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

    const oldStage = lead.stage;
    lead.stage = stage;
    lead.stageEnteredAt = Date.now();
    
    // Auto temp update if stage is close or beyond
    if (stage === 'close') lead.temperature = 'sql';
    if (stage === 'onboard') lead.temperature = 'closed';

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

// POST /api/leads/:id/convert
router.post('/:id/convert', auth, requireRole(['admin', 'sales']), async (req, res) => {
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
        
        lead.temperature = 'closed';
        lead.stage = 'onboard';
        lead.convertedToClient = true;
        lead.convertedAt = Date.now();
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
            engagedTeam: engagedTeam || []
        });
        await client.save();
        
        lead.clientId = client._id;
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
        const submitter = await User.findById(lead.submittedBy);
        submitter.points += getPointsForEvent('deal_closed');
        submitter.rank = calculateRank(submitter);
        await submitter.save();

        if (closedBy) {
            const closer = await User.findById(closedBy);
            closer.points += getPointsForEvent('deal_closed_closer');
            closer.totalCloses += 1;
            closer.rank = calculateRank(closer);
            await closer.save();
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

        const activity = new Activity({
            type: type || 'note',
            leadId: lead._id,
            performedBy: req.user._id,
            description: description || 'Note added',
            notes: notes
        });
        await activity.save();

        // Update last contacted if it's a contact type
        if (['call', 'email', 'meeting'].includes(type)) {
            lead.lastContactedAt = Date.now();
            await lead.save();
        }

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

module.exports = router;
