const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/netbots_crm';

const User = require('../models/User');

async function list() {
  try {
    await mongoose.connect(MONGO_URI);
    const users = await User.find({}, 'name email role designation');
    console.log('Users in database:', users);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

list();
