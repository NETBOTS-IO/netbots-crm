const Imap = require('node-imap');
const { simpleParser } = require('mailparser');
const EmailAccount = require('../models/EmailAccount');
const EmailLog = require('../models/EmailLog');

/**
 * Checks a single SMTP account inbox via IMAP for replies
 */
async function checkRepliesForAccount(account) {
  // If SMTP port is 465, IMAP port is usually 993 (SSL)
  const imapHost = account.smtpHost.replace('smtp.', 'imap.');
  const config = {
    user: account.smtpUser,
    password: account.smtpPass,
    host: imapHost,
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
  };

  const imap = new Imap(config);

  return new Promise((resolve) => {
    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          imap.end();
          return resolve({ success: false, error: err.message });
        }

        // Search for unread messages received within the last 7 days
        const delay = new Date();
        delay.setDate(delay.getDate() - 7);
        
        imap.search(['UNSEEN', ['SINCE', delay]], (err, results) => {
          if (err || !results || results.length === 0) {
            imap.end();
            return resolve({ success: true, count: 0 });
          }

          const f = imap.fetch(results, { bodies: '' });
          let processed = 0;

          f.on('message', (msg, seqno) => {
            msg.on('body', (stream, info) => {
              simpleParser(stream, async (err, parsed) => {
                if (err) return;
                
                const inReplyTo = parsed.inReplyTo;
                const replyToMessageId = parsed.headers.get('in-reply-to');
                const targetMessageId = inReplyTo || replyToMessageId;

                if (targetMessageId) {
                  // Find matching EmailLog by messageId
                  const log = await EmailLog.findOne({
                    messageId: targetMessageId,
                    replied: false
                  });

                  if (log) {
                    log.replied = true;
                    log.repliedAt = parsed.date || new Date();
                    log.replyContent = parsed.text ? parsed.text.substring(0, 500) : '';
                    log.replyMessageId = parsed.messageId;
                    log.status = 'replied';
                    await log.save();

                    // Denormalize/Trigger logic for sequences can go here
                    console.log(`Detected reply from ${log.recipientEmail} for campaign/sequence`);
                  }
                }
              });
            });
          });

          f.once('error', (err) => {
            console.error('Fetch error:', err.message);
          });

          f.once('end', () => {
            imap.end();
            resolve({ success: true, count: results.length });
          });
        });
      });
    });

    imap.once('error', (err) => {
      resolve({ success: false, error: err.message });
    });

    imap.connect();
  });
}

/**
 * Poll all active accounts for replies
 */
async function checkAllIncomingReplies() {
  const accounts = await EmailAccount.find({ status: 'active' });
  for (const account of accounts) {
    try {
      await checkRepliesForAccount(account);
    } catch (e) {
      console.error(`IMAP check failed for ${account.email}:`, e.message);
    }
  }
}

module.exports = {
  checkRepliesForAccount,
  checkAllIncomingReplies
};
