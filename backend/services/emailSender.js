const nodemailer = require('nodemailer');
const EmailAccount = require('../models/EmailAccount');
const EmailLog = require('../models/EmailLog');
const Unsubscribe = require('../models/Unsubscribe');

/**
 * Get the next available SMTP account from the pool
 * Sorted by remaining limit descending, then priority descending
 */
async function fnGetNextSmtpAccount() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find active accounts
  const accounts = await EmailAccount.find({
    status: 'active'
  });

  // Filter and reset limit count if needed
  const availableAccounts = [];
  for (const account of accounts) {
    let resetNeeded = false;
    if (!account.lastResetAt) {
      resetNeeded = true;
    } else {
      const resetDate = new Date(account.lastResetAt);
      resetDate.setHours(0, 0, 0, 0);
      if (resetDate.getTime() < today.getTime()) {
        resetNeeded = true;
      }
    }

    if (resetNeeded) {
      account.sentToday = 0;
      account.lastResetAt = new Date();
      await account.save();
    }

    if (account.sentToday < account.dailyLimit) {
      availableAccounts.push(account);
    } else {
      // Mark as exhausted temporarily
      account.status = 'exhausted';
      await account.save();
    }
  }

  // Restore exhausted accounts if new day
  const exhausted = await EmailAccount.find({ status: 'exhausted' });
  for (const account of exhausted) {
    const resetDate = new Date(account.lastResetAt || 0);
    resetDate.setHours(0, 0, 0, 0);
    if (resetDate.getTime() < today.getTime()) {
      account.sentToday = 0;
      account.status = 'active';
      account.lastResetAt = new Date();
      await account.save();
      availableAccounts.push(account);
    }
  }

  if (availableAccounts.length === 0) {
    return null;
  }

  // Sort by capacity remaining (dailyLimit - sentToday) desc, priority desc
  availableAccounts.sort((a, b) => {
    const capA = a.dailyLimit - a.sentToday;
    const capB = b.dailyLimit - b.sentToday;
    if (capA !== capB) return capB - capA;
    return b.priority - a.priority;
  });

  return availableAccounts[0];
}

/**
 * Replace placeholders in template content with Lead details
 */
function replaceMergeTags(html, lead) {
  if (!html) return '';
  let text = html;
  
  const placeholders = {
    '{{firstName}}': lead.contactName || lead.companyName || 'Valued Customer',
    '{{companyName}}': lead.companyName || 'your company',
    '{{email}}': lead.email || '',
    '{{phone}}': lead.phone || '',
    '{{stage}}': lead.stage || '',
    '{{priority}}': lead.priority || ''
  };

  for (const [key, value] of Object.entries(placeholders)) {
    text = text.replaceAll(key, value);
  }
  
  return text;
}

/**
 * Send an email using pool rotation
 */
async function sendRotatedEmail({ recipient, subject, htmlContent, campaignId, sequenceId, sequenceStepId }) {
  // Check global suppression list
  const isSuppressed = await Unsubscribe.findOne({ email: recipient.email.toLowerCase() });
  if (isSuppressed) {
    console.log(`Skipping suppressed address: ${recipient.email}`);
    return { success: false, reason: 'suppressed' };
  }

  const smtpAccount = await fnGetNextSmtpAccount();
  if (!smtpAccount) {
    console.error('All SMTP accounts are exhausted or error-state.');
    return { success: false, reason: 'no_available_smtp_accounts' };
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: smtpAccount.smtpHost,
    port: smtpAccount.smtpPort,
    secure: smtpAccount.smtpSecure, // true for 465, false for other ports
    auth: {
      user: smtpAccount.smtpUser,
      pass: smtpAccount.smtpPass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // Custom link click redirect & open tracking ID
  const emailLog = new EmailLog({
    campaignId,
    sequenceId,
    sequenceStepId,
    recipientEmail: recipient.email,
    recipientName: recipient.contactName || recipient.companyName,
    recipientType: recipient.schema ? 'lead' : 'manual',
    recipientId: recipient._id,
    accountId: smtpAccount._id,
    fromEmail: smtpAccount.email,
    status: 'queued'
  });

  await emailLog.save();

  // Inject Open Tracking Pixel
  const trackingHost = process.env.BACKEND_URL || 'http://localhost:5000';
  const openPixel = `<img src="${trackingHost}/api/email-webhooks/open/${emailLog._id}" width="1" height="1" style="display:none;" />`;
  
  // Replace placeholders
  let customizedHtml = replaceMergeTags(htmlContent, recipient);
  
  // Rewrites links with tracking redirect endpoint
  const linkRegex = /href="([^"]+)"/g;
  let linkIndex = 0;
  customizedHtml = customizedHtml.replace(linkRegex, (match, url) => {
    // Avoid tracking unsubscribe url or anchors
    if (url.includes('/unsubscribe') || url.startsWith('#') || url.startsWith('mailto:')) {
      return match;
    }
    const trackingUrl = `${trackingHost}/api/email-webhooks/click/${emailLog._id}/${linkIndex}?dest=${encodeURIComponent(url)}`;
    linkIndex++;
    return `href="${trackingUrl}"`;
  });

  // Append unsubscribe link and pixel
  const unsubLink = `${trackingHost}/api/email-webhooks/unsubscribe/${emailLog._id}`;
  customizedHtml += `<br/><hr/><p style="font-size:11px;color:#999;text-align:center;">
    You are receiving this because you signed up with us. 
    <a href="${unsubLink}" target="_blank">Unsubscribe here</a>.
  </p>${openPixel}`;

  try {
    const mailOptions = {
      from: `"${smtpAccount.fromName}" <${smtpAccount.email}>`,
      to: recipient.email,
      replyTo: smtpAccount.replyTo || smtpAccount.email,
      subject: replaceMergeTags(subject, recipient),
      html: customizedHtml,
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Update SMTP limits and logs
    smtpAccount.sentToday += 1;
    smtpAccount.lastSentAt = new Date();
    smtpAccount.consecutiveErrors = 0; // reset
    await smtpAccount.save();

    emailLog.status = 'sent';
    emailLog.messageId = info.messageId;
    emailLog.sentAt = new Date();
    await emailLog.save();

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Failed sending to ${recipient.email} via ${smtpAccount.email}:`, error.message);
    
    smtpAccount.consecutiveErrors += 1;
    if (smtpAccount.consecutiveErrors >= 3) {
      smtpAccount.status = 'error';
      smtpAccount.healthCheckResult = error.message;
    }
    await smtpAccount.save();

    emailLog.status = 'failed';
    emailLog.errorMessage = error.message;
    await emailLog.save();

    return { success: false, error: error.message };
  }
}

module.exports = {
  fnGetNextSmtpAccount,
  sendRotatedEmail,
  replaceMergeTags
};
