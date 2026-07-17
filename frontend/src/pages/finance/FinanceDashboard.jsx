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
  Receipt,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
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
  const [reportPage, setReportPage] = useState(1);
  const REPORT_PER_PAGE = 50;

  // Table filter, pagination, and sorting state
  const [txSearch, setTxSearch] = useState('');
  const [txPage, setTxPage] = useState(1);
  const [txSort, setTxSort] = useState({ key: 'date', dir: 'desc' });
  const [txTypeFilter, setTxTypeFilter] = useState('all');
  const TX_PER_PAGE = 20;

  const [assetSearch, setAssetSearch] = useState('');
  const [assetPage, setAssetPage] = useState(1);
  const [assetSort, setAssetSort] = useState({ key: 'name', dir: 'asc' });
  const ASSET_PER_PAGE = 15;

  const [liabSearch, setLiabSearch] = useState('');
  const [liabPage, setLiabPage] = useState(1);
  const LIAB_PER_PAGE = 10;

  const [acctSearch, setAcctSearch] = useState('');
  const [acctTypeFilter, setAcctTypeFilter] = useState('all');

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
    notes: '',
    attachment: null
  });

  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [showCustomClient, setShowCustomClient] = useState(false);
  const [showCustomVendor, setShowCustomVendor] = useState(false);
  const [showCustomProject, setShowCustomProject] = useState(false);

  const [customCategoryName, setCustomCategoryName] = useState('');
  const [customClientName, setCustomClientName] = useState('');
  const [customVendorName, setCustomVendorName] = useState('');
  const [customProjectName, setCustomProjectName] = useState('');

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
    clientId: '',
    clientName: '',
    clientAddress: '',
    issuerName: 'Net Bots (SMC-PRIVATE) LIMITED',
    issuerDetails: '2nd Floor, Shah Plaza, Opp Pakeeza Bakers,\nKarasmathang Chowk, Skardu\ninfo@netbots.io\n+92 343 3757372',
    advancePaid: 0,
    discountPercent: 0,
    note: '',
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

      setAccounts(accountsRes?.data || []);
      setIncomes(incomesRes?.data || []);
      setExpenses(expensesRes?.data || []);
      setAssets(assetsRes?.data || []);
      setLiabilities(liabilitiesRes?.data || []);
      setCrmData({
        clients: clientsRes?.data || [],
        vendors: vendorsRes?.data || [],
        projects: projectsRes?.data || []
      });

      const trialBalanceRes = await api.get('/finance/reports/trial-balance');
      const cashAcct = trialBalanceRes?.data?.accounts?.find(a => a.account === 'Cash on Hand');
      const cashBalance = cashAcct ? (cashAcct.debit - cashAcct.credit) : 0;

      setSummaryData({
        netProfit: pnlRes?.data?.netProfit || 0,
        totalAssets: bsRes?.data?.totalAssets || 0,
        totalLiabilities: bsRes?.data?.totalLiabilities || 0,
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
    setReportData(null); // Reset before switching to prevent stale type mismatch
    setReportPage(1);
    setReportLoading(true);
    try {
      const endpoint = `/finance/reports/${selectedReport}`;
      const res = await api.get(endpoint);
      setReportData(res?.data);
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
      let finalCategory = txForm.category;
      if (showCustomCategory && customCategoryName.trim()) {
        await api.post('/finance/accounts', { name: customCategoryName.trim(), type: txType, description: 'Created inline' });
        finalCategory = customCategoryName.trim();
      }

      let finalClient = txForm.client;
      if (txType === 'Income' && showCustomClient && customClientName.trim()) {
        const clientRes = await api.post('/finance/clients', { companyName: customClientName.trim() });
        finalClient = clientRes.data?._id || clientRes._id || clientRes.data?.data?._id;
      }

      let finalVendor = txForm.vendor;
      if (txType === 'Expense' && showCustomVendor && customVendorName.trim()) {
        const vendorRes = await api.post('/finance/vendors', { name: customVendorName.trim(), category: 'Misc' });
        finalVendor = vendorRes.data?._id || vendorRes._id || vendorRes.data?.data?._id;
      }

      let finalProject = txForm.project;
      if (showCustomProject && customProjectName.trim()) {
        // Link to client if selected
        const projRes = await api.post('/finance/projects', {
          name: customProjectName.trim(),
          client: finalClient || undefined
        });
        finalProject = projRes.data?._id || projRes._id || projRes.data?.data?._id;
      }

      const endpoint = txType === 'Income' ? '/finance/income' : '/finance/expense';
      const formData = new FormData();
      
      formData.append('amount', Number(txForm.amount));
      formData.append('date', txForm.date);
      formData.append('category', finalCategory || (txType === 'Income' ? 'Service Revenue' : 'Rent Expense'));
      formData.append('payment_method', txForm.payment_method);
      if (txForm.notes) formData.append('notes', txForm.notes);
      if (finalProject) formData.append('project', finalProject);

      if (txType === 'Income') {
        if (finalClient) formData.append('client', finalClient);
      } else {
        if (finalVendor) formData.append('vendor', finalVendor);
        formData.append('is_billable', txForm.is_billable);
        formData.append('is_recurring', txForm.is_recurring);
      }
      
      if (txForm.attachment) {
        formData.append('attachment', txForm.attachment);
      }

      await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast({ title: "Success", description: "Transaction recorded successfully." });
      setIsTxModalOpen(false);
      
      // Reset form & custom states
      setShowCustomCategory(false);
      setShowCustomClient(false);
      setShowCustomVendor(false);
      setShowCustomProject(false);
      setCustomCategoryName('');
      setCustomClientName('');
      setCustomVendorName('');
      setCustomProjectName('');

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
        notes: '',
        attachment: null
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
      const companySafe = (invoiceForm.issuerName || 'Company').trim().replace(/[^a-z0-9]/gi, '_');
      const invSafe = (invoiceForm.invoiceNo || 'pos').trim().replace(/[^a-z0-9]/gi, '_');
      link.download = `${companySafe}_${invSafe}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 1.0);
      link.click();
      toast({ title: "JPG Downloaded", description: "Thermal receipt exported successfully." });
    });
  };

  const handleFetchBillableExpenses = async () => {
    if (!invoiceForm.clientId) {
      toast({ variant: "destructive", title: "Error", description: "Select a CRM Client first to fetch billable expenses." });
      return;
    }
    try {
      const res = await api.get(`/finance/expense/billable/${invoiceForm.clientId}`);
      const unbilled = res.data?.data || [];
      if (unbilled.length === 0) {
        toast({ title: "No Expenses", description: "No unbilled expenses found for this client." });
        return;
      }
      
      const newItems = unbilled.map(exp => ({
        description: `Billable Expense: ${exp.category} - ${exp.notes || exp.vendor?.name || 'Misc'}`,
        quantity: 1,
        rate: exp.amount,
        discount: 0
      }));
      
      setInvoiceForm(prev => ({
        ...prev,
        items: [...prev.items, ...newItems]
      }));
      toast({ title: "Imported", description: `Added ${newItems.length} billable expenses to invoice.` });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch billable expenses." });
    }
  };

  const handleSaveInvoiceToLedger = async () => {
    if (!invoiceForm.clientId) {
      toast({ variant: "destructive", title: "Error", description: "A CRM Client must be selected to save this invoice to the ledger." });
      return;
    }
    try {
      // 1. Calculate totals
      const grossTotal = invoiceForm.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
      const itemDiscounts = invoiceForm.items.reduce((sum, item) => sum + Number(item.discount || 0), 0);
      const netAfterItem = grossTotal - itemDiscounts;
      const percentAmount = Number(((netAfterItem * (invoiceForm.discountPercent || 0)) / 100).toFixed(2));
      const netTotal = grossTotal - itemDiscounts - percentAmount;
      
      // 2. Save Invoice
      const invBody = {
        invoiceNumber: invoiceForm.invoiceNo,
        client: invoiceForm.clientId,
        amount: netTotal,
        issueDate: invoiceForm.date,
        dueDate: invoiceForm.date,
        items: invoiceForm.items.map(i => ({
          description: i.description,
          quantity: i.quantity,
          rate: i.rate,
          total: (i.quantity * i.rate) - Number(i.discount || 0)
        })),
        status: 'Sent'
      };
      
      const invRes = await api.post('/invoices', invBody);
      const newInvId = invRes.data.data._id;
      
      // 3. Post Payment if Advance was given
      if (invoiceForm.advancePaid > 0) {
        await api.post(`/invoices/${newInvId}/pay`, {
          paymentAmount: invoiceForm.advancePaid,
          payment_method: 'Cash', // Defaulting to Cash for POS
          notes: invoiceForm.note || 'Advance payment at POS'
        });
      }
      
      toast({ title: "Invoice Saved", description: "Invoice and Ledger Entries successfully recorded." });
      loadDashboardData();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: err.response?.data?.error || err.message });
    }
  };

  // ── Table data computation helpers ──────────────────────────────────
  // Transactions: merge incomes + expenses, filter, sort, paginate
  const allTransactions = [
    ...incomes.map(i => ({ ...i, _type: 'Income' })),
    ...expenses.map(e => ({ ...e, _type: 'Expense' }))
  ];

  const filteredTransactions = allTransactions.filter(tx => {
    const q = txSearch.toLowerCase();
    const matchSearch = !q || tx.category?.toLowerCase().includes(q) ||
      tx.notes?.toLowerCase().includes(q) ||
      tx.payment_method?.toLowerCase().includes(q) ||
      (tx.client?.name || tx.client?.companyName || '').toLowerCase().includes(q) ||
      (tx.vendor?.name || '').toLowerCase().includes(q);
    const matchType = txTypeFilter === 'all' || tx._type.toLowerCase() === txTypeFilter;
    return matchSearch && matchType;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const dir = txSort.dir === 'asc' ? 1 : -1;
    if (txSort.key === 'date') return dir * (new Date(a.date) - new Date(b.date));
    if (txSort.key === 'amount') return dir * (a.amount - b.amount);
    if (txSort.key === 'category') return dir * (a.category || '').localeCompare(b.category || '');
    return 0;
  });

  const txTotalPages = Math.max(1, Math.ceil(sortedTransactions.length / TX_PER_PAGE));
  const paginatedTransactions = sortedTransactions.slice((txPage - 1) * TX_PER_PAGE, txPage * TX_PER_PAGE);

  const handleTxSort = (key) => {
    setTxSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
    setTxPage(1);
  };

  const TxSortIcon = ({ col }) => {
    if (txSort.key !== col) return <ArrowUpDown size={12} className="text-slate-300" />;
    return txSort.dir === 'asc' ? <ArrowUp size={12} className="text-indigo-600" /> : <ArrowDown size={12} className="text-indigo-600" />;
  };

  // Assets: filter, sort, paginate
  const filteredAssets = assets.filter(a => {
    const q = assetSearch.toLowerCase();
    return !q || a.name?.toLowerCase().includes(q) || a.category?.toLowerCase().includes(q) || a.status?.toLowerCase().includes(q);
  });

  const sortedAssets = [...filteredAssets].sort((a, b) => {
    const dir = assetSort.dir === 'asc' ? 1 : -1;
    if (assetSort.key === 'name') return dir * (a.name || '').localeCompare(b.name || '');
    if (assetSort.key === 'purchase_value') return dir * (a.purchase_value - b.purchase_value);
    if (assetSort.key === 'current_book_value') return dir * (a.current_book_value - b.current_book_value);
    if (assetSort.key === 'purchase_date') return dir * (new Date(a.purchase_date) - new Date(b.purchase_date));
    return 0;
  });

  const assetTotalPages = Math.max(1, Math.ceil(sortedAssets.length / ASSET_PER_PAGE));
  const paginatedAssets = sortedAssets.slice((assetPage - 1) * ASSET_PER_PAGE, assetPage * ASSET_PER_PAGE);

  const handleAssetSort = (key) => {
    setAssetSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
    setAssetPage(1);
  };

  const AssetSortIcon = ({ col }) => {
    if (assetSort.key !== col) return <ArrowUpDown size={12} className="text-slate-300" />;
    return assetSort.dir === 'asc' ? <ArrowUp size={12} className="text-indigo-600" /> : <ArrowDown size={12} className="text-indigo-600" />;
  };

  // Liabilities: filter, paginate
  const filteredLiabilities = liabilities.filter(l => {
    const q = liabSearch.toLowerCase();
    return !q || l.name?.toLowerCase().includes(q) || l.type?.toLowerCase().includes(q);
  });
  const liabTotalPages = Math.max(1, Math.ceil(filteredLiabilities.length / LIAB_PER_PAGE));
  const paginatedLiabilities = filteredLiabilities.slice((liabPage - 1) * LIAB_PER_PAGE, liabPage * LIAB_PER_PAGE);

  // Accounts (Chart of Accounts): filter
  const filteredAccounts = accounts.filter(acc => {
    const q = acctSearch.toLowerCase();
    const matchSearch = !q || acc.name?.toLowerCase().includes(q) || acc.description?.toLowerCase().includes(q);
    const matchType = acctTypeFilter === 'all' || acc.type === acctTypeFilter;
    return matchSearch && matchType;
  });

  // ── Reusable Pagination Component ──────────────────────────────────
  const PaginationBar = ({ page, totalPages, setPage, totalItems, label }) => (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 bg-slate-50/50 border-t border-slate-100">
      <span className="text-xs text-slate-500 font-medium">
        Showing {Math.min((page - 1) * (totalItems > 0 ? Math.ceil(totalItems / totalPages) : 1) + 1, totalItems)}–{Math.min(page * Math.ceil(totalItems / totalPages), totalItems)} of {totalItems} {label}
      </span>
      <div className="flex items-center gap-1">
        <Button
          size="sm" variant="outline" disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          className="h-7 w-7 p-0"
        >
          <ChevronLeft size={14} />
        </Button>
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          let p;
          if (totalPages <= 7) { p = i + 1; }
          else if (page <= 4) { p = i + 1; }
          else if (page >= totalPages - 3) { p = totalPages - 6 + i; }
          else { p = page - 3 + i; }
          return (
            <Button
              key={p} size="sm" variant={page === p ? 'default' : 'outline'}
              onClick={() => setPage(p)}
              className={`h-7 w-7 p-0 text-xs font-bold ${page === p ? 'bg-indigo-600 text-white' : ''}`}
            >
              {p}
            </Button>
          );
        })}
        <Button
          size="sm" variant="outline" disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
          className="h-7 w-7 p-0"
        >
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );

  // PDF Download Logic - with branded header & logo matching Lead PDF design
  const handleDownloadPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF();

    // ── Branded Header (matching lead PDF style) ──────────────────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Net Bots  (SMC-PRIVATE) LIMITED", 14, 15);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Intellectual property of Net Bots  (SMC-PRIVATE) LIMITED", 14, 19);

    // Try adding the company logo
    try {
      doc.addImage('/logo.png', 'PNG', 155, 6, 42, 14);
    } catch (imgErr) {
      console.warn("Logo failed to load in PDF export, proceeding with text only.", imgErr);
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 23, 196, 23);

    // ── Report Metadata ──────────────────────────────────────────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    const reportLabel = selectedReport.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    doc.text(`${reportLabel} Statement`, 14, 30);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);

    doc.line(14, 37, 196, 37);

    let y = 44;

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

      (Array.isArray(reportData) ? reportData : []).forEach(asset => {
        drawRow(asset.name, `$${asset.purchaseValue?.toLocaleString()}`, `$${asset.currentBookValue?.toLocaleString()}`, `$${asset.accumulatedDepreciation?.toLocaleString()}`);
      });
    }
    else if (selectedReport === 'liabilities-loans') {
      drawRow("Liability Description", "Type", "Principal ($)", "Outstanding ($)", true);
      doc.line(14, y - 4, 196, y - 4);
      y += 4;

      (Array.isArray(reportData) ? reportData : []).forEach(lib => {
        drawRow(lib.name, lib.type, `$${lib.principal_amount?.toLocaleString()}`, `$${lib.outstanding_balance?.toLocaleString()}`);
      });
    }
    else if (selectedReport === 'project-profitability') {
      drawRow("Project / Client", "Income ($)", "Expenses ($)", "Project Profit ($)", true);
      doc.line(14, y - 4, 196, y - 4);
      y += 4;

      (Array.isArray(reportData) ? reportData : []).forEach(p => {
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
  const itemTotalDiscount = invoiceDiscounts.reduce((a, b) => a + b, 0);
  
  const netAfterItemDiscounts = invoiceGrossTotal - itemTotalDiscount;
  const percentDiscountAmount = Number(((netAfterItemDiscounts * (invoiceForm.discountPercent || 0)) / 100).toFixed(2));
  
  const invoiceTotalDiscount = itemTotalDiscount + percentDiscountAmount;
  const invoiceNetTotal = invoiceGrossTotal - invoiceTotalDiscount;
  const invoiceBalancePending = Math.max(0, invoiceNetTotal - Number(invoiceForm.advancePaid || 0));
  const displayedAdvance = Math.min(invoiceNetTotal, Number(invoiceForm.advancePaid || 0));

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
                  PKR {summaryData.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                  PKR {summaryData.totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                  PKR {summaryData.totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                  PKR {summaryData.cashOnHand.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-800">Incomes & Expenses Ledger</h3>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none sm:min-w-[200px]">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text" placeholder="Search transactions..."
                  value={txSearch} onChange={e => { setTxSearch(e.target.value); setTxPage(1); }}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                />
              </div>
              <select
                value={txTypeFilter} onChange={e => { setTxTypeFilter(e.target.value); setTxPage(1); }}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white font-semibold"
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">{filteredTransactions.length} records</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-655 text-xs uppercase font-bold border-b border-slate-200">
                  <th className="p-3 cursor-pointer select-none" onClick={() => handleTxSort('date')}>
                    <span className="flex items-center gap-1">Date <TxSortIcon col="date" /></span>
                  </th>
                  <th className="p-3">Type</th>
                  <th className="p-3 cursor-pointer select-none" onClick={() => handleTxSort('category')}>
                    <span className="flex items-center gap-1">Category <TxSortIcon col="category" /></span>
                  </th>
                  <th className="p-3">Client/Vendor</th>
                  <th className="p-3 hidden lg:table-cell">Project</th>
                  <th className="p-3 hidden md:table-cell">Payment Method</th>
                  <th className="p-3 hidden xl:table-cell">Notes</th>
                  <th className="p-3 text-right cursor-pointer select-none" onClick={() => handleTxSort('amount')}>
                    <span className="flex items-center justify-end gap-1">Amount <TxSortIcon col="amount" /></span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {paginatedTransactions.map(item => (
                  <tr key={item._id} className="hover:bg-slate-50/50">
                    <td className="p-3 whitespace-nowrap text-slate-600">{new Date(item.date).toLocaleDateString()}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                        item._type === 'Income' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>{item._type}</span>
                    </td>
                    <td className="p-3 whitespace-nowrap font-medium text-slate-700">{item.category}</td>
                    <td className="p-3 whitespace-nowrap text-slate-600">
                      {item._type === 'Income'
                        ? (item.client?.companyName || item.client?.name || 'Other')
                        : (item.vendor?.name || 'Payee')}
                    </td>
                    <td className="p-3 whitespace-nowrap text-slate-500 hidden lg:table-cell">{item.project?.name || '-'}</td>
                    <td className="p-3 whitespace-nowrap text-slate-600 hidden md:table-cell">{item.payment_method}</td>
                    <td className="p-3 text-slate-500 truncate max-w-[200px] hidden xl:table-cell">{item.notes || '-'}</td>
                    <td className={`p-3 text-right font-bold whitespace-nowrap ${item._type === 'Income' ? 'text-green-700' : 'text-red-700'}`}>
                      ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-400 font-medium">No transactions found matching your filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredTransactions.length > 0 && (
            <PaginationBar page={txPage} totalPages={txTotalPages} setPage={setTxPage} totalItems={filteredTransactions.length} label="transactions" />
          )}
        </div>
      )}

      {/* Asset Register Tab */}
      {activeTab === 'assets' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Fixed Asset Register</h3>
              <p className="text-[11px] text-slate-400">Calculate Straight-line depreciation and capital write-offs</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none sm:min-w-[220px]">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text" placeholder="Search assets..."
                  value={assetSearch} onChange={e => { setAssetSearch(e.target.value); setAssetPage(1); }}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                />
              </div>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">{filteredAssets.length} assets</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-655 text-xs uppercase font-bold border-b border-slate-200">
                  <th className="p-3 cursor-pointer select-none" onClick={() => handleAssetSort('name')}>
                    <span className="flex items-center gap-1">Asset Name <AssetSortIcon col="name" /></span>
                  </th>
                  <th className="p-3">Category</th>
                  <th className="p-3 cursor-pointer select-none" onClick={() => handleAssetSort('purchase_date')}>
                    <span className="flex items-center gap-1">Acquisition Date <AssetSortIcon col="purchase_date" /></span>
                  </th>
                  <th className="p-3 text-right cursor-pointer select-none" onClick={() => handleAssetSort('purchase_value')}>
                    <span className="flex items-center justify-end gap-1">Purchase Value <AssetSortIcon col="purchase_value" /></span>
                  </th>
                  <th className="p-3 text-right cursor-pointer select-none" onClick={() => handleAssetSort('current_book_value')}>
                    <span className="flex items-center justify-end gap-1">Current Book Value <AssetSortIcon col="current_book_value" /></span>
                  </th>
                  <th className="p-3 text-center">Useful Life (Yrs)</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {paginatedAssets.map(asset => (
                  <tr key={asset._id} className="hover:bg-slate-50/50">
                    <td className="p-3 whitespace-nowrap font-medium text-slate-700">{asset.name}</td>
                    <td className="p-3 whitespace-nowrap text-slate-600">{asset.category}</td>
                    <td className="p-3 whitespace-nowrap text-slate-600">{new Date(asset.purchase_date).toLocaleDateString()}</td>
                    <td className="p-3 text-right font-semibold text-slate-700">PKR {asset.purchase_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right font-bold text-blue-655">PKR {asset.current_book_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-center text-slate-600">{asset.useful_life_years}</td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        asset.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>{asset.status}</span>
                    </td>
                    <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                      {asset.status === 'Active' && asset.current_book_value > 0 && (
                        <Button
                          size="xs" variant="outline" onClick={() => runDepreciation(asset._id)}
                          className="text-xs h-7 gap-1 border-blue-200 hover:bg-blue-50 text-blue-700"
                        >
                          <Calculator size={12} /> Depreciate
                        </Button>
                      )}
                      {asset.status === 'Active' && (
                        <Button
                          size="xs" variant="outline"
                          onClick={() => { setSelectedAssetForDisposal(asset._id); setIsDisposalModalOpen(true); }}
                          className="text-xs h-7 gap-1 border-red-200 hover:bg-red-50 text-red-700"
                        >
                          <Trash2 size={12} /> Dispose
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredAssets.length === 0 && (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-400 font-medium">No assets registered yet matching your criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredAssets.length > 0 && (
            <PaginationBar page={assetPage} totalPages={assetTotalPages} setPage={setAssetPage} totalItems={filteredAssets.length} label="assets" />
          )}
        </div>
      )}

      {/* Liabilities Tab */}
      {activeTab === 'liabilities' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Outstanding Liabilities & Repayment Schedules</h3>
                <p className="text-[11px] text-slate-400">Generate amortization principal + interest schedules</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none sm:min-w-[220px]">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text" placeholder="Search loans/liabilities..."
                    value={liabSearch} onChange={e => { setLiabSearch(e.target.value); setLiabPage(1); }}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                  />
                </div>
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">{filteredLiabilities.length} records</span>
              </div>
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
                  {paginatedLiabilities.map(l => {
                    const paidAmt = l.principal_amount - l.outstanding_balance;
                    const pct = l.principal_amount > 0 ? (paidAmt / l.principal_amount) * 100 : 0;
                    return (
                      <React.Fragment key={l._id}>
                        <tr className="hover:bg-slate-50/50 font-medium">
                          <td className="p-3 whitespace-nowrap text-slate-800">{l.name}</td>
                          <td className="p-3 whitespace-nowrap text-slate-600">{l.type}</td>
                          <td className="p-3 text-right text-slate-650">PKR {l.principal_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="p-3 text-right text-orange-650 font-bold">PKR {l.outstanding_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
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
                                  <div className="text-sm font-bold text-slate-855 mt-1">PKR {installment.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                  <div className="text-[10px] text-slate-500">
                                    Principal: PKR {installment.principal} | Interest: PKR {installment.interest}
                                  </div>
                                  <div className="mt-2 flex items-center justify-between">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                      installment.status === 'Paid' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                                    }`}>{installment.status}</span>
                                    {installment.status === 'Pending' && (
                                      <Button
                                        size="xs" onClick={() => payInstallment(l._id, installment._id)}
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
                  {filteredLiabilities.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-400 font-medium">No liabilities found matching your criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {filteredLiabilities.length > 0 && (
              <PaginationBar page={liabPage} totalPages={liabTotalPages} setPage={setLiabPage} totalItems={filteredLiabilities.length} label="liabilities" />
            )}
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
                            <span className="font-semibold text-slate-808">PKR {d.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        ))}
                        <div className="flex justify-between p-3 bg-green-50/50 font-bold text-green-700">
                          <span>Total Revenue</span>
                          <span>PKR {reportData.totalIncome?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="bg-slate-100 p-3 font-bold text-slate-700 border-b border-slate-200">Cost & Operating Expenses</div>
                      <div className="divide-y divide-slate-150">
                        {reportData.expenseDetails?.map((d, i) => (
                          <div key={i} className="flex justify-between p-3">
                            <span className="text-slate-655">{d.account}</span>
                            <span className="font-semibold text-slate-805">PKR {d.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        ))}
                        <div className="flex justify-between p-3 bg-red-50/50 font-bold text-red-700">
                          <span>Total Operating Expenses</span>
                          <span>PKR {reportData.totalExpense?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between p-4 bg-slate-900 text-white rounded-lg font-black text-base">
                      <span>Net Operating Income (Net Profit)</span>
                      <span>PKR {reportData.netProfit?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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
                              <span className="font-semibold text-slate-808">PKR {d.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                          ))}
                          <div className="flex justify-between p-3 bg-blue-100/50 font-bold text-blue-900">
                            <span>Total Assets</span>
                            <span>PKR {reportData.totalAssets?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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
                                <span className="font-semibold text-slate-808">PKR {d.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              </div>
                            ))}
                            <div className="flex justify-between p-3 bg-orange-100/50 font-bold text-orange-900">
                              <span>Total Liabilities</span>
                              <span>PKR {reportData.totalLiabilities?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>

                        <div className="border border-slate-200 rounded-lg overflow-hidden h-fit">
                          <div className="bg-indigo-50 p-3 font-bold text-indigo-855 border-b border-slate-200">Equity</div>
                          <div className="divide-y divide-slate-150">
                            {reportData.equityDetails?.map((d, i) => (
                              <div key={i} className="flex justify-between p-3">
                                <span className="text-slate-655">{d.account}</span>
                                <span className="font-semibold text-slate-808">PKR {d.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              </div>
                            ))}
                            <div className="flex justify-between p-3 bg-indigo-100/50 font-bold text-indigo-900">
                              <span>Total Equity</span>
                              <span>PKR {reportData.totalEquity?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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
                      <span>Assets (PKR {reportData.totalAssets?.toLocaleString()}) = L+E (PKR {(reportData.totalLiabilities + reportData.totalEquity)?.toLocaleString()})</span>
                    </div>
                  </div>
                )}

                {/* Cash Flow Statement report content */}
                {selectedReport === 'cash-flow' && (
                  <div className="space-y-4 text-sm">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="border border-slate-200 rounded-lg p-4 bg-green-50/20">
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Cash In</span>
                        <div className="text-xl font-bold text-green-700 mt-1">PKR {reportData.cashIn?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      </div>
                      <div className="border border-slate-200 rounded-lg p-4 bg-red-50/20">
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Cash Out</span>
                        <div className="text-xl font-bold text-red-700 mt-1">PKR {reportData.cashOut?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      </div>
                      <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Net Cash Flow</span>
                        <div className="text-xl font-bold text-slate-800 mt-1">PKR {reportData.netCashFlow?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
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
                          {(reportData.flows || []).slice((reportPage - 1) * REPORT_PER_PAGE, reportPage * REPORT_PER_PAGE).map((f, i) => (
                            <tr key={i} className="hover:bg-slate-50/50">
                              <td className="p-3">{new Date(f.date).toLocaleDateString()}</td>
                              <td className="p-3 font-medium text-slate-700">{f.description}</td>
                              <td className={`p-3 text-right font-bold ${f.amount >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                {f.amount >= 0 ? '+' : ''}PKR {f.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {(reportData.flows || []).length > REPORT_PER_PAGE && (
                        <PaginationBar
                          page={reportPage}
                          totalPages={Math.ceil((reportData.flows || []).length / REPORT_PER_PAGE)}
                          setPage={setReportPage}
                          totalItems={(reportData.flows || []).length}
                          label="logs"
                        />
                      )}
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
                        {(reportData.accounts || []).slice((reportPage - 1) * REPORT_PER_PAGE, reportPage * REPORT_PER_PAGE).map((acc, i) => (
                          <tr key={i} className="hover:bg-slate-50/30">
                            <td className="p-3 font-medium text-slate-800">{acc.account}</td>
                            <td className="p-3 text-slate-500">{acc.type}</td>
                            <td className="p-3 text-right text-slate-700 font-mono">{acc.debit > 0 ? `PKR ${acc.debit.toLocaleString()}` : '-'}</td>
                            <td className="p-3 text-right text-slate-700 font-mono">{acc.credit > 0 ? `PKR ${acc.credit.toLocaleString()}` : '-'}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-350">
                          <td colSpan="2" className="p-3">Grand Balance Totals</td>
                          <td className="p-3 text-right font-mono">PKR {reportData.grandTotalDebit?.toLocaleString()}</td>
                          <td className="p-3 text-right font-mono">PKR {reportData.grandTotalCredit?.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                    {(reportData.accounts || []).length > REPORT_PER_PAGE && (
                      <PaginationBar
                        page={reportPage}
                        totalPages={Math.ceil((reportData.accounts || []).length / REPORT_PER_PAGE)}
                        setPage={setReportPage}
                        totalItems={(reportData.accounts || []).length}
                        label="accounts"
                      />
                    )}
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
                              <span className="font-semibold text-slate-808">PKR {item.amount.toLocaleString()}</span>
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
                              <span className="font-semibold text-slate-808">PKR {item.amount.toLocaleString()}</span>
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
                              <span className="font-semibold text-slate-808">PKR {item.amount.toLocaleString()}</span>
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
                              <span className="font-semibold text-slate-808">PKR {item.amount.toLocaleString()}</span>
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
                      <span className="text-lg text-blue-655">PKR {reportData.totalOutstanding?.toLocaleString()}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {reportData.brackets?.map((br, idx) => (
                        <div key={idx} className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm flex flex-col justify-between">
                          <div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{br.bracket}</div>
                            <div className="text-lg font-black text-slate-855 mt-1">PKR {br.amount?.toLocaleString()}</div>
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
                      <span className="text-lg text-orange-655">PKR {reportData.totalOutstanding?.toLocaleString()}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {reportData.brackets?.map((br, idx) => (
                        <div key={idx} className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm flex flex-col justify-between">
                          <div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{br.bracket}</div>
                            <div className="text-lg font-black text-slate-855 mt-1">PKR {br.amount?.toLocaleString()}</div>
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
                        {(Array.isArray(reportData) ? reportData : []).slice((reportPage - 1) * REPORT_PER_PAGE, reportPage * REPORT_PER_PAGE).map((asset, i) => (
                          <tr key={i} className="hover:bg-slate-50/30">
                            <td className="p-3 font-medium text-slate-855">{asset.name}</td>
                            <td className="p-3 text-slate-500">{asset.category}</td>
                            <td className="p-3 text-right font-mono">PKR {asset.purchaseValue?.toLocaleString()}</td>
                            <td className="p-3 text-right font-mono text-blue-655 font-bold">PKR {asset.currentBookValue?.toLocaleString()}</td>
                            <td className="p-3 text-right font-mono text-slate-600">PKR {asset.accumulatedDepreciation?.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(Array.isArray(reportData) ? reportData : []).length > REPORT_PER_PAGE && (
                      <PaginationBar
                        page={reportPage}
                        totalPages={Math.ceil((Array.isArray(reportData) ? reportData : []).length / REPORT_PER_PAGE)}
                        setPage={setReportPage}
                        totalItems={(Array.isArray(reportData) ? reportData : []).length}
                        label="assets"
                      />
                    )}
                  </div>
                )}

                {/* Liability Schedule report */}
                {selectedReport === 'liabilities-loans' && (
                  <div className="space-y-4 text-sm">
                    {(Array.isArray(reportData) ? reportData : []).slice((reportPage - 1) * REPORT_PER_PAGE, reportPage * REPORT_PER_PAGE).map((lib, i) => (
                      <div key={i} className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-slate-100 p-3 font-bold text-slate-755 border-b border-slate-200 flex justify-between">
                          <span>{lib.name} ({lib.type})</span>
                          <span>Interest: {lib.interest_rate}%</span>
                        </div>
                        <div className="p-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div>
                            <span className="text-slate-500 font-medium">Principal:</span>
                            <div className="font-bold text-slate-700">PKR {lib.principal_amount?.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-slate-500 font-medium">Outstanding Balance:</span>
                            <div className="font-bold text-orange-600">PKR {lib.outstanding_balance?.toLocaleString()}</div>
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
                    {(Array.isArray(reportData) ? reportData : []).length > REPORT_PER_PAGE && (
                      <PaginationBar
                        page={reportPage}
                        totalPages={Math.ceil((Array.isArray(reportData) ? reportData : []).length / REPORT_PER_PAGE)}
                        setPage={setReportPage}
                        totalItems={(Array.isArray(reportData) ? reportData : []).length}
                        label="liabilities"
                      />
                    )}
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
                        {(Array.isArray(reportData) ? reportData : []).slice((reportPage - 1) * REPORT_PER_PAGE, reportPage * REPORT_PER_PAGE).map((p, i) => (
                          <tr key={i} className="hover:bg-slate-50/30">
                            <td className="p-3 font-semibold text-slate-855">{p.projectName}</td>
                            <td className="p-3 text-right text-green-700 font-bold">PKR {p.income?.toLocaleString()}</td>
                            <td className="p-3 text-right text-red-700 font-bold">PKR {p.expense?.toLocaleString()}</td>
                            <td className={`p-3 text-right font-bold ${p.profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                              PKR {p.profit?.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        {(Array.isArray(reportData) ? reportData : []).length === 0 && (
                          <tr>
                            <td colSpan="4" className="p-8 text-center text-slate-400">No project-linked incomes or expenses registered yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    {(Array.isArray(reportData) ? reportData : []).length > REPORT_PER_PAGE && (
                      <PaginationBar
                        page={reportPage}
                        totalPages={Math.ceil((Array.isArray(reportData) ? reportData : []).length / REPORT_PER_PAGE)}
                        setPage={setReportPage}
                        totalItems={(Array.isArray(reportData) ? reportData : []).length}
                        label="projects"
                      />
                    )}
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
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800">Chart of Accounts Categories</h3>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none sm:min-w-[180px]">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text" placeholder="Search categories..."
                    value={acctSearch} onChange={e => setAcctSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                  />
                </div>
                <select
                  value={acctTypeFilter} onChange={e => setAcctTypeFilter(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white font-semibold"
                >
                  <option value="all">All Types</option>
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                  <option value="Asset">Asset</option>
                  <option value="Liability">Liability</option>
                  <option value="Equity">Equity</option>
                </select>
              </div>
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
                  {filteredAccounts.map(acc => (
                    <tr key={acc._id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-800">{acc.name}</td>
                      <td className="p-3 text-slate-600">{acc.type}</td>
                      <td className="p-3 text-slate-500">{acc.description || '-'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          acc.isSystem ? 'bg-slate-100 text-slate-500' : 'bg-green-50 text-green-700'
                        }`}>{acc.isSystem ? 'System' : 'Custom'}</span>
                      </td>
                    </tr>
                  ))}
                  {filteredAccounts.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-slate-400 font-medium">No account categories found matching your criteria.</td>
                    </tr>
                  )}
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
                <label className="block uppercase tracking-wider text-slate-400 mb-1 text-[10px]">Link CRM Client (Optional)</label>
                <div className="flex gap-2">
                  <select
                    value={invoiceForm.clientId}
                    onChange={e => {
                      const cid = e.target.value;
                      const client = crmData.clients.find(c => c._id === cid);
                      setInvoiceForm(prev => ({
                        ...prev,
                        clientId: cid,
                        clientName: client ? (client.companyName || client.name) : prev.clientName,
                        clientAddress: client ? client.address : prev.clientAddress
                      }));
                    }}
                    className="w-1/2 border border-slate-200 bg-white rounded-md p-1.5 text-xs font-semibold"
                  >
                    <option value="">None / Custom</option>
                    {crmData.clients.map(c => (
                      <option key={c._id} value={c._id}>{c.companyName || c.name}</option>
                    ))}
                  </select>
                  <Button
                    size="xs"
                    onClick={handleFetchBillableExpenses}
                    disabled={!invoiceForm.clientId}
                    className="w-1/2 h-8 text-[10px] bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold"
                  >
                    Import Billable Expenses
                  </Button>
                </div>
              </div>

              <div className="col-span-2">
                <label className="block uppercase tracking-wider text-slate-400 mb-1 text-[10px]">Client / Person Name (Printed)</label>
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
                <label className="block uppercase tracking-wider text-slate-400 mb-1 text-[10px]">Advance Paid (PKR)</label>
                <Input
                  type="number"
                  value={invoiceForm.advancePaid}
                  onChange={e => setInvoiceForm(prev => ({ ...prev, advancePaid: Number(e.target.value || 0) }))}
                />
              </div>
              <div>
                <label className="block uppercase tracking-wider text-slate-400 mb-1 text-[10px]">Total Discount (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={invoiceForm.discountPercent}
                  onChange={e => setInvoiceForm(prev => ({ ...prev, discountPercent: Number(e.target.value || 0) }))}
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
              <div className="col-span-2">
                <label className="block uppercase tracking-wider text-slate-400 mb-1 text-[10px]">Receipt Note / Terms</label>
                <textarea
                  className="w-full text-xs border border-slate-200 rounded p-2 font-mono h-16 bg-white"
                  value={invoiceForm.note}
                  onChange={e => setInvoiceForm(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="e.g. Terms: 50% advance, balance on delivery. Thank you for your business!"
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

              {/* Form columns header label */}
              <div className="grid grid-cols-12 gap-2 mb-1.5 text-[9px] uppercase font-extrabold text-slate-400 px-2 tracking-wider text-center items-center">
                <div className="col-span-4 text-left">Service / Item Name</div>
                <div className="col-span-2">Rate (PKR)</div>
                <div className="col-span-2">Qty</div>
                <div className="col-span-2">Disc (PKR)</div>
                <div className="col-span-1">Total</div>
                <div className="col-span-1"></div>
              </div>

              <div className="space-y-2">
                {invoiceForm.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded border border-slate-200">
                    <div className="col-span-4">
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
                        className="w-full border border-slate-200 bg-white rounded p-1 text-xs text-center"
                        placeholder="Disc"
                        value={item.discount}
                        onChange={e => {
                          const newItems = [...invoiceForm.items];
                          newItems[idx].discount = Number(e.target.value || 0);
                          setInvoiceForm(prev => ({ ...prev, items: newItems }));
                        }}
                      />
                    </div>
                    <div className="col-span-1 font-bold text-xs text-slate-700 text-center">
                      {(item.quantity * item.rate) - Number(item.discount || 0)}
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
            <div className="col-span-12 flex gap-3 pt-3 mt-3 border-t">
              <Button
                onClick={handleDownloadReceiptJpg}
                className="flex-1 bg-slate-900 text-white font-bold h-9 text-xs flex items-center gap-2"
              >
                <Download size={14} /> Download JPG POS Receipt
              </Button>
              <Button
                onClick={handleSaveInvoiceToLedger}
                className="flex-1 bg-indigo-600 text-white font-bold h-9 text-xs flex items-center gap-2"
              >
                <CheckCircle2 size={14} /> Save to CRM & Ledger
              </Button>
            </div>

            {/* Thermal Receipt Container */}
            <div
              id="thermal-receipt-preview"
              className="relative overflow-hidden w-[350px] bg-white p-6 border border-slate-350 shadow-lg text-slate-900 font-mono text-[11px] select-none print:shadow-none"
              style={{ fontFamily: "monospace", lineHeight: '1.5' }}
            >
              {/* Dynamic stamp based on payment status */}
              {(() => {
                let stampText = '';
                let stampColor = '';
                if (invoiceBalancePending <= 0) {
                  stampText = 'PAID';
                  stampColor = 'border-green-600/35 text-green-600/35';
                } else if (invoiceForm.advancePaid > 0 && invoiceBalancePending > 0) {
                  stampText = 'PARTIAL';
                  stampColor = 'border-blue-600/35 text-blue-600/35';
                } else {
                  stampText = 'UNPAID';
                  stampColor = 'border-red-650/35 text-red-650/35';
                }
                return (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 select-none">
                    <div className={`border-4 rounded-xl px-5 py-1.5 text-2xl font-black tracking-widest uppercase rotate-[-22deg] scale-110 ${stampColor}`}>
                      {stampText}
                    </div>
                  </div>
                );
              })()}

              {/* Header */}
              <div className="text-center space-y-1">
                <div className="text-[10px] font-black tracking-normal whitespace-nowrap uppercase overflow-hidden text-ellipsis">*** {invoiceForm.issuerName} ***</div>
                <div className="whitespace-pre-line text-[10px] text-slate-600">{invoiceForm.issuerDetails}</div>
                <div>--------------------------------</div>
              </div>

              {/* Invoice Meta */}
              <div className="space-y-1.5 my-3">
                <div className="flex justify-between py-0.5">
                  <span>DATE: {new Date(invoiceForm.date).toLocaleDateString()}</span>
                  <span>TIME: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="py-0.5">INV NO: {invoiceForm.invoiceNo}</div>
                {invoiceForm.clientName && (
                  <div className="truncate py-0.5">CLIENT: {invoiceForm.clientName}</div>
                )}
                {invoiceForm.clientAddress && (
                  <div className="truncate py-0.5">ADDR: {invoiceForm.clientAddress}</div>
                )}
                <div className="pt-0.5">--------------------------------</div>
              </div>

              {/* Items Table */}
              <table className="w-full text-[10px] my-3 border-collapse text-slate-900 font-mono">
                <thead>
                  <tr className="font-bold border-b border-dashed border-slate-300">
                    <th className="text-left pb-1 font-mono font-bold" style={{ width: '45%' }}>ITEM / UNIT</th>
                    <th className="text-right pb-1 font-mono font-bold" style={{ width: '15%' }}>RATE</th>
                    <th className="text-center pb-1 font-mono font-bold" style={{ width: '10%' }}>QTY</th>
                    <th className="text-right pb-1 font-mono font-bold" style={{ width: '15%' }}>DISC</th>
                    <th className="text-right pb-1 font-mono font-bold" style={{ width: '15%' }}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceForm.items.map((item, idx) => {
                    const subTotal = item.quantity * item.rate;
                    const finalTotal = subTotal - Number(item.discount || 0);
                    return (
                      <tr key={idx} className="border-b border-slate-100/50">
                        <td className="py-1.5 text-left font-semibold font-mono truncate max-w-[120px]">{item.description}</td>
                        <td className="py-1.5 text-right font-mono">{item.rate}</td>
                        <td className="py-1.5 text-center font-mono">{item.quantity}</td>
                        <td className="py-1.5 text-right font-mono text-slate-505">-{item.discount}</td>
                        <td className="py-1.5 text-right font-bold font-mono">{finalTotal}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Totals & Advance */}
              <div className="space-y-1 my-3 font-semibold text-right text-[10px]">
                <div className="flex justify-between">
                  <span>GROSS SUBTOTAL:</span>
                  <span>PKR {invoiceGrossTotal.toFixed(2)}</span>
                </div>
                {itemTotalDiscount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>ITEM DISCOUNTS:</span>
                    <span>-PKR {itemTotalDiscount.toFixed(2)}</span>
                  </div>
                )}
                {percentDiscountAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>TOTAL DISCOUNT ({invoiceForm.discountPercent}%):</span>
                    <span>-PKR {percentDiscountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600 font-bold">
                  <span>COMBINED DISCOUNT:</span>
                  <span>-PKR {invoiceTotalDiscount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-700 font-bold border-t pt-1">
                  <span>NET TOTAL:</span>
                  <span>PKR {invoiceNetTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-indigo-700">
                  <span>ADVANCE RECEIVED:</span>
                  <span>-PKR {displayedAdvance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-700 font-black border-t border-double pt-1 text-[11px]">
                  <span>BALANCE DUE:</span>
                  <span>PKR {invoiceBalancePending.toFixed(2)}</span>
                </div>
              </div>

              {invoiceForm.note && (
                <>
                  <div className="py-1">--------------------------------</div>
                  <div className="text-left whitespace-pre-line text-[10px] text-slate-750 font-mono leading-relaxed py-1">
                    <span className="font-bold text-slate-800">NOTE:</span><br />
                    {invoiceForm.note}
                  </div>
                </>
              )}

              <div className="py-1">--------------------------------</div>

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
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Transaction</DialogTitle>
            <DialogDescription>Add income or expense to automatically post balanced journal entries to ledger.</DialogDescription>
          </DialogHeader>
 
          <form onSubmit={handleAddTransaction} className="space-y-4 text-slate-855 pr-1">
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 border rounded-lg">
              <button
                type="button"
                onClick={() => { setTxType('Income'); setShowCustomCategory(false); }}
                className={`py-1.5 text-xs font-bold rounded-md ${txType === 'Income' ? 'bg-white text-green-650 shadow-sm' : 'text-slate-500'}`}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() => { setTxType('Expense'); setShowCustomCategory(false); }}
                className={`py-1.5 text-xs font-bold rounded-md ${txType === 'Expense' ? 'bg-white text-red-655 shadow-sm' : 'text-slate-500'}`}
              >
                Expense
              </button>
            </div>
 
            {/* Compact Grid Layout for Forms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Amount (PKR)</label>
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
                <div className="flex gap-1.5">
                  {!showCustomCategory ? (
                    <>
                      <select
                        value={txForm.category}
                        onChange={e => setTxForm(prev => ({ ...prev, category: e.target.value }))}
                        className="flex-1 border border-slate-200 bg-white rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-100"
                        required={!showCustomCategory}
                      >
                        <option value="">Select Category</option>
                        {accounts
                          .filter(a => a.type === txType)
                          .map(a => (
                            <option key={a._id} value={a.name}>{a.name}</option>
                          ))
                        }
                      </select>
                      <Button type="button" size="xs" variant="outline" className="h-9 px-2 text-indigo-600 hover:text-indigo-800" onClick={() => setShowCustomCategory(true)}>
                        <Plus size={16} />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Input
                        value={customCategoryName}
                        onChange={e => setCustomCategoryName(e.target.value)}
                        placeholder="New category name"
                        className="flex-1"
                        required={showCustomCategory}
                      />
                      <Button type="button" size="xs" variant="outline" className="h-9 px-2 text-red-600 hover:text-red-800 font-bold" onClick={() => { setShowCustomCategory(false); setCustomCategoryName(''); }}>
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
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
                  className="w-full border border-slate-200 bg-white rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-100"
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
                  <div className="flex gap-1.5">
                    {!showCustomClient ? (
                      <>
                        <select
                          value={txForm.client}
                          onChange={e => setTxForm(prev => ({ ...prev, client: e.target.value }))}
                          className="flex-1 border border-slate-200 bg-white rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-100"
                        >
                          <option value="">None / Other</option>
                          {crmData.clients.map(c => (
                            <option key={c._id} value={c._id}>{c.companyName || c.name}</option>
                          ))}
                        </select>
                        <Button type="button" size="xs" variant="outline" className="h-9 px-2 text-indigo-600 hover:text-indigo-800" onClick={() => setShowCustomClient(true)}>
                          <Plus size={16} />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Input
                          value={customClientName}
                          onChange={e => setCustomClientName(e.target.value)}
                          placeholder="New client company name"
                          className="flex-1"
                          required={showCustomClient}
                        />
                        <Button type="button" size="xs" variant="outline" className="h-9 px-2 text-red-600 hover:text-red-800 font-bold" onClick={() => { setShowCustomClient(false); setCustomClientName(''); }}>
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Vendor Link (CRM)</label>
                  <div className="flex gap-1.5">
                    {!showCustomVendor ? (
                      <>
                        <select
                          value={txForm.vendor}
                          onChange={e => setTxForm(prev => ({ ...prev, vendor: e.target.value }))}
                          className="flex-1 border border-slate-200 bg-white rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-100"
                        >
                          <option value="">None / Other</option>
                          {crmData.vendors.map(v => (
                            <option key={v._id} value={v._id}>{v.name}</option>
                          ))}
                        </select>
                        <Button type="button" size="xs" variant="outline" className="h-9 px-2 text-indigo-600 hover:text-indigo-800" onClick={() => setShowCustomVendor(true)}>
                          <Plus size={16} />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Input
                          value={customVendorName}
                          onChange={e => setCustomVendorName(e.target.value)}
                          placeholder="New vendor name"
                          className="flex-1"
                          required={showCustomVendor}
                        />
                        <Button type="button" size="xs" variant="outline" className="h-9 px-2 text-red-600 hover:text-red-800 font-bold" onClick={() => { setShowCustomVendor(false); setCustomVendorName(''); }}>
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
 
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Project Link (CRM)</label>
                <div className="flex gap-1.5">
                  {!showCustomProject ? (
                    <>
                      <select
                        value={txForm.project}
                        onChange={e => setTxForm(prev => ({ ...prev, project: e.target.value }))}
                        className="flex-1 border border-slate-200 bg-white rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-100"
                      >
                        <option value="">None</option>
                        {crmData.projects.map(p => (
                          <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                      </select>
                      <Button type="button" size="xs" variant="outline" className="h-9 px-2 text-indigo-600 hover:text-indigo-800" onClick={() => setShowCustomProject(true)}>
                        <Plus size={16} />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Input
                        value={customProjectName}
                        onChange={e => setCustomProjectName(e.target.value)}
                        placeholder="New project name"
                        className="flex-1"
                        required={showCustomProject}
                      />
                      <Button type="button" size="xs" variant="outline" className="h-9 px-2 text-red-600 hover:text-red-800 font-bold" onClick={() => { setShowCustomProject(false); setCustomProjectName(''); }}>
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
 
            {txType === 'Expense' && (
              <div className="flex items-center gap-4 text-xs font-semibold py-1.5 bg-slate-50 px-2 rounded border border-slate-200/60">
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
 
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Attachment (Receipt/Proof)</label>
              <Input
                type="file"
                onChange={e => setTxForm(prev => ({ ...prev, attachment: e.target.files[0] }))}
                className="file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100"
              />
            </div>
 
            <DialogFooter className="pt-2">
              <Button type="submit" className="w-full bg-slate-900 text-white font-bold h-10">Record Transaction</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Asset Modal */}
      <Dialog open={isAssetModalOpen} onOpenChange={setIsAssetModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register Capital Asset</DialogTitle>
            <DialogDescription>Track property, furniture, or equipment and compute depreciation.</DialogDescription>
          </DialogHeader>
 
          <form onSubmit={handleAddAsset} className="space-y-4 text-slate-855 pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-1 sm:col-span-2">
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
                  className="w-full border border-slate-200 bg-white rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-100"
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
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Purchase Value (PKR)</label>
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
                className="w-full border border-slate-200 bg-white rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">None / Other</option>
                {crmData.vendors.map(v => (
                  <option key={v._id} value={v._id}>{v.name}</option>
                ))}
              </select>
            </div>
 
            <DialogFooter className="pt-2">
              <Button type="submit" className="w-full bg-slate-900 text-white font-bold h-10">Capitalize Asset</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
 
      {/* Liability Modal */}
      <Dialog open={isLiabilityModalOpen} onOpenChange={setIsLiabilityModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register Liability / Loan</DialogTitle>
            <DialogDescription>Acquire loans or payables and auto-generate installment schedules.</DialogDescription>
          </DialogHeader>
 
          <form onSubmit={handleAddLiability} className="space-y-4 text-slate-855 pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-1 sm:col-span-2">
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
                  className="w-full border border-slate-200 bg-white rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-100"
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
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Principal Amount (PKR)</label>
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
 
            <DialogFooter className="pt-2">
              <Button type="submit" className="w-full bg-slate-900 text-white font-bold h-10">Create Loan</Button>
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
