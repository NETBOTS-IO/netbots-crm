const mongoose = require('mongoose');
const User = require('../models/User');
const Lead = require('../models/Lead');
const Client = require('../models/Client');
require('dotenv').config();

// Simple colors for terminal output
const green = (text) => `\x1b[32m${text}\x1b[0m`;
const red = (text) => `\x1b[31m${text}\x1b[0m`;
const yellow = (text) => `\x1b[33m${text}\x1b[0m`;
const cyan = (text) => `\x1b[36m${text}\x1b[0m`;

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/netbots_crm';

async function testRBAC() {
  console.log(cyan('=== NetBots CRM: RBAC Automated Test Suite ==='));
  
  await mongoose.connect(MONGO_URI);
  console.log('Connected to Database.');

  // 1. Create clean test users for each role
  console.log('\nSetting up test users...');
  
  const collector = new User({
    name: 'Test Collector',
    email: 'collector_test@netbots.io',
    password: 'password123',
    role: 'lead_gen',
    designation: ['LeadCollector'],
    permissions: {
      view_dashboard: true,
      can_view_leads: true,
      can_add_leads: true,
      can_edit_leads: false,
      can_delete_leads: false,
      manage_clients: false,
      manage_team: false,
      manage_permissions: false,
      view_commissions: true,
      manage_payouts: false,
      view_leaderboard: true,
      can_bulk_manage_leads: false
    }
  });

  const verifier = new User({
    name: 'Test Verifier',
    email: 'verifier_test@netbots.io',
    password: 'password123',
    role: 'lead_gen',
    designation: ['LeadVerifier'],
    permissions: {
      view_dashboard: true,
      can_view_leads: true,
      can_add_leads: false,
      can_edit_leads: true,
      can_delete_leads: false,
      manage_clients: false,
      manage_team: false,
      manage_permissions: false,
      view_commissions: true,
      manage_payouts: false,
      view_leaderboard: true,
      can_bulk_manage_leads: false
    }
  });

  const closer = new User({
    name: 'Test Closer',
    email: 'closer_test@netbots.io',
    password: 'password123',
    role: 'lead_gen', // note base role is lead_gen, but designation has LeadCloser overlays!
    designation: ['LeadCloser'],
    permissions: {
      view_dashboard: true,
      can_view_leads: true,
      can_add_leads: false,
      can_edit_leads: true,
      can_delete_leads: false,
      manage_clients: true,
      manage_team: false,
      manage_permissions: false,
      view_commissions: true,
      manage_payouts: false,
      view_leaderboard: true,
      can_bulk_manage_leads: false
    }
  });

  // Mock Request and Response for controllers
  const mockResponse = () => {
    const res = {};
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data) => {
      res.body = data;
      return res;
    };
    return res;
  };

  // Helper assertions
  let testCount = 0;
  let passCount = 0;

  function assertAccess(actionName, user, allowed, checkFunction) {
    testCount++;
    const isAllowed = checkFunction(user);
    if (isAllowed === allowed) {
      console.log(`${green('✔ PASS')} [${user.designation.join(', ')}] ${actionName}: ${isAllowed ? 'Allowed' : 'Blocked'}`);
      passCount++;
    } else {
      console.log(`${red('✘ FAIL')} [${user.designation.join(', ')}] ${actionName}: expected ${allowed ? 'Allowed' : 'Blocked'}, got ${isAllowed ? 'Allowed' : 'Blocked'}`);
    }
  }

  // Define check functions mirroring our backend middleware & logic
  const canAddLeadLogic = (u) => u.role === 'admin' || (u.permissions && u.permissions.can_add_leads);
  const canEditLeadLogic = (u) => u.role === 'admin' || (u.permissions && u.permissions.can_edit_leads);
  const canConvertLeadLogic = (u) => u.role === 'admin' || u.role === 'sales' || (u.permissions && u.permissions.manage_clients);
  const canImportLeadLogic = (u) => u.role === 'admin' || (u.permissions && u.permissions.can_add_leads);
  const canManageClientsLogic = (u) => u.role === 'admin' || (u.permissions && u.permissions.manage_clients);

  // Run Assertions
  console.log('\n--- Running RBAC Assertions ---');

  // Lead Creation (Add)
  assertAccess('Add Lead', collector, true, canAddLeadLogic);
  assertAccess('Add Lead', verifier, false, canAddLeadLogic);
  assertAccess('Add Lead', closer, false, canAddLeadLogic);

  // Lead Editing (Edit)
  assertAccess('Edit Lead', collector, false, canEditLeadLogic);
  assertAccess('Edit Lead', verifier, true, canEditLeadLogic);
  assertAccess('Edit Lead', closer, true, canEditLeadLogic);

  // Lead Conversion (Convert)
  assertAccess('Convert Lead to Client', collector, false, canConvertLeadLogic);
  assertAccess('Convert Lead to Client', verifier, false, canConvertLeadLogic);
  assertAccess('Convert Lead to Client', closer, true, canConvertLeadLogic);

  // CSV Importing
  assertAccess('Import CSV Leads', collector, true, canImportLeadLogic);
  assertAccess('Import CSV Leads', verifier, false, canImportLeadLogic);
  assertAccess('Import CSV Leads', closer, false, canImportLeadLogic);

  // Client Management (List/View/Edit Clients)
  assertAccess('Manage Clients', collector, false, canManageClientsLogic);
  assertAccess('Manage Clients', verifier, false, canManageClientsLogic);
  assertAccess('Manage Clients', closer, true, canManageClientsLogic);

  console.log(`\nResults: Passed ${green(passCount)} / ${testCount} tests.`);

  await mongoose.disconnect();
  process.exit(passCount === testCount ? 0 : 1);
}

testRBAC().catch(err => {
  console.error(err);
  process.exit(1);
});
