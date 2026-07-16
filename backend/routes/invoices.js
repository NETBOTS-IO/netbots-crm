const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Income = require('../models/Income');
const JournalEntry = require('../models/JournalEntry');
const Account = require('../models/Account');

const getAccount = async (name) => {
  return await Account.findOne({ name });
};

// Create Invoice
router.post('/', async (req, res) => {
  try {
    const invoice = new Invoice({ ...req.body, createdBy: req.user ? req.user.id : null });
    await invoice.save();
    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark Invoice as Paid (Auto-generates Income)
router.post('/:id/pay', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });
    
    if (invoice.status === 'Paid') {
      return res.status(400).json({ success: false, error: 'Invoice is already paid' });
    }

    const { payment_method = 'Bank Transfer', notes = 'Invoice Payment' } = req.body;

    // 1. Create Income Record
    const income = new Income({
      amount: invoice.amount,
      date: Date.now(),
      client: invoice.client,
      project: invoice.project,
      invoice: invoice._id,
      category: 'Service Revenue',
      payment_method,
      notes,
      createdBy: req.user ? req.user.id : null
    });

    // 2. Generate Ledger Entry
    const debitAccount = await getAccount('Cash on Hand');
    const creditAccount = await getAccount('Accounts Receivable'); // Usually an invoice is Accounts Receivable

    if (!debitAccount || !creditAccount) {
      return res.status(400).json({ success: false, error: 'Missing Accounts in Chart of Accounts' });
    }

    const journalEntry = new JournalEntry({
      description: `Payment for Invoice #${invoice.invoiceNumber}`,
      source_type: 'InvoicePayment',
      source_id: invoice._id,
      createdBy: req.user ? req.user.id : null,
      lines: [
        { account: debitAccount._id, debit: invoice.amount, credit: 0 },
        { account: creditAccount._id, debit: 0, credit: invoice.amount }
      ]
    });

    await journalEntry.save();
    
    income.journalEntry = journalEntry._id;
    await income.save();

    // 3. Update Invoice Status
    invoice.status = 'Paid';
    invoice.paidAmount = invoice.amount;
    await invoice.save();

    res.json({ success: true, data: invoice, income });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
