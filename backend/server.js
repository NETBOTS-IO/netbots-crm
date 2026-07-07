const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per 15 mins
  message: { success: false, error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

const allowedOrigins = [
  'http://www.netbots.io', 'https://www.netbots.io',
  'http://netbots.io', 'https://netbots.io',
  'http://crm.netbots.io', 'https://crm.netbots.io',
  'http://hotelsync.netbots.io', 'https://hotelsync.netbots.io',
  'http://api.netbots.io', 'https://api.netbots.io',
  'http://147.93.94.137', 'https://147.93.94.137',
  'http://localhost:5173', 'http://localhost:5000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.static('../frontend'));

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

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/accounta_crm';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    initCronJobs();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));
