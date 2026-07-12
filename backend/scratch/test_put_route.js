const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/netbots_crm';

const Lead = require('../models/Lead');
const User = require('../models/User');

async function testPutRoute() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    const admin = await User.findOne({ role: 'admin' });
    const lead = await Lead.findOne({ convertedToClient: { $ne: true } });
    if (!lead) {
      console.log('No leads found.');
      process.exit(1);
    }

    console.log(`Initial Lead companyName: ${lead.companyName}`);

    // Let's mimic the PUT route payload
    const updatedName = lead.companyName + ' (Updated)';
    
    // We can directly call the API or test the database update
    // But let's test the database update first to see if any validators fail!
    lead.companyName = updatedName;
    try {
      await lead.save();
      console.log(`Database Save Success! New companyName: ${lead.companyName}`);
    } catch (dbErr) {
      console.error('Database Save Error:', dbErr);
    }

    // Now let's test the route logic directly by mimicking the request
    // We'll write a simulation of the route code
    const updateData = { companyName: lead.companyName + ' Sim' };
    
    // Check lock
    const checkLeadLock = async (leadId, user) => {
        if (user.role === 'admin') return { allowed: true };
        const leadDoc = await Lead.findById(leadId);
        if (!leadDoc) return { allowed: false, error: 'Lead not found', status: 404 };
        const isVerifier = Array.isArray(user.designation) && user.designation.includes('LeadVerifier');
        const isCloser = Array.isArray(user.designation) && user.designation.includes('LeadCloser');
        if (isVerifier && leadDoc.workingVerifier && leadDoc.workingVerifier.toString() !== user._id.toString()) {
            return { allowed: false, error: 'Locked by verifier', status: 400 };
        }
        if (isCloser && leadDoc.workingCloser && leadDoc.workingCloser.toString() !== user._id.toString()) {
            return { allowed: false, error: 'Locked by closer', status: 400 };
        }
        return { allowed: true };
    };

    const lockCheck = await checkLeadLock(lead._id, admin);
    console.log('Simulation LockCheck allowed:', lockCheck.allowed);

    const updatedDoc = await Lead.findByIdAndUpdate(lead._id, updateData, { new: true });
    console.log('Simulation findByIdAndUpdate Success:', updatedDoc.companyName);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testPutRoute();
