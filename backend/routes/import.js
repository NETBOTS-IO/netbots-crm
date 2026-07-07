const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const Lead = require('../models/Lead');
const { auth, requireRole } = require('../middleware/auth');

const upload = multer({ dest: 'uploads/' });

// POST /api/import/leads
// Robust streaming CSV import
router.post('/leads', auth, requireRole(['ceo', 'admin']), upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
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
            source: 'bulk_import',
            notes: getValue(['Notes', 'notes']) || '',
          };

          if (!leadData.companyName) {
            errors.push({ row, error: 'Missing company name' });
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

      res.json({
        success: true,
        summary: {
          total: results.length,
          success: successCount,
          failed: errors.length
        },
        errors: errors.slice(0, 10) // Return first 10 errors for debugging
      });
    });
});

module.exports = router;
