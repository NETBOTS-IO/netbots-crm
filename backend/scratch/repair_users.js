const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/netbots_crm';

function flattenDesignation(val) {
  if (!val) return [];
  if (typeof val === 'string') {
    return [val];
  }
  if (Array.isArray(val)) {
    // recursively flatten and extract strings
    let result = [];
    for (const item of val) {
      if (typeof item === 'string') {
        result.push(item);
      } else if (Array.isArray(item)) {
        result = result.concat(flattenDesignation(item));
      }
    }
    return result;
  }
  return [];
}

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({}).toArray();
    
    console.log('Repairing users designations and ranks...');
    for (const u of users) {
      const flat = flattenDesignation(u.designation);
      const newRank = (!u.rank || u.rank === ' ' || u.rank === '') ? 'rookie' : u.rank;
      
      console.log(`User: ${u.email}`);
      console.log(`  Old designation: ${JSON.stringify(u.designation)} -> New: ${JSON.stringify(flat)}`);
      console.log(`  Old rank: ${JSON.stringify(u.rank)} -> New: ${JSON.stringify(newRank)}`);
      
      await db.collection('users').updateOne(
        { _id: u._id },
        { $set: { designation: flat, rank: newRank } }
      );
    }
    
    console.log('Repair completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
