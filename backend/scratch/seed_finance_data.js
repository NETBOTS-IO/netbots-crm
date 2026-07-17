const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Account = require('../models/Account');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const JournalEntry = require('../models/JournalEntry');
const Asset = require('../models/Asset');
const Liability = require('../models/Liability');
const Client = require('../models/Client');
const Vendor = require('../models/Vendor');
const Project = require('../models/Project');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const Lead = require('../models/Lead');

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

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/netbots_crm';

async function seed() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Get creator/user ID
    const user = await User.findOne({ role: 'admin' }) || await User.findOne({});
    if (!user) {
      console.error('Error: Please seed at least one user first.');
      process.exit(1);
    }
    const creatorId = user._id;
    console.log(`Using user "${user.name}" (${creatorId}) as creator for seeded data.`);

    // 2. Clear old data
    console.log('Cleaning up existing financial and CRM records...');
    await Promise.all([
      Client.deleteMany({}),
      Lead.deleteMany({}),
      Vendor.deleteMany({}),
      Project.deleteMany({}),
      Invoice.deleteMany({}),
      Income.deleteMany({}),
      Expense.deleteMany({}),
      Asset.deleteMany({}),
      Liability.deleteMany({}),
      JournalEntry.deleteMany({}),
      Account.deleteMany({})
    ]);

    // 3. Seed Chart of Accounts
    console.log('Seeding Chart of Accounts...');
    await Account.insertMany(DEFAULT_ACCOUNTS);

    const getAccount = async (name) => {
      let acc = await Account.findOne({ name });
      if (!acc) acc = await Account.findOne({});
      return acc;
    };

    const cashAcc = await getAccount('Cash on Hand');
    const arAcc = await getAccount('Accounts Receivable');
    const apAcc = await getAccount('Accounts Payable');
    const loanAcc = await getAccount('Loans Payable');
    const rentExpenseAcc = await getAccount('Rent Expense');
    const softwareExpenseAcc = await getAccount('Software Subscriptions');
    const interestExpenseAcc = await getAccount('Interest Expense');
    const serviceRevenueAcc = await getAccount('Service Revenue');
    const otherIncomeAcc = await getAccount('Other Income');
    const equipmentAcc = await getAccount('Equipment');
    const furnitureAcc = await getAccount('Furniture');

    // 4. Seed CRM Leads
    console.log('Seeding CRM Leads...');
    const lead1 = await new Lead({ companyName: 'Acme Corp', submittedBy: creatorId }).save();
    const lead2 = await new Lead({ companyName: 'Globex Inc', submittedBy: creatorId }).save();
    const lead3 = await new Lead({ companyName: 'Initech', submittedBy: creatorId }).save();

    // 5. Seed CRM Clients & Vendors
    console.log('Seeding CRM Clients and Vendors...');
    const client1 = await new Client({
      leadId: lead1._id,
      companyName: 'Acme Corp',
      name: 'Acme Corp',
      email: 'billing@acme.com',
      dealType: 'one_time',
      startDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      submittedBy: creatorId,
      closedBy: creatorId
    }).save();

    const client2 = await new Client({
      leadId: lead2._id,
      companyName: 'Globex Inc',
      name: 'Globex Inc',
      email: 'finance@globex.com',
      dealType: 'monthly_subscription',
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      submittedBy: creatorId,
      closedBy: creatorId
    }).save();

    const client3 = await new Client({
      leadId: lead3._id,
      companyName: 'Initech',
      name: 'Initech',
      email: 'admin@initech.com',
      dealType: 'one_time',
      startDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
      submittedBy: creatorId,
      closedBy: creatorId
    }).save();

    const vendor1 = await new Vendor({ name: 'AWS Cloud', category: 'Software', contactEmail: 'billing@aws.amazon.com', createdBy: creatorId }).save();
    const vendor2 = await new Vendor({ name: 'Office Supply Depot', category: 'Supplier', contactEmail: 'orders@officesupply.com', createdBy: creatorId }).save();
    const vendor3 = await new Vendor({ name: 'Hassan Landlord Co.', category: 'Rent', contactEmail: 'hassan@landlord.com', createdBy: creatorId }).save();

    // 6. Seed Projects
    console.log('Seeding CRM Projects...');
    const project1 = await new Project({ name: 'Acme Portal Integration', client: client1._id, budget: 20000, status: 'In Progress', createdBy: creatorId }).save();
    const project2 = await new Project({ name: 'Globex Analytics Module', client: client2._id, budget: 12000, status: 'Not Started', createdBy: creatorId }).save();

    // 7. Seed Invoices
    console.log('Seeding CRM Invoices...');
    const inv1 = await new Invoice({
      invoiceNumber: 'INV-2026-001',
      client: client1._id,
      project: project1._id,
      amount: 15000,
      paidAmount: 15000,
      status: 'Paid',
      issueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      items: [{ description: 'Milestone 1 Deliverables', quantity: 1, rate: 15000, total: 15000 }],
      createdBy: creatorId
    }).save();

    const inv2 = await new Invoice({
      invoiceNumber: 'INV-2026-002',
      client: client2._id,
      project: project2._id,
      amount: 8500,
      paidAmount: 0,
      status: 'Sent',
      issueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      items: [{ description: 'Project Setup & Design', quantity: 1, rate: 8500, total: 8500 }],
      createdBy: creatorId
    }).save();

    const inv3 = await new Invoice({
      invoiceNumber: 'INV-2026-003',
      client: client3._id,
      amount: 3200,
      paidAmount: 0,
      status: 'Overdue',
      issueDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      items: [{ description: 'Standard Consultations', quantity: 8, rate: 400, total: 3200 }],
      createdBy: creatorId
    }).save();

    // 8. Seed Incomes & Incomes Journal Entries
    console.log('Seeding Income Transactions & balanced Ledger entries...');
    const inc1 = new Income({
      amount: 15000,
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      client: client1._id,
      project: project1._id,
      invoice: inv1._id,
      category: 'Service Revenue',
      payment_method: 'Bank Transfer',
      notes: 'Payment for Invoice INV-2026-001',
      createdBy: creatorId
    });
    const jeInc1 = await new JournalEntry({
      date: inc1.date,
      description: `Income: Service Revenue - Payment for INV-2026-001`,
      source_type: 'Income',
      source_id: inc1._id,
      createdBy: creatorId,
      lines: [
        { account: cashAcc._id, debit: 15000, credit: 0 },
        { account: serviceRevenueAcc._id, debit: 0, credit: 15000 }
      ]
    }).save();
    inc1.journalEntry = jeInc1._id;
    await inc1.save();

    const inc2 = new Income({
      amount: 4500,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      client: client3._id,
      category: 'Other Income',
      payment_method: 'Online',
      notes: 'Setup consultation fee',
      createdBy: creatorId
    });
    const jeInc2 = await new JournalEntry({
      date: inc2.date,
      description: `Income: Other Income - Setup fee`,
      source_type: 'Income',
      source_id: inc2._id,
      createdBy: creatorId,
      lines: [
        { account: cashAcc._id, debit: 4500, credit: 0 },
        { account: otherIncomeAcc._id, debit: 0, credit: 4500 }
      ]
    }).save();
    inc2.journalEntry = jeInc2._id;
    await inc2.save();

    // 9. Seed Expenses
    console.log('Seeding Expense Transactions & balanced Ledger entries...');
    const exp1 = new Expense({
      amount: 2500,
      date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      vendor: vendor3._id,
      category: 'Rent Expense',
      payment_method: 'Cash',
      notes: 'Office rent July 2026',
      createdBy: creatorId
    });
    const jeExp1 = await new JournalEntry({
      date: exp1.date,
      description: `Expense: Rent Expense - Office Rent`,
      source_type: 'Expense',
      source_id: exp1._id,
      createdBy: creatorId,
      lines: [
        { account: rentExpenseAcc._id, debit: 2500, credit: 0 },
        { account: cashAcc._id, debit: 0, credit: 2500 }
      ]
    }).save();
    exp1.journalEntry = jeExp1._id;
    await exp1.save();

    const exp2 = new Expense({
      amount: 1200,
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      vendor: vendor1._id,
      category: 'Software Subscriptions',
      payment_method: 'Credit Card',
      notes: 'AWS monthly Hosting',
      createdBy: creatorId
    });
    const jeExp2 = await new JournalEntry({
      date: exp2.date,
      description: `Expense: Software Subscriptions - AWS hosting`,
      source_type: 'Expense',
      source_id: exp2._id,
      createdBy: creatorId,
      lines: [
        { account: softwareExpenseAcc._id, debit: 1200, credit: 0 },
        { account: cashAcc._id, debit: 0, credit: 1200 }
      ]
    }).save();
    exp2.journalEntry = jeExp2._id;
    await exp2.save();

    const exp3 = new Expense({
      amount: 800,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      vendor: vendor2._id,
      project: project1._id,
      category: 'Rent Expense',
      payment_method: 'On Credit',
      is_billable: true,
      notes: 'Project equipment purchase',
      createdBy: creatorId
    });
    const jeExp3 = await new JournalEntry({
      date: exp3.date,
      description: `Expense: Rent Expense - Project equipment`,
      source_type: 'Expense',
      source_id: exp3._id,
      createdBy: creatorId,
      lines: [
        { account: rentExpenseAcc._id, debit: 800, credit: 0 },
        { account: apAcc._id, debit: 0, credit: 800 }
      ]
    }).save();
    exp3.journalEntry = jeExp3._id;
    await exp3.save();

    // 10. Seed Assets
    console.log('Seeding Capital Assets register...');
    const asset1 = await new Asset({
      name: 'Workstation PCs',
      category: 'Equipment',
      purchase_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      purchase_value: 6000,
      current_book_value: 4000,
      useful_life_years: 3,
      depreciation_method: 'Straight-line',
      vendor: vendor2._id,
      createdBy: creatorId
    }).save();

    await new JournalEntry({
      date: asset1.purchase_date,
      description: `Acquired Asset: Workstation PCs`,
      source_type: 'Asset',
      source_id: asset1._id,
      createdBy: creatorId,
      lines: [
        { account: equipmentAcc._id, debit: 6000, credit: 0 },
        { account: cashAcc._id, debit: 0, credit: 6000 }
      ]
    }).save();

    const asset2 = await new Asset({
      name: 'Filing Cabinets',
      category: 'Furniture',
      purchase_date: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
      purchase_value: 2400,
      current_book_value: 2400,
      useful_life_years: 5,
      depreciation_method: 'Straight-line',
      vendor: vendor2._id,
      createdBy: creatorId
    }).save();

    await new JournalEntry({
      date: asset2.purchase_date,
      description: `Acquired Asset: Filing Cabinets`,
      source_type: 'Asset',
      source_id: asset2._id,
      createdBy: creatorId,
      lines: [
        { account: furnitureAcc._id, debit: 2400, credit: 0 },
        { account: cashAcc._id, debit: 0, credit: 2400 }
      ]
    }).save();

    // 11. Seed Liabilities
    console.log('Seeding Liabilities repayment schedules...');
    const liability1 = new Liability({
      name: 'Expansion Loan',
      type: 'Loan',
      principal_amount: 50000,
      outstanding_balance: 41666.66,
      interest_rate: 5,
      start_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      installments: 12,
      vendor: null,
      createdBy: creatorId
    });

    const mPrincipal = Number((50000 / 12).toFixed(2));
    const mInterest = Number(((50000 * 0.05) / 12).toFixed(2));
    for (let i = 1; i <= 12; i++) {
      let dDate = new Date(liability1.start_date);
      dDate.setMonth(dDate.getMonth() + i);
      liability1.repayment_schedule.push({
        dueDate: dDate,
        principal: mPrincipal,
        interest: mInterest,
        total: Number((mPrincipal + mInterest).toFixed(2)),
        status: i <= 2 ? 'Paid' : 'Pending'
      });
    }

    const jeLiab = await new JournalEntry({
      date: liability1.start_date,
      description: `Acquired Liability: Expansion Loan`,
      source_type: 'Liability',
      source_id: liability1._id,
      createdBy: creatorId,
      lines: [
        { account: cashAcc._id, debit: 50000, credit: 0 },
        { account: loanAcc._id, debit: 0, credit: 50000 }
      ]
    }).save();
    liability1.journalEntry = jeLiab._id;
    await liability1.save();

    for (let i = 0; i < 2; i++) {
      const rep = liability1.repayment_schedule[i];
      await new JournalEntry({
        date: rep.dueDate,
        description: `Repayment of loan installment: Expansion Loan`,
        source_type: 'LiabilityRepayment',
        source_id: liability1._id,
        createdBy: creatorId,
        lines: [
          { account: loanAcc._id, debit: rep.principal, credit: 0 },
          { account: interestExpenseAcc._id, debit: rep.interest, credit: 0 },
          { account: cashAcc._id, debit: 0, credit: rep.total }
        ]
      }).save();
    }

    const liability2 = await new Liability({
      name: 'Equipment purchase payable',
      type: 'Payable',
      principal_amount: 800,
      outstanding_balance: 800,
      interest_rate: 0,
      start_date: exp3.date,
      installments: 1,
      vendor: vendor2._id,
      createdBy: creatorId
    }).save();
    liability2.repayment_schedule.push({
      dueDate: new Date(exp3.date.getTime() + 30 * 24 * 60 * 60 * 1000),
      principal: 800,
      interest: 0,
      total: 800,
      status: 'Pending'
    });
    await liability2.save();

    console.log('--------------------------------------------------');
    console.log('Success: All demo accounts and data populated!');
    console.log('--------------------------------------------------');
    mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error during seeding:', err.stack);
    mongoose.connection.close();
    process.exit(1);
  }
}

seed();
