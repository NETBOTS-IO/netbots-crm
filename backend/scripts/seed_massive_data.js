const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const Account = require('../models/Account');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const JournalEntry = require('../models/JournalEntry');
const Asset = require('../models/Asset');
const Liability = require('../models/Liability');
const Client = require('../models/Client');
const Vendor = require('../models/Vendor');
const Project = require('../models/Project');

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/netbots_crm';

const DEFAULT_ACCOUNTS = [
  { name: 'Cash on Hand', type: 'Asset', isSystem: true },
  { name: 'Accounts Receivable', type: 'Asset', isSystem: true },
  { name: 'Accounts Payable', type: 'Liability', isSystem: true },
  { name: 'Retained Earnings', type: 'Equity', isSystem: true },
  { name: 'Service Revenue', type: 'Income', isSystem: true },
  { name: 'Other Income', type: 'Income', isSystem: true },
  { name: 'Rent Expense', type: 'Expense', isSystem: true },
  { name: 'Salaries Expense', type: 'Expense', isSystem: true },
  { name: 'Marketing Expense', type: 'Expense', isSystem: true },
  { name: 'Software Subscriptions', type: 'Expense', isSystem: true },
  { name: 'Depreciation Expense', type: 'Expense', isSystem: true },
  { name: 'Accumulated Depreciation', type: 'Asset', isSystem: true },
  { name: 'Interest Expense', type: 'Expense', isSystem: true },
  { name: 'Equipment', type: 'Asset', isSystem: true },
  { name: 'Software/Digital Assets', type: 'Asset', isSystem: true },
  { name: 'Furniture', type: 'Asset', isSystem: true },
  { name: 'Vehicles', type: 'Asset', isSystem: true },
  { name: 'Loans Payable', type: 'Liability', isSystem: true }
];

const getAccount = async (name) => {
  let acc = await Account.findOne({ name });
  if (!acc) {
    acc = await new Account({ name, type: DEFAULT_ACCOUNTS.find(a => a.name === name)?.type || 'Asset' }).save();
  }
  return acc;
};

const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const seedData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear collections
    await Account.deleteMany({});
    await Income.deleteMany({});
    await Expense.deleteMany({});
    await JournalEntry.deleteMany({});
    await Asset.deleteMany({});
    await Liability.deleteMany({});
    await Client.deleteMany({});
    await Vendor.deleteMany({});
    await Project.deleteMany({});

    // 1. Seed Accounts
    await Account.insertMany(DEFAULT_ACCOUNTS);
    const cashAcc = await getAccount('Cash on Hand');
    const serviceRevenueAcc = await getAccount('Service Revenue');
    const rentExpenseAcc = await getAccount('Rent Expense');
    const salariesExpenseAcc = await getAccount('Salaries Expense');
    const softwareExpenseAcc = await getAccount('Software Subscriptions');
    const marketingExpenseAcc = await getAccount('Marketing Expense');
    const equipmentAcc = await getAccount('Equipment');
    const loansPayableAcc = await getAccount('Loans Payable');

    // 2. Mock Clients and Vendors
    const clients = [];
    const dummyLeadId = new mongoose.Types.ObjectId();
    const adminUserId = new mongoose.Types.ObjectId();
    for (let i = 1; i <= 20; i++) {
      clients.push(await new Client({ 
        name: `Client ${i}`, 
        email: `client${i}@test.com`, 
        companyName: `Company ${i}`,
        startDate: new Date(),
        dealType: 'monthly_subscription',
        leadId: dummyLeadId,
        submittedBy: adminUserId,
        closedBy: adminUserId
      }).save());
    }

    const vendors = [];
    for (let i = 1; i <= 20; i++) {
      vendors.push(await new Vendor({ name: `Vendor ${i}`, category: 'Supplier' }).save());
    }

    const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
    const endDate = new Date();

    // 3. Seed Income (150 records)
    for (let i = 1; i <= 150; i++) {
      const amount = Math.floor(Math.random() * 5000) + 100;
      const date = randomDate(startDate, endDate);
      const inc = await new Income({
        amount, date, client: clients[i % clients.length]._id,
        category: 'Service Revenue', payment_method: 'Cash', notes: `Massive seed income ${i}`
      }).save();

      await new JournalEntry({
        date: inc.date, description: `Income: ${inc.notes}`, source_type: 'Income', source_id: inc._id,
        lines: [
          { account: cashAcc._id, debit: amount, credit: 0 },
          { account: serviceRevenueAcc._id, debit: 0, credit: amount }
        ]
      }).save();
    }
    console.log('Incomes seeded');

    // 4. Seed Expenses (200 records)
    const expenseCategories = ['Rent Expense', 'Salaries Expense', 'Software Subscriptions', 'Marketing Expense'];
    for (let i = 1; i <= 200; i++) {
      const amount = Math.floor(Math.random() * 3000) + 50;
      const date = randomDate(startDate, endDate);
      const category = expenseCategories[i % expenseCategories.length];
      const expAcc = await getAccount(category);
      
      const exp = await new Expense({
        amount, date, vendor: vendors[i % vendors.length]._id,
        category, payment_method: 'Cash', notes: `Massive seed expense ${i}`
      }).save();

      await new JournalEntry({
        date: exp.date, description: `Expense: ${exp.notes}`, source_type: 'Expense', source_id: exp._id,
        lines: [
          { account: expAcc._id, debit: amount, credit: 0 },
          { account: cashAcc._id, debit: 0, credit: amount }
        ]
      }).save();
    }
    console.log('Expenses seeded');

    // 5. Seed Assets (50 records)
    for (let i = 1; i <= 50; i++) {
      const purchase_value = Math.floor(Math.random() * 20000) + 1000;
      const purchase_date = randomDate(startDate, endDate);
      const asset = await new Asset({
        name: `Massive Asset ${i}`, category: 'Equipment', purchase_date,
        purchase_value, current_book_value: purchase_value, useful_life_years: 5,
        depreciation_method: 'Straight-line', vendor: vendors[i % vendors.length]._id
      }).save();

      await new JournalEntry({
        date: asset.purchase_date, description: `Acquired Asset: ${asset.name}`, source_type: 'Asset', source_id: asset._id,
        lines: [
          { account: equipmentAcc._id, debit: purchase_value, credit: 0 },
          { account: cashAcc._id, debit: 0, credit: purchase_value }
        ]
      }).save();
    }
    console.log('Assets seeded');

    // 6. Seed Liabilities (30 records)
    for (let i = 1; i <= 30; i++) {
      const principal_amount = Math.floor(Math.random() * 50000) + 5000;
      const start_date = randomDate(startDate, endDate);
      const liability = await new Liability({
        name: `Massive Loan ${i}`, type: 'Loan', principal_amount, outstanding_balance: principal_amount,
        interest_rate: 5, start_date, installments: 12, vendor: vendors[i % vendors.length]._id
      }).save();

      await new JournalEntry({
        date: liability.start_date, description: `New Liability: ${liability.name}`, source_type: 'Liability', source_id: liability._id,
        lines: [
          { account: cashAcc._id, debit: principal_amount, credit: 0 },
          { account: loansPayableAcc._id, debit: 0, credit: principal_amount }
        ]
      }).save();
    }
    console.log('Liabilities seeded');

    console.log('Seeding massive dataset completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding massive dataset:', error);
    process.exit(1);
  }
};

seedData();
