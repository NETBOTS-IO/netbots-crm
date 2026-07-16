const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const Lead = require('../models/Lead');
const { auth, requireRole } = require('../middleware/auth');

const upload = multer({ dest: 'uploads/' });

// POST /api/import/leads
// Robust streaming CSV import — Admin or users with can_add_leads permission
router.post('/leads', auth, upload.single('file'), async (req, res) => {
  // Permission check: admin bypass or can_add_leads
  if (req.user.role !== 'admin' && (!req.user.permissions || !req.user.permissions.can_add_leads)) {
    return res.status(403).json({ success: false, error: 'Access denied: Cannot import leads.' });
  }
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  const isJson = req.file.originalname.endsWith('.json') || req.file.mimetype === 'application/json';

  if (isJson) {
    try {
      const fileContent = fs.readFileSync(req.file.path, 'utf8');
      const results = JSON.parse(fileContent);
      if (!Array.isArray(results)) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ success: false, error: 'JSON file must contain an array of lead objects.' });
      }

      const errors = [];
      let successCount = 0;

      for (const row of results) {
        try {
          const getValue = (keys) => {
            for (const key of keys) {
              if (row[key] !== undefined && row[key] !== null) {
                const val = String(row[key]).trim();
                if (val !== '') return val;
              }
            }
            return undefined;
          };

          const leadData = {
            companyName: getValue(['Name', 'name', 'companyName', 'Company', 'company_name']),
            contactName: getValue(['contactName', 'Contact', 'contact_name']),
            phone: getValue(['Phone', 'phone']),
            email: getValue(['Email', 'email']),
            website: getValue(['Website', 'website']),
            address: getValue(['Address', 'address']),
            instagram: getValue(['Instagram', 'instagram']),
            facebook: getValue(['Facebook', 'facebook']),
            twitter: getValue(['Twitter', 'twitter']),
            linkedin: getValue(['Linkedin', 'linkedin', 'linkedInUrl']),
            yelp: getValue(['Yelp', 'yelp']),
            youtube: getValue(['Youtube', 'youtube']),
            placeId: getValue(['PlaceID', 'PlaceId', 'placeId', 'place_id']),
            cid: getValue(['CID', 'Cid', 'cid']),
            category: getValue(['Category', 'category']),
            reviewCount: getValue(['ReviewCount', 'reviewCount', 'review_count']) ? parseInt(getValue(['ReviewCount', 'reviewCount', 'review_count']), 10) : undefined,
            averageRating: getValue(['AverageRating', 'averageRating', 'average_rating']) ? parseFloat(getValue(['AverageRating', 'averageRating', 'average_rating'])) : undefined,
            latitude: getValue(['Latitude', 'latitude']) ? parseFloat(getValue(['Latitude', 'latitude'])) : undefined,
            longitude: getValue(['Longitude', 'longitude']) ? parseFloat(getValue(['Longitude', 'longitude'])) : undefined,
            mondayHours: getValue(['1_Monday', 'mondayHours', 'Monday', 'monday_hours']),
            tuesdayHours: getValue(['2_Tuesday', 'tuesdayHours', 'Tuesday', 'tuesday_hours']),
            wednesdayHours: getValue(['3_Wednesday', 'wednesdayHours', 'Wednesday', 'wednesday_hours']),
            thursdayHours: getValue(['4_Thursday', 'thursdayHours', 'Thursday', 'thursday_hours']),
            fridayHours: getValue(['5_Friday', 'fridayHours', 'Friday', 'friday_hours']),
            saturdayHours: getValue(['6_Saturday', 'saturdayHours', 'Saturday', 'saturday_hours']),
            sundayHours: getValue(['7_Sunday', 'sundayHours', 'Sunday', 'sunday_hours']),
            submittedBy: req.user._id,
            leadCollectedBy: req.user.name || req.user.email,
            targetService: getValue(['TargetService', 'targetService', 'target_service', 'service']),
            source: 'bulk_import',
            priority: req.body.priority || 'medium',
            notes: getValue(['Notes', 'notes']) || '',
          };

          if (!leadData.companyName) {
            errors.push({ row, error: 'Missing company name' });
            continue;
          }

          const dupeQuery = { companyName: leadData.companyName };
          if (leadData.phone) {
            dupeQuery.phone = leadData.phone;
          } else if (leadData.email) {
            dupeQuery.email = leadData.email;
          }

          const existing = await Lead.findOne(dupeQuery);
          if (existing) {
            errors.push({ row, error: 'Duplicate lead' });
            continue;
          }

          const lead = new Lead(leadData);
          await lead.save();
          successCount++;
        } catch (err) {
          errors.push({ row, error: err.message });
        }
      }

      fs.unlinkSync(req.file.path);
      const duplicateCount = errors.filter(e => e.error === 'Duplicate lead').length;

      return res.json({
        success: true,
        summary: {
          total: results.length,
          success: successCount,
          failed: errors.length,
          duplicates: duplicateCount
        },
        errors: errors.slice(0, 10)
      });

    } catch (parseErr) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, error: 'Malformed JSON file: ' + parseErr.message });
    }
  }

  const results = [];
  const errors = [];
  let successCount = 0;

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      for (const row of results) {
        try {
          // Robust mapping & validation
          const getValue = (keys) => {
            for (const key of keys) {
              if (row[key] !== undefined && row[key] !== null) {
                const val = String(row[key]).trim();
                if (val !== '') return val;
              }
            }
            return undefined;
          };

            const leadData = {
            companyName: getValue(['Name', 'name', 'companyName', 'Company', 'company_name']),
            contactName: getValue(['contactName', 'Contact', 'contact_name']),
            phone: getValue(['Phone', 'phone']),
            email: getValue(['Email', 'email']),
            website: getValue(['Website', 'website']),
            address: getValue(['Address', 'address']),
            instagram: getValue(['Instagram', 'instagram']),
            facebook: getValue(['Facebook', 'facebook']),
            twitter: getValue(['Twitter', 'twitter']),
            linkedin: getValue(['Linkedin', 'linkedin', 'linkedInUrl']),
            yelp: getValue(['Yelp', 'yelp']),
            youtube: getValue(['Youtube', 'youtube']),
            placeId: getValue(['PlaceID', 'PlaceId', 'placeId', 'place_id']),
            cid: getValue(['CID', 'Cid', 'cid']),
            category: getValue(['Category', 'category']),
            reviewCount: getValue(['ReviewCount', 'reviewCount', 'review_count']) ? parseInt(getValue(['ReviewCount', 'reviewCount', 'review_count']), 10) : undefined,
            averageRating: getValue(['AverageRating', 'averageRating', 'average_rating']) ? parseFloat(getValue(['AverageRating', 'averageRating', 'average_rating'])) : undefined,
            latitude: getValue(['Latitude', 'latitude']) ? parseFloat(getValue(['Latitude', 'latitude'])) : undefined,
            longitude: getValue(['Longitude', 'longitude']) ? parseFloat(getValue(['Longitude', 'longitude'])) : undefined,
            mondayHours: getValue(['1_Monday', 'mondayHours', 'Monday', 'monday_hours']),
            tuesdayHours: getValue(['2_Tuesday', 'tuesdayHours', 'Tuesday', 'tuesday_hours']),
            wednesdayHours: getValue(['3_Wednesday', 'wednesdayHours', 'Wednesday', 'wednesday_hours']),
            thursdayHours: getValue(['4_Thursday', 'thursdayHours', 'Thursday', 'thursday_hours']),
            fridayHours: getValue(['5_Friday', 'fridayHours', 'Friday', 'friday_hours']),
            saturdayHours: getValue(['6_Saturday', 'saturdayHours', 'Saturday', 'saturday_hours']),
            sundayHours: getValue(['7_Sunday', 'sundayHours', 'Sunday', 'sunday_hours']),
            submittedBy: req.user._id, // Default to uploader
            leadCollectedBy: req.user.name || req.user.email,
            targetService: getValue(['TargetService', 'targetService', 'target_service', 'service']),
            source: 'bulk_import',
            priority: req.body.priority || 'medium',
            notes: getValue(['Notes', 'notes']) || '',
          };

          if (!leadData.companyName) {
            errors.push({ row, error: 'Missing company name' });
            continue;
          }

          // Duplicate check: same company name and either same phone or same email
          const dupeQuery = { companyName: leadData.companyName };
          if (leadData.phone) {
            dupeQuery.phone = leadData.phone;
          } else if (leadData.email) {
            dupeQuery.email = leadData.email;
          }

          const existing = await Lead.findOne(dupeQuery);
          if (existing) {
            errors.push({ row, error: 'Duplicate lead' });
            continue;
          }

          const lead = new Lead(leadData);
          await lead.save();
          successCount++;
        } catch (err) {
          errors.push({ row, error: err.message });
        }
      }

      // Cleanup
      fs.unlinkSync(req.file.path);

      const duplicateCount = errors.filter(e => e.error === 'Duplicate lead').length;

      res.json({
        success: true,
        summary: {
          total: results.length,
          success: successCount,
          failed: errors.length,
          duplicates: duplicateCount
        },
        errors: errors.slice(0, 10) // Return first 10 errors for debugging
      });
    });
});

