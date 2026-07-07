const cron = require('node-cron');
const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const User = require('../models/User');
const { sendDailySummary, sendMonthlyProgressEmail } = require('../utils/mailer');

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
};

module.exports = { initCronJobs };
