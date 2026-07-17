const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/netbots_crm';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB for seeding performance data...');

  const User = require('./models/User');
  const Lead = require('./models/Lead');
  const Client = require('./models/Client');
  const Activity = require('./models/Activity');

  // Find admin user for submission reference
  const adminUser = await User.findOne({ role: 'admin' });
  if (!adminUser) {
    console.error('Admin user not found. Run admin seed or login first.');
    process.exit(1);
  }

  // Create some mock users
  const hash = await bcrypt.hash('123456', 10);
  
  // 1. Collectors
  const collector1 = await User.findOneAndUpdate(
    { email: 'ali@netbots.io' },
    { name: 'Ali Collector', password: hash, role: 'lead_gen', designation: 'LeadCollector' },
    { upsert: true, returnDocument: 'after' }
  );
  const collector2 = await User.findOneAndUpdate(
    { email: 'zain@netbots.io' },
    { name: 'Zain Collector', password: hash, role: 'lead_gen', designation: 'LeadCollector' },
    { upsert: true, returnDocument: 'after' }
  );

  // 2. Verifiers
  const verifier1 = await User.findOneAndUpdate(
    { email: 'sarah@netbots.io' },
    { name: 'Sarah Verifier', password: hash, role: 'lead_gen', designation: 'LeadVerifier' },
    { upsert: true, returnDocument: 'after' }
  );
  const verifier2 = await User.findOneAndUpdate(
    { email: 'asad@netbots.io' },
    { name: 'Asad Verifier', password: hash, role: 'lead_gen', designation: 'LeadVerifier' },
    { upsert: true, returnDocument: 'after' }
  );

  // 3. Closers
  const closer1 = await User.findOneAndUpdate(
    { email: 'karamat_closer@netbots.io' },
    { name: 'Karamat Closer', password: hash, role: 'sales', designation: 'LeadCloser' },
    { upsert: true, returnDocument: 'after' }
  );
  const closer2 = await User.findOneAndUpdate(
    { email: 'saqlain_closer@netbots.io' },
    { name: 'Saqlain Closer', password: hash, role: 'sales', designation: 'LeadCloser' },
    { upsert: true, returnDocument: 'after' }
  );

  console.log('Seeded mock users.');

  // Clear existing mock leads
  await Lead.deleteMany({ companyName: /Mock Corp/ });
  await Client.deleteMany({ companyName: /Mock Corp/ });

  // Generate leads for Ali Collector (total 10 leads, 8 verified, 3 closed)
  for (let i = 1; i <= 10; i++) {
    const isVerified = i <= 8;
    const isClosed = i <= 3;
    
    const lead = new Lead({
      companyName: `Mock Corp Ali ${i}`,
      contactName: `Contact Ali ${i}`,
      phone: `+9230012345${i}`,
      email: `contact${i}@mockali.com`,
      temperature: isClosed ? 'closed' : (isVerified ? 'sql' : 'cold'),
      stage: isClosed ? 'onboard' : (isVerified ? 'close' : 'identify'),
      submittedBy: collector1._id,
      leadCollectedBy: collector1.name,
      leadVerifiedBy: isVerified ? verifier1.name : undefined,
      verifiedAt: isVerified ? Date.now() : undefined,
      convertedToClient: isClosed,
      clientId: undefined
    });
    await lead.save();

    if (isClosed) {
      const client = new Client({
        leadId: lead._id,
        companyName: lead.companyName,
        contactName: lead.contactName,
        email: lead.email,
        phone: lead.phone,
        dealType: 'monthly_subscription',
        planType: 'monthly_growth',
        monthlyAmount: 25000,
        startDate: Date.now(),
        leadCollectedBy: collector1.name,
        leadVerifiedBy: verifier1.name,
        leadVerifiedAt: Date.now(),
        leadCreatedAt: Date.now(),
        salesClosedBy: closer1.name,
        closedBy: closer1._id,
        submittedBy: collector1._id
      });
      await client.save();
      lead.clientId = client._id;
      await lead.save();
    }
  }

  // Generate leads for Zain Collector (total 5 leads, 2 verified, 1 closed)
  for (let i = 1; i <= 5; i++) {
    const isVerified = i <= 2;
    const isClosed = i <= 1;

    const lead = new Lead({
      companyName: `Mock Corp Zain ${i}`,
      contactName: `Contact Zain ${i}`,
      phone: `+9230054321${i}`,
      email: `contact${i}@mockzain.com`,
      temperature: isClosed ? 'closed' : (isVerified ? 'sql' : 'cold'),
      stage: isClosed ? 'onboard' : (isVerified ? 'close' : 'identify'),
      submittedBy: collector2._id,
      leadCollectedBy: collector2.name,
      leadVerifiedBy: isVerified ? verifier2.name : undefined,
      verifiedAt: isVerified ? Date.now() : undefined,
      convertedToClient: isClosed,
      clientId: undefined
    });
    await lead.save();

    if (isClosed) {
      const client = new Client({
        leadId: lead._id,
        companyName: lead.companyName,
        contactName: lead.contactName,
        email: lead.email,
        phone: lead.phone,
        dealType: 'lifetime_deal',
        planType: 'lifetime_deal',
        lifetimeAmount: 150000,
        startDate: Date.now(),
        leadCollectedBy: collector2.name,
        leadVerifiedBy: verifier2.name,
        leadVerifiedAt: Date.now(),
        leadCreatedAt: Date.now(),
        salesClosedBy: closer2.name,
        closedBy: closer2._id,
        submittedBy: collector2._id
      });
      await client.save();
      lead.clientId = client._id;
      await lead.save();
    }
  }

  console.log('Seeded mock leads and clients.');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
