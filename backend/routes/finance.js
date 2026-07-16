const express = require('express');
const router = express.Router();
const Account = require('../models/Account');

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
  { name: 'Accumulated Depreciation', type: 'Asset', isSystem: true }
];

// Seed default chart of accounts
router.post('/accounts/seed', async (req, res) => {
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
router.get('/accounts', async (req, res) => {
  try {
    const accounts = await Account.find().populate('parent_account');
    res.json({ success: true, data: accounts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const Income = require('../models/Income');
const Expense = require('../models/Expense');
const JournalEntry = require('../models/JournalEntry');

// Helper to get Account by name
const getAccount = async (name) => {
  return await Account.findOne({ name });
};

// Add Income
router.post('/income', async (req, res) => {
  try {
    const { amount, date, client, project, category, payment_method, notes } = req.body;
    
    // Create Income Record
    const income = new Income({
      amount, date, client, project, category, payment_method, notes, createdBy: req.user ? req.user.id : null
    });

    // Accounting Logic: Debit Cash/Bank, Credit Income
    const debitAccount = await getAccount('Cash on Hand'); // Simplified for now
    const creditAccount = await getAccount(category) || await getAccount('Service Revenue');

    if (!debitAccount || !creditAccount) {
      return res.status(400).json({ success: false, error: 'Corresponding accounts not found for ledger entry.' });
    }

    const journalEntry = new JournalEntry({
      date: date || Date.now(),
      description: `Income from ${payment_method}: ${notes || category}`,
      source_type: 'Income',
      source_id: income._id,
      createdBy: req.user ? req.user.id : null,
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

// Add Expense
router.post('/expense', async (req, res) => {
  try {
    const { amount, date, vendor, project, category, payment_method, notes, is_billable } = req.body;
    
    const expense = new Expense({
      amount, date, vendor, project, category, payment_method, notes, is_billable, createdBy: req.user ? req.user.id : null
    });

    // Accounting Logic: Debit Expense, Credit Cash/Payable
    const debitAccount = await getAccount(category) || await getAccount('Other Expense');
    let creditAccountName = 'Cash on Hand';
    if (payment_method === 'On Credit') creditAccountName = 'Accounts Payable';
    
    const creditAccount = await getAccount(creditAccountName);

    if (!debitAccount || !creditAccount) {
      return res.status(400).json({ success: false, error: 'Corresponding accounts not found for ledger entry.' });
    }

    const journalEntry = new JournalEntry({
      date: date || Date.now(),
      description: `Expense to ${vendor || 'Vendor'}: ${notes || category}`,
      source_type: 'Expense',
      source_id: expense._id,
      createdBy: req.user ? req.user.id : null,
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

const Asset = require('../models/Asset');
const Liability = require('../models/Liability');

// Add Asset
router.post('/assets', async (req, res) => {
  try {
    const { name, category, purchase_date, purchase_value, useful_life_years, depreciation_method, vendor } = req.body;
    
    const asset = new Asset({
      name, category, purchase_date, purchase_value, useful_life_years, depreciation_method, vendor, createdBy: req.user ? req.user.id : null
    });

    // Accounting Logic: Debit Asset Category, Credit Cash/Bank
    const debitAccount = await getAccount(category) || await getAccount('Accounts Receivable'); // Fallback, should be specific asset account
    const creditAccount = await getAccount('Cash on Hand');

    if (debitAccount && creditAccount) {
      const journalEntry = new JournalEntry({
        description: `Purchased Asset: ${name}`,
        source_type: 'Asset',
        source_id: asset._id,
        createdBy: req.user ? req.user.id : null,
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

// Add Liability
router.post('/liabilities', async (req, res) => {
  try {
    const { name, type, principal_amount, interest_rate, start_date, installments, vendor } = req.body;
    
    const liability = new Liability({
      name, type, principal_amount, outstanding_balance: principal_amount, interest_rate, start_date, installments, vendor, createdBy: req.user ? req.user.id : null
    });

    // Generate simple repayment schedule
    if (installments > 0) {
      const monthlyPrincipal = principal_amount / installments;
      const monthlyInterest = (principal_amount * (interest_rate / 100)) / installments;
      for (let i = 1; i <= installments; i++) {
        let date = new Date(start_date || Date.now());
        date.setMonth(date.getMonth() + i);
        liability.repayment_schedule.push({
          dueDate: date,
          principal: monthlyPrincipal,
          interest: monthlyInterest,
          total: monthlyPrincipal + monthlyInterest
        });
      }
    }

    // Accounting Logic: Debit Cash, Credit Liability
    const debitAccount = await getAccount('Cash on Hand');
    const creditAccount = await getAccount('Accounts Payable'); // Fallback

    if (debitAccount && creditAccount) {
      const journalEntry = new JournalEntry({
        description: `Liability Acquired: ${name}`,
        source_type: 'Liability',
        source_id: liability._id,
        createdBy: req.user ? req.user.id : null,
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

module.exports = router;
