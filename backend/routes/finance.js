const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Account = require('../models/Account');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const JournalEntry = require('../models/JournalEntry');
const Asset = require('../models/Asset');
const Liability = require('../models/Liability');
const Client = require('../models/Client');
const Vendor = require('../models/Vendor');
const Project = require('../models/Project');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

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

// Helper to get Account by name
const getAccount = async (name) => {
  let acc = await Account.findOne({ name });
  if (!acc) {
    acc = await Account.findOne({ isSystem: true });
  }
  return acc;
};

// Seed default chart of accounts
router.post('/accounts/seed', auth, async (req, res) => {
  try {
    const existing = await Account.countDocuments();
    if (existing > 0) {
      return res.status(400).json({ success: false, error: 'Accounts already seeded' });
    }
    await Account.insertMany(DEFAULT_ACCOUNTS);
    res.json({ success: true, message: 'Chart of accounts seeded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all accounts
router.get('/accounts', auth, async (req, res) => {
  try {
    const accounts = await Account.find().populate('parent_account');
    res.json({ success: true, data: accounts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add Account Category
router.post('/accounts', auth, async (req, res) => {
  try {
    const { name, type, description, parent_account } = req.body;
    const account = new Account({
      name,
      type,
      description,
      parent_account: parent_account || null
    });
    await account.save();
    res.status(201).json({ success: true, data: account });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET Incomes
router.get('/income', auth, async (req, res) => {
  try {
    const incomes = await Income.find()
      .populate('client', 'companyName contactName email')
      .populate('project', 'name')
      .sort('-date');
    res.json({ success: true, data: incomes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add Income
router.post('/income', auth, upload.single('attachment'), async (req, res) => {
  try {
    const { amount, date, client, project, category, payment_method, notes } = req.body;
    
    const income = new Income({
      amount: Number(amount),
      date: date || new Date(),
      client: client || null,
      project: project || null,
      category,
      payment_method,
      notes,
      attachment: req.file ? `/uploads/${req.file.filename}` : null,
      createdBy: req.user.id
    });

    const debitAccount = await getAccount('Cash on Hand');
    const creditAccount = await getAccount(category) || await getAccount('Service Revenue');

    if (!debitAccount || !creditAccount) {
      return res.status(400).json({ success: false, error: 'Corresponding ledger accounts not found.' });
    }

    const journalEntry = new JournalEntry({
      date: date || new Date(),
      description: `Income: ${category} - ${notes || 'Client Payment'}`,
      source_type: 'Income',
      source_id: income._id,
      createdBy: req.user.id,
      lines: [
        { account: debitAccount._id, debit: amount, credit: 0 },
        { account: creditAccount._id, debit: 0, credit: amount }
      ]
    });

    await journalEntry.save();
    
    income.journalEntry = journalEntry._id;
    await income.save();

    res.status(201).json({ success: true, data: income });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET Expenses
router.get('/expense', auth, async (req, res) => {
  try {
    const expenses = await Expense.find()
      .populate('vendor', 'name')
      .populate('project', 'name')
      .sort('-date');
    res.json({ success: true, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add Expense
router.post('/expense', auth, upload.single('attachment'), async (req, res) => {
  try {
    const { amount, date, vendor, project, category, payment_method, notes, is_billable, is_recurring } = req.body;
    
    const expense = new Expense({
      amount: Number(amount),
      date: date || new Date(),
      vendor: vendor || null,
      project: project || null,
      category,
      payment_method,
      is_billable: is_billable === 'true' || is_billable === true,
      is_recurring: is_recurring === 'true' || is_recurring === true,
      notes,
      attachment: req.file ? `/uploads/${req.file.filename}` : null,
      createdBy: req.user.id
    });

    const debitAccount = await getAccount(category) || await getAccount('Rent Expense');
    let creditAccountName = 'Cash on Hand';
    if (payment_method === 'On Credit') {
      creditAccountName = 'Accounts Payable';
    }
    const creditAccount = await getAccount(creditAccountName);

    if (!debitAccount || !creditAccount) {
      return res.status(400).json({ success: false, error: 'Corresponding ledger accounts not found.' });
    }

    const journalEntry = new JournalEntry({
      date: date || new Date(),
      description: `Expense: ${category} - ${notes || 'Payment'}`,
      source_type: 'Expense',
      source_id: expense._id,
      createdBy: req.user.id,
      lines: [
        { account: debitAccount._id, debit: amount, credit: 0 },
        { account: creditAccount._id, debit: 0, credit: amount }
      ]
    });

    await journalEntry.save();
    
    expense.journalEntry = journalEntry._id;
    await expense.save();

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET unbilled billable expenses for a specific client
router.get('/expense/billable/:clientId', auth, async (req, res) => {
  try {
    // A billable expense for a client could be via the project or directly to client if we had it,
    // but in Expense model we have `project`. So we find projects for this client, then expenses for those projects.
    const projects = await Project.find({ client: req.params.clientId });
    const projectIds = projects.map(p => p._id);
    
    const expenses = await Expense.find({
      is_billable: true,
      billed_on_invoice: { $exists: false },
      project: { $in: projectIds }
    }).populate('project', 'name').populate('vendor', 'name');
    
    res.json({ success: true, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET Assets
router.get('/assets', auth, async (req, res) => {
  try {
    const assets = await Asset.find()
      .populate('vendor', 'name')
      .sort('-purchase_date');
    res.json({ success: true, data: assets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add Asset
router.post('/assets', auth, async (req, res) => {
  try {
    const { name, category, purchase_date, purchase_value, useful_life_years, depreciation_method, vendor } = req.body;
    
    const asset = new Asset({
      name,
      category,
      purchase_date: purchase_date || new Date(),
      purchase_value,
      useful_life_years: useful_life_years || 3,
      depreciation_method: depreciation_method || 'Straight-line',
      vendor: vendor || null,
      createdBy: req.user.id
    });

    let accountName = 'Equipment';
    if (category === 'Software/Digital') accountName = 'Software/Digital Assets';
    if (category === 'Furniture') accountName = 'Furniture';
    if (category === 'Vehicles') accountName = 'Vehicles';

    const debitAccount = await getAccount(accountName);
    const creditAccount = await getAccount('Cash on Hand');

    if (debitAccount && creditAccount) {
      const journalEntry = new JournalEntry({
        date: purchase_date || new Date(),
        description: `Acquired Asset: ${name}`,
        source_type: 'Asset',
        source_id: asset._id,
        createdBy: req.user.id,
        lines: [
          { account: debitAccount._id, debit: purchase_value, credit: 0 },
          { account: creditAccount._id, debit: 0, credit: purchase_value }
        ]
      });
      await journalEntry.save();
      asset.journalEntry = journalEntry._id;
    }

    await asset.save();
    res.status(201).json({ success: true, data: asset });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Depreciate Asset (Straight-line)
router.post('/assets/:id/depreciate', auth, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ success: false, error: 'Asset not found' });
    if (asset.status !== 'Active') return res.status(400).json({ success: false, error: 'Asset is not active' });
    if (asset.depreciation_method === 'None') return res.status(400).json({ success: false, error: 'Asset is not depreciable' });

    const annualDepreciation = asset.purchase_value / asset.useful_life_years;
    const amount = Number((annualDepreciation / 12).toFixed(2));

    if (asset.current_book_value <= amount) {
      return res.status(400).json({ success: false, error: 'Asset is already fully depreciated' });
    }

    const debitAccount = await getAccount('Depreciation Expense');
    const creditAccount = await getAccount('Accumulated Depreciation');

    if (!debitAccount || !creditAccount) {
      return res.status(400).json({ success: false, error: 'Accounting configurations missing' });
    }

    const journalEntry = new JournalEntry({
      date: new Date(),
      description: `Depreciation run for: ${asset.name}`,
      source_type: 'AssetDepreciation',
      source_id: asset._id,
      createdBy: req.user.id,
      lines: [
        { account: debitAccount._id, debit: amount, credit: 0 },
        { account: creditAccount._id, debit: 0, credit: amount }
      ]
    });

    await journalEntry.save();
    
    asset.current_book_value = Number((asset.current_book_value - amount).toFixed(2));
    await asset.save();

    res.json({ success: true, data: asset, depreciationPosted: amount });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Dispose Asset
router.post('/assets/:id/dispose', auth, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ success: false, error: 'Asset not found' });
    if (asset.status !== 'Active') return res.status(400).json({ success: false, error: 'Asset already disposed' });

    const salvageValue = Number(req.body.salvageValue) || 0;
    const bookValue = asset.current_book_value;
    const gainOrLoss = salvageValue - bookValue;

    const debitAccount = await getAccount('Cash on Hand');
    let assetAccountName = 'Equipment';
    if (asset.category === 'Software/Digital') assetAccountName = 'Software/Digital Assets';
    if (asset.category === 'Furniture') assetAccountName = 'Furniture';
    if (asset.category === 'Vehicles') assetAccountName = 'Vehicles';
    const creditAccount = await getAccount(assetAccountName);

    if (debitAccount && creditAccount) {
      const lines = [
        { account: creditAccount._id, debit: 0, credit: bookValue }
      ];
      if (salvageValue > 0) {
        lines.push({ account: debitAccount._id, debit: salvageValue, credit: 0 });
      }
      
      const journalEntry = new JournalEntry({
        date: new Date(),
        description: `Disposed Asset: ${asset.name}. Salvage value: ${salvageValue}. Gain/Loss: ${gainOrLoss}`,
        source_type: 'AssetDisposal',
        source_id: asset._id,
        createdBy: req.user.id,
        lines
      });
      await journalEntry.save();
    }

    asset.status = 'Disposed';
    asset.current_book_value = 0;
    await asset.save();

    res.json({ success: true, data: asset, gainOrLoss });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET Liabilities
router.get('/liabilities', auth, async (req, res) => {
  try {
    const liabilities = await Liability.find()
      .populate('vendor', 'name')
      .sort('-createdAt');
    res.json({ success: true, data: liabilities });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add Liability
router.post('/liabilities', auth, async (req, res) => {
  try {
    const { name, type, principal_amount, interest_rate, start_date, installments, vendor } = req.body;
    
    const liability = new Liability({
      name,
      type,
      principal_amount,
      outstanding_balance: principal_amount,
      interest_rate: interest_rate || 0,
      start_date: start_date || new Date(),
      installments: installments || 1,
      vendor: vendor || null,
      createdBy: req.user.id
    });

    if (installments > 0) {
      const monthlyPrincipal = Number((principal_amount / installments).toFixed(2));
      const monthlyInterest = Number(((principal_amount * ((interest_rate || 0) / 100)) / installments).toFixed(2));
      
      for (let i = 1; i <= installments; i++) {
        let date = new Date(start_date || Date.now());
        date.setMonth(date.getMonth() + i);
        liability.repayment_schedule.push({
          dueDate: date,
          principal: monthlyPrincipal,
          interest: monthlyInterest,
          total: Number((monthlyPrincipal + monthlyInterest).toFixed(2)),
          status: 'Pending'
        });
      }
    }

    const debitAccount = await getAccount('Cash on Hand');
    const creditAccount = await getAccount('Loans Payable');

    if (debitAccount && creditAccount) {
      const journalEntry = new JournalEntry({
        date: start_date || new Date(),
        description: `Acquired Liability: ${name}`,
        source_type: 'Liability',
        source_id: liability._id,
        createdBy: req.user.id,
        lines: [
          { account: debitAccount._id, debit: principal_amount, credit: 0 },
          { account: creditAccount._id, debit: 0, credit: principal_amount }
        ]
      });
      await journalEntry.save();
      liability.journalEntry = journalEntry._id;
    }

    await liability.save();
    res.status(201).json({ success: true, data: liability });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Repay Liability Installment
router.post('/liabilities/:id/repay/:repaymentId', auth, async (req, res) => {
  try {
    const liability = await Liability.findById(req.params.id);
    if (!liability) return res.status(404).json({ success: false, error: 'Liability not found' });

    const repayment = liability.repayment_schedule.id(req.params.repaymentId);
    if (!repayment) return res.status(404).json({ success: false, error: 'Repayment installment not found' });
    if (repayment.status === 'Paid') return res.status(400).json({ success: false, error: 'Repayment already paid' });

    const liabilityAccount = await getAccount('Loans Payable');
    const interestAccount = await getAccount('Interest Expense');
    const cashAccount = await getAccount('Cash on Hand');

    if (!liabilityAccount || !interestAccount || !cashAccount) {
      return res.status(400).json({ success: false, error: 'Accounting system configuration missing' });
    }

    const journalEntry = new JournalEntry({
      date: new Date(),
      description: `Repayment of installment for loan: ${liability.name}`,
      source_type: 'LiabilityRepayment',
      source_id: liability._id,
      createdBy: req.user.id,
      lines: [
        { account: liabilityAccount._id, debit: repayment.principal, credit: 0 },
        { account: interestAccount._id, debit: repayment.interest, credit: 0 },
        { account: cashAccount._id, debit: 0, credit: repayment.total }
      ]
    });

    await journalEntry.save();

    repayment.status = 'Paid';
    liability.outstanding_balance = Number((liability.outstanding_balance - repayment.principal).toFixed(2));
    if (liability.outstanding_balance < 0) liability.outstanding_balance = 0;
    
    await liability.save();

    res.json({ success: true, data: liability });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CRM HELPERS
router.get('/clients', auth, async (req, res) => {
  try {
    const clients = await Client.find({}, 'companyName contactName email');
    res.json({ success: true, data: clients });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
router.post('/clients', auth, async (req, res) => {
  try {
    const { companyName, contactName, email, phone } = req.body;
    const client = new Client({
      companyName,
      contactName: contactName || '',
      email: email || '',
      phone: phone || '',
      dealType: 'one_time',
      startDate: new Date(),
      submittedBy: req.user.id
    });
    await client.save();
    res.status(201).json({ success: true, data: client });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
router.get('/vendors', auth, async (req, res) => {
  try {
    const vendors = await Vendor.find({});
    res.json({ success: true, data: vendors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/vendors', auth, async (req, res) => {
  try {
    const { name, category, contactEmail, contactPhone, address, taxId } = req.body;
    const vendor = new Vendor({ name, category, contactEmail, contactPhone, address, taxId, createdBy: req.user.id });
    await vendor.save();
    res.status(201).json({ success: true, data: vendor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/projects', auth, async (req, res) => {
  try {
    const projects = await Project.find({}).populate('client', 'companyName contactName');
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/projects', auth, async (req, res) => {
  try {
    const { name, client, budget, description, startDate, endDate } = req.body;
    const project = new Project({ name, client, budget, description, startDate, endDate, createdBy: req.user.id });
    await project.save();
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Seed all demo data for comprehensive testing
router.post('/accounts/seed-all-data', auth, async (req, res) => {
  try {
    const creatorId = req.user.id;

    // 1. Seed accounts first if empty
    const acctCount = await Account.countDocuments();
    if (acctCount === 0) {
      await Account.insertMany(DEFAULT_ACCOUNTS);
    }

    // 2. Clear existing entries to prevent duplication
    await Promise.all([
      Client.deleteMany({}),
      Vendor.deleteMany({}),
      Project.deleteMany({}),
      Invoice.deleteMany({}),
      Income.deleteMany({}),
      Expense.deleteMany({}),
      Asset.deleteMany({}),
      Liability.deleteMany({}),
      JournalEntry.deleteMany({})
    ]);

    // Get needed accounts
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

    // 3. Create Sample Clients
    const client1 = await new Client({ name: 'Acme Corp', email: 'billing@acme.com', company: 'Acme', submittedBy: creatorId, closedBy: creatorId }).save();
    const client2 = await new Client({ name: 'Globex Inc', email: 'finance@globex.com', company: 'Globex', submittedBy: creatorId, closedBy: creatorId }).save();
    const client3 = await new Client({ name: 'Initech', email: 'admin@initech.com', company: 'Initech', submittedBy: creatorId, closedBy: creatorId }).save();

    // 4. Create Sample Vendors
    const vendor1 = await new Vendor({ name: 'AWS Cloud', category: 'Software', contactEmail: 'billing@aws.amazon.com', createdBy: creatorId }).save();
    const vendor2 = await new Vendor({ name: 'Office Supply Depot', category: 'Supplier', contactEmail: 'orders@officesupply.com', createdBy: creatorId }).save();
    const vendor3 = await new Vendor({ name: 'Hassan Landlord Co.', category: 'Rent', contactEmail: 'hassan@landlord.com', createdBy: creatorId }).save();

    // 5. Create Sample Projects
    const project1 = await new Project({ name: 'Acme Portal Integration', client: client1._id, budget: 20000, status: 'In Progress', createdBy: creatorId }).save();
    const project2 = await new Project({ name: 'Globex Analytics Module', client: client2._id, budget: 12000, status: 'Not Started', createdBy: creatorId }).save();

    // 6. Create Invoices (to test AR aging & invoice payment auto flow)
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
    await new JournalEntry({
      date: inv1.issueDate,
      description: `Invoice Issued #${inv1.invoiceNumber}`,
      source_type: 'Invoice',
      source_id: inv1._id,
      createdBy: creatorId,
      lines: [
        { account: arAcc._id, debit: 15000, credit: 0 },
        { account: serviceRevenueAcc._id, debit: 0, credit: 15000 }
      ]
    }).save();

    const inv2 = await new Invoice({
      invoiceNumber: 'INV-2026-002',
      client: client2._id,
      project: project2._id,
      amount: 8500,
      paidAmount: 4000,
      status: 'Partial',
      issueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      items: [{ description: 'Project Setup & Design', quantity: 1, rate: 8500, total: 8500 }],
      createdBy: creatorId
    }).save();
    await new JournalEntry({
      date: inv2.issueDate,
      description: `Invoice Issued #${inv2.invoiceNumber}`,
      source_type: 'Invoice',
      source_id: inv2._id,
      createdBy: creatorId,
      lines: [
        { account: arAcc._id, debit: 8500, credit: 0 },
        { account: serviceRevenueAcc._id, debit: 0, credit: 8500 }
      ]
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
    await new JournalEntry({
      date: inv3.issueDate,
      description: `Invoice Issued #${inv3.invoiceNumber}`,
      source_type: 'Invoice',
      source_id: inv3._id,
      createdBy: creatorId,
      lines: [
        { account: arAcc._id, debit: 3200, credit: 0 },
        { account: serviceRevenueAcc._id, debit: 0, credit: 3200 }
      ]
    }).save();

    // 7. Create Incomes
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
    
    const inc2 = new Income({
      amount: 4000,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      client: client2._id,
      project: project2._id,
      invoice: inv2._id,
      category: 'Service Revenue',
      payment_method: 'Online',
      notes: 'Partial advance payment for INV-2026-002',
      createdBy: creatorId
    });

    // Income Journal Entries
    const jeInc1 = await new JournalEntry({
      date: inc1.date,
      description: `Income: Service Revenue - Payment for INV-2026-001`,
      source_type: 'Income',
      source_id: inc1._id,
      createdBy: creatorId,
      lines: [
        { account: cashAcc._id, debit: 15000, credit: 0 },
        { account: arAcc._id, debit: 0, credit: 15000 }
      ]
    }).save();
    inc1.journalEntry = jeInc1._id;
    await inc1.save();

    const jeInc2 = await new JournalEntry({
      date: inc2.date,
      description: `Income: Service Revenue - Partial Payment for INV-2026-002`,
      source_type: 'Income',
      source_id: inc2._id,
      createdBy: creatorId,
      lines: [
        { account: cashAcc._id, debit: 4000, credit: 0 },
        { account: arAcc._id, debit: 0, credit: 4000 }
      ]
    }).save();
    inc2.journalEntry = jeInc2._id;
    await inc2.save();

    // 8. Create Expenses
    const exp1 = new Expense({
      amount: 2500,
      date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      vendor: vendor3._id,
      category: 'Rent Expense',
      payment_method: 'Cash',
      notes: 'Office rent July 2026',
      createdBy: creatorId
    });

    const exp2 = new Expense({
      amount: 1200,
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      vendor: vendor1._id,
      category: 'Software Subscriptions',
      payment_method: 'Credit Card',
      notes: 'AWS monthly Hosting',
      createdBy: creatorId
    });

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

    // 9. Create Assets
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

    // 10. Create Liabilities
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

    // Populate installments
    const monthlyPrincipal = Number((50000 / 12).toFixed(2));
    const monthlyInterest = Number(((50000 * (5 / 100)) / 12).toFixed(2));
    for (let i = 1; i <= 12; i++) {
      let dDate = new Date(liability1.start_date);
      dDate.setMonth(dDate.getMonth() + i);
      liability1.repayment_schedule.push({
        dueDate: dDate,
        principal: monthlyPrincipal,
        interest: monthlyInterest,
        total: Number((monthlyPrincipal + monthlyInterest).toFixed(2)),
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

    // Add repayments journal entries
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

    // Also record Payable liability corresponding to Exp3
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

    res.json({ success: true, message: 'All CRM, ERP, and General Ledger demo data seeded successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
