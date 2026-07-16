const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const JournalEntry = require('../models/JournalEntry');

// Get Profit & Loss (Income Statement)
router.get('/pnl', async (req, res) => {
  try {
    const incomeAccounts = await Account.find({ type: 'Income' }).select('_id name');
    const expenseAccounts = await Account.find({ type: 'Expense' }).select('_id name');

    const incomeIds = incomeAccounts.map(a => a._id);
    const expenseIds = expenseAccounts.map(a => a._id);

    // Aggregate ledger lines
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
      const isIncome = incomeIds.some(id => id.equals(row._id));
      const isExpense = expenseIds.some(id => id.equals(row._id));
      
      if (isIncome) {
        // Income is a credit balance
        const balance = row.totalCredit - row.totalDebit;
        totalIncome += balance;
        const acc = incomeAccounts.find(a => a._id.equals(row._id));
        incomeDetails.push({ account: acc.name, balance });
      } else if (isExpense) {
        // Expense is a debit balance
        const balance = row.totalDebit - row.totalCredit;
        totalExpense += balance;
        const acc = expenseAccounts.find(a => a._id.equals(row._id));
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

// Get Balance Sheet
router.get('/balance-sheet', async (req, res) => {
  try {
    const assetAccounts = await Account.find({ type: 'Asset' }).select('_id name');
    const liabilityAccounts = await Account.find({ type: 'Liability' }).select('_id name');
    const equityAccounts = await Account.find({ type: 'Equity' }).select('_id name');

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
    
    // In a real system, Retained Earnings is calculated from Net Profit dynamically.
    // For simplicity, we just aggregate the accounts here.

    report.forEach(row => {
      if (assetAccounts.some(id => id._id.equals(row._id))) {
        totalAssets += (row.totalDebit - row.totalCredit); // Assets are debit balances
      } else if (liabilityAccounts.some(id => id._id.equals(row._id))) {
        totalLiabilities += (row.totalCredit - row.totalDebit); // Liabilities are credit balances
      } else if (equityAccounts.some(id => id._id.equals(row._id))) {
        totalEquity += (row.totalCredit - row.totalDebit); // Equity is credit balance
      }
    });

    res.json({
      success: true,
      data: {
        totalAssets,
        totalLiabilities,
        totalEquity,
        isBalanced: totalAssets === (totalLiabilities + totalEquity)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
