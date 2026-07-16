const nodemailer = require('nodemailer');
const EmailAccount = require('../models/EmailAccount');

/**
 * Runs SMTP authentication check on a single account
 */
async function checkAccountHealth(accountId) {
  const account = await EmailAccount.findById(accountId);
  if (!account) return { success: false, error: 'Account not found' };

  const transporter = nodemailer.createTransport({
    host: account.smtpHost,
    port: account.smtpPort,
    secure: account.smtpSecure,
    auth: {
      user: account.smtpUser,
      pass: account.smtpPass
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    await transporter.verify();
    
    account.status = 'active';
    account.healthCheckResult = 'Handshake success';
    account.consecutiveErrors = 0;
    account.lastHealthCheck = new Date();
    await account.save();
    return { success: true };
  } catch (error) {
    account.status = 'error';
    account.healthCheckResult = error.message;
    account.lastHealthCheck = new Date();
    await account.save();
    return { success: false, error: error.message };
  }
}

/**
 * Check all SMTP accounts
 */
async function checkAllAccountsHealth() {
  const accounts = await EmailAccount.find({});
  const results = [];
  for (const account of accounts) {
    const res = await checkAccountHealth(account._id);
    results.push({ email: account.email, success: res.success, error: res.error });
  }
  return results;
}

module.exports = {
  checkAccountHealth,
  checkAllAccountsHealth
};
