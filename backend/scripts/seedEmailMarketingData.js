module.paths.push('e:/products/netbots-crm/backend/node_modules');
const mongoose = require('mongoose');
require('dotenv').config({ path: 'e:/products/netbots-crm/backend/.env' });

const EmailAccount = require('../models/EmailAccount');
const EmailTemplate = require('../models/EmailTemplate');
const EmailList = require('../models/EmailList');
const EmailSegment = require('../models/EmailSegment');
const EmailSequence = require('../models/EmailSequence');
const EmailCampaign = require('../models/EmailCampaign');
const User = require('../models/User');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/netbots_crm';

async function seed() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  let user = await User.findOne({});
  if (!user) {
    user = new User({
      name: 'Admin Shah',
      email: 'admin@netbots.io',
      password: 'password123',
      role: 'admin'
    });
    await user.save();
  }
  const userId = user._id;

  console.log('Clearing old email marketing seed data...');
  await EmailAccount.deleteMany({ name: /Seed/ });
  await EmailTemplate.deleteMany({ name: /Seed/ });
  await EmailList.deleteMany({ name: /Seed/ });
  await EmailSegment.deleteMany({ name: /Seed/ });
  await EmailSequence.deleteMany({ name: /Seed/ });
  await EmailCampaign.deleteMany({ name: /Seed/ });

  // 1. Email Accounts
  console.log('Seeding Email Accounts...');
  const acc1 = new EmailAccount({
    name: 'Seed Gmail Outreach Rotation',
    email: 'outbound-rotation1@netbots.io',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    smtpSecure: true,
    smtpUser: 'outbound-rotation1@netbots.io',
    smtpPass: 'outboundPass1',
    fromName: 'Shah | Restaurant Growth Partner',
    dailyLimit: 300,
    sentToday: 185,
    status: 'active',
    addedBy: userId
  });
  const acc2 = new EmailAccount({
    name: 'Seed Hostinger Main Outbound',
    email: 'deals@netbots.io',
    smtpHost: 'smtp.hostinger.com',
    smtpPort: 465,
    smtpSecure: true,
    smtpUser: 'deals@netbots.io',
    smtpPass: 'dealsPass2',
    fromName: 'The NetBots Restaurant Hub',
    dailyLimit: 600,
    sentToday: 95,
    status: 'active',
    addedBy: userId
  });
  await acc1.save();
  await acc2.save();

  // 2. Email Templates for Restaurant Outreach Niche
  console.log('Seeding Niche Templates...');
  
  // Google Business SEO Templates
  const gbp1 = new EmailTemplate({
    name: 'Seed GBP Outreach 1: Listing Question',
    category: 'custom',
    subject: 'Quick question about {{companyName}}\'s Google Maps listing',
    htmlContent: '<p>Hi {{contactName}},</p><p>I was searching for some good food spots in your area and noticed your Google Business listing for <strong>{{companyName}}</strong> doesn\'t have your menu link or current opening hours updated.</p><p>You are likely losing 20-30 customers daily because of this minor detail. Do you have 5 minutes this week to show you how to fix it?</p><p>Best,<br>Shah<br>NetBots Growth Hub</p>',
    createdBy: userId
  });
  const gbp2 = new EmailTemplate({
    name: 'Seed GBP Outreach 2: Local Map Ranking',
    category: 'follow_up',
    subject: 'Did you see your competitors ranking above {{companyName}}?',
    htmlContent: '<p>Hey {{contactName}},</p><p>Just following up on my previous note. I did a quick local search for top restaurants in your zip code, and 3 of your competitors ranked in the Google "Local 3-Pack" Maps section above {{companyName}} simply because of listing SEO optimization.</p><p>I created a 3-step listing optimization checklist for you. Let me know if I should send it over?</p><p>Best,<br>Shah</p>',
    createdBy: userId
  });
  const gbp3 = new EmailTemplate({
    name: 'Seed GBP Outreach 3: Audit Booking',
    category: 're_engagement',
    subject: 'Claim your free Google Local Listing audit for {{companyName}}',
    htmlContent: '<p>Hi {{contactName}},</p><p>I\'d love to do a free 10-minute Local SEO Audit for {{companyName}} to show you exactly how to rank in the top 3 on Google Maps.</p><p>No sales pitch, just real value. Let me know if we can schedule a quick call?</p><p>Link: <a href="https://calendly.com/netbots">Book Audit Call</a></p><p>Regards,<br>Shah</p>',
    createdBy: userId
  });

  // Website Development Templates
  const webdev1 = new EmailTemplate({
    name: 'Seed WebDev 1: Menu & Ordering Hook',
    category: 'custom',
    subject: 'Commission-free online ordering for {{companyName}}',
    htmlContent: '<p>Hi {{contactName}},</p><p>I checked {{companyName}}\'s web presence and noticed you guys rely heavily on Foodpanda/third-party portals taking 25-30% commissions on online orders.</p><p>We build customized, direct ordering websites that let your customers order straight from you with 0% commissions. Would you be open to seeing a quick demo next Tuesday?</p><p>Best regards,<br>The NetBots Team</p>',
    createdBy: userId
  });
  const webdev2 = new EmailTemplate({
    name: 'Seed WebDev 2: Mobile Menu Demo',
    category: 'follow_up',
    subject: 'Direct Ordering Demo for {{companyName}}',
    htmlContent: '<p>Hi {{contactName}},</p><p>I mocked up a simple mobile-friendly digital menu preview for {{companyName}}.</p><p>It loads in less than 1.5 seconds and lets customers add items to cart and check out via WhatsApp or credit card with 0 commission.</p><p>Should I send you the preview link?</p><p>Thanks,<br>Shah</p>',
    createdBy: userId
  });
  const webdev3 = new EmailTemplate({
    name: 'Seed WebDev 3: Final Onboarding Offer',
    category: 'promotional',
    subject: 'Start saving commissions at {{companyName}} this month',
    htmlContent: '<p>Hi {{contactName}},</p><p>We are running a special package this month where we handle your website hosting, setup, and digital menu integration with 0 upfront development costs. You only pay a flat monthly support fee.</p><p>Reply "YES" to schedule your website launch.</p><p>Best,<br>Shah</p>',
    createdBy: userId
  });

  // Website Refinement & SEO Templates
  const refine1 = new EmailTemplate({
    name: 'Seed Refine 1: Mobile Performance Alert',
    category: 'custom',
    subject: 'Is {{companyName}}\'s website mobile-friendly for hungry customers?',
    htmlContent: '<p>Hi {{contactName}},</p><p>I tried opening {{companyName}}\'s website on my mobile device, and it took over 5 seconds to load the menu image. Most hungry users leave a site if it doesn\'t load in under 3 seconds.</p><p>We can optimize your speed and redesign the mobile menu layout to double your booking conversions. Let\'s chat?</p><p>Best,<br>Shah</p>',
    createdBy: userId
  });
  const refine2 = new EmailTemplate({
    name: 'Seed Refine 2: Google Speed Audit',
    category: 'follow_up',
    subject: 'Google Speed Score for {{companyName}}',
    htmlContent: '<p>Hey {{contactName}},</p><p>I ran a Google PageSpeed test on your site and the score was 34/100 (which flag-marks it as slow). This also hurts your Google ranking.</p><p>I can fix these speed bottlenecks in 48 hours. Let me know if you\'d like a free performance breakdown?</p><p>Cheers,<br>Shah</p>',
    createdBy: userId
  });
  const refine3 = new EmailTemplate({
    name: 'Seed Refine 3: Upgrade Proposal',
    category: 'follow_up',
    subject: 'Let\'s revamp {{companyName}}\'s website speed',
    htmlContent: '<p>Hi {{contactName}},</p><p>If you are ready to modernize {{companyName}}\'s speed and design, reply to this email and we will send over a custom proposal.</p><p>Best,<br>NetBots Team</p>',
    createdBy: userId
  });

  await gbp1.save(); await gbp2.save(); await gbp3.save();
  await webdev1.save(); await webdev2.save(); await webdev3.save();
  await refine1.save(); await refine2.save(); await refine3.save();

  // 3. Email Lists
  console.log('Seeding Lists...');
  const restaurantList = new EmailList({
    name: 'Seed Local Restaurants Leads',
    description: 'Cold lead contact lists for food business owners',
    type: 'static',
    createdBy: userId,
    subscribers: [
      { email: 'cafe-test1@netbots.io', name: 'La Piazza Owner', status: 'subscribed' },
      { email: 'cafe-test2@netbots.io', name: 'Burger Junction Manager', status: 'subscribed' }
    ],
    stats: { totalSubscribers: 2, activeSubscribers: 2 }
  });
  await restaurantList.save();

  // 4. Email Sequences (Robust visual nodes configurations for Restaurant Niche)
  console.log('Seeding Sequences...');

  // Sequence 1: Google Business SEO Outreach
  const seqGBP = new EmailSequence({
    name: 'Seed GBP Local SEO Funnel',
    description: 'Restaurant outreach funnel targeting Google Maps SEO optimization and review acquisition.',
    status: 'active',
    trigger: { type: 'lead_created', conditions: {} },
    steps: [
      {
        stepId: 'gbp_step_1',
        type: 'send_email',
        label: 'Send Listing Question Hook',
        config: { templateId: gbp1._id, position: { x: 300, y: 120 } },
        nextStepId: 'gbp_wait_1'
      },
      {
        stepId: 'gbp_wait_1',
        type: 'wait',
        label: 'Wait 3 Days',
        config: { duration: 3, unit: 'days', position: { x: 300, y: 250 } },
        nextStepId: 'gbp_cond_reply'
      },
      {
        stepId: 'gbp_cond_reply',
        type: 'condition',
        label: 'Replied to Hook?',
        config: { conditionType: 'email_replied', value: '', position: { x: 300, y: 380 } },
        branchTrueStepId: 'gbp_act_warm',
        branchFalseStepId: 'gbp_step_2'
      },
      {
        stepId: 'gbp_act_warm',
        type: 'action',
        label: 'Move to Hot Lead',
        config: { actionType: 'update_temperature', fieldValue: 'sql', position: { x: 100, y: 520 } },
        nextStepId: 'gbp_exit'
      },
      {
        stepId: 'gbp_step_2',
        type: 'send_email',
        label: 'Send Map Ranking Comparison',
        config: { templateId: gbp2._id, position: { x: 500, y: 520 } },
        nextStepId: 'gbp_wait_2'
      },
      {
        stepId: 'gbp_wait_2',
        type: 'wait',
        label: 'Wait 4 Days',
        config: { duration: 4, unit: 'days', position: { x: 500, y: 650 } },
        nextStepId: 'gbp_cond_reply_2'
      },
      {
        stepId: 'gbp_cond_reply_2',
        type: 'condition',
        label: 'Replied to Follow-up?',
        config: { conditionType: 'email_replied', value: '', position: { x: 500, y: 780 } },
        branchTrueStepId: 'gbp_act_warm',
        branchFalseStepId: 'gbp_step_3'
      },
      {
        stepId: 'gbp_step_3',
        type: 'send_email',
        label: 'Send Audit Booking Offer',
        config: { templateId: gbp3._id, position: { x: 700, y: 920 } },
        nextStepId: 'gbp_wait_3'
      },
      {
        stepId: 'gbp_wait_3',
        type: 'wait',
        label: 'Wait 5 Days',
        config: { duration: 5, unit: 'days', position: { x: 700, y: 1050 } },
        nextStepId: 'gbp_cond_reply_3'
      },
      {
        stepId: 'gbp_cond_reply_3',
        type: 'condition',
        label: 'Replied to Final Offer?',
        config: { conditionType: 'email_replied', value: '', position: { x: 700, y: 1180 } },
        branchTrueStepId: 'gbp_act_warm',
        branchFalseStepId: 'gbp_exit_cold'
      },
      {
        stepId: 'gbp_exit_cold',
        type: 'action',
        label: 'Tag Lead Cold',
        config: { actionType: 'update_temperature', fieldValue: 'cold', position: { x: 900, y: 1300 } },
        nextStepId: 'gbp_exit'
      },
      {
        stepId: 'gbp_exit',
        type: 'exit',
        label: 'Exit GBP Funnel',
        config: { position: { x: 300, y: 1450 } }
      }
    ],
    stats: { totalEnrolled: 18, currentlyActive: 10, completed: 5, exited: 3 },
    createdBy: userId
  });

  // Sequence 2: Commission-Free Direct Ordering WebDev Outreach
  const seqWebDev = new EmailSequence({
    name: 'Seed Commission-Free Ordering WebDev',
    description: 'Onboard restaurants by showing commission savings from buildout web-menus.',
    status: 'active',
    trigger: { type: 'stage_changed', conditions: {} },
    steps: [
      {
        stepId: 'wd_step_1',
        type: 'send_email',
        label: 'Send Ordering Hook',
        config: { templateId: webdev1._id, position: { x: 300, y: 120 } },
        nextStepId: 'wd_wait_1'
      },
      {
        stepId: 'wd_wait_1',
        type: 'wait',
        label: 'Wait 3 Days',
        config: { duration: 3, unit: 'days', position: { x: 300, y: 250 } },
        nextStepId: 'wd_cond_reply'
      },
      {
        stepId: 'wd_cond_reply',
        type: 'condition',
        label: 'Replied to Hook?',
        config: { conditionType: 'email_replied', value: '', position: { x: 300, y: 380 } },
        branchTrueStepId: 'wd_act_onboard',
        branchFalseStepId: 'wd_step_2'
      },
      {
        stepId: 'wd_act_onboard',
        type: 'action',
        label: 'Change Stage: Onboarding',
        config: { actionType: 'update_stage', fieldValue: 'onboard', position: { x: 100, y: 520 } },
        nextStepId: 'wd_exit'
      },
      {
        stepId: 'wd_step_2',
        type: 'send_email',
        label: 'Send Mobile Menu Demo Link',
        config: { templateId: webdev2._id, position: { x: 500, y: 520 } },
        nextStepId: 'wd_wait_2'
      },
      {
        stepId: 'wd_wait_2',
        type: 'wait',
        label: 'Wait 4 Days',
        config: { duration: 4, unit: 'days', position: { x: 500, y: 650 } },
        nextStepId: 'wd_cond_reply_2'
      },
      {
        stepId: 'wd_cond_reply_2',
        type: 'condition',
        label: 'Replied to Demo?',
        config: { conditionType: 'email_replied', value: '', position: { x: 500, y: 780 } },
        branchTrueStepId: 'wd_act_onboard',
        branchFalseStepId: 'wd_step_3'
      },
      {
        stepId: 'wd_step_3',
        type: 'send_email',
        label: 'Send Special Offer Package',
        config: { templateId: webdev3._id, position: { x: 700, y: 920 } },
        nextStepId: 'wd_wait_3'
      },
      {
        stepId: 'wd_wait_3',
        type: 'wait',
        label: 'Wait 5 Days',
        config: { duration: 5, unit: 'days', position: { x: 700, y: 1050 } },
        nextStepId: 'wd_cond_reply_3'
      },
      {
        stepId: 'wd_cond_reply_3',
        type: 'condition',
        label: 'Replied to Offer?',
        config: { conditionType: 'email_replied', value: '', position: { x: 700, y: 1180 } },
        branchTrueStepId: 'wd_act_onboard',
        branchFalseStepId: 'wd_exit'
      },
      {
        stepId: 'wd_exit',
        type: 'exit',
        label: 'Exit WebDev Funnel',
        config: { position: { x: 300, y: 1350 } }
      }
    ],
    stats: { totalEnrolled: 24, currentlyActive: 15, completed: 6, exited: 3 },
    createdBy: userId
  });

  // Sequence 3: Weak Restaurant Website Revamp & SEO Speedup
  const seqSpeedup = new EmailSequence({
    name: 'Seed Weak Website Speed Revamp & SEO',
    description: 'Outreach aiming to speed up, redesign mobile menus, and optimize site SEO settings.',
    status: 'active',
    trigger: { type: 'lead_created', conditions: {} },
    steps: [
      {
        stepId: 'su_step_1',
        type: 'send_email',
        label: 'Send Speed & Mobile Alert',
        config: { templateId: refine1._id, position: { x: 300, y: 120 } },
        nextStepId: 'su_wait_1'
      },
      {
        stepId: 'su_wait_1',
        type: 'wait',
        label: 'Wait 2 Days',
        config: { duration: 2, unit: 'days', position: { x: 300, y: 250 } },
        nextStepId: 'su_cond_reply'
      },
      {
        stepId: 'su_cond_reply',
        type: 'condition',
        label: 'Replied to Speed Hook?',
        config: { conditionType: 'email_replied', value: '', position: { x: 300, y: 380 } },
        branchTrueStepId: 'su_act_nurture',
        branchFalseStepId: 'su_step_2'
      },
      {
        stepId: 'su_act_nurture',
        type: 'action',
        label: 'Change Stage: Nurture',
        config: { actionType: 'update_stage', fieldValue: 'nurture', position: { x: 100, y: 520 } },
        nextStepId: 'su_exit'
      },
      {
        stepId: 'su_step_2',
        type: 'send_email',
        label: 'Send Google Speed Audit Stats',
        config: { templateId: refine2._id, position: { x: 500, y: 520 } },
        nextStepId: 'su_wait_2'
      },
      {
        stepId: 'su_wait_2',
        type: 'wait',
        label: 'Wait 3 Days',
        config: { duration: 3, unit: 'days', position: { x: 500, y: 650 } },
        nextStepId: 'su_cond_reply_2'
      },
      {
        stepId: 'su_cond_reply_2',
        type: 'condition',
        label: 'Replied to Audit?',
        config: { conditionType: 'email_replied', value: '', position: { x: 500, y: 780 } },
        branchTrueStepId: 'su_act_nurture',
        branchFalseStepId: 'su_step_3'
      },
      {
        stepId: 'su_step_3',
        type: 'send_email',
        label: 'Send Revamp Proposal Pitch',
        config: { templateId: refine3._id, position: { x: 700, y: 920 } },
        nextStepId: 'su_wait_3'
      },
      {
        stepId: 'su_wait_3',
        type: 'wait',
        label: 'Wait 4 Days',
        config: { duration: 4, unit: 'days', position: { x: 700, y: 1050 } },
        nextStepId: 'su_cond_reply_3'
      },
      {
        stepId: 'su_cond_reply_3',
        type: 'condition',
        label: 'Replied to Proposal?',
        config: { conditionType: 'email_replied', value: '', position: { x: 700, y: 1180 } },
        branchTrueStepId: 'su_act_nurture',
        branchFalseStepId: 'su_exit'
      },
      {
        stepId: 'su_exit',
        type: 'exit',
        label: 'Exit Speedup Funnel',
        config: { position: { x: 300, y: 1350 } }
      }
    ],
    stats: { totalEnrolled: 15, currentlyActive: 8, completed: 4, exited: 3 },
    createdBy: userId
  });

  await seqGBP.save();
  await seqWebDev.save();
  await seqSpeedup.save();

  // 5. Campaigns
  console.log('Seeding Campaigns...');
  const camp1 = new EmailCampaign({
    name: 'Seed Summer Promotion Campaign',
    subject: 'Huge Savings on Software Services!',
    previewText: 'Up to 50% off for a limited time',
    fromAccount: acc2._id,
    templateId: webdev1._id,
    audienceType: 'all_leads',
    status: 'sent',
    sentAt: new Date(Date.now() - 3600000 * 24 * 5),
    completedAt: new Date(Date.now() - 3600000 * 24 * 5 + 3600000),
    stats: {
      totalRecipients: 100,
      sent: 100,
      delivered: 98,
      uniqueOpens: 42,
      uniqueClicks: 15,
      bounced: 2,
      unsubscribed: 1
    },
    createdBy: userId
  });
  const camp2 = new EmailCampaign({
    name: 'Seed Monthly Newsletter',
    subject: 'NetBots Product Updates - July 2026',
    fromAccount: acc1._id,
    templateId: gbp1._id,
    audienceType: 'list',
    listId: restaurantList._id,
    status: 'scheduled',
    scheduledAt: new Date(Date.now() + 3600000 * 24 * 2),
    createdBy: userId
  });
  await camp1.save();
  await camp2.save();

  console.log('Email Marketing Module successfully seeded with detailed Restaurant Niche funnels!');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
