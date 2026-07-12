const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/netbots_crm';

const Lead = require('../models/Lead');
const User = require('../models/User');

async function runTests() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully.');

    // 1. Verify we can find a lead
    const lead = await Lead.findOne({ convertedToClient: { $ne: true } });
    if (!lead) {
      console.log('No leads found in database. Seeding mock leads first...');
      // Wait, let's just create a dummy lead for test
      const dummyUser = await User.findOne();
      if (!dummyUser) {
        console.error('No users found. Please seed the database first.');
        process.exit(1);
      }
      const newLead = new Lead({
        companyName: 'Test Lock Corp',
        submittedBy: dummyUser._id
      });
      await newLead.save();
      console.log('Created dummy lead for locking test.');
    }

    const testLead = await Lead.findOne({ convertedToClient: { $ne: true } });
    console.log(`Testing with Lead ID: ${testLead._id}, Company: ${testLead.companyName}`);

    // Find a user with LeadVerifier designation or role
    const verifier = await User.findOne({ designation: 'LeadVerifier' }) || await User.findOne({ role: 'admin' });
    const closer = await User.findOne({ designation: 'LeadCloser' }) || await User.findOne({ role: 'sales' });

    console.log(`Verifier User: ${verifier.name} (${verifier.email})`);
    console.log(`Closer User: ${closer.name} (${closer.email})`);

    // 2. Test Lock Verifier
    testLead.workingVerifier = verifier._id;
    await testLead.save();
    console.log('Lock Verifier: Success - workingVerifier saved!');

    // 3. Test Lock Closer
    testLead.workingCloser = closer._id;
    await testLead.save();
    console.log('Lock Closer: Success - workingCloser saved!');

    // Populate and check
    const populated = await Lead.findById(testLead._id).populate('workingVerifier workingCloser');
    console.log('Populated Lead workingVerifier:', populated.workingVerifier.name);
    console.log('Populated Lead workingCloser:', populated.workingCloser.name);

    // 4. Test Unlock
    populated.workingVerifier = null;
    populated.workingCloser = null;
    await populated.save();
    console.log('Unlock: Success - working fields reset to null!');

    // 5. Test stats aggregation query
    let statsQuery = {
      convertedToClient: { $ne: true },
      clientId: { $exists: false }
    };
    const statsResult = await Lead.aggregate([
      { $match: statsQuery },
      {
        $group: {
          _id: null,
          totalLeadsCount: { $sum: 1 },
          contactedCount: {
            $sum: {
              $cond: [
                { $ne: ["$lastContactedAt", null] },
                1,
                0
              ]
            }
          },
          commitmentsCount: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$temperature", "sql"] },
                    { $eq: ["$stage", "close"] }
                  ]
                },
                1,
                0
              ]
            }
          },
          followUpCount: {
            $sum: {
              $cond: [
                { $ne: ["$followUpDate", null] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);
    console.log('Aggregation Stats result:', statsResult);

    console.log('🎉 All Database and Model Logic Tests PASSED!');
    process.exit(0);
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
}

runTests();
