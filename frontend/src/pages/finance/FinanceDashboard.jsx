import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '@/lib/api';
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  LayoutDashboard,
  IndianRupee,
  Plus,
  Percent,
  Calendar,
  Briefcase,
  User,
  Users,
  Settings,
  TrendingUp,
  TrendingDown,
  Wallet,
  Coins,
  Trash2,
  CheckCircle2,
  Printer,
  Download,
  RefreshCw,
  AlertCircle,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  ShieldCheck,
  FileText,
  Receipt
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const FinanceDashboard = () => {
  const location = useLocation();
  const { toast } = useToast();
  
  // Tab control
  const initialTab = location.pathname.endsWith('/transactions') ? 'transactions' : 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync activeTab with route path updates
  useEffect(() => {
    const tab = location.pathname.endsWith('/transactions') ? 'transactions' : 'overview';
    setActiveTab(tab);
  }, [location.pathname]);

  // States
  const [loading, setLoading] = useState(true);
  const [crmData, setCrmData] = useState({ clients: [], vendors: [], projects: [] });
  const [accounts, setAccounts] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [assets, setAssets] = useState([]);
  const [liabilities, setLiabilities] = useState([]);
  const [summaryData, setSummaryData] = useState({
    netProfit: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    cashOnHand: 0
  });

  // Report state
  const [selectedReport, setSelectedReport] = useState('pnl');
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isLiabilityModalOpen, setIsLiabilityModalOpen] = useState(false);
  const [isDisposalModalOpen, setIsDisposalModalOpen] = useState(false);
  const [selectedAssetForDisposal, setSelectedAssetForDisposal] = useState(null);
  const [salvageValue, setSalvageValue] = useState('');

  // Form states
  const [txType, setTxType] = useState('Income');
  const [txForm, setTxForm] = useState({
    amount: '',
    category: '',
    date: new Date().toISOString().substring(0, 10),
    client: '',
    vendor: '',
    project: '',
    payment_method: 'Cash',
    is_billable: false,
    is_recurring: false,
    notes: ''
  });

  const [assetForm, setAssetForm] = useState({
    name: '',
    category: '',
    purchase_date: new Date().toISOString().substring(0, 10),
    purchase_value: '',
    useful_life_years: 3,
    depreciation_method: 'Straight-line',
    vendor: ''
  });

  const [liabilityForm, setLiabilityForm] = useState({
    name: '',
    type: '',
    principal_amount: '',
    interest_rate: '',
    start_date: new Date().toISOString().substring(0, 10),
    installments: 1,
    vendor: ''
  });

  // Invoice generator state
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNo: 'INV-' + Math.floor(1000 + Math.random() * 9000),
    date: new Date().toISOString().substring(0, 10),
    clientName: '',
    clientAddress: '',
    issuerName: 'NetBots Group',
    issuerDetails: 'Plot 4, Sector I-9, Islamabad\ninfo@thenetbots.com\n+92 300 0000000',
    advancePaid: 0,
    items: [
      { description: 'Consulting & Implementation', quantity: 1, rate: 1500, discount: 150 }
    ]
  });

  // Load essential data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Seed default accounts structure first if needed
      await api.post('/finance/accounts/seed').catch(() => {});
      
      const [
        accountsRes,
        incomesRes,
        expensesRes,
        assetsRes,
        liabilitiesRes,
        clientsRes,
        vendorsRes,
        projectsRes,
        pnlRes,
        bsRes
      ] = await Promise.all([
        api.get('/finance/accounts'),
        api.get('/finance/income'),
        api.get('/finance/expense'),
        api.get('/finance/assets'),
        api.get('/finance/liabilities'),
        api.get('/finance/clients'),
        api.get('/finance/vendors'),
        api.get('/finance/projects'),
        api.get('/finance/reports/pnl'),
        api.get('/finance/reports/balance-sheet')
      ]);

      setAccounts(accountsRes.data?.data || []);
      setIncomes(incomesRes.data?.data || []);
      setExpenses(expensesRes.data?.data || []);
      setAssets(assetsRes.data?.data || []);
      setLiabilities(liabilitiesRes.data?.data || []);
      setCrmData({
        clients: clientsRes.data?.data || [],
        vendors: vendorsRes.data?.data || [],
        projects: projectsRes.data?.data || []
      });

      const trialBalanceRes = await api.get('/finance/reports/trial-balance');
      const cashAcct = trialBalanceRes.data?.data?.accounts?.find(a => a.account === 'Cash on Hand');
      const cashBalance = cashAcct ? (cashAcct.debit - cashAcct.credit) : 0;

      setSummaryData({
        netProfit: pnlRes.data?.data?.netProfit || 0,
        totalAssets: bsRes.data?.data?.totalAssets || 0,
        totalLiabilities: bsRes.data?.data?.totalLiabilities || 0,
        cashOnHand: cashBalance
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load accounting data."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Load report data when selectedReport changes
  const fetchSelectedReport = async () => {
    setReportLoading(true);
    try {
      const endpoint = `/finance/reports/${selectedReport}`;
      const res = await api.get(endpoint);
      setReportData(res.data?.data);
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Report Error", description: "Failed to generate report." });
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchSelectedReport();
    }
  }, [selectedReport, activeTab]);

  // Handle Form Submissions
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      const endpoint = txType === 'Income' ? '/finance/income' : '/finance/expense';
      const body = {
        amount: Number(txForm.amount),
        date: txForm.date,
        category: txForm.category || (txType === 'Income' ? 'Service Revenue' : 'Rent Expense'),
        payment_method: txForm.payment_method,
        notes: txForm.notes,
        project: txForm.project || undefined
      };

      if (txType === 'Income') {
        body.client = txForm.client || undefined;
      } else {
        body.vendor = txForm.vendor || undefined;
        body.is_billable = txForm.is_billable;
        body.is_recurring = txForm.is_recurring;
      }

      await api.post(endpoint, body);
      toast({ title: "Success", description: "Transaction recorded successfully." });
      setIsTxModalOpen(false);
      setTxForm({
        amount: '',
        category: '',
        date: new Date().toISOString().substring(0, 10),
        client: '',
        vendor: '',
        project: '',
        payment_method: 'Cash',
        is_billable: false,
        is_recurring: false,
        notes: ''
      });
      loadDashboardData();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: err.response?.data?.error || err.message });
    }
  };

  const handleAddAsset = async (e) => {
    e.preventDefault();
    try {
      await api.post('/finance/assets', {
        ...assetForm,
        purchase_value: Number(assetForm.purchase_value),
        useful_life_years: Number(assetForm.useful_life_years),
        vendor: assetForm.vendor || undefined
      });
      toast({ title: "Success", description: "Asset registered successfully." });
      setIsAssetModalOpen(false);
      setAssetForm({
        name: '',
        category: '',
        purchase_date: new Date().toISOString().substring(0, 10),
        purchase_value: '',
        useful_life_years: 3,
        depreciation_method: 'Straight-line',
        vendor: ''
      });
      loadDashboardData();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: err.response?.data?.error || err.message });
    }
  };

  const handleAddLiability = async (e) => {
    e.preventDefault();
    try {
      await api.post('/finance/liabilities', {
        ...liabilityForm,
        principal_amount: Number(liabilityForm.principal_amount),
        interest_rate: Number(liabilityForm.interest_rate),
        installments: Number(liabilityForm.installments),
        vendor: liabilityForm.vendor || undefined
      });
      toast({ title: "Success", description: "Liability registered successfully." });
      setIsLiabilityModalOpen(false);
      setLiabilityForm({
        name: '',
        type: '',
        principal_amount: '',
        interest_rate: '',
        start_date: new Date().toISOString().substring(0, 10),
        installments: 1,
        vendor: ''
      });
      loadDashboardData();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: err.response?.data?.error || err.message });
    }
  };

  const runDepreciation = async (assetId) => {
    try {
      const res = await api.post(`/finance/assets/${assetId}/depreciate`);
      toast({ title: "Depreciation Calculated", description: `Asset depreciated by $${res.data.depreciationPosted}.` });
      loadDashboardData();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: err.response?.data?.error || err.message });
    }
  };

  const handleAssetDisposal = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/finance/assets/${selectedAssetForDisposal}/dispose`, {
        salvageValue: Number(salvageValue)
      });
      toast({ title: "Asset Disposed", description: `Disposal recorded successfully.` });
      setIsDisposalModalOpen(false);
      setSalvageValue('');
      loadDashboardData();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: err.response?.data?.error || err.message });
    }
  };

  const payInstallment = async (liabilityId, installmentId) => {
    try {
      await api.post(`/finance/liabilities/${liabilityId}/repay/${installmentId}`);
      toast({ title: "Installment Paid", description: "Installment payment recorded." });
      loadDashboardData();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: err.response?.data?.error || err.message });
    }
  };

  // POS Receipt JPG download function
  const handleDownloadReceiptJpg = () => {
    const element = document.getElementById('thermal-receipt-preview');
    if (!element) return;
    
    html2canvas(element, { scale: 3, useCORS: true }).then((canvas) => {
      const link = document.createElement('a');
      link.download = `receipt-${invoiceForm.invoiceNo || 'pos'}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 1.0);
      link.click();
      toast({ title: "JPG Downloaded", description: "Thermal receipt exported successfully." });
    });
  };

  // PDF Download Logic
  const handleDownloadPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text("NETBOTS CRM & ERP FINANCIALS", 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Report: ${selectedReport.toUpperCase()} STATEMENT`, 14, 27);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 36, 196, 36);

    let y = 46;

    const drawRow = (label, col2 = '', col3 = '', col4 = '', isBold = false) => {
      if (isBold) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
      } else {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
      }
      doc.text(String(label), 14, y);
      doc.text(String(col2), 95, y);
      if (col3) doc.text(String(col3), 135, y);
      if (col4) doc.text(String(col4), 170, y);
      y += 8;
    };

    if (selectedReport === 'pnl') {
      drawRow("Account Category / Name", "Balance / Net Value ($)", "", "", true);
      doc.line(14, y - 4, 196, y - 4);
      y += 4;
      
      drawRow("REVENUE (INCOME)", "", "", "", true);
      reportData.incomeDetails?.forEach(d => {
        drawRow("  " + d.account, `$${d.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
      });
      drawRow("Total Income / Revenue", `$${reportData.totalIncome?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, "", "", true);
      y += 4;

      drawRow("COST & OPERATING EXPENSES", "", "", "", true);
      reportData.expenseDetails?.forEach(d => {
        drawRow("  " + d.account, `$${d.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
      });
      drawRow("Total Operating Expenses", `$${reportData.totalExpense?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, "", "", true);
      y += 6;
      doc.line(14, y - 4, 196, y - 4);

      drawRow("NET OPERATING PROFIT / (LOSS)", `$${reportData.netProfit?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, "", "", true);
    } 
    else if (selectedReport === 'balance-sheet') {
      drawRow("Account Type / Name", "Net Value ($)", "", "", true);
      doc.line(14, y - 4, 196, y - 4);
      y += 4;

      drawRow("ASSETS", "", "", "", true);
      reportData.assetDetails?.forEach(d => {
        drawRow("  " + d.account, `$${d.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
      });
      drawRow("Total Assets Balance", `$${reportData.totalAssets?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, "", "", true);
      y += 4;

      drawRow("LIABILITIES", "", "", "", true);
      reportData.liabilityDetails?.forEach(d => {
        drawRow("  " + d.account, `$${d.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
      });
      drawRow("Total Liabilities Balance", `$${reportData.totalLiabilities?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, "", "", true);
      y += 4;

      drawRow("OWNER'S EQUITY", "", "", "", true);
      reportData.equityDetails?.forEach(d => {
        drawRow("  " + d.account, `$${d.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
      });
      drawRow("Total Owner Equity", `$${reportData.totalEquity?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, "", "", true);
    }
    else if (selectedReport === 'cash-flow') {
      drawRow("Cash Inflow", `$${reportData.cashIn?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, "", "", true);
      drawRow("Cash Outflow", `$${reportData.cashOut?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, "", "", true);
      drawRow("Net Cash Flow", `$${reportData.netCashFlow?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, "", "", true);
      y += 6;
      doc.line(14, y - 4, 196, y - 4);

      drawRow("Date", "Description", "Flow Value ($)", "", true);
      reportData.flows?.forEach(f => {
        drawRow(new Date(f.date).toLocaleDateString(), f.description.substring(0, 40), `$${f.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
      });
    }
    else if (selectedReport === 'trial-balance') {
      drawRow("Account Name", "Account Type", "Debits ($)", "Credits ($)", true);
      doc.line(14, y - 4, 196, y - 4);
      y += 4;

      reportData.accounts?.forEach(a => {
        drawRow(a.account, a.type, a.debit > 0 ? `$${a.debit.toLocaleString()}` : '-', a.credit > 0 ? `$${a.credit.toLocaleString()}` : '-');
      });
      y += 4;
      doc.line(14, y - 4, 196, y - 4);
      drawRow("Grand Balance Totals", "", `$${reportData.grandTotalDebit?.toLocaleString()}`, `$${reportData.grandTotalCredit?.toLocaleString()}`, true);
    }
    else if (selectedReport === 'expense-breakdown' || selectedReport === 'income-breakdown') {
      drawRow("Classification Category / Group", "Accumulated Value ($)", "", "", true);
      doc.line(14, y - 4, 196, y - 4);
      y += 4;

      drawRow("BY CATEGORY:", "", "", "", true);
      reportData.byCategory?.forEach(item => {
        drawRow("  " + item.label, `$${item.amount.toLocaleString()}`);
      });
      y += 4;

      drawRow("BY RELATED ENTITY:", "", "", "", true);
      const entityList = selectedReport === 'income-breakdown' ? reportData.byClient : reportData.byVendor;
      entityList?.forEach(item => {
        drawRow("  " + item.label, `$${item.amount.toLocaleString()}`);
      });
    }
    else if (selectedReport === 'ar-aging') {
      drawRow("Aging Bracket", "Outstanding Balance ($)", "", "", true);
      doc.line(14, y - 4, 196, y - 4);
      y += 4;

      reportData.brackets?.forEach(br => {
        drawRow(br.bracket, `$${br.amount?.toLocaleString()}`, `${br.invoices?.length || 0} invoice(s)`);
      });
    }
    else if (selectedReport === 'ap-aging') {
      drawRow("Aging Bracket", "Outstanding Balance ($)", "", "", true);
      doc.line(14, y - 4, 196, y - 4);
      y += 4;

      reportData.brackets?.forEach(br => {
        drawRow(br.bracket, `$${br.amount?.toLocaleString()}`, `${br.bills?.length || 0} bill(s)`);
      });
    }
    else if (selectedReport === 'asset-register') {
      drawRow("Asset Item Name", "Purchase ($)", "Current Book ($)", "Accum. Depr. ($)", true);
      doc.line(14, y - 4, 196, y - 4);
      y += 4;

      reportData.forEach(asset => {
        drawRow(asset.name, `$${asset.purchaseValue?.toLocaleString()}`, `$${asset.currentBookValue?.toLocaleString()}`, `$${asset.accumulatedDepreciation?.toLocaleString()}`);
      });
    }
    else if (selectedReport === 'liabilities-loans') {
      drawRow("Liability Description", "Type", "Principal ($)", "Outstanding ($)", true);
      doc.line(14, y - 4, 196, y - 4);
      y += 4;

      reportData.forEach(lib => {
        drawRow(lib.name, lib.type, `$${lib.principal_amount?.toLocaleString()}`, `$${lib.outstanding_balance?.toLocaleString()}`);
      });
    }
    else if (selectedReport === 'project-profitability') {
      drawRow("Project / Client", "Income ($)", "Expenses ($)", "Project Profit ($)", true);
      doc.line(14, y - 4, 196, y - 4);
      y += 4;

      reportData.forEach(p => {
        drawRow(p.projectName, `$${p.income?.toLocaleString()}`, `$${p.expense?.toLocaleString()}`, `$${p.profit?.toLocaleString()}`);
      });
    }

    doc.save(`netbots_financial_report_${selectedReport}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <RefreshCw className="animate-spin text-indigo-650" size={32} />
        <p className="text-slate-500 font-semibold">Loading ERP Ledger engine...</p>
      </div>
    );
  }

  // Setup Overview charts data
  const monthlyTrendsData = {
    labels: ['Total Income', 'Total Expense'],
    datasets: [{
      label: 'Financial Flow ($)',
      data: [
        incomes.reduce((sum, i) => sum + i.amount, 0),
        expenses.reduce((sum, e) => sum + e.amount, 0)
      ],
      backgroundColor: ['rgba(34, 197, 94, 0.75)', 'rgba(239, 68, 68, 0.75)'],
      borderColor: ['rgba(34, 197, 94, 1)', 'rgba(239, 68, 68, 1)'],
      borderWidth: 1.5
    }]
  };

  const balanceSheetRatioData = {
    labels: ['Assets', 'Liabilities', 'Equity'],
    datasets: [{
      data: [
        summaryData.totalAssets,
        summaryData.totalLiabilities,
        Math.max(0, summaryData.totalAssets - summaryData.totalLiabilities)
      ],
      backgroundColor: ['rgba(59, 130, 246, 0.7)', 'rgba(249, 115, 22, 0.7)', 'rgba(99, 102, 241, 0.7)'],
      borderWidth: 1
    }]
  };

  // Helper calculations for thermal invoice preview
  const invoiceSubtotals = invoiceForm.items.map(item => item.quantity * item.rate);
  const invoiceDiscounts = invoiceForm.items.map(item => Number(item.discount || 0));
  const invoiceGrossTotal = invoiceSubtotals.reduce((a, b) => a + b, 0);
  const invoiceTotalDiscount = invoiceDiscounts.reduce((a, b) => a + b, 0);
  const invoiceNetTotal = invoiceGrossTotal - invoiceTotalDiscount;
  const invoiceBalancePending = invoiceNetTotal - Number(invoiceForm.advancePaid || 0);

  return (
    <div className="space-y-6">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Coins className="text-indigo-600" /> Accounts & Finance ERP
          </h1>
          <p className="text-sm text-slate-500 mt-1">Double-entry balanced accounting engine & report generator.</p>
        </div>

        {/* Global Action buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => { setTxType('Income'); setIsTxModalOpen(true); }}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs gap-1.5 h-9"
          >
            <Plus size={14} /> Add Income
          </Button>
          <Button
            onClick={() => { setTxType('Expense'); setIsTxModalOpen(true); }}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs gap-1.5 h-9"
          >
            <Plus size={14} /> Add Expense
          </Button>
          <Button
            onClick={() => setIsAssetModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs gap-1.5 h-9"
          >
            <Plus size={14} /> Add Asset
          </Button>
          <Button
            onClick={() => setIsLiabilityModalOpen(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs gap-1.5 h-9"
          >
            <Plus size={14} /> Add Loan/Liability
          </Button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200 gap-6 select-none">
        {['overview', 'transactions', 'assets', 'liabilities', 'reports', 'categories', 'invoice-generator'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 font-semibold text-sm capitalize border-b-2 transition-all ${
              activeTab === tab 
                ? 'border-indigo-600 text-indigo-600 font-bold' 
                : 'border-transparent text-slate-500 hover:text-indigo-650'
            }`}
          >
            {tab === 'overview' ? 'Overview' : tab === 'categories' ? 'Chart of Accounts' : tab === 'invoice-generator' ? 'Invoice Generator' : tab}
          </button>
        ))}
      </div>

      {/* Overview Dashboard Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Dashboard KPIs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Net Profit</span>
                <h3 className={`text-2xl font-bold mt-1 ${summaryData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${summaryData.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className={`p-3 rounded-lg ${summaryData.netProfit >= 0 ? 'bg-green-50 text-green-655' : 'bg-red-50 text-red-655'}`}>
                {summaryData.netProfit >= 0 ? <ArrowUpRight size={22} /> : <ArrowDownRight size={22} />}
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Assets</span>
                <h3 className="text-2xl font-bold mt-1 text-blue-655">
                  ${summaryData.totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-655 rounded-lg">
                <Layers size={22} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Liabilities</span>
                <h3 className="text-2xl font-bold mt-1 text-orange-655">
                  ${summaryData.totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="p-3 bg-orange-50 text-orange-655 rounded-lg">
                <Wallet size={22} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Cash on Hand</span>
                <h3 className="text-2xl font-bold mt-1 text-indigo-655">
                  ${summaryData.cashOnHand.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-655 rounded-lg">
                <IndianRupee size={22} />
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Income vs Expenses Analysis</h3>
              <div className="h-[250px] flex items-center justify-center">
                <Bar data={monthlyTrendsData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Capital Structure Ratio</h3>
              <div className="h-[250px] flex items-center justify-center">
                <Doughnut data={balanceSheetRatioData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-800">Incomes & Expenses Ledger</h3>
            <span className="text-xs text-slate-500 font-medium">Auto-synced with double-entry general ledger</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-655 text-xs uppercase font-bold border-b border-slate-200">
                  <th className="p-3">Date</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Client/Vendor</th>
                  <th className="p-3">Project</th>
                  <th className="p-3">Payment Method</th>
                  <th className="p-3">Notes</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {incomes.map(item => (
                  <tr key={item._id} className="hover:bg-slate-50/50">
                    <td className="p-3 whitespace-nowrap text-slate-600">{new Date(item.date).toLocaleDateString()}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-green-50 text-green-700 uppercase tracking-wider">Income</span>
                    </td>
                    <td className="p-3 whitespace-nowrap font-medium text-slate-700">{item.category}</td>
                    <td className="p-3 whitespace-nowrap text-slate-600">{item.client?.companyName || item.client?.name || 'Other'}</td>
                    <td className="p-3 whitespace-nowrap text-slate-500">{item.project?.name || '-'}</td>
                    <td className="p-3 whitespace-nowrap text-slate-600">{item.payment_method}</td>
                    <td className="p-3 text-slate-500 truncate max-w-[200px]">{item.notes || '-'}</td>
                    <td className="p-3 text-right font-bold text-green-700 whitespace-nowrap">${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                {expenses.map(item => (
                  <tr key={item._id} className="hover:bg-slate-50/50">
                    <td className="p-3 whitespace-nowrap text-slate-600">{new Date(item.date).toLocaleDateString()}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-700 uppercase tracking-wider">Expense</span>
                    </td>
                    <td className="p-3 whitespace-nowrap font-medium text-slate-700">{item.category}</td>
                    <td className="p-3 whitespace-nowrap text-slate-600">{item.vendor?.name || 'Payee'}</td>
                    <td className="p-3 whitespace-nowrap text-slate-500">{item.project?.name || '-'}</td>
                    <td className="p-3 whitespace-nowrap text-slate-600">{item.payment_method}</td>
                    <td className="p-3 text-slate-500 truncate max-w-[200px]">{item.notes || '-'}</td>
                    <td className="p-3 text-right font-bold text-red-700 whitespace-nowrap">${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                {incomes.length === 0 && expenses.length === 0 && (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-400 font-medium">No ledger transactions found. Click Add buttons above to record.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Asset Register Tab */}
      {activeTab === 'assets' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-800">Fixed Asset Register</h3>
            <span className="text-xs text-slate-500 font-medium">Calculate Straight-line depreciation and capital write-offs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-655 text-xs uppercase font-bold border-b border-slate-200">
                  <th className="p-3">Asset Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Acquisition Date</th>
                  <th className="p-3 text-right">Purchase Value</th>
                  <th className="p-3 text-right">Current Book Value</th>
                  <th className="p-3">Useful Life (Yrs)</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {assets.map(asset => (
                  <tr key={asset._id} className="hover:bg-slate-50/50">
                    <td className="p-3 whitespace-nowrap font-medium text-slate-700">{asset.name}</td>
                    <td className="p-3 whitespace-nowrap text-slate-600">{asset.category}</td>
                    <td className="p-3 whitespace-nowrap text-slate-600">{new Date(asset.purchase_date).toLocaleDateString()}</td>
                    <td className="p-3 text-right font-semibold text-slate-700">${asset.purchase_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right font-bold text-blue-655">${asset.current_book_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-center text-slate-600">{asset.useful_life_years}</td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        asset.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                      {asset.status === 'Active' && asset.current_book_value > 0 && (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => runDepreciation(asset._id)}
                          className="text-xs h-7 gap-1 border-blue-200 hover:bg-blue-50 text-blue-700"
                        >
                          <Calculator size={12} /> Depreciate
                        </Button>
                      )}
                      {asset.status === 'Active' && (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => { setSelectedAssetForDisposal(asset._id); setIsDisposalModalOpen(true); }}
                          className="text-xs h-7 gap-1 border-red-200 hover:bg-red-50 text-red-700"
                        >
                          <Trash2 size={12} /> Dispose
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {assets.length === 0 && (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-400 font-medium">No assets registered yet. Click "Add Asset" to start tracking capital assets.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Liabilities Tab */}
      {activeTab === 'liabilities' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800">Outstanding Liabilities & Repayment Schedules</h3>
              <span className="text-xs text-slate-500 font-medium">Generate amortization principal + interest schedules</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-655 text-xs uppercase font-bold border-b border-slate-200">
                    <th className="p-3">Lending Entity / Loan</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">Principal Amount</th>
                    <th className="p-3 text-right">Outstanding Balance</th>
                    <th className="p-3 text-center">Interest Rate</th>
                    <th className="p-3">Amortization Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {liabilities.map(l => {
                    const paidAmt = l.principal_amount - l.outstanding_balance;
                    const pct = l.principal_amount > 0 ? (paidAmt / l.principal_amount) * 100 : 0;
                    return (
                      <React.Fragment key={l._id}>
                        <tr className="hover:bg-slate-50/50 font-medium">
                          <td className="p-3 whitespace-nowrap text-slate-800">{l.name}</td>
                          <td className="p-3 whitespace-nowrap text-slate-600">{l.type}</td>
                          <td className="p-3 text-right text-slate-650">${l.principal_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="p-3 text-right text-orange-600 font-bold">${l.outstanding_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="p-3 text-center">{l.interest_rate}%</td>
                          <td className="p-3 min-w-[150px]">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div className="bg-green-600 h-full" style={{ width: `${pct}%` }}></div>
                              </div>
                              <span className="text-xs text-slate-500 font-semibold">{pct.toFixed(0)}%</span>
                            </div>
                          </td>
                        </tr>
                        {/* Repayment Schedule nested section */}
                        <tr>
                          <td colSpan="6" className="bg-slate-50 p-4 border-t border-b border-slate-200">
                            <div className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Repayment Installments Schedule:</div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                              {l.repayment_schedule.map((installment, idx) => (
                                <div key={installment._id} className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-between gap-1 shadow-sm">
                                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
                                    <span>Inst. #{idx + 1}</span>
                                    <span>{new Date(installment.dueDate).toLocaleDateString()}</span>
                                  </div>
                                  <div className="text-sm font-bold text-slate-855 mt-1">${installment.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                  <div className="text-[10px] text-slate-500">
                                    Principal: ${installment.principal} | Interest: ${installment.interest}
                                  </div>
                                  <div className="mt-2 flex items-center justify-between">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                      installment.status === 'Paid' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                                    }`}>
                                      {installment.status}
                                    </span>
                                    {installment.status === 'Pending' && (
                                      <Button
                                        size="xs"
                                        onClick={() => payInstallment(l._id, installment._id)}
                                        className="h-6 text-[9px] bg-indigo-600 hover:bg-indigo-700 font-semibold text-white px-2 py-0"
                                      >
                                        Mark Paid
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                  {liabilities.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-400 font-medium">No liabilities registered. Click "Add Loan/Liability" to generate repayable liability schedules.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Report list Sidebar */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 h-fit space-y-2">
            <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-3 px-2">Financial Reports</h3>
            {[
              { id: 'pnl', label: '1. Profit & Loss', icon: FileText },
              { id: 'balance-sheet', label: '2. Balance Sheet', icon: FileText },
              { id: 'cash-flow', label: '3. Cash Flow Statement', icon: FileText },
              { id: 'trial-balance', label: '4. Trial Balance', icon: FileText },
              { id: 'expense-breakdown', label: '5. Expense Breakdown', icon: FileText },
              { id: 'income-breakdown', label: '6. Income Breakdown', icon: FileText },
              { id: 'ar-aging', label: '7. AR Aging Report', icon: FileText },
              { id: 'ap-aging', label: '8. AP Aging Report', icon: FileText },
              { id: 'asset-register', label: '9. Asset Register Report', icon: FileText },
              { id: 'liabilities-loans', label: '10. Liability Schedule', icon: FileText },
              { id: 'project-profitability', label: '11. Project Profitability', icon: FileText }
            ].map(rep => (
              <button
                key={rep.id}
                onClick={() => setSelectedReport(rep.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md border text-left transition-all ${
                  selectedReport === rep.id
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
                    : 'bg-transparent border-transparent hover:bg-slate-50 text-slate-600'
                }`}
              >
                <rep.icon size={14} className={selectedReport === rep.id ? 'text-indigo-750' : 'text-slate-400'} />
                {rep.label}
              </button>
            ))}
          </div>

          {/* Report calculations area */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6 print:border-none print:shadow-none" id="printable-report-area">
            {reportLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[300px] gap-2 text-slate-500">
                <RefreshCw className="animate-spin text-indigo-650" size={24} />
                <span className="text-xs font-medium">Compiling aggregate ledger lines...</span>
              </div>
            ) : reportData ? (
              <div className="space-y-6">
                {/* Print Header */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide">NetBots ERP Financial System</h2>
                    <h3 className="text-sm font-bold text-slate-500 mt-0.5 capitalize">{selectedReport.replace('-', ' ')}</h3>
                    <p className="text-[10px] text-slate-400 mt-1">Generated: {new Date().toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleDownloadPDF}
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 font-bold text-xs h-8 print:hidden"
                    >
                      <Download size={12} /> Download PDF
                    </Button>
                    <Button
                      onClick={() => window.print()}
                      size="sm"
                      variant="outline"
                      className="gap-1.5 font-bold text-xs h-8 print:hidden"
                    >
                      <Printer size={12} /> Print Report
                    </Button>
                  </div>
                </div>

                {/* Profit & Loss report content */}
                {selectedReport === 'pnl' && (
                  <div className="space-y-4 text-sm">
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="bg-slate-100 p-3 font-bold text-slate-700 border-b border-slate-200">Revenue (Incomes)</div>
                      <div className="divide-y divide-slate-150">
                        {reportData.incomeDetails?.map((d, i) => (
                          <div key={i} className="flex justify-between p-3">
                            <span className="text-slate-655">{d.account}</span>
                            <span className="font-semibold text-slate-808">${d.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        ))}
                        <div className="flex justify-between p-3 bg-green-50/50 font-bold text-green-700">
                          <span>Total Revenue</span>
                          <span>${reportData.totalIncome?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="bg-slate-100 p-3 font-bold text-slate-700 border-b border-slate-200">Cost & Operating Expenses</div>
                      <div className="divide-y divide-slate-150">
                        {reportData.expenseDetails?.map((d, i) => (
                          <div key={i} className="flex justify-between p-3">
                            <span className="text-slate-655">{d.account}</span>
                            <span className="font-semibold text-slate-805">${d.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        ))}
                        <div className="flex justify-between p-3 bg-red-50/50 font-bold text-red-700">
                          <span>Total Operating Expenses</span>
                          <span>${reportData.totalExpense?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between p-4 bg-slate-900 text-white rounded-lg font-black text-base">
                      <span>Net Operating Income (Net Profit)</span>
                      <span>${reportData.netProfit?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                )}

                {/* Balance Sheet report content */}
                {selectedReport === 'balance-sheet' && (
                  <div className="space-y-4 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Assets */}
                      <div className="border border-slate-200 rounded-lg overflow-hidden h-fit">
                        <div className="bg-blue-50 p-3 font-bold text-blue-800 border-b border-slate-200">Assets</div>
                        <div className="divide-y divide-slate-150">
                          {reportData.assetDetails?.map((d, i) => (
                            <div key={i} className="flex justify-between p-3">
                              <span className="text-slate-655">{d.account}</span>
                              <span className="font-semibold text-slate-808">${d.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                          ))}
                          <div className="flex justify-between p-3 bg-blue-100/50 font-bold text-blue-900">
                            <span>Total Assets</span>
                            <span>${reportData.totalAssets?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Liabilities & Equity */}
                      <div className="space-y-4">
                        <div className="border border-slate-200 rounded-lg overflow-hidden h-fit">
                          <div className="bg-orange-50 p-3 font-bold text-orange-850 border-b border-slate-200">Liabilities</div>
                          <div className="divide-y divide-slate-150">
                            {reportData.liabilityDetails?.map((d, i) => (
                              <div key={i} className="flex justify-between p-3">
                                <span className="text-slate-655">{d.account}</span>
                                <span className="font-semibold text-slate-808">${d.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              </div>
                            ))}
                            <div className="flex justify-between p-3 bg-orange-100/50 font-bold text-orange-900">
                              <span>Total Liabilities</span>
                              <span>${reportData.totalLiabilities?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>

                        <div className="border border-slate-200 rounded-lg overflow-hidden h-fit">
                          <div className="bg-indigo-50 p-3 font-bold text-indigo-855 border-b border-slate-200">Equity</div>
                          <div className="divide-y divide-slate-150">
                            {reportData.equityDetails?.map((d, i) => (
                              <div key={i} className="flex justify-between p-3">
                                <span className="text-slate-655">{d.account}</span>
                                <span className="font-semibold text-slate-808">${d.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              </div>
                            ))}
                            <div className="flex justify-between p-3 bg-indigo-100/50 font-bold text-indigo-900">
                              <span>Total Equity</span>
                              <span>${reportData.totalEquity?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between p-4 bg-slate-900 text-white rounded-lg font-black text-sm">
                      <div className="flex items-center gap-2">
                        <span>Balance Verification check:</span>
                        {reportData.isBalanced ? (
                          <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded flex items-center gap-1 font-bold"><ShieldCheck size={12} /> Ledger Balanced</span>
                        ) : (
                          <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded font-bold">Unbalanced Ledger</span>
                        )}
                      </div>
                      <span>Assets ({reportData.totalAssets}) = L+E ({reportData.totalLiabilities + reportData.totalEquity})</span>
                    </div>
                  </div>
                )}

                {/* Cash Flow Statement report content */}
                {selectedReport === 'cash-flow' && (
                  <div className="space-y-4 text-sm">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="border border-slate-200 rounded-lg p-4 bg-green-50/20">
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Cash In</span>
                        <div className="text-xl font-bold text-green-700 mt-1">${reportData.cashIn?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      </div>
                      <div className="border border-slate-200 rounded-lg p-4 bg-red-50/20">
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Cash Out</span>
                        <div className="text-xl font-bold text-red-700 mt-1">${reportData.cashOut?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      </div>
                      <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Net Cash Flow</span>
                        <div className="text-xl font-bold text-slate-800 mt-1">${reportData.netCashFlow?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="bg-slate-100 p-3 font-bold text-slate-700 border-b border-slate-200">Cash Flow Logs</div>
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-655">
                            <th className="p-3">Date</th>
                            <th className="p-3">Description</th>
                            <th className="p-3 text-right">Flow Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 text-xs">
                          {reportData.flows?.map((f, i) => (
                            <tr key={i} className="hover:bg-slate-50/50">
                              <td className="p-3">{new Date(f.date).toLocaleDateString()}</td>
                              <td className="p-3 font-medium text-slate-700">{f.description}</td>
                              <td className={`p-3 text-right font-bold ${f.amount >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                {f.amount >= 0 ? '+' : ''}${f.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Trial Balance report content */}
                {selectedReport === 'trial-balance' && (
                  <div className="space-y-4 text-sm">
                    <table className="w-full border border-slate-200 rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-left">
                          <th className="p-3">Account Name</th>
                          <th className="p-3">Account Type</th>
                          <th className="p-3 text-right">Debit Balance</th>
                          <th className="p-3 text-right">Credit Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {reportData.accounts?.map((acc, i) => (
                          <tr key={i} className="hover:bg-slate-50/30">
                            <td className="p-3 font-medium text-slate-800">{acc.account}</td>
                            <td className="p-3 text-slate-500">{acc.type}</td>
                            <td className="p-3 text-right text-slate-700 font-mono">{acc.debit > 0 ? `$${acc.debit.toLocaleString()}` : '-'}</td>
                            <td className="p-3 text-right text-slate-700 font-mono">{acc.credit > 0 ? `$${acc.credit.toLocaleString()}` : '-'}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-350">
                          <td colSpan="2" className="p-3">Grand Balance Totals</td>
                          <td className="p-3 text-right font-mono">${reportData.grandTotalDebit?.toLocaleString()}</td>
                          <td className="p-3 text-right font-mono">${reportData.grandTotalCredit?.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Expense Breakdown report content */}
                {selectedReport === 'expense-breakdown' && (
                  <div className="space-y-6 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* By Category */}
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-slate-100 p-3 font-bold text-slate-700 border-b border-slate-200">Expenses by Category</div>
                        <div className="divide-y divide-slate-150">
                          {reportData.byCategory?.map((item, idx) => (
                            <div key={idx} className="flex justify-between p-3">
                              <span className="text-slate-655">{item.label}</span>
                              <span className="font-semibold text-slate-808">${item.amount.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* By Vendor */}
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-slate-100 p-3 font-bold text-slate-700 border-b border-slate-200">Expenses by Vendor</div>
                        <div className="divide-y divide-slate-150">
                          {reportData.byVendor?.map((item, idx) => (
                            <div key={idx} className="flex justify-between p-3">
                              <span className="text-slate-655">{item.label}</span>
                              <span className="font-semibold text-slate-808">${item.amount.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Income Breakdown report content */}
                {selectedReport === 'income-breakdown' && (
                  <div className="space-y-6 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* By Category */}
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-slate-100 p-3 font-bold text-slate-700 border-b border-slate-200">Income by Category</div>
                        <div className="divide-y divide-slate-150">
                          {reportData.byCategory?.map((item, idx) => (
                            <div key={idx} className="flex justify-between p-3">
                              <span className="text-slate-655">{item.label}</span>
                              <span className="font-semibold text-slate-808">${item.amount.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* By Client */}
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-slate-100 p-3 font-bold text-slate-700 border-b border-slate-200">Income by Client</div>
                        <div className="divide-y divide-slate-150">
                          {reportData.byClient?.map((item, idx) => (
                            <div key={idx} className="flex justify-between p-3">
                              <span className="text-slate-655">{item.label}</span>
                              <span className="font-semibold text-slate-808">${item.amount.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* AR Aging report content */}
                {selectedReport === 'ar-aging' && (
                  <div className="space-y-4 text-sm">
                    <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg flex justify-between items-center font-bold">
                      <span className="text-slate-500 uppercase tracking-wider text-xs">Total Outstanding Accounts Receivable:</span>
                      <span className="text-lg text-blue-655">${reportData.totalOutstanding?.toLocaleString()}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {reportData.brackets?.map((br, idx) => (
                        <div key={idx} className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm flex flex-col justify-between">
                          <div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{br.bracket}</div>
                            <div className="text-lg font-black text-slate-855 mt-1">${br.amount?.toLocaleString()}</div>
                          </div>
                          <div className="mt-3 text-[10px] text-slate-500">
                            {br.invoices?.length || 0} invoice(s)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AP Aging report content */}
                {selectedReport === 'ap-aging' && (
                  <div className="space-y-4 text-sm">
                    <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg flex justify-between items-center font-bold">
                      <span className="text-slate-500 uppercase tracking-wider text-xs">Total Outstanding Accounts Payable:</span>
                      <span className="text-lg text-orange-655">${reportData.totalOutstanding?.toLocaleString()}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {reportData.brackets?.map((br, idx) => (
                        <div key={idx} className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm flex flex-col justify-between">
                          <div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{br.bracket}</div>
                            <div className="text-lg font-black text-slate-855 mt-1">${br.amount?.toLocaleString()}</div>
                          </div>
                          <div className="mt-3 text-[10px] text-slate-500">
                            {br.bills?.length || 0} bill(s)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Asset Register & Depreciation report */}
                {selectedReport === 'asset-register' && (
                  <div className="space-y-4 text-sm">
                    <table className="w-full border border-slate-200 rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-left">
                          <th className="p-3">Asset</th>
                          <th className="p-3">Category</th>
                          <th className="p-3 text-right">Purchase Value</th>
                          <th className="p-3 text-right">Current Book Value</th>
                          <th className="p-3 text-right">Accum. Depr.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        {reportData.map((asset, i) => (
                          <tr key={i} className="hover:bg-slate-50/30">
                            <td className="p-3 font-medium text-slate-855">{asset.name}</td>
                            <td className="p-3 text-slate-500">{asset.category}</td>
                            <td className="p-3 text-right font-mono">${asset.purchaseValue?.toLocaleString()}</td>
                            <td className="p-3 text-right font-mono text-blue-655 font-bold">${asset.currentBookValue?.toLocaleString()}</td>
                            <td className="p-3 text-right font-mono text-slate-600">${asset.accumulatedDepreciation?.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Liability Schedule report */}
                {selectedReport === 'liabilities-loans' && (
                  <div className="space-y-4 text-sm">
                    {reportData.map((lib, i) => (
                      <div key={i} className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-slate-100 p-3 font-bold text-slate-755 border-b border-slate-200 flex justify-between">
                          <span>{lib.name} ({lib.type})</span>
                          <span>Interest: {lib.interest_rate}%</span>
                        </div>
                        <div className="p-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div>
                            <span className="text-slate-500 font-medium">Principal:</span>
                            <div className="font-bold text-slate-700">${lib.principal_amount?.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-slate-500 font-medium">Outstanding Balance:</span>
                            <div className="font-bold text-orange-600">${lib.outstanding_balance?.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-slate-500 font-medium">Installments count:</span>
                            <div className="font-bold text-slate-755">{lib.installments}</div>
                          </div>
                          <div>
                            <span className="text-slate-500 font-medium">Start Date:</span>
                            <div className="font-bold text-slate-755">{new Date(lib.start_date).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Project Profitability report content */}
                {selectedReport === 'project-profitability' && (
                  <div className="space-y-4 text-sm">
                    <table className="w-full border border-slate-200 rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-left">
                          <th className="p-3">Project Name</th>
                          <th className="p-3 text-right">Revenue (Income)</th>
                          <th className="p-3 text-right">Direct Expenses</th>
                          <th className="p-3 text-right">Calculated Profit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        {reportData.map((p, i) => (
                          <tr key={i} className="hover:bg-slate-50/30">
                            <td className="p-3 font-semibold text-slate-855">{p.projectName}</td>
                            <td className="p-3 text-right text-green-700 font-bold">${p.income?.toLocaleString()}</td>
                            <td className="p-3 text-right text-red-700 font-bold">${p.expense?.toLocaleString()}</td>
                            <td className={`p-3 text-right font-bold ${p.profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                              ${p.profit?.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        {reportData.length === 0 && (
                          <tr>
                            <td colSpan="4" className="p-8 text-center text-slate-400">No project-linked incomes or expenses registered yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-10 text-center text-slate-400 font-medium">Select a financial report from the sidebar to view details.</div>
            )}
          </div>
        </div>
      )}

      {/* Categories / Chart of Accounts Tab */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List of Accounts */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800">Chart of Accounts Categories</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-655 text-xs uppercase font-bold border-b border-slate-200">
                    <th className="p-3">Category Name</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">System Protected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {accounts.map(acc => (
                    <tr key={acc._id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-800">{acc.name}</td>
                      <td className="p-3 text-slate-600">{acc.type}</td>
                      <td className="p-3 text-slate-500">{acc.description || '-'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          acc.isSystem ? 'bg-slate-100 text-slate-500' : 'bg-green-50 text-green-700'
                        }`}>
                          {acc.isSystem ? 'System' : 'Custom'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Category Form */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 h-fit space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2">Add New Account Category</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const name = e.target.name.value;
                const type = e.target.type.value;
                const description = e.target.description.value;
                await api.post('/finance/accounts', { name, type, description });
                toast({ title: "Success", description: "Category/Account added successfully." });
                e.target.reset();
                loadDashboardData();
              } catch (err) {
                toast({ variant: "destructive", title: "Error", description: err.response?.data?.error || err.message });
              }
            }} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-xs uppercase text-slate-400 mb-1">Category Name</label>
                <Input name="name" required placeholder="e.g. Consulting Revenue, Marketing Expense" />
              </div>
              <div>
                <label className="block text-xs uppercase text-slate-400 mb-1">Account Type</label>
                <select name="type" className="w-full border border-slate-200 bg-white rounded-md p-2 text-sm" required>
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                  <option value="Asset">Asset</option>
                  <option value="Liability">Liability</option>
                  <option value="Equity">Equity</option>
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase text-slate-400 mb-1">Description</label>
                <Input name="description" placeholder="Brief description of transactions in this category..." />
              </div>
              <Button type="submit" className="w-full bg-slate-900 text-white font-bold h-10">Create Category</Button>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Generator Tab */}
      {activeTab === 'invoice-generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Invoice Creator Form Controls */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2 flex items-center gap-1.5">
              <Receipt size={16} className="text-indigo-600" /> POS thermal invoice generator
            </h3>
            
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="block uppercase tracking-wider text-slate-400 mb-1 text-[10px]">Invoice Number</label>
                <Input
                  value={invoiceForm.invoiceNo}
                  onChange={e => setInvoiceForm(prev => ({ ...prev, invoiceNo: e.target.value }))}
                />
              </div>
              <div>
                <label className="block uppercase tracking-wider text-slate-400 mb-1 text-[10px]">Invoice Date</label>
                <Input
                  type="date"
                  value={invoiceForm.date}
                  onChange={e => setInvoiceForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="col-span-2">
                <label className="block uppercase tracking-wider text-slate-400 mb-1 text-[10px]">Client / Person Name</label>
                <Input
                  value={invoiceForm.clientName}
                  onChange={e => setInvoiceForm(prev => ({ ...prev, clientName: e.target.value }))}
                  placeholder="e.g. Acme Corporation"
                />
              </div>
              <div className="col-span-2">
                <label className="block uppercase tracking-wider text-slate-400 mb-1 text-[10px]">Client Address</label>
                <Input
                  value={invoiceForm.clientAddress}
                  onChange={e => setInvoiceForm(prev => ({ ...prev, clientAddress: e.target.value }))}
                  placeholder="e.g. 5th Avenue, NYC"
                />
              </div>
              <div>
                <label className="block uppercase tracking-wider text-slate-400 mb-1 text-[10px]">Issuer Organization</label>
                <Input
                  value={invoiceForm.issuerName}
                  onChange={e => setInvoiceForm(prev => ({ ...prev, issuerName: e.target.value }))}
                />
              </div>
              <div>
                <label className="block uppercase tracking-wider text-slate-400 mb-1 text-[10px]">Advance Paid ($)</label>
                <Input
                  type="number"
                  value={invoiceForm.advancePaid}
                  onChange={e => setInvoiceForm(prev => ({ ...prev, advancePaid: Number(e.target.value || 0) }))}
                />
              </div>
              <div className="col-span-2">
                <label className="block uppercase tracking-wider text-slate-400 mb-1 text-[10px]">NetBots Contact & Address Details</label>
                <textarea
                  className="w-full text-xs border border-slate-200 rounded p-2 font-mono h-16 bg-white"
                  value={invoiceForm.issuerDetails}
                  onChange={e => setInvoiceForm(prev => ({ ...prev, issuerDetails: e.target.value }))}
                />
              </div>
            </div>

            {/* Items control table */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-700">Services & Discount Lines:</span>
                <Button
                  size="xs"
                  onClick={() => setInvoiceForm(prev => ({
                    ...prev,
                    items: [...prev.items, { description: 'New Service', quantity: 1, rate: 0, discount: 0 }]
                  }))}
                  className="bg-slate-900 text-white font-bold h-7 text-[10px]"
                >
                  Add Row
                </Button>
              </div>

              <div className="space-y-2">
                {invoiceForm.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded border border-slate-200">
                    <div className="col-span-5">
                      <input
                        type="text"
                        className="w-full border border-slate-200 bg-white rounded p-1 text-xs"
                        placeholder="Service Name"
                        value={item.description}
                        onChange={e => {
                          const newItems = [...invoiceForm.items];
                          newItems[idx].description = e.target.value;
                          setInvoiceForm(prev => ({ ...prev, items: newItems }));
                        }}
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        className="w-full border border-slate-200 bg-white rounded p-1 text-xs text-center"
                        placeholder="Qty"
                        value={item.quantity}
                        min="1"
                        onChange={e => {
                          const newItems = [...invoiceForm.items];
                          newItems[idx].quantity = Number(e.target.value || 1);
                          setInvoiceForm(prev => ({ ...prev, items: newItems }));
                        }}
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        className="w-full border border-slate-200 bg-white rounded p-1 text-xs text-right"
                        placeholder="Rate"
                        value={item.rate}
                        onChange={e => {
                          const newItems = [...invoiceForm.items];
                          newItems[idx].rate = Number(e.target.value || 0);
                          setInvoiceForm(prev => ({ ...prev, items: newItems }));
                        }}
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        className="w-full border border-slate-200 bg-white rounded p-1 text-xs text-right"
                        placeholder="Disc"
                        value={item.discount}
                        onChange={e => {
                          const newItems = [...invoiceForm.items];
                          newItems[idx].discount = Number(e.target.value || 0);
                          setInvoiceForm(prev => ({ ...prev, items: newItems }));
                        }}
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => setInvoiceForm(prev => ({
                          ...prev,
                          items: prev.items.filter((_, i) => i !== idx)
                        }))}
                        className="text-red-500 hover:text-red-700"
                        disabled={invoiceForm.items.length === 1}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* POS Thermal live Preview */}
          <div className="lg:col-span-2 flex flex-col items-center">
            <Button
              onClick={handleDownloadReceiptJpg}
              className="w-full max-w-[300px] mb-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 gap-1.5"
            >
              <Download size={14} /> Download Receipt (JPG)
            </Button>

            {/* Thermal Receipt Container */}
            <div
              id="thermal-receipt-preview"
              className="w-[300px] bg-white p-5 border border-slate-300 shadow-lg text-slate-900 font-mono text-[11px] leading-tight select-none print:shadow-none"
              style={{ fontFamily: "'Courier New', Courier, monospace" }}
            >
              {/* Header */}
              <div className="text-center space-y-1">
                <div className="text-sm font-black tracking-widest uppercase">*** {invoiceForm.issuerName} ***</div>
                <div className="whitespace-pre-line text-[10px] text-slate-600">{invoiceForm.issuerDetails}</div>
                <div>--------------------------------</div>
              </div>

              {/* Invoice Meta */}
              <div className="space-y-0.5 my-3">
                <div className="flex justify-between">
                  <span>DATE: {new Date(invoiceForm.date).toLocaleDateString()}</span>
                  <span>TIME: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div>INV NO: {invoiceForm.invoiceNo}</div>
                {invoiceForm.clientName && (
                  <div className="truncate">CLIENT: {invoiceForm.clientName}</div>
                )}
                {invoiceForm.clientAddress && (
                  <div className="truncate">ADDR: {invoiceForm.clientAddress}</div>
                )}
                <div>--------------------------------</div>
              </div>

              {/* Items grid */}
              <div className="space-y-1 my-3">
                <div className="grid grid-cols-12 font-bold border-b border-dashed pb-1">
                  <span className="col-span-6">ITEM / UNIT</span>
                  <span className="col-span-2 text-center">QTY</span>
                  <span className="col-span-2 text-right">DISC</span>
                  <span className="col-span-2 text-right">TOTAL</span>
                </div>
                {invoiceForm.items.map((item, idx) => {
                  const subTotal = item.quantity * item.rate;
                  const finalTotal = subTotal - Number(item.discount || 0);
                  return (
                    <div key={idx} className="grid grid-cols-12 py-0.5 border-b border-slate-100/50">
                      <span className="col-span-6 truncate font-semibold">{item.description}</span>
                      <span className="col-span-2 text-center">{item.quantity}</span>
                      <span className="col-span-2 text-right text-slate-500">-${item.discount}</span>
                      <span className="col-span-2 text-right font-bold">${finalTotal}</span>
                    </div>
                  );
                })}
              </div>

              <div>--------------------------------</div>

              {/* Totals & Advance */}
              <div className="space-y-1 my-3 font-semibold text-right">
                <div className="flex justify-between">
                  <span>GROSS SUBTOTAL:</span>
                  <span>${invoiceGrossTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>TOTAL DISCOUNT:</span>
                  <span>-${invoiceTotalDiscount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-700 font-bold border-t pt-1">
                  <span>NET TOTAL:</span>
                  <span>${invoiceNetTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-indigo-700">
                  <span>ADVANCE RECEIVED:</span>
                  <span>-${Number(invoiceForm.advancePaid || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-700 font-black border-t border-double pt-1 text-[12px]">
                  <span>BALANCE DUE:</span>
                  <span>${invoiceBalancePending.toFixed(2)}</span>
                </div>
              </div>

              <div>--------------------------------</div>

              {/* Barcode simulation & Thank you */}
              <div className="text-center space-y-2 mt-4">
                <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500">*** THANK YOU ***</div>
                <div className="text-[9px] text-slate-400">Powered by NetBots ERP Core</div>
                
                {/* Visual barcode simulation */}
                <div className="flex justify-center items-stretch h-8 gap-[1px] mt-2 opacity-80 px-4">
                  {[3,1,2,4,1,3,2,1,4,2,3,1,2,1,4,1,3,2,1,4,3,2,1,3,4,2,1,3].map((w, i) => (
                    <div
                      key={i}
                      className="bg-black"
                      style={{ width: `${w}px` }}
                    />
                  ))}
                </div>
                <div className="text-[8px] tracking-[3px] text-slate-500 mt-1">{invoiceForm.invoiceNo}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      <Dialog open={isTxModalOpen} onOpenChange={setIsTxModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Record Transaction</DialogTitle>
            <DialogDescription>Add income or expense to automatically post balanced journal entries to ledger.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddTransaction} className="space-y-4 text-slate-855">
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 border rounded-lg">
              <button
                type="button"
                onClick={() => setTxType('Income')}
                className={`py-1.5 text-xs font-bold rounded-md ${txType === 'Income' ? 'bg-white text-green-650 shadow-sm' : 'text-slate-500'}`}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() => setTxType('Expense')}
                className={`py-1.5 text-xs font-bold rounded-md ${txType === 'Expense' ? 'bg-white text-red-655 shadow-sm' : 'text-slate-500'}`}
              >
                Expense
              </button>
            </div>

            {/* Compact Grid Layout for Forms */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Amount ($)</label>
                <Input
                  type="number"
                  value={txForm.amount}
                  onChange={e => setTxForm(prev => ({ ...prev, amount: e.target.value }))}
                  required
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Category</label>
                <select
                  value={txForm.category}
                  onChange={e => setTxForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full border border-slate-200 bg-white rounded-md p-2 text-sm"
                  required
                >
                  <option value="">Select Category</option>
                  {accounts
                    .filter(a => a.type === txType)
                    .map(a => (
                      <option key={a._id} value={a.name}>{a.name}</option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Date</label>
                <Input
                  type="date"
                  value={txForm.date}
                  onChange={e => setTxForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Method</label>
                <select
                  value={txForm.payment_method}
                  onChange={e => setTxForm(prev => ({ ...prev, payment_method: e.target.value }))}
                  className="w-full border border-slate-200 bg-white rounded-md p-2 text-sm"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Online">Online</option>
                  {txType === 'Expense' && <option value="On Credit">On Credit</option>}
                </select>
              </div>

              {txType === 'Income' ? (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Client Link (CRM)</label>
                  <select
                    value={txForm.client}
                    onChange={e => setTxForm(prev => ({ ...prev, client: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded-md p-2 text-sm"
                  >
                    <option value="">None / Other</option>
                    {crmData.clients.map(c => (
                      <option key={c._id} value={c._id}>{c.companyName || c.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Vendor Link (CRM)</label>
                  <select
                    value={txForm.vendor}
                    onChange={e => setTxForm(prev => ({ ...prev, vendor: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded-md p-2 text-sm"
                  >
                    <option value="">None / Other</option>
                    {crmData.vendors.map(v => (
                      <option key={v._id} value={v._id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Project Link (CRM)</label>
                <select
                  value={txForm.project}
                  onChange={e => setTxForm(prev => ({ ...prev, project: e.target.value }))}
                  className="w-full border border-slate-200 bg-white rounded-md p-2 text-sm"
                >
                  <option value="">None</option>
                  {crmData.projects.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {txType === 'Expense' && (
              <div className="flex items-center gap-4 text-xs font-semibold py-1 bg-slate-50 px-2 rounded border border-slate-200/60">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={txForm.is_billable}
                    onChange={e => setTxForm(prev => ({ ...prev, is_billable: e.target.checked }))}
                  />
                  Billable to client
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={txForm.is_recurring}
                    onChange={e => setTxForm(prev => ({ ...prev, is_recurring: e.target.checked }))}
                  />
                  Recurring subscription
                </label>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Notes / Description</label>
              <Input
                value={txForm.notes}
                onChange={e => setTxForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Details of the payment..."
              />
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full bg-slate-900 text-white font-bold h-10 mt-2">Record Transaction</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Asset Modal */}
      <Dialog open={isAssetModalOpen} onOpenChange={setIsAssetModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Register Capital Asset</DialogTitle>
            <DialogDescription>Track property, furniture, or equipment and compute depreciation.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddAsset} className="space-y-4 text-slate-855">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Asset Name</label>
                <Input
                  value={assetForm.name}
                  onChange={e => setAssetForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="MacBook Pro, Office Desk..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Asset Category / Head</label>
                <select
                  value={assetForm.category}
                  onChange={e => setAssetForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full border border-slate-200 bg-white rounded-md p-2 text-sm"
                  required
                >
                  <option value="">Select Asset Head</option>
                  {accounts
                    .filter(a => a.type === 'Asset')
                    .map(a => (
                      <option key={a._id} value={a.name}>{a.name}</option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Useful Life (Years)</label>
                <Input
                  type="number"
                  value={assetForm.useful_life_years}
                  onChange={e => setAssetForm(prev => ({ ...prev, useful_life_years: e.target.value }))}
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Purchase Date</label>
                <Input
                  type="date"
                  value={assetForm.purchase_date}
                  onChange={e => setAssetForm(prev => ({ ...prev, purchase_date: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Purchase Value ($)</label>
                <Input
                  type="number"
                  value={assetForm.purchase_value}
                  onChange={e => setAssetForm(prev => ({ ...prev, purchase_value: e.target.value }))}
                  required
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Purchased From (Vendor)</label>
              <select
                value={assetForm.vendor}
                onChange={e => setAssetForm(prev => ({ ...prev, vendor: e.target.value }))}
                className="w-full border border-slate-200 bg-white rounded-md p-2 text-sm"
              >
                <option value="">None / Other</option>
                {crmData.vendors.map(v => (
                  <option key={v._id} value={v._id}>{v.name}</option>
                ))}
              </select>
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full bg-slate-900 text-white font-bold h-10 mt-2">Capitalize Asset</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Liability Modal */}
      <Dialog open={isLiabilityModalOpen} onOpenChange={setIsLiabilityModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Register Liability / Loan</DialogTitle>
            <DialogDescription>Acquire loans or payables and auto-generate installment schedules.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddLiability} className="space-y-4 text-slate-855">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Liability / Creditor Name</label>
                <Input
                  value={liabilityForm.name}
                  onChange={e => setLiabilityForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="Bank Loan, Vendor Credit..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Liability Category / Head</label>
                <select
                  value={liabilityForm.type}
                  onChange={e => setLiabilityForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full border border-slate-200 bg-white rounded-md p-2 text-sm"
                  required
                >
                  <option value="">Select Liability Head</option>
                  {accounts
                    .filter(a => a.type === 'Liability')
                    .map(a => (
                      <option key={a._id} value={a.name}>{a.name}</option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Interest Rate (%)</label>
                <Input
                  type="number"
                  value={liabilityForm.interest_rate}
                  onChange={e => setLiabilityForm(prev => ({ ...prev, interest_rate: e.target.value }))}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Principal Amount ($)</label>
                <Input
                  type="number"
                  value={liabilityForm.principal_amount}
                  onChange={e => setLiabilityForm(prev => ({ ...prev, principal_amount: e.target.value }))}
                  required
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Installments count</label>
                <Input
                  type="number"
                  value={liabilityForm.installments}
                  onChange={e => setLiabilityForm(prev => ({ ...prev, installments: e.target.value }))}
                  required
                  min="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Start Date</label>
              <Input
                type="date"
                value={liabilityForm.start_date}
                onChange={e => setLiabilityForm(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full bg-slate-900 text-white font-bold h-10 mt-2">Create Loan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Asset Disposal Modal */}
      <Dialog open={isDisposalModalOpen} onOpenChange={setIsDisposalModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Dispose Asset</DialogTitle>
            <DialogDescription>Record asset disposal and book gain/loss values.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssetDisposal} className="space-y-4 text-slate-855">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Salvage Value Received ($)</label>
              <Input
                type="number"
                value={salvageValue}
                onChange={e => setSalvageValue(e.target.value)}
                required
                placeholder="0.00"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Specify any cash received during disposal. Leaving as 0 writes off full book value as loss.</span>
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-10 mt-2">Dispose and Write-off</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinanceDashboard;
