const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/netbots_crm';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB for seeding follow-up test data...');

  const User = require('./models/User');
  const Lead = require('./models/Lead');

  // Find a closer and admin for assignment
  const closer = await User.findOne({ $or: [{ role: 'sales' }, { designation: 'LeadCloser' }] });
  const admin = await User.findOne({ role: 'admin' });

  if (!closer || !admin) {
    console.error('Seeding requirements not met. Run npm run seed or seed_performance first to seed users.');
    process.exit(1);
  }

  // Clear existing mock followups
  await Lead.deleteMany({ companyName: /Followup Mock/ });

  const now = new Date();

  // Helper to add time
  const addTime = (hours = 0, days = 0, weeks = 0, years = 0) => {
    const d = new Date(now);
    d.setHours(d.getHours() + hours);
    d.setDate(d.getDate() + days + (weeks * 7));
    d.setFullYear(d.getFullYear() + years);
    return d;
  };

  const mockLeads = [
    {
      companyName: 'Followup Mock - 2 Hours Due',
      contactName: 'John Due Hours',
      phone: '+15550001111',
      email: 'hours@followupmock.com',
      temperature: 'sql',
      priority: 'urgent',
      stage: 'close',
      submittedBy: admin._id,
      workingCloser: closer._id,
      assignedCloser: closer._id,
      followUpDate: addTime(2) // 2 hours from now
    },
    {
      companyName: 'Followup Mock - 5 Days Due',
      contactName: 'David Due Days',
      phone: '+15550002222',
      email: 'days@followupmock.com',
      temperature: 'warm',
      priority: 'high',
      stage: 'nurture',
      submittedBy: admin._id,
      workingCloser: closer._id,
      assignedCloser: closer._id,
      followUpDate: addTime(0, 5) // 5 days from now
    },
    {
      companyName: 'Followup Mock - 3 Weeks Due',
      contactName: 'Sarah Due Weeks',
      phone: '+15550003333',
      email: 'weeks@followupmock.com',
      temperature: 'warm',
      priority: 'medium',
      stage: 'qualify',
      submittedBy: admin._id,
      workingCloser: closer._id,
      assignedCloser: closer._id,
      followUpDate: addTime(0, 0, 3) // 3 weeks from now
    },
    {
      companyName: 'Followup Mock - 1 Year Due',
      contactName: 'Robert Due Years',
      phone: '+15550004444',
      email: 'years@followupmock.com',
      temperature: 'cold',
      priority: 'low',
      stage: 'identify',
      submittedBy: admin._id,
      workingCloser: closer._id,
      assignedCloser: closer._id,
      followUpDate: addTime(0, 0, 0, 1) // 1 year from now
    },
    {
      companyName: 'Followup Mock - OVERDUE 4 Hours',
      contactName: 'Alice Overdue Hours',
      phone: '+15550005555',
      email: 'overduehours@followupmock.com',
      temperature: 'sql',
      priority: 'urgent',
      stage: 'close',
      submittedBy: admin._id,
      workingCloser: closer._id,
      assignedCloser: closer._id,
      followUpDate: addTime(-4) // 4 hours ago
    },
    {
      companyName: 'Followup Mock - OVERDUE 2 Days',
      contactName: 'Michael Overdue Days',
      phone: '+15550006666',
      email: 'overduedays@followupmock.com',
      temperature: 'warm',
      priority: 'high',
      stage: 'nurture',
      submittedBy: admin._id,
      workingCloser: closer._id,
      assignedCloser: closer._id,
      followUpDate: addTime(0, -2) // 2 days ago
    }
  ];

  console.log(`Inserting ${mockLeads.length} follow-up mock leads...`);
  await Lead.insertMany(mockLeads);
  console.log('Successfully seeded follow-up test data!');
  
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
