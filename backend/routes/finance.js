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

// GET Incomes
router.get('/income', auth, async (req, res) => {
  try {
    const incomes = await Income.find()
      .populate('client', 'name email')
      .populate('project', 'name')
      .sort('-date');
    res.json({ success: true, data: incomes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add Income
router.post('/income', auth, async (req, res) => {
  try {
    const { amount, date, client, project, category, payment_method, notes } = req.body;
    
    const income = new Income({
      amount,
      date: date || new Date(),
      client: client || null,
      project: project || null,
      category,
      payment_method,
      notes,
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
router.post('/expense', auth, async (req, res) => {
  try {
    const { amount, date, vendor, project, category, payment_method, notes, is_billable, is_recurring } = req.body;
    
    const expense = new Expense({
      amount,
      date: date || new Date(),
      vendor: vendor || null,
      project: project || null,
      category,
      payment_method,
      is_billable: !!is_billable,
      is_recurring: !!is_recurring,
      notes,
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
    const clients = await Client.find({}, 'name email company');
    res.json({ success: true, data: clients });
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
    const projects = await Project.find({}).populate('client', 'name');
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

module.exports = router;
