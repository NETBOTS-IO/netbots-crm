const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Lead = require('./models/Lead');
const Client = require('./models/Client');
const Commission = require('./models/Commission');
const Payout = require('./models/Payout');
const Activity = require('./models/Activity');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/netbots_crm';

const seed = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing data
        await User.deleteMany({});
        await Lead.deleteMany({});
        await Client.deleteMany({});
        await Commission.deleteMany({});
        await Payout.deleteMany({});
        await Activity.deleteMany({});
        console.log('Cleared existing data.');

        // Create Admin User
        const hashedPassword = await bcrypt.hash('SaqlainShah@110', 10);
        const admin = new User({
            name: 'Saqlain Shah',
            email: 'saqlain@netbots.io',
            password: hashedPassword,
            role: 'admin',
            phone: '+923001234567',
            permissions: {
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
            }
        });
        
        await admin.save();
        console.log('Admin user saqlain@netbots.io created successfully!');
        
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

seed();
