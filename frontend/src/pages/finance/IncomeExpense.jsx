import React, { useState } from 'react';
import api from '@/lib/api';

const IncomeExpense = () => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('Income');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = type === 'Income' ? '/finance/income' : '/finance/expense';
      await api.post(endpoint, {
        amount: Number(amount),
        category,
        payment_method: 'Cash',
        date: new Date()
      });
      setMessage('Transaction recorded and Ledger updated successfully!');
      setAmount('');
      setCategory('');
    } catch (err) {
      setMessage('Error: ' + err.message);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Income & Expense</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow border border-gray-100 max-w-md space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select value={type} onChange={e => setType(e.target.value)} className="w-full border p-2 rounded">
            <option>Income</option>
            <option>Expense</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Amount</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category (e.g. Service Revenue or Rent Expense)</label>
          <input type="text" value={category} onChange={e => setCategory(e.target.value)} required className="w-full border p-2 rounded" />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Record Transaction</button>
        {message && <p className="text-sm mt-2 text-green-600">{message}</p>}
      </form>
    </div>
  );
};

export default IncomeExpense;
