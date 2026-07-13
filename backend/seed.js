const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Lead = require('./models/Lead');
const Client = require('./models/Client');
const Commission = require('./models/Commission');
const Payout = require('./models/Payout');
const Activity = require('./models/Activity');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/netbots_crm';

const seed = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB for seeding users and system data...');

        // Clear existing data to avoid conflicts
        await User.deleteMany({});
        await Lead.deleteMany({});
        await Client.deleteMany({});
        await Commission.deleteMany({});
        await Payout.deleteMany({});
        await Activity.deleteMany({});
        console.log('Cleared existing database collections.');

        const defaultPassword = 'SaqlainShah@110';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        // Define full permissions configuration
        const fullPermissions = {
            view_dashboard: true,
            can_view_leads: true,
            can_add_leads: true,
            can_edit_leads: true,
            can_delete_leads: true,
            manage_clients: true,
            manage_team: true,
            manage_permissions: true,
            view_commissions: true,
            manage_payouts: true,
            view_leaderboard: true,
            can_bulk_manage_leads: true
        };

        // Define default permissions for standard roles
        const defaultLeadGenPermissions = {
            view_dashboard: true,
            can_view_leads: true,
            can_add_leads: true,
            can_edit_leads: false,
            can_delete_leads: false,
            manage_clients: false,
            manage_team: false,
            manage_permissions: false,
            view_commissions: true,
            manage_payouts: false,
            view_leaderboard: true,
            can_bulk_manage_leads: false
        };

        const defaultSalesPermissions = {
            view_dashboard: true,
            can_view_leads: true,
            can_add_leads: true,
            can_edit_leads: true,
            can_delete_leads: false,
            manage_clients: true,
            manage_team: false,
            manage_permissions: false,
            view_commissions: true,
            manage_payouts: false,
            view_leaderboard: true,
            can_bulk_manage_leads: false
        };

        const usersToSeed = [
            // Admin Users (All permissions)
            {
                name: 'Saqlain Shah',
                email: 'saqlainshahbaltee@gmail.com',
                password: hashedPassword,
                role: 'admin',
                phone: '+923001234567',
                permissions: { ...fullPermissions },
                designation: ['Administrator', 'Owner']
            },
            {
                name: 'Saqlain Shah Netbots',
                email: 'saqlain@netbots.io',
                password: hashedPassword,
                role: 'admin',
                phone: '+923001234568',
                permissions: { ...fullPermissions },
                designation: ['Administrator']
            },
            // Lead Gen Users with default permissions
            {
                name: 'Ali Collector',
                email: 'ali@netbots.io',
                password: hashedPassword,
                role: 'lead_gen',
                phone: '+923001234501',
                permissions: { ...defaultLeadGenPermissions },
                designation: ['LeadCollector'],
                archetype: 'lead_researcher',
                rank: 'rookie',
                points: 120
            },
            {
                name: 'Zain Collector',
                email: 'zain@netbots.io',
                password: hashedPassword,
                role: 'lead_gen',
                phone: '+923001234502',
                permissions: { ...defaultLeadGenPermissions },
                designation: ['LeadCollector'],
                archetype: 'facebook_manager',
                rank: 'hunter',
                points: 350
            },
            {
                name: 'Sarah Verifier',
                email: 'sarah@netbots.io',
                password: hashedPassword,
                role: 'lead_gen',
                phone: '+923001234503',
                permissions: { ...defaultLeadGenPermissions },
                designation: ['LeadVerifier'],
                archetype: 'reddit_specialist',
                rank: 'hunter',
                points: 400
            },
            // Lead Gen User with ALL permissions (special privilege)
            {
                name: 'Asad Super Verifier',
                email: 'asad@netbots.io',
                password: hashedPassword,
                role: 'lead_gen',
                phone: '+923001234504',
                permissions: { ...fullPermissions },
                designation: ['LeadVerifier', 'TeamLead'],
                archetype: 'lead_researcher',
                rank: 'champion',
                points: 1200
            },
            // Sales Users with default permissions
            {
                name: 'Karamat Closer',
                email: 'karamat_closer@netbots.io',
                password: hashedPassword,
                role: 'sales',
                phone: '+923001234505',
                permissions: { ...defaultSalesPermissions },
                designation: ['LeadCloser'],
                archetype: 'sales_closer',
                rank: 'closer',
                points: 600
            },
            // Sales User with ALL permissions
            {
                name: 'Saqlain Super Closer',
                email: 'saqlain_closer@netbots.io',
                password: hashedPassword,
                role: 'sales',
                phone: '+923001234506',
                permissions: { ...fullPermissions },
                designation: ['LeadCloser', 'SalesManager'],
                archetype: 'sales_closer',
                rank: 'elite_closer',
                points: 1500
            },
            // Technical Staff with default permissions
            {
                name: 'Zamir Tech Support',
                email: 'zamir@netbots.io',
                password: hashedPassword,
                role: 'technical_staff',
                phone: '+923001234507',
                permissions: { 
                    ...defaultLeadGenPermissions,
                    view_dashboard: true,
                    can_view_leads: true
                },
                designation: ['Technical Support']
            },
            // Technical Staff with ALL permissions
            {
                name: 'Zamir Super Admin Tech',
                email: 'zamir_admin@netbots.io',
                password: hashedPassword,
                role: 'technical_staff',
                phone: '+923001234508',
                permissions: { ...fullPermissions },
                designation: ['SysAdmin', 'Technical Lead']
            },
            // Additional users to reach 10+ users
            {
                name: 'Tasneem Shakoor',
                email: 'tasneem@netbots.io',
                password: hashedPassword,
                role: 'lead_gen',
                phone: '+923001234509',
                permissions: { ...defaultLeadGenPermissions },
                designation: ['LeadCollector'],
                archetype: 'lead_researcher'
            },
            {
                name: 'Sana Zehra',
                email: 'sana@netbots.io',
                password: hashedPassword,
                role: 'lead_gen',
                phone: '+923001234510',
                permissions: { ...defaultLeadGenPermissions },
                designation: ['LeadCollector'],
                archetype: 'facebook_manager'
            },
            {
                name: 'Anmol Sales',
                email: 'anmo@netbots.io',
                password: hashedPassword,
                role: 'sales',
                phone: '+923001234511',
                permissions: { ...defaultSalesPermissions },
                designation: ['LeadCloser'],
                archetype: 'ca_recruiter'
            },
            {
                name: 'Ahsan Sales Head',
                email: 'ahsan@netbots.io',
                password: hashedPassword,
                role: 'sales',
                phone: '+923001234512',
                permissions: { ...fullPermissions },
                designation: ['SalesHead'],
                archetype: 'sales_closer',
                rank: 'gold_closer',
                points: 2000
            }
        ];

        console.log(`Inserting ${usersToSeed.length} users into the database...`);
        const insertedUsers = await User.insertMany(usersToSeed);
        console.log(`Successfully seeded ${insertedUsers.length} users!`);

        // Print the created users and details
        console.log('\nSeeded Users Checklist:');
        insertedUsers.forEach(u => {
            const hasAllPerms = Object.values(u.permissions.toObject()).every(val => val === true);
            console.log(`- Name: ${u.name} | Email: ${u.email} | Role: ${u.role} | Has All Perms: ${hasAllPerms}`);
        });

        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

seed();
