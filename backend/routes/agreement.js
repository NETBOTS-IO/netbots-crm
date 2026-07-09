const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { auth } = require('../middleware/auth');

// POST /api/agreement/sign
router.post('/sign', auth, async (req, res) => {
  const { pdfBase64 } = req.body;
  if (!pdfBase64) {
    return res.status(400).json({ success: false, error: 'PDF data is required.' });
  }

  try {
    // 1. Ensure directory exists
    const dir = path.join(__dirname, '..', 'uploads', 'agreements');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 2. Decode and save PDF
    const filename = `agreement_${req.user._id}_${Date.now()}.pdf`;
    const filepath = path.join(dir, filename);
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    fs.writeFileSync(filepath, pdfBuffer);

    // 3. Update User Document
    const user = await User.findById(req.user._id);
    user.agreementSigned = true;
    user.agreementSignedAt = Date.now();
    user.agreementPdfPath = `/uploads/agreements/${filename}`;
    await user.save();

    // Send visual signed copy via email
    try {
        const { sendMailWithAttachment } = require('../utils/mailer');
        const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">New Onboarding Contractor Sign-off</h2>
            <p style="font-size: 14px; color: #4b5563;">Contractor <strong>${user.name}</strong> (${user.email}) has signed the Independent Contractor Agreement.</p>
            <p style="font-size: 14px; color: #4b5563;"><strong>Designation:</strong> ${user.designation || 'Staff'}</p>
            <p style="font-size: 14px; color: #4b5563;"><strong>Date Signed:</strong> ${new Date().toLocaleString()}</p>
            <p style="font-size: 14px; color: #4b5563;">Attached is the generated PDF containing the agreement terms and their webcam selfie capture.</p>
            <div style="margin-top: 25px; font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px;">
                <p>Property of Net Bots  (SMC-PRIVATE) LIMITED</p>
            </div>
        </div>
        `;
        await sendMailWithAttachment(
            'saqlainshahbaltee@gmail.com',
            `Onboarding Contract Signed - ${user.name}`,
            emailHtml,
            [{ filename: `Signed_Agreement_${user.name.replace(/\s+/g, '_')}.pdf`, content: pdfBuffer }]
        );
    } catch (mailErr) {
        console.error('Failed to email signed contract PDF', mailErr);
    }

    // 4. Log Contract Signed Activity
    const activity = new Activity({
      type: 'note',
      performedBy: req.user._id,
      description: `Signed Independent Contractor Agreement with live camera selfie verification.`
    });
    await activity.save();

    console.log(`[Agreement] Successfully saved agreement PDF for user: ${req.user.name} (${req.user.email})`);
    
    res.json({ 
      success: true, 
      message: 'Agreement signed and uploaded successfully.',
      pdfPath: user.agreementPdfPath
    });

  } catch (err) {
    console.error('Failed to save agreement PDF', err);
    res.status(500).json({ success: false, error: 'Server error saving agreement.' });
  }
});

module.exports = router;
