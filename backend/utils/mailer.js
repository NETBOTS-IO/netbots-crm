const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || 'crm@netbots.io',
        pass: process.env.SMTP_PASS || 'CRM-NetBots@110'
    }
});

// Helper to send emails
const sendMail = async (to, subject, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"NetBots CRM" <${process.env.SMTP_USER || 'crm@netbots.io'}>`,
            to,
            subject,
            html
        });
        console.log('Email sent: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Mail sending failed:', error);
        return { success: false, error };
    }
};

/**
 * Sends the Daily Activity Summary to Admin
 */
const sendDailySummary = async (adminEmail, data) => {
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">NetBots CRM Daily Activity Report</h2>
        <p style="font-size: 14px; color: #4b5563;">Here is the daily overview of activity for <strong>${new Date().toLocaleDateString()}</strong>:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr style="background-color: #f8fafc;">
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">New Leads Added Today</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 16px; font-weight: bold; color: #2563eb; text-align: right;">${data.newLeads}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Leads Contacted Today</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 16px; font-weight: bold; color: #d97706; text-align: right;">${data.contactedLeads}</td>
            </tr>
            <tr style="background-color: #f8fafc;">
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">SQLs / Closures Today</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 16px; font-weight: bold; color: #059669; text-align: right;">${data.closedLeads}</td>
            </tr>
        </table>
        
        <div style="margin-top: 25px; font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px;">
            <p>Property of NetBots (SMC-Private) Limited</p>
        </div>
    </div>
    `;
    return sendMail(adminEmail, `Daily Activity Summary - ${new Date().toLocaleDateString()}`, html);
};

/**
 * Sends a Lead Conversion Congratulatory Email to Engaged Team Members
 */
const sendLeadConversionEmail = async (emails, clientName, dealValue, planType) => {
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="text-align: center; padding-bottom: 20px;">
            <h1 style="color: #059669; margin-bottom: 5px;">🎉 Deal Closed!</h1>
            <p style="font-size: 16px; color: #4b5563; font-weight: bold; margin-top: 0;">Congratulations to the team!</p>
        </div>
        <p style="font-size: 14px; color: #374151;">We are excited to announce that <strong>${clientName}</strong> has been officially closed and converted into an active customer.</p>
        
        <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h4 style="margin: 0 0 5px 0; color: #065f46; font-size: 14px;">Deal Highlights:</h4>
            <p style="margin: 3px 0; font-size: 13px; color: #047857;"><strong>Plan:</strong> ${planType.replace(/_/g, ' ').toUpperCase()}</p>
            <p style="margin: 3px 0; font-size: 13px; color: #047857;"><strong>Deal Value:</strong> $${dealValue.toLocaleString()}</p>
        </div>

        <p style="font-size: 14px; color: #374151;">Thank you for your hard work and contribution to making this conversion possible. Let's keep the momentum going!</p>
        
        <div style="margin-top: 25px; font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px;">
            <p>Property of NetBots (SMC-Private) Limited</p>
        </div>
    </div>
    `;
    return sendMail(emails.join(','), `🎉 Congrats! Deal Closed: ${clientName}`, html);
};

/**
 * Sends the Monthly Progress Report to a Team Member
 */
const sendMonthlyProgressEmail = async (email, memberName, data) => {
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Monthly Performance Summary</h2>
        <p style="font-size: 14px; color: #4b5563;">Hi <strong>${memberName}</strong>,</p>
        <p style="font-size: 14px; color: #4b5563;">Here is your performance summary for the past month:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr style="background-color: #f8fafc;">
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Rank</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 14px; font-weight: bold; color: #1e3a8a; text-align: right; text-transform: uppercase;">${data.rank}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Total Points</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 14px; font-weight: bold; color: #374151; text-align: right;">${data.points}</td>
            </tr>
            <tr style="background-color: #f8fafc;">
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Total Leads Submitted</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 14px; font-weight: bold; color: #374151; text-align: right;">${data.totalLeadsSubmitted}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Total SQLs Generated</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 14px; font-weight: bold; color: #374151; text-align: right;">${data.totalSQLs}</td>
            </tr>
            <tr style="background-color: #f8fafc;">
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Total Closes</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 14px; font-weight: bold; color: #374151; text-align: right;">${data.totalCloses}</td>
            </tr>
        </table>
        
        <p style="font-size: 14px; color: #4b5563; margin-top: 20px;">Keep up the great work in the coming month!</p>
        
        <div style="margin-top: 25px; font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px;">
            <p>Property of NetBots (SMC-Private) Limited</p>
        </div>
    </div>
    `;
    return sendMail(email, `Monthly Performance Report - ${memberName}`, html);
};

const sendMailWithAttachment = async (to, subject, html, attachments = []) => {
    try {
        const info = await transporter.sendMail({
            from: `"NetBots CRM" <${process.env.SMTP_USER || 'crm@netbots.io'}>`,
            to,
            subject,
            html,
            attachments
        });
        console.log('Email sent: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Mail sending failed:', error);
        return { success: false, error };
    }
};

/**
 * Sends a Follow-Up Reminder Email to a closer
 */
const sendFollowUpReminderEmail = async (email, memberName, lead) => {
    const followUpDateStr = lead.followUpDate ? new Date(lead.followUpDate).toLocaleString() : 'N/A';
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #dc2626; border-bottom: 2px solid #ef4444; padding-bottom: 10px;">⏰ Follow-Up Reminder</h2>
        <p style="font-size: 14px; color: #4b5563;">Hi <strong>${memberName}</strong>,</p>
        <p style="font-size: 14px; color: #4b5563;">This is a reminder that you have an upcoming follow-up scheduled for the following lead:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr style="background-color: #f8fafc;">
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Company Name</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 14px; color: #1e3a8a; text-align: right; font-weight: bold;">${lead.companyName}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Contact Person</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 14px; color: #374151; text-align: right;">${lead.contactName || 'N/A'}</td>
            </tr>
            <tr style="background-color: #f8fafc;">
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Phone</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 14px; color: #374151; text-align: right;">${lead.phone || 'N/A'}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Email</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 14px; color: #374151; text-align: right;">${lead.email || 'N/A'}</td>
            </tr>
            <tr style="background-color: #f8fafc;">
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Follow-Up Date & Time</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 14px; font-weight: bold; color: #b91c1c; text-align: right;">${followUpDateStr}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Priority</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 14px; font-weight: bold; text-transform: uppercase; color: #374151; text-align: right;">${lead.priority || 'medium'}</td>
            </tr>
        </table>
        
        <p style="font-size: 14px; color: #4b5563; margin-top: 20px;">Please click the link below to view details and update the lead status:</p>
        <div style="text-align: center; margin-top: 15px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/leads/details/${lead._id}" 
               style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
               View Lead Details
            </a>
        </div>
        
        <div style="margin-top: 25px; font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px;">
            <p>Property of NetBots (SMC-Private) Limited</p>
        </div>
    </div>
    `;
    return sendMail(email, `⏰ Follow-Up Reminder: ${lead.companyName}`, html);
};

module.exports = {
    sendMail,
    sendMailWithAttachment,
    sendDailySummary,
    sendLeadConversionEmail,
    sendMonthlyProgressEmail,
    sendFollowUpReminderEmail
};
