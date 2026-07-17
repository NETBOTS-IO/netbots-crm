const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Account = require('../models/Account');
const JournalEntry = require('../models/JournalEntry');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Asset = require('../models/Asset');
const Liability = require('../models/Liability');
const Invoice = require('../models/Invoice');
const Project = require('../models/Project');

// Helper to get all accounts mapped by ID
const getAccountsMap = async () => {
  const accounts = await Account.find({});
  const map = {};
  accounts.forEach(a => {
    map[a._id.toString()] = a;
  });
  return map;
};

// 1. Profit & Loss (Income Statement)
router.get('/pnl', auth, async (req, res) => {
  try {
    const accountsMap = await getAccountsMap();
    
    const report = await JournalEntry.aggregate([
      { $unwind: "$lines" },
      { 
        $group: {
          _id: "$lines.account",
          totalDebit: { $sum: "$lines.debit" },
          totalCredit: { $sum: "$lines.credit" }
        }
      }
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    const incomeDetails = [];
    const expenseDetails = [];

    report.forEach(row => {
      const acc = accountsMap[row._id.toString()];
      if (!acc) return;

      if (acc.type === 'Income') {
        const balance = row.totalCredit - row.totalDebit;
        totalIncome += balance;
        incomeDetails.push({ account: acc.name, balance });
      } else if (acc.type === 'Expense') {
        const balance = row.totalDebit - row.totalCredit;
        totalExpense += balance;
        expenseDetails.push({ account: acc.name, balance });
      }
    });

    res.json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        netProfit: totalIncome - totalExpense,
        incomeDetails,
        expenseDetails
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Balance Sheet
router.get('/balance-sheet', auth, async (req, res) => {
  try {
    const accountsMap = await getAccountsMap();

    const report = await JournalEntry.aggregate([
      { $unwind: "$lines" },
      { 
        $group: {
          _id: "$lines.account",
          totalDebit: { $sum: "$lines.debit" },
          totalCredit: { $sum: "$lines.credit" }
        }
      }
    ]);

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    
    const assetDetails = [];
    const liabilityDetails = [];
    const equityDetails = [];

    // Calculate P&L Net Profit to roll into Retained Earnings (Equity)
    let netProfit = 0;
    report.forEach(row => {
      const acc = accountsMap[row._id.toString()];
      if (!acc) return;
      if (acc.type === 'Income') {
        netProfit += (row.totalCredit - row.totalDebit);
      } else if (acc.type === 'Expense') {
        netProfit -= (row.totalDebit - row.totalCredit);
      }
    });

    report.forEach(row => {
      const acc = accountsMap[row._id.toString()];
      if (!acc) return;

      if (acc.type === 'Asset') {
        const balance = row.totalDebit - row.totalCredit;
        totalAssets += balance;
        assetDetails.push({ account: acc.name, balance });
      } else if (acc.type === 'Liability') {
        const balance = row.totalCredit - row.totalDebit;
        totalLiabilities += balance;
        liabilityDetails.push({ account: acc.name, balance });
      } else if (acc.type === 'Equity') {
        let balance = row.totalCredit - row.totalDebit;
        if (acc.name === 'Retained Earnings') {
          balance += netProfit; // Add Net Profit dynamically to Retained Earnings
        }
        totalEquity += balance;
        equityDetails.push({ account: acc.name, balance });
      }
    });

    // Check if Retained Earnings is in the list, if not, add it dynamically
    const hasRetainedEarnings = equityDetails.some(e => e.account === 'Retained Earnings');
    if (!hasRetainedEarnings && netProfit !== 0) {
      totalEquity += netProfit;
      equityDetails.push({ account: 'Retained Earnings', balance: netProfit });
    }

    res.json({
      success: true,
      data: {
        totalAssets,
        totalLiabilities,
        totalEquity,
        assetDetails,
        liabilityDetails,
        equityDetails,
        isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Cash Flow Statement
router.get('/cash-flow', auth, async (req, res) => {
  try {
    const cashAccount = await Account.findOne({ name: 'Cash on Hand' });
    if (!cashAccount) {
      return res.status(400).json({ success: false, error: 'Cash on Hand account not found' });
    }

    // Retrieve journal entry lines that touch the Cash account
    const entries = await JournalEntry.find({ 'lines.account': cashAccount._id })
      .sort('date');

    let cashIn = 0;
    let cashOut = 0;
    const flows = [];

    entries.forEach(entry => {
      const cashLine = entry.lines.find(l => l.account.toString() === cashAccount._id.toString());
      if (cashLine) {
        const debit = cashLine.debit;
        const credit = cashLine.credit;
        const netFlow = debit - credit;

        if (netFlow > 0) {
          cashIn += netFlow;
        } else {
          cashOut += Math.abs(netFlow);
        }

        flows.push({
          date: entry.date,
          description: entry.description,
          sourceType: entry.source_type,
          amount: netFlow
        });
      }
    });

    res.json({
      success: true,
      data: {
        cashIn,
        cashOut,
        netCashFlow: cashIn - cashOut,
        flows
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Trial Balance
router.get('/trial-balance', auth, async (req, res) => {
  try {
    const accountsMap = await getAccountsMap();

    const report = await JournalEntry.aggregate([
      { $unwind: "$lines" },
      { 
        $group: {
          _id: "$lines.account",
          totalDebit: { $sum: "$lines.debit" },
          totalCredit: { $sum: "$lines.credit" }
        }
      }
    ]);

    const accounts = [];
    let grandTotalDebit = 0;
    let grandTotalCredit = 0;

    report.forEach(row => {
      const acc = accountsMap[row._id.toString()];
      if (!acc) return;

      const debit = row.totalDebit;
      const credit = row.totalCredit;
      grandTotalDebit += debit;
      grandTotalCredit += credit;

      accounts.push({
        account: acc.name,
        type: acc.type,
        debit,
        credit
      });
    });

    res.json({
      success: true,
      data: {
        accounts,
        grandTotalDebit,
        grandTotalCredit,
        isBalanced: Math.abs(grandTotalDebit - grandTotalCredit) < 0.01
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Expense Breakdown Report
router.get('/expense-breakdown', auth, async (req, res) => {
  try {
    const expenses = await Expense.find().populate('project', 'name').populate('vendor', 'name');
    
    const byCategory = {};
    const byVendor = {};
    const byProject = {};
    let totalExpense = 0;

    expenses.forEach(e => {
      totalExpense += e.amount;

      // Group by Category
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;

      // Group by Vendor
      const vendorName = e.vendor ? e.vendor.name : 'Unspecified';
      byVendor[vendorName] = (byVendor[vendorName] || 0) + e.amount;

      // Group by Project
      const projectName = e.project ? e.project.name : 'No Project';
      byProject[projectName] = (byProject[projectName] || 0) + e.amount;
    });

    res.json({
      success: true,
      data: {
        totalExpense,
        byCategory: Object.keys(byCategory).map(k => ({ label: k, amount: byCategory[k] })),
        byVendor: Object.keys(byVendor).map(k => ({ label: k, amount: byVendor[k] })),
        byProject: Object.keys(byProject).map(k => ({ label: k, amount: byProject[k] }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Income Breakdown Report
router.get('/income-breakdown', auth, async (req, res) => {
  try {
    const incomes = await Income.find().populate('project', 'name').populate('client', 'companyName contactName');
    
    const byCategory = {};
    const byClient = {};
    const byProject = {};
    let totalIncome = 0;

    incomes.forEach(i => {
      totalIncome += i.amount;

      // Group by Category
      byCategory[i.category] = (byCategory[i.category] || 0) + i.amount;

      // Group by Client
      const clientName = i.client ? (i.client.companyName || i.client.contactName) : 'Unspecified';
      byClient[clientName] = (byClient[clientName] || 0) + i.amount;

      // Group by Project
      const projectName = i.project ? i.project.name : 'No Project';
      byProject[projectName] = (byProject[projectName] || 0) + i.amount;
    });

    res.json({
      success: true,
      data: {
        totalIncome,
        byCategory: Object.keys(byCategory).map(k => ({ label: k, amount: byCategory[k] })),
        byClient: Object.keys(byClient).map(k => ({ label: k, amount: byClient[k] })),
        byProject: Object.keys(byProject).map(k => ({ label: k, amount: byProject[k] }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Accounts Receivable (AR) Aging Report
router.get('/ar-aging', auth, async (req, res) => {
  try {
    const invoices = await Invoice.find({ status: { $ne: 'Paid' } }).populate('client', 'companyName contactName');
    
    const now = new Date();
    const brackets = {
      '0-30 days': [],
      '31-60 days': [],
      '61-90 days': [],
      '90+ days': []
    };
    
    let totalOutstanding = 0;

    invoices.forEach(inv => {
      const outstanding = inv.amount - (inv.paidAmount || 0);
      if (outstanding <= 0) return;

      totalOutstanding += outstanding;
      
      const diffTime = Math.abs(now - new Date(inv.dueDate));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const item = {
        invoiceNumber: inv.invoiceNumber,
        client: inv.client ? (inv.client.companyName || inv.client.contactName) : 'Unknown Client',
        amount: inv.amount,
        outstanding,
        dueDate: inv.dueDate
      };

      if (diffDays <= 30) {
        brackets['0-30 days'].push(item);
      } else if (diffDays <= 60) {
        brackets['31-60 days'].push(item);
      } else if (diffDays <= 90) {
        brackets['61-90 days'].push(item);
      } else {
        brackets['90+ days'].push(item);
      }
    });

    res.json({
      success: true,
      data: {
        totalOutstanding,
        brackets: Object.keys(brackets).map(k => ({
          bracket: k,
          amount: brackets[k].reduce((sum, item) => sum + item.outstanding, 0),
          invoices: brackets[k]
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. Accounts Payable (AP) Aging Report
router.get('/ap-aging', auth, async (req, res) => {
  try {
    // Collect liabilities of type 'Payable' or expenses purchased 'On Credit' that aren't fully paid
    const payables = await Liability.find({ type: 'Payable', outstanding_balance: { $gt: 0 } }).populate('vendor', 'name');
    
    const now = new Date();
    const brackets = {
      '0-30 days': [],
      '31-60 days': [],
      '61-90 days': [],
      '90+ days': []
    };
    
    let totalOutstanding = 0;

    payables.forEach(p => {
      totalOutstanding += p.outstanding_balance;
      
      const diffTime = Math.abs(now - new Date(p.start_date));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const item = {
        name: p.name,
        vendor: p.vendor ? p.vendor.name : 'Unknown Vendor',
        amount: p.principal_amount,
        outstanding: p.outstanding_balance,
        startDate: p.start_date
      };

      if (diffDays <= 30) {
        brackets['0-30 days'].push(item);
      } else if (diffDays <= 60) {
        brackets['31-60 days'].push(item);
      } else if (diffDays <= 90) {
        brackets['61-90 days'].push(item);
      } else {
        brackets['90+ days'].push(item);
      }
    });

    res.json({
      success: true,
      data: {
        totalOutstanding,
        brackets: Object.keys(brackets).map(k => ({
          bracket: k,
          amount: brackets[k].reduce((sum, item) => sum + item.outstanding, 0),
          bills: brackets[k]
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 9. Asset Register & Depreciation Report
router.get('/asset-register', auth, async (req, res) => {
  try {
    const assets = await Asset.find().populate('vendor', 'name');
    
    const list = assets.map(a => {
      const accumulatedDepreciation = Number((a.purchase_value - a.current_book_value).toFixed(2));
      return {
        _id: a._id,
        name: a.name,
        category: a.category,
        purchaseDate: a.purchase_date,
        purchaseValue: a.purchase_value,
        currentBookValue: a.current_book_value,
        usefulLifeYears: a.useful_life_years,
        depreciationMethod: a.depreciation_method,
        status: a.status,
        accumulatedDepreciation
      };
    });

    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 10. Liability / Loan Schedule Report
router.get('/liabilities-loans', auth, async (req, res) => {
  try {
    const liabilities = await Liability.find().populate('vendor', 'name');
    res.json({ success: true, data: liabilities });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 11. Client/Project Profitability Report
router.get('/project-profitability', auth, async (req, res) => {
  try {
    const incomes = await Income.find().populate('project', 'name');
    const expenses = await Expense.find().populate('project', 'name');
    
    const profitability = {};

    incomes.forEach(i => {
      if (!i.project) return;
      const projId = i.project._id.toString();
      if (!profitability[projId]) {
        profitability[projId] = { projectName: i.project.name, income: 0, expense: 0 };
      }
      profitability[projId].income += i.amount;
    });

    expenses.forEach(e => {
      if (!e.project) return;
      const projId = e.project._id.toString();
      if (!profitability[projId]) {
        profitability[projId] = { projectName: e.project.name, income: 0, expense: 0 };
      }
      profitability[projId].expense += e.amount;
    });

    const list = Object.keys(profitability).map(id => {
      const p = profitability[id];
      return {
        projectId: id,
        projectName: p.projectName,
        income: p.income,
        expense: p.expense,
        profit: p.income - p.expense
      };
    });

    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
