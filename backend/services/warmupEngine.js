const EmailAccount = require('../models/EmailAccount');
const nodemailer = require('nodemailer');

const WARMUP_TEMPLATES = [
  {
    subject: "Meeting sync next week?",
    body: "Hi,\n\nHope you are having a productive week. Are we still on for the quick sync next Tuesday afternoon? Let me know if that time still works for you.\n\nBest regards,\n{{fromName}}"
  },
  {
    subject: "Feedback on the updated layout proposal",
    body: "Hello,\n\nI reviewed the updated layouts you sent over yesterday. The color scheme looks great and the structure is much cleaner. I think we are ready to proceed with development.\n\nThanks,\n{{fromName}}"
  },
  {
    subject: "Confirming contact details",
    body: "Hi,\n\nJust wanted to confirm that I have updated your contact details in our system. Let me know if there are any other modifications needed before the project kick-off.\n\nCheers,\n{{fromName}}"
  },
  {
    subject: "Quick question about the pricing details",
    body: "Hey there,\n\nCould you please send over the latest pricing sheet for the restaurant menu buildout? I want to make sure we align on the commission-free pricing points.\n\nBest,\n{{fromName}}"
  },
  {
    subject: "Following up on our last call",
    body: "Hi,\n\nJust following up on the discussion we had last week. Have you had a chance to review the proposal? Happy to jump on a quick 15-minute call to answer any questions.\n\nRegards,\n{{fromName}}"
  },
  {
    subject: "Invoice for Project Milestone 2",
    body: "Hello,\n\nPlease find attached the invoice for Milestone 2 of the project. Payment is due within 7 business days. Let me know if you have any questions.\n\nThank you,\n{{fromName}}"
  },
  {
    subject: "Update on the onboarding process",
    body: "Hi there,\n\nJust a quick update — the onboarding documents have been prepared and will be sent over by end of day. Please make sure to complete the required forms before the training session.\n\nKind regards,\n{{fromName}}"
  },
  {
    subject: "Checking in — any updates?",
    body: "Hello,\n\nHope everything is going well on your end. Wanted to check in and see if there are any updates on the pending deliverables. Let me know when you get a chance.\n\nBest,\n{{fromName}}"
  }
];

function getDailyTarget(dayCount) {
  if (dayCount <= 3) return 10;
  if (dayCount <= 10) return 20;
  if (dayCount <= 17) return 30;
  if (dayCount <= 24) return 40;
  return 55;
}

/**
 * Create a nodemailer transporter for a given account
 */
function createTransporter(account) {
  return nodemailer.createTransport({
    host: account.smtpHost,
    port: account.smtpPort,
    secure: account.smtpSecure,
    auth: {
      user: account.smtpUser,
      pass: account.smtpPass
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000
  });
}

/**
 * Send a single warmup email from one account to a recipient
 */
async function sendWarmupEmail(fromAccount, recipientEmail) {
  const template = WARMUP_TEMPLATES[Math.floor(Math.random() * WARMUP_TEMPLATES.length)];
  const subject = template.subject;
  const body = template.body.replace(/{{fromName}}/g, fromAccount.fromName || 'Team');

  const transporter = createTransporter(fromAccount);

  await transporter.sendMail({
    from: `"${fromAccount.fromName}" <${fromAccount.email}>`,
    to: recipientEmail,
    subject: subject,
    text: body
  });
}

async function processWarmup() {
  console.log('[WarmupEngine] Running Email Warmup Engine...');

  const warmingAccounts = await EmailAccount.find({ isWarmingUp: true });
  if (warmingAccounts.length === 0) {
    console.log('[WarmupEngine] No accounts currently in warmup mode.');
    return;
  }

  // All accounts available as potential recipients (including non-warming ones)
  const allAccounts = await EmailAccount.find({});
  if (allAccounts.length === 0) return;

  for (const account of warmingAccounts) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let lastSent = account.lastSentAt ? new Date(account.lastSentAt) : null;
    if (lastSent) lastSent.setHours(0, 0, 0, 0);

    // New day? Reset daily counter and increment day count
    if (!lastSent || lastSent.getTime() < today.getTime()) {
      account.warmUpDayCount = (account.warmUpDayCount || 0) + 1;
      account.sentToday = 0;
    }

    const target = getDailyTarget(account.warmUpDayCount);
    account.warmUpDailyTarget = target;
    await account.save();

    if (account.sentToday >= target) {
      console.log(`[WarmupEngine] ${account.email} already reached daily target of ${target}. Skipping.`);
      continue;
    }

    // Build peer list: all OTHER accounts (both warming and non-warming)
    let peers = allAccounts.filter(a => a.email !== account.email);

    // If no peers at all, fall back to seed address
    if (peers.length === 0) {
      peers = [{ email: 'warmup-seed@netbots.io' }];
    }

    // Shuffle peers for variety
    for (let i = peers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [peers[i], peers[j]] = [peers[j], peers[i]];
    }

    // Send to as many peers as possible until daily target is reached
    const emailsRemaining = target - account.sentToday;
    const peersToEmail = peers.slice(0, emailsRemaining);

    console.log(`[WarmupEngine] ${account.email} — Day ${account.warmUpDayCount}, Target: ${target}, Remaining: ${emailsRemaining}, Sending to ${peersToEmail.length} peer(s).`);

    let successCount = 0;
    let failCount = 0;

    for (const peer of peersToEmail) {
      try {
        const recipientEmail = peer.email;
        await sendWarmupEmail(account, recipientEmail);
        account.sentToday += 1;
        account.lastSentAt = new Date();
        account.status = 'warming_up';
        account.consecutiveErrors = 0; // reset on success
        await account.save();
        successCount++;
        console.log(`[WarmupEngine] ✓ Sent from ${account.email} → ${recipientEmail} (${account.sentToday}/${target})`);

        // Small delay between emails to avoid SMTP rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
      } catch (err) {
        failCount++;
        console.error(`[WarmupEngine] ✗ Failed from ${account.email} → ${peer.email}:`, err.message);
        account.consecutiveErrors = (account.consecutiveErrors || 0) + 1;
        if (account.consecutiveErrors >= 3) {
          account.status = 'error';
          account.healthCheckResult = `Warmup failure: ${err.message}`;
          await account.save();
          console.error(`[WarmupEngine] ⚠ ${account.email} marked as ERROR after 3 consecutive failures.`);
          break; // stop sending from this account
        }
        await account.save();
      }
    }

    console.log(`[WarmupEngine] ${account.email} done — ${successCount} sent, ${failCount} failed. Progress: ${account.sentToday}/${target} for Day ${account.warmUpDayCount}.`);
  }

  console.log('[WarmupEngine] Warmup cycle complete.');
}

module.exports = { processWarmup };
