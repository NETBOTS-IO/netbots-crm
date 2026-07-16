import React, { useState, useEffect } from 'react';
import api from '@/lib/api';

const FinanceDashboard = () => {
  const [data, setData] = useState({ pnl: null, balanceSheet: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [pnlRes, bsRes] = await Promise.all([
          api.get('/finance/reports/pnl'),
          api.get('/finance/reports/balance-sheet')
        ]);
        setData({
          pnl: pnlRes.data?.data,
          balanceSheet: bsRes.data?.data
        });
      } catch (err) {
        console.error('Error fetching finance dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) return <div className="p-6 animate-pulse">Loading ERP Engine...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Accounts & Finance ERP</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Net Profit (P&L)</h3>
          <p className={`text-3xl font-bold mt-2 ${data.pnl?.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${data.pnl?.netProfit?.toLocaleString() || '0'}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Assets</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            ${data.balanceSheet?.totalAssets?.toLocaleString() || '0'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Liabilities</h3>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            ${data.balanceSheet?.totalLiabilities?.toLocaleString() || '0'}
          </p>
        </div>
      </div>

      {/* Simplified views of the other sections could be mapped here */}
    </div>
  );
};

export default FinanceDashboard;
