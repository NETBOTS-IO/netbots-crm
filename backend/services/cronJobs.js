const cron = require('node-cron');
const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const User = require('../models/User');
const { sendDailySummary, sendMonthlyProgressEmail, sendFollowUpReminderEmail } = require('../utils/mailer');

const initCronJobs = () => {
    // 1. Daily Summary at 6:00 AM
    cron.schedule('0 6 * * *', async () => {
        console.log('Running Daily Admin Summary Cron Job...');
        try {
            const yesterday = new Date();
            yesterday.setHours(yesterday.getHours() - 24);

            // Fetch new leads created in last 24h
            const newLeads = await Lead.countDocuments({ createdAt: { $gte: yesterday } });

            // Fetch leads contacted in last 24h
            const contactedLeads = await Lead.countDocuments({ lastContactedAt: { $gte: yesterday } });

            // Fetch leads closed in last 24h
            const closedLeads = await Lead.countDocuments({ stage: 'onboard', convertedAt: { $gte: yesterday } });

            const adminEmail = process.env.ADMIN_EMAIL || 'saqlainshahbaltee@gmail.com';

            await sendDailySummary(adminEmail, {
                newLeads,
                contactedLeads,
                closedLeads
            });
            console.log('Daily Admin Summary sent successfully.');
        } catch (error) {
            console.error('Failed to run Daily Summary Cron:', error);
        }
    });

    // 2. Monthly Team Member Summary at 00:00 on the 1st day of every month
    cron.schedule('0 0 1 * *', async () => {
        console.log('Running Monthly Team Performance Summaries Cron Job...');
        try {
            const users = await User.find({ isActive: true });
            
            for (const user of users) {
                if (!user.email) continue;
                
                const progressData = {
                    rank: user.rank || 'rookie',
                    points: user.points || 0,
                    totalLeadsSubmitted: user.totalLeadsSubmitted || 0,
                    totalSQLs: user.totalSQLs || 0,
                    totalCloses: user.totalCloses || 0
                };
                
                await sendMonthlyProgressEmail(user.email, user.name, progressData);
                console.log(`Monthly Progress sent to ${user.name} (${user.email})`);
            }
            console.log('Monthly Performance Summaries completed.');
        } catch (error) {
            console.error('Failed to run Monthly Summaries Cron:', error);
        }
    });

    // 3. Hourly Lead Follow-Up Reminders
    cron.schedule('0 * * * *', async () => {
        console.log('Running Hourly Lead Follow-Up Reminders Cron Job...');
        try {
            const now = new Date();
            const tomorrow = new Date();
            tomorrow.setHours(tomorrow.getHours() + 24);

            // Fetch leads that have followUpDate in the next 24 hours, aren't converted, and reminder hasn't been sent
            const leadsToRemind = await Lead.find({
                followUpDate: { $gte: now, $lte: tomorrow },
                convertedToClient: { $ne: true },
                followUpReminderSent: { $ne: true }
            }).populate('workingCloser assignedCloser');

            for (const lead of leadsToRemind) {
                // Find closer user to remind: workingCloser first, then assignedCloser
                const closer = lead.workingCloser || lead.assignedCloser;
                if (closer && closer.email) {
                    await sendFollowUpReminderEmail(closer.email, closer.name, lead);
                    lead.followUpReminderSent = true;
                    await lead.save();
                    console.log(`Follow-up reminder sent to ${closer.name} for lead ${lead.companyName}`);
                }
            }
        } catch (error) {
            console.error('Failed to run Hourly Follow-up Reminder Cron:', error);
        }
    });

    // 4. Sequence automation engine processing loop (runs every minute)
    cron.schedule('*/1 * * * *', async () => {
        try {
            const { processActiveEnrollments } = require('./sequenceEngine');
            await processActiveEnrollments();
        } catch (error) {
            console.error('Failed to run Sequence Engine Cron:', error);
        }
    });

    // 5. Incoming SMTP IMAP Inbox check for reply tracking (runs every 10 minutes)
    cron.schedule('*/10 * * * *', async () => {
        try {
            const { checkAllIncomingReplies } = require('./replyChecker');
            await checkAllIncomingReplies();
        } catch (error) {
            console.error('Failed to run Reply Checker IMAP Cron:', error);
        }
    });

    // 6. Warmup engine sending loop (runs hourly)
    cron.schedule('0 * * * *', async () => {
        try {
            const { processWarmup } = require('./warmupEngine');
            await processWarmup();
        } catch (error) {
            console.error('Failed to run Warmup Engine Cron:', error);
        }
    });
};

module.exports = { initCronJobs };