// POST /api/import/extension-leads
// Import leads from the NetBots Chrome extension scraper
router.post('/extension-leads', auth, async (req, res) => {
  try {
    const { leads } = req.body;
    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ success: false, error: 'No leads provided.' });
    }

    let successCount = 0;
    const errors = [];

    for (const raw of leads) {
      try {
        const companyName = (raw.Name || '').trim();
        if (!companyName) {
          errors.push({ name: raw.Name, error: 'Missing company name' });
          continue;
        }

        // Duplicate check: same name + same phone
        const dupeQuery = { companyName };
        if (raw.Phone) dupeQuery.phone = raw.Phone.trim();
        const existing = await Lead.findOne(dupeQuery);
        if (existing) {
          errors.push({ name: companyName, error: 'Duplicate lead' });
          continue;
        }

        const leadData = {
          companyName,
          phone: (raw.Phone || '').trim() || undefined,
          email: (raw.Email || '').trim() || undefined,
          website: (raw.Website || '').trim() || undefined,
          address: (raw.Address || '').trim() || undefined,
          instagram: (raw.Instagram || '').trim() || undefined,
          facebook: (raw.Facebook || '').trim() || undefined,
          twitter: (raw.Twitter || '').trim() || undefined,
          linkedin: (raw.Linkedin || '').trim() || undefined,
          yelp: (raw.Yelp || '').trim() || undefined,
          youtube: (raw.Youtube || '').trim() || undefined,
          placeId: (raw.PlaceID || '').trim() || undefined,
          cid: (raw.CID || '').trim() || undefined,
          category: (raw.Category || '').trim() || undefined,
          reviewCount: raw.ReviewCount ? parseInt(raw.ReviewCount) : undefined,
          averageRating: raw.AverageRating ? parseFloat(raw.AverageRating) : undefined,
          latitude: raw.Latitude ? parseFloat(raw.Latitude) : undefined,
          longitude: raw.Longitude ? parseFloat(raw.Longitude) : undefined,
          mondayHours: raw['1_Monday'] || undefined,
          tuesdayHours: raw['2_Tuesday'] || undefined,
          wednesdayHours: raw['3_Wednesday'] || undefined,
          thursdayHours: raw['4_Thursday'] || undefined,
          fridayHours: raw['5_Friday'] || undefined,
          saturdayHours: raw['6_Saturday'] || undefined,
          sundayHours: raw['7_Sunday'] || undefined,
          submittedBy: req.user._id,
          leadCollectedBy: req.user.name || req.user.email,
          targetService: raw.TargetService || raw.targetService || raw.service || undefined,
          channel: 'google_maps_scraper',
          notes: 'Imported via NetBots Chrome Extension'
        };

        const lead = new Lead(leadData);
        await lead.save();
        successCount++;
      } catch (err) {
        errors.push({ name: raw.Name, error: err.message });
      }
    }

    res.json({
      success: true,
      summary: {
        total: leads.length,
        success: successCount,
        failed: errors.length,
        duplicates: errors.filter(e => e.error === 'Duplicate lead').length
      },
      errors: errors.slice(0, 10)
    });
  } catch (err) {
    console.error('Extension import error:', err);
    res.status(500).json({ success: false, error: 'Server error during import.' });
  }
});

module.exports = router;
