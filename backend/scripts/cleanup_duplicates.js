const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const User = require('../models/User');
  
  // Remove duplicate phantom users from the old netbots-crm DB migration
  const result = await User.deleteMany({ email: { $regex: /@netbots\.com$/ } });
  console.log('Deleted phantom users:', result.deletedCount);
  
  // Also remove duplicate teams from migration
  const Team = require('../models/Team');
  const teams = await Team.find({});
  const seen = new Set();
  let deletedTeams = 0;
  for (const t of teams) {
    const key = t.name;
    if (seen.has(key)) {
      await Team.deleteOne({ _id: t._id });
      deletedTeams++;
    } else {
      seen.add(key);
    }
  }
  console.log('Deleted duplicate teams:', deletedTeams);
  
  const remaining = await User.find({});
  console.log('Remaining users:');
  remaining.forEach(u => console.log(' ', u._id.toString(), u.email, u.role));
  
  process.exit(0);
}
run();
