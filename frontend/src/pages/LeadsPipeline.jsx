import { useEffect, useState, useCallback } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import api from '@/lib/api';
import { Plus, Pencil, Upload, Search, Calendar, CheckSquare, PhoneCall, TrendingUp, Trash2, Check, X, Globe, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { exportTableToPDF } from '../utils/pdfExport';
import { FileDown } from 'lucide-react';

const LeadsPipeline = () => {
    const [leads, setLeads] = useState([]);
    const [stats, setStats] = useState({ totalLeadsCount: 0, contactedCount: 0, commitmentsCount: 0, followUpCount: 0 });
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
    const [limit] = useState(50);
    
    // Helper to get session storage filter or fallback
    const getSessionFilter = (key, defaultValue) => {
        const stored = sessionStorage.getItem(key);
        return stored !== null ? stored : defaultValue;
    };

    // Filters
    const [searchTerm, setSearchTerm] = useState(() => getSessionFilter('lead_filter_search', ''));
    const [filterPriority, setFilterPriority] = useState(() => getSessionFilter('lead_filter_priority', 'all'));
    const [filterStage, setFilterStage] = useState(() => getSessionFilter('lead_filter_stage', 'all'));
    const [filterTemp, setFilterTemp] = useState(() => getSessionFilter('lead_filter_temp', 'all'));
    const [filterContact, setFilterContact] = useState(() => getSessionFilter('lead_filter_contact', 'all'));
    const [period, setPeriod] = useState(() => getSessionFilter('lead_filter_period', 'all'));
    const [cardFilter, setCardFilter] = useState(() => getSessionFilter('lead_filter_card', 'all'));
    const [filterVerifier, setFilterVerifier] = useState(() => getSessionFilter('lead_filter_verifier', 'all'));
    const [filterCloser, setFilterCloser] = useState(() => getSessionFilter('lead_filter_closer', 'all'));
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    const [verifiersList, setVerifiersList] = useState([]);
    const [closersList, setClosersList] = useState([]);

    const [loading, setLoading] = useState(true);
    const [selectedLeads, setSelectedLeads] = useState([]);

    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const { toast } = useToast();

    const isPrivileged = currentUser?.role === 'admin';
    const canView = currentUser?.role === 'admin' || currentUser?.permissions?.can_view_leads;
    const canAdd = currentUser?.role === 'admin' || currentUser?.permissions?.can_add_leads;
    const canEdit = currentUser?.role === 'admin' || currentUser?.permissions?.can_edit_leads;
    const canBulkManage = currentUser?.role === 'admin' || currentUser?.permissions?.can_bulk_manage_leads;

    // Sync state changes with Session Storage
    useEffect(() => {
        sessionStorage.setItem('lead_filter_search', searchTerm);
    }, [searchTerm]);
    useEffect(() => {
        sessionStorage.setItem('lead_filter_priority', filterPriority);
    }, [filterPriority]);
    useEffect(() => {
        sessionStorage.setItem('lead_filter_stage', filterStage);
    }, [filterStage]);
    useEffect(() => {
        sessionStorage.setItem('lead_filter_temp', filterTemp);
    }, [filterTemp]);
    useEffect(() => {
        sessionStorage.setItem('lead_filter_contact', filterContact);
    }, [filterContact]);
    useEffect(() => {
        sessionStorage.setItem('lead_filter_period', period);
    }, [period]);
    useEffect(() => {
        sessionStorage.setItem('lead_filter_card', cardFilter);
    }, [cardFilter]);
    useEffect(() => {
        sessionStorage.setItem('lead_filter_verifier', filterVerifier);
    }, [filterVerifier]);
    useEffect(() => {
        sessionStorage.setItem('lead_filter_closer', filterCloser);
    }, [filterCloser]);

    // Fetch team members list for verifiers & closers dropdowns
    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const res = await api.get('/team');
                if (res.success) {
                    const allUsers = res.data;
                    setVerifiersList(allUsers.filter(u => Array.isArray(u.designation) && u.designation.includes('LeadVerifier')));
                    setClosersList(allUsers.filter(u => Array.isArray(u.designation) && u.designation.includes('LeadCloser')));
                }
            } catch (err) {
                console.error("Failed to fetch team members", err);
            }
        };
        fetchTeam();
    }, []);

    const handleLockVerifier = async (leadId) => {
        try {
            const res = await api.put(`/leads/${leadId}/lock-verifier`);
            if (res.success) {
                toast({ title: "Locked", description: "Lead verifier lock claimed." });
                setLeads(prev => prev.map(l => l._id === leadId ? res.data : l));
            }
        } catch (err) {
            const errorMsg = typeof err === 'string' ? err : (err.error || err.message || "Could not lock lead.");
            toast({ variant: "destructive", title: "Lock Failed", description: errorMsg });
        }
    };

    const handleUnlockVerifier = async (leadId) => {
        try {
            const res = await api.put(`/leads/${leadId}/unlock-verifier`);
            if (res.success) {
                toast({ title: "Unlocked", description: "Lead verifier lock released." });
                setLeads(prev => prev.map(l => l._id === leadId ? res.data : l));
            }
        } catch (err) {
            const errorMsg = typeof err === 'string' ? err : (err.error || err.message || "Could not unlock lead.");
            toast({ variant: "destructive", title: "Unlock Failed", description: errorMsg });
        }
    };

    const handleLockCloser = async (leadId) => {
        try {
            const res = await api.put(`/leads/${leadId}/lock-closer`);
            if (res.success) {
                toast({ title: "Locked", description: "Lead closer lock claimed." });
                setLeads(prev => prev.map(l => l._id === leadId ? res.data : l));
            }
        } catch (err) {
            const errorMsg = typeof err === 'string' ? err : (err.error || err.message || "Could not lock lead.");
            toast({ variant: "destructive", title: "Lock Failed", description: errorMsg });
        }
    };

    const handleUnlockCloser = async (leadId) => {
        try {
            const res = await api.put(`/leads/${leadId}/unlock-closer`);
            if (res.success) {
                toast({ title: "Unlocked", description: "Lead closer lock released." });
                setLeads(prev => prev.map(l => l._id === leadId ? res.data : l));
            }
        } catch (err) {
            const errorMsg = typeof err === 'string' ? err : (err.error || err.message || "Could not unlock lead.");
            toast({ variant: "destructive", title: "Unlock Failed", description: errorMsg });
        }
    };

    const handleClearAllFilters = () => {
        setSearchTerm('');
        setFilterPriority('all');
        setFilterStage('all');
        setFilterTemp('all');
        setFilterContact('all');
        setPeriod('all');
        setCardFilter('all');
        setFilterVerifier('all');
        setFilterCloser('all');
        sessionStorage.removeItem('lead_filter_search');
        sessionStorage.removeItem('lead_filter_priority');
        sessionStorage.removeItem('lead_filter_stage');
        sessionStorage.removeItem('lead_filter_temp');
        sessionStorage.removeItem('lead_filter_contact');
        sessionStorage.removeItem('lead_filter_period');
        sessionStorage.removeItem('lead_filter_card');
        sessionStorage.removeItem('lead_filter_verifier');
        sessionStorage.removeItem('lead_filter_closer');
        setPagination(p => ({ ...p, page: 1 }));
    };

    const isLeadLockedForUser = (lead) => {
        if (currentUser?.role === 'admin') return false;
        
        const isVerifier = Array.isArray(currentUser?.designation) && currentUser.designation.includes('LeadVerifier');
        const isCloser = Array.isArray(currentUser?.designation) && currentUser.designation.includes('LeadCloser');
        const myId = currentUser?._id?.toString();

        if (isVerifier && lead.workingVerifier && lead.workingVerifier._id?.toString() !== myId) {
            return true;
        }
        if (isCloser && lead.workingCloser && lead.workingCloser._id?.toString() !== myId) {
            return true;
        }
        return false;
    };

    const getRowBgClass = (lead) => {
        if (!canView) return "blur-sm select-none";
        
        const isVerifier = Array.isArray(currentUser?.designation) && currentUser.designation.includes('LeadVerifier');
        const isCloser = Array.isArray(currentUser?.designation) && currentUser.designation.includes('LeadCloser');
        const myId = currentUser?._id?.toString();
        
        const isVerifierMine = lead.workingVerifier?._id?.toString() === myId;
        const isCloserMine = lead.workingCloser?._id?.toString() === myId;
        
        // Locked by someone else of the same role -> Disabled / Muted look
        const lockedByOtherVerifier = lead.workingVerifier && lead.workingVerifier._id?.toString() !== myId;
        const lockedByOtherCloser = lead.workingCloser && lead.workingCloser._id?.toString() !== myId;
        
        if (currentUser?.role !== 'admin' && ((isVerifier && lockedByOtherVerifier) || (isCloser && lockedByOtherCloser))) {
            return "bg-slate-100/60 text-slate-400 hover:bg-slate-100/60 cursor-not-allowed select-none transition-colors";
        }

        // Own active claim (highest priority highlight)
        if (isVerifierMine || isCloserMine) {
            return "bg-emerald-100/90 hover:bg-emerald-200/95 text-emerald-950 transition-colors border-l-4 border-emerald-600 font-medium";
        }
        
        // Claimed by both Verifier and Closer
        if (lead.workingVerifier && lead.workingCloser) {
            return "bg-teal-100/80 hover:bg-teal-200/80 text-teal-950 transition-colors border-l-4 border-teal-500 font-medium";
        }

        // Claimed by Verifier only
        if (lead.workingVerifier) {
            return "bg-amber-100/80 hover:bg-amber-200/80 text-amber-950 transition-colors border-l-4 border-amber-500 font-medium";
        }

        // Claimed by Closer only
        if (lead.workingCloser) {
            return "bg-indigo-100/80 hover:bg-indigo-200/80 text-indigo-950 transition-colors border-l-4 border-indigo-500 font-medium";
        }
        
        return "hover:bg-slate-50 transition-colors";
    };

    const handleRowClick = (lead) => {
        if (!canView) return;
        
        const isVerifier = Array.isArray(currentUser?.designation) && currentUser.designation.includes('LeadVerifier');
        const isCloser = Array.isArray(currentUser?.designation) && currentUser.designation.includes('LeadCloser');
        const myId = currentUser?._id?.toString();
        
        if (currentUser?.role !== 'admin') {
            if (isVerifier && lead.workingVerifier && lead.workingVerifier._id?.toString() !== myId) {
                toast({ 
                    variant: "destructive", 
                    title: "Lead Locked", 
                    description: `This lead is currently locked. Lead Verifier "${lead.workingVerifier.name}" is working on it.` 
                });
                return;
            }
            if (isCloser && lead.workingCloser && lead.workingCloser._id?.toString() !== myId) {
                toast({ 
                    variant: "destructive", 
                    title: "Lead Locked", 
                    description: `This lead is currently locked. Lead Closer "${lead.workingCloser.name}" is working on it.` 
                });
                return;
            }
        }
        
        navigate(`/leads/details/${lead._id}`);
    };

    const handleExportPDF = () => {
        const headers = ["Lead Name", "Business Name", "Phone", "Email", "Stage", "Priority", "Temp"];
        const rows = leads.map(l => [
            l.contactName || 'N/A',
            l.companyName || 'N/A',
            l.phone || 'N/A',
            l.email || 'N/A',
            l.stage || 'N/A',
            l.priority || 'N/A',
            l.temperature || 'N/A'
        ]);
        exportTableToPDF("Leads Pipeline Registry", headers, rows, `Leads_Export_${Date.now()}.pdf`);
    };

    const fetchLeads = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page,
                limit,
                search: searchTerm,
                period,
                cardFilter,
                priority: filterPriority,
                stage: filterStage,
                temp: filterTemp,
                contact: filterContact,
                workingVerifier: filterVerifier,
                workingCloser: filterCloser
            });
            const res = await api.get(`/leads?${params.toString()}`);
            if (res.success) {
                setLeads(res.data);
                if (res.stats) setStats(res.stats);
                if (res.pagination) setPagination(res.pagination);
                setSelectedLeads([]); // clear selection on fetch
            }
        } catch (err) {
            console.error("Failed to fetch leads", err);
            toast({ variant: "destructive", title: "Error", description: "Failed to load leads." });
        } finally {
            setLoading(false);
        }
    }, [pagination.page, limit, searchTerm, period, cardFilter, filterPriority, filterStage, filterTemp, filterContact, filterVerifier, filterCloser]);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    // Handle filter change (reset to page 1)
    useEffect(() => {
        setPagination(p => ({ ...p, page: 1 }));
    }, [searchTerm, period, cardFilter, filterPriority, filterStage, filterTemp, filterContact, filterVerifier, filterCloser]);

    const getTempColor = (temp) => {
        const colors = {
            cold: "bg-blue-100 text-blue-700",
            warm: "bg-orange-100 text-orange-700",
            sql: "bg-emerald-100 text-emerald-700",
            closed: "bg-slate-100 text-slate-700"
        };
        return colors[temp] || "bg-slate-100 text-slate-700";
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedLeads(leads.map(l => l._id));
        } else {
            setSelectedLeads([]);
        }
    };

    const handleSelectLead = (id, checked) => {
        if (checked) {
            setSelectedLeads(prev => [...prev, id]);
        } else {
            setSelectedLeads(prev => prev.filter(leadId => leadId !== id));
        }
    };

    const executeBulkAction = async (action, payload = {}) => {
        if (!canBulkManage) {
            toast({ variant: "destructive", title: "Access Denied", description: "You don't have permission to perform bulk actions." });
            return;
        }

        if (action === 'delete') {
            const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedLeads.length} selected lead(s)? This action CANNOT be undone.`);
            if (!confirmDelete) return;
        }

        try {
            const res = await api.post('/leads/bulk-action', {
                leadIds: selectedLeads,
                action,
                payload
            });
            if (res.success) {
                toast({ title: "Success", description: res.message });
                fetchLeads();
            }
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: "Failed to execute bulk action." });
        }
    };

    const promptBulkAction = (actionType) => {
        let value = null;
        if (actionType === 'updateStage') {
            value = window.prompt("Enter new stage (identify, qualify, nurture, close, onboard, retain, refer):");
            if (value) executeBulkAction(actionType, { stage: value.toLowerCase() });
        } else if (actionType === 'updateTemperature') {
            value = window.prompt("Enter new temperature (cold, warm, sql, closed):");
            if (value) executeBulkAction(actionType, { temperature: value.toLowerCase() });
        } else if (actionType === 'updatePriority') {
            value = window.prompt("Enter new priority (low, medium, high, urgent):");
            if (value) executeBulkAction(actionType, { priority: value.toLowerCase() });
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Period Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-lg border shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Leads Pipeline Overview</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase">Analyze and action your prospects</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase shrink-0">Show Stats For:</span>
                    <Select value={period} onValueChange={(v) => { setPeriod(v); setCardFilter('all'); }}>
                        <SelectTrigger className="w-[140px] h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="today">Today Only</SelectItem>
                            <SelectItem value="week">Past 7 Days</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                            <SelectItem value="year">This Year</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Stats Dashboard Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card 
                    onClick={() => setCardFilter('all')} 
                    className={`cursor-pointer bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-sm hover:shadow transition-all ${cardFilter === 'all' ? 'ring-2 ring-blue-500 border-transparent shadow' : ''}`}
                >
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Total Leads</p>
                            <h3 className="text-2xl font-black text-blue-900 mt-1">{stats.totalLeadsCount}</h3>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-full text-blue-600">
                            <TrendingUp size={20} />
                        </div>
                    </CardContent>
                </Card>

                <Card 
                    onClick={() => setCardFilter('contacted')} 
                    className={`cursor-pointer bg-gradient-to-br from-amber-50 to-white border-amber-100 shadow-sm hover:shadow transition-all ${cardFilter === 'contacted' ? 'ring-2 ring-amber-500 border-transparent shadow' : ''}`}
                >
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Contacted In Period</p>
                            <h3 className="text-2xl font-black text-amber-950 mt-1">{stats.contactedCount}</h3>
                        </div>
                        <div className="p-3 bg-amber-500/10 rounded-full text-amber-600">
                            <PhoneCall size={20} />
                        </div>
                    </CardContent>
                </Card>

                <Card 
                    onClick={() => setCardFilter('commitments')} 
                    className={`cursor-pointer bg-gradient-to-br from-emerald-50 to-white border-emerald-100 shadow-sm hover:shadow transition-all ${cardFilter === 'commitments' ? 'ring-2 ring-emerald-500 border-transparent shadow' : ''}`}
                >
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Commitments (SQLs)</p>
                            <h3 className="text-2xl font-black text-emerald-950 mt-1">{stats.commitmentsCount}</h3>
                        </div>
                        <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-600">
                            <CheckSquare size={20} />
                        </div>
                    </CardContent>
                </Card>

                <Card 
                    onClick={() => setCardFilter('followup')} 
                    className={`cursor-pointer bg-gradient-to-br from-purple-50 to-white border-purple-100 shadow-sm hover:shadow transition-all ${cardFilter === 'followup' ? 'ring-2 ring-purple-500 border-transparent shadow' : ''}`}
                >
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Scheduled Follow-ups</p>
                            <h3 className="text-2xl font-black text-purple-950 mt-1">{stats.followUpCount}</h3>
                        </div>
                        <div className="p-3 bg-purple-500/10 rounded-full text-purple-600">
                            <Calendar size={20} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {cardFilter !== 'all' && (
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-lg text-xs text-slate-700">
                    <span>
                        Filtering pipeline to show: <strong className="uppercase font-extrabold text-blue-700">{cardFilter === 'contacted' ? 'Contacted in period' : cardFilter === 'commitments' ? 'Commitments' : 'Scheduled Follow-ups'}</strong>
                    </span>
                    <button className="h-7 px-3 text-[10px] font-black uppercase tracking-tight bg-slate-200 hover:bg-slate-300 text-slate-700 rounded transition-colors" onClick={() => setCardFilter('all')}>
                        Clear Card Filter
                    </button>
                </div>
            )}

            {/* Filter controls panel */}
            <div className="p-4 bg-white rounded-lg border shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-[480px]">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <Input
                                className="pl-10 h-10 w-full"
                                placeholder="Search leads, contacts, emails or phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button 
                            variant="outline" 
                            className="h-10 gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 relative font-semibold shrink-0"
                            onClick={() => setIsFiltersOpen(true)}
                        >
                            <SlidersHorizontal size={15} />
                            Filter & Sort
                            {(filterPriority !== 'all' || filterStage !== 'all' || filterTemp !== 'all' || filterContact !== 'all' || filterVerifier !== 'all' || filterCloser !== 'all') && (
                                <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-sm animate-pulse">
                                    !
                                </span>
                            )}
                        </Button>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto items-center justify-end">
                        {currentUser?.role === 'admin' && (
                            <Button variant="outline" size="sm" className="gap-2 border-red-200 text-red-700 hover:bg-red-50" onClick={handleExportPDF}>
                                <FileDown size={14} /> Export to PDF
                            </Button>
                        )}
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/import/leads')}>
                            <Upload size={14} /> Import CSV
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => window.open('https://www.google.com/maps', '_blank')}>
                            <Globe size={14} /> Find New Lead
                        </Button>
                        <Button 
                            size="sm" 
                            className="gap-2 bg-blue-600 hover:bg-blue-700" 
                            onClick={() => navigate('/leads/new')}
                            disabled={!canAdd}
                            title={!canAdd ? "You do not have permission to add leads." : ""}
                        >
                            <Plus size={14} /> New Lead
                        </Button>
                    </div>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedLeads.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-900">
                        <Badge variant="secondary" className="bg-blue-200 text-blue-900 hover:bg-blue-300">
                            {selectedLeads.length} Selected
                        </Badge>
                        <span>Apply bulk actions:</span>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="bg-white" onClick={() => promptBulkAction('updateStage')} disabled={!canBulkManage}>
                            Change Stage
                        </Button>
                        <Button size="sm" variant="outline" className="bg-white" onClick={() => promptBulkAction('updateTemperature')} disabled={!canBulkManage}>
                            Change Temp
                        </Button>
                        <Button size="sm" variant="outline" className="bg-white" onClick={() => promptBulkAction('updatePriority')} disabled={!canBulkManage}>
                            Change Priority
                        </Button>
                        <Button size="sm" variant="destructive" className="gap-2" onClick={() => executeBulkAction('delete')} disabled={!canBulkManage}>
                            <Trash2 size={14} /> Delete
                        </Button>
                    </div>
                </div>
            )}

            {/* Color Legend / Indicators */}
            <div className="flex flex-wrap items-center gap-4 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 shadow-sm">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Claims Legend:</span>
                <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-emerald-200 border border-emerald-400 block shrink-0" />
                    <span>My Active Claim</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-amber-200 border border-amber-400 block shrink-0" />
                    <span>Claimed by Verifier</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-indigo-200 border border-indigo-400 block shrink-0" />
                    <span>Claimed by Closer</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-teal-200 border border-teal-400 block shrink-0" />
                    <span>Claimed by Both</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-300 block shrink-0 opacity-60" />
                    <span className="opacity-75">Locked for Me</span>
                </div>
            </div>

            <div className="rounded-md border bg-white overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12 text-center">
                                <input 
                                    type="checkbox"
                                    checked={leads.length > 0 && selectedLeads.length === leads.length}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                                />
                            </TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Industry</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Temp</TableHead>
                            <TableHead>Stage</TableHead>
                            <TableHead>Work Claim</TableHead>
                            {isPrivileged && <TableHead>Researcher</TableHead>}
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && leads.length === 0 ? (
                            <TableRow><TableCell colSpan={11} className="text-center py-8">Loading...</TableCell></TableRow>
                        ) : leads.map((lead) => (
                            <TableRow key={lead._id} className={getRowBgClass(lead)}>
                                <TableCell className="text-center">
                                    <input 
                                        type="checkbox"
                                        checked={selectedLeads.includes(lead._id)}
                                        onChange={(e) => handleSelectLead(lead._id, e.target.checked)}
                                        className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                                    />
                                </TableCell>
                                <TableCell className={`font-medium ${canView ? 'cursor-pointer hover:text-blue-600' : ''}`} onClick={() => handleRowClick(lead)}>
                                    <div className="flex flex-col">
                                        <span>{lead.companyName}</span>
                                        <span className="text-[10px] text-slate-400 capitalize">{lead.source?.replace('_', ' ')}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        <div>{lead.contactName || 'N/A'}</div>
                                        <div className="text-slate-500 text-xs">{lead.phone}</div>
                                    </div>
                                </TableCell>
                                <TableCell className="capitalize text-xs">{lead.industry || lead.businessType}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={`capitalize text-[10px] ${lead.priority === 'urgent' ? 'border-red-500 text-red-600 bg-red-50' :
                                        lead.priority === 'high' ? 'border-orange-500 text-orange-600 bg-orange-50' : ''
                                        }`}>
                                        {lead.priority || 'medium'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className={getTempColor(lead.temperature)}>
                                        {lead.temperature?.toUpperCase()}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="capitalize text-xs">{lead.stage}</Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        {/* Verifier Lock Button */}
                                        {(currentUser?.role === 'admin' || (Array.isArray(currentUser?.designation) && currentUser.designation.includes('LeadVerifier'))) && (
                                            lead.workingVerifier ? (
                                                lead.workingVerifier._id === currentUser?._id ? (
                                                    <Button 
                                                        size="xs" 
                                                        className="h-6 text-[9px] px-2 font-bold uppercase tracking-tight bg-emerald-600 hover:bg-emerald-700 text-white" 
                                                        onClick={() => handleUnlockVerifier(lead._id)}
                                                    >
                                                        Verifier: Mine (Unlock)
                                                    </Button>
                                                ) : (
                                                    <Button 
                                                        size="xs" 
                                                        disabled 
                                                        className="h-6 text-[9px] px-2 font-semibold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed select-none"
                                                        title={`Locked by ${lead.workingVerifier.name}`}
                                                    >
                                                        Verifier: {lead.workingVerifier.name}
                                                    </Button>
                                                )
                                            ) : (
                                                <Button 
                                                    size="xs" 
                                                    variant="outline" 
                                                    className="h-6 text-[9px] px-2 font-semibold border-slate-200 text-slate-600 hover:bg-slate-50"
                                                    onClick={() => handleLockVerifier(lead._id)}
                                                >
                                                    Claim Verifier
                                                </Button>
                                            )
                                        )}

                                        {/* Closer Lock Button */}
                                        {(currentUser?.role === 'admin' || (Array.isArray(currentUser?.designation) && currentUser.designation.includes('LeadCloser'))) && (
                                            lead.workingCloser ? (
                                                lead.workingCloser._id === currentUser?._id ? (
                                                    <Button 
                                                        size="xs" 
                                                        className="h-6 text-[9px] px-2 font-bold uppercase tracking-tight bg-blue-600 hover:bg-blue-700 text-white" 
                                                        onClick={() => handleUnlockCloser(lead._id)}
                                                    >
                                                        Closer: Mine (Unlock)
                                                    </Button>
                                                ) : (
                                                    <Button 
                                                        size="xs" 
                                                        disabled 
                                                        className="h-6 text-[9px] px-2 font-semibold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed select-none"
                                                        title={`Locked by ${lead.workingCloser.name}`}
                                                    >
                                                        Closer: {lead.workingCloser.name}
                                                    </Button>
                                                )
                                            ) : (
                                                !lead.isVerifiedByVerifier ? (
                                                    <Button 
                                                        size="xs" 
                                                        disabled
                                                        className="h-6 text-[9px] px-2 font-semibold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed select-none"
                                                        title="Please wait for a Verifier to mark this lead as verified first."
                                                    >
                                                        Claim Closer
                                                    </Button>
                                                ) : (
                                                    <Button 
                                                        size="xs" 
                                                        variant="outline" 
                                                        className="h-6 text-[9px] px-2 font-semibold border-slate-200 text-slate-600 hover:bg-slate-50"
                                                        onClick={() => handleLockCloser(lead._id)}
                                                    >
                                                        Claim Closer
                                                    </Button>
                                                )
                                            )
                                        )}
                                    </div>
                                </TableCell>
                                {isPrivileged && (
                                    <TableCell className="text-xs font-bold text-slate-600">
                                        {lead.submittedBy?.name || 'Unknown'}
                                    </TableCell>
                                )}
                                <TableCell className="text-right">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => navigate(`/leads/edit/${lead._id}`)}
                                        disabled={!canEdit || isLeadLockedForUser(lead)}
                                        title={!canEdit ? "You do not have permission to edit leads." : isLeadLockedForUser(lead) ? "This lead is locked by another team member." : ""}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                
                {/* Pagination Controls */}
                <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50">
                    <div className="text-sm text-slate-500">
                        Showing {leads.length > 0 ? (pagination.page - 1) * limit + 1 : 0} to {Math.min(pagination.page * limit, pagination.total)} of {pagination.total} entries
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={pagination.page <= 1}
                            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                        >
                            Previous
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={pagination.page >= pagination.pages}
                            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>

            <Dialog open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2">
                            <SlidersHorizontal className="h-5 w-5 text-slate-600" />
                            Filter & Sort Leads
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</label>
                            <Select value={filterPriority} onValueChange={setFilterPriority}>
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Priorities</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stage</label>
                            <Select value={filterStage} onValueChange={setFilterStage}>
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Stage" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Stages</SelectItem>
                                    <SelectItem value="identify">Identify</SelectItem>
                                    <SelectItem value="qualify">Qualify</SelectItem>
                                    <SelectItem value="nurture">Nurture</SelectItem>
                                    <SelectItem value="close">Close (Commitment)</SelectItem>
                                    <SelectItem value="onboard">Onboard</SelectItem>
                                    <SelectItem value="retain">Retain</SelectItem>
                                    <SelectItem value="refer">Refer</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Temperature</label>
                            <Select value={filterTemp} onValueChange={setFilterTemp}>
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Temperature" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Temperatures</SelectItem>
                                    <SelectItem value="cold">Cold</SelectItem>
                                    <SelectItem value="warm">Warm</SelectItem>
                                    <SelectItem value="sql">SQL</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Activity / Contact</label>
                            <Select value={filterContact} onValueChange={setFilterContact}>
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Activity / Contact" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Activities</SelectItem>
                                    <SelectItem value="contacted_today">Contacted Today</SelectItem>
                                    <SelectItem value="needs_followup">Needs Follow-up</SelectItem>
                                    <SelectItem value="commitments">Has Commitments</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verifier</label>
                            <Select value={filterVerifier} onValueChange={setFilterVerifier}>
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Verifier" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Verifiers</SelectItem>
                                    <SelectItem value="unassigned">Unassigned Only</SelectItem>
                                    {verifiersList.map(v => (
                                        <SelectItem key={v._id} value={v._id}>{v.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Closer</label>
                            <Select value={filterCloser} onValueChange={setFilterCloser}>
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Closer" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Closers</SelectItem>
                                    <SelectItem value="unassigned">Unassigned Only</SelectItem>
                                    {closersList.map(c => (
                                        <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="flex justify-between items-center sm:justify-between w-full border-t pt-4">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold uppercase tracking-wider"
                            onClick={() => {
                                handleClearAllFilters();
                                setIsFiltersOpen(false);
                            }}
                        >
                            Reset All
                        </Button>
                        <Button 
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                            onClick={() => setIsFiltersOpen(false)}
                        >
                            Apply Filters
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default LeadsPipeline;
