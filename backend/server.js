const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const helmet = require('helmet');
const { initCronJobs } = require('./services/cronJobs');

const app = express();

// Security proofing middleware
app.use(helmet());

// Custom Mongo injection sanitize middleware compatible with Express 5
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (obj instanceof Object) {
      for (const key in obj) {
        if (/^\$/.test(key)) {
          delete obj[key];
        } else {
          sanitize(obj[key]);
        }
      }
    }
  };
  sanitize(req.body);
  sanitize(req.params);
  if (req.query) {
    for (const key in req.query) {
      if (/^\$/.test(key)) {
        delete req.query[key];
      } else if (req.query[key] instanceof Object) {
        sanitize(req.query[key]);
      }
    }
  }
  next();
});

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    // Whitelist check using regex
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|172\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin);
    const isNetbots = /netbots\.io$/.test(origin);
    const isServerIp = /^https?:\/\/147\.93\.94\.137(:\d+)?$/.test(origin);
    const isExtension = /^chrome-extension:\/\//.test(origin);

    if (isLocalhost || isNetbots || isServerIp || isExtension) {
      return callback(null, true);
    }

    const msg = `The CORS policy for this site does not allow access from origin: ${origin}`;
    return callback(new Error(msg), false);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/leads',        require('./routes/leads'));
app.use('/api/clients',      require('./routes/clients'));
app.use('/api/team',         require('./routes/team'));
app.use('/api/commissions',  require('./routes/commissions'));
app.use('/api/payouts',      require('./routes/payouts'));
app.use('/api/partners',     require('./routes/partners'));
app.use('/api/analytics',    require('./routes/analytics'));
app.use('/api/gamification', require('./routes/gamification'));
app.use('/api/dashboard',    require('./routes/dashboard'));
app.use('/api/import',       require('./routes/import'));
app.use('/api/time-tracking', require('./routes/timeTracking'));
app.use('/api/audit-logs',    require('./routes/auditLogs'));
app.use('/api/performance',   require('./routes/performance'));
app.use('/api/agreement',     require('./routes/agreement'));

// Catch-all route to serve compiled React app for frontend routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/netbots_crm';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // One-time migration: convert string designations to arrays for existing users
    try {
      const rawCollection = mongoose.connection.db.collection('users');
      const usersWithStringDesignation = await rawCollection.find({ designation: { $type: 'string' } }).toArray();
      let migratedCount = 0;
      for (const u of usersWithStringDesignation) {
        if (typeof u.designation === 'string') {
          const designationArray = [u.designation];
          await rawCollection.updateOne({ _id: u._id }, { $set: { designation: designationArray } });
          migratedCount++;
        }
      }
      if (migratedCount > 0) {
        console.log(`Migrated ${migratedCount} users: designation string -> array`);
      }
    } catch (migrationErr) {
      console.error('Designation migration error (non-fatal):', migrationErr.message);
    }
    
    initCronJobs();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Trigger nodemon restart after starting local MongoDB service - restarted
