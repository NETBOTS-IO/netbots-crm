import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
    Clock, 
    Search, 
    User, 
    ArrowRight, 
    Calendar,
    AlertTriangle,
    CheckCircle2,
    SlidersHorizontal,
    Phone,
    Mail,
    Building2,
    Sparkles,
    Hourglass,
    FileDown,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { exportTableToPDF } from '../utils/pdfExport';

const Followups = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [tempFilter, setTempFilter] = useState('all');
    
    // Pagination & Sorting States
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortBy, setSortBy] = useState('soonest');

    // Dialog states for outcomes
    const [actionDialogOpen, setActionDialogOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [actionType, setActionType] = useState('spoke');
    const [actionNotes, setActionNotes] = useState('');
    const [nextFollowUpDate, setNextFollowUpDate] = useState('');
    const [actionSubmitting, setActionSubmitting] = useState(false);

    const openActionDialog = (lead) => {
        setSelectedLead(lead);
        setActionType('spoke');
        setActionNotes('');
        setNextFollowUpDate('');
        setActionDialogOpen(true);
    };

    const handleActionSubmit = async () => {
        if (!selectedLead) return;
        if (actionType === 'postpone' && !nextFollowUpDate) {
            alert('Please select a date and time for the next follow-up.');
            return;
        }

        setActionSubmitting(true);
        try {
            const res = await api.post(`/leads/${selectedLead._id}/followup-action`, {
                action: actionType,
                notes: actionNotes,
                nextFollowUpDate: actionType === 'postpone' ? nextFollowUpDate : undefined
            });

            if (res.success) {
                setActionDialogOpen(false);
                fetchFollowups(); // Refresh data
            } else {
                alert(res.error || 'Failed to process action');
            }
        } catch (err) {
            console.error("Action error:", err);
            alert('Connection failed');
        } finally {
            setActionSubmitting(false);
        }
    };

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        overdue: 0,
        dueSoon: 0, 
        unclaimed: 0
    });

    const fetchFollowups = async () => {
        setLoading(true);
        try {
            const params = {};
            if (priorityFilter !== 'all') params.priority = priorityFilter;
            if (tempFilter !== 'all') params.temp = tempFilter;
            if (search.trim()) params.search = search.trim();

            const res = await api.get('/leads/followups', { params });
            if (res.success) {
                setLeads(res.data);
                calculateStats(res.data);
                setCurrentPage(1); // reset to page 1 on fresh load
            }
        } catch (err) {
            console.error("Failed to fetch follow-ups:", err);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const now = new Date();
        let overdue = 0;
        let dueSoon = 0;
        let unclaimed = 0;

        data.forEach(lead => {
            const target = new Date(lead.followUpDate);
            const diffMs = target - now;
            if (diffMs < 0) {
                overdue++;
            } else if (diffMs <= 24 * 60 * 60 * 1000) {
                dueSoon++;
            }
            if (!lead.workingCloser && !lead.assignedCloser) {
                unclaimed++;
            }
        });

        setStats({
            total: data.length,
            overdue,
            dueSoon,
            unclaimed
        });
    };

    useEffect(() => {
        fetchFollowups();
    }, [priorityFilter, tempFilter]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchFollowups();
    };

    const getRemainingTime = (dateStr) => {
        if (!dateStr) return { text: 'Not set', isOverdue: false, severity: 'none' };
        
        const now = new Date();
        const target = new Date(dateStr);
        const diffMs = target - now;
        const isOverdue = diffMs < 0;
        const absDiff = Math.abs(diffMs);

        const totalHours = Math.floor(absDiff / (1000 * 60 * 60));
        const totalDays = Math.floor(totalHours / 24);
        const remainingHours = totalHours % 24;

        const years = Math.floor(totalDays / 365);
        const remainingDaysAfterYears = totalDays % 365;
        const weeks = Math.floor(remainingDaysAfterYears / 7);
        const days = remainingDaysAfterYears % 7;

        let parts = [];
        if (years > 0) parts.push(`${years}y`);
        if (weeks > 0) parts.push(`${weeks}w`);
        if (days > 0) parts.push(`${days}d`);
        if (remainingHours > 0 || parts.length === 0) parts.push(`${remainingHours}h`);

        const text = parts.join(' ');
        
        let severity = 'info';
        if (isOverdue) {
            severity = 'danger';
        } else {
            if (totalHours <= 2) severity = 'urgent';
            else if (totalHours <= 24) severity = 'warning';
        }

        return { text: isOverdue ? `${text} Ago` : text, isOverdue, severity };
    };

    const getPriorityWeight = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'urgent': return 4;
            case 'high': return 3;
            case 'medium': return 2;
            case 'low': return 1;
            default: return 0;
        }
    };

    const getTempWeight = (temp) => {
        switch (temp?.toLowerCase()) {
            case 'sql': return 3;
            case 'warm': return 2;
            case 'cold': return 1;
            default: return 0;
        }
    };

    // Sort leads based on current sorting selection
    const getSortedLeads = () => {
        const leadsCopy = [...leads];
        return leadsCopy.sort((a, b) => {
            if (sortBy === 'soonest') {
                return new Date(a.followUpDate) - new Date(b.followUpDate);
            }
            if (sortBy === 'furthest') {
                return new Date(b.followUpDate) - new Date(a.followUpDate);
            }
            if (sortBy === 'highest-priority') {
                return getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
            }
            if (sortBy === 'lowest-priority') {
                return getPriorityWeight(a.priority) - getPriorityWeight(b.priority);
            }
            if (sortBy === 'sql-first') {
                return getTempWeight(b.temperature) - getTempWeight(a.temperature);
            }
            return 0;
        });
    };

    const sortedLeads = getSortedLeads();

    // Paginate sorted leads
    const totalPages = Math.ceil(sortedLeads.length / pageSize);
    const indexOfLastLead = currentPage * pageSize;
    const indexOfFirstLead = indexOfLastLead - pageSize;
    const currentLeads = sortedLeads.slice(indexOfFirstLead, indexOfLastLead);

    const getPriorityStyle = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'urgent': return 'border-red-500 text-red-600 bg-red-50/50';
            case 'high': return 'border-amber-500 text-amber-600 bg-amber-50/50';
            case 'medium': return 'border-slate-300 text-slate-650 bg-slate-50/50';
            case 'low': return 'border-slate-200 text-slate-500 bg-slate-50/50';
            default: return 'border-slate-200 text-slate-500 bg-slate-50/50';
        }
    };

    const getTempStyle = (temp) => {
        switch (temp?.toLowerCase()) {
            case 'sql': return 'border-slate-950 bg-slate-950 text-white';
            case 'warm': return 'border-slate-300 text-slate-800 bg-slate-50/50';
            case 'cold': return 'border-slate-200 text-slate-400 bg-slate-50/20';
            default: return 'border-slate-200 text-slate-500 bg-slate-50/50';
        }
    };

    const getRemainingTimeStyle = (severity) => {
        switch (severity) {
            case 'danger': return 'bg-red-50 text-red-650 border-red-200 font-semibold';
            case 'urgent': return 'bg-rose-50 text-rose-650 border-rose-200 font-semibold';
            case 'warning': return 'bg-amber-50 text-amber-650 border-amber-200 font-medium';
            default: return 'bg-slate-50 text-slate-600 border-slate-200 font-medium';
        }
    };

    // PDF Export Logic
    const handleExportPDF = () => {
        const headers = ["Company", "Contact Person", "Phone/Email", "Follow-up Date/Time", "Remaining Time", "Priority", "Temp", "Claimed Closer"];
        const rows = sortedLeads.map(lead => {
            const timeInfo = getRemainingTime(lead.followUpDate);
            const closerName = lead.workingCloser?.name || lead.assignedCloser?.name || 'Unclaimed';
            return [
                lead.companyName || 'N/A',
                lead.contactName || 'N/A',
                `${lead.phone || ''} / ${lead.email || ''}`,
                lead.followUpDate ? new Date(lead.followUpDate).toLocaleString() : 'N/A',
                timeInfo.text,
                (lead.priority || 'medium').toUpperCase(),
                (lead.temperature || 'cold').toUpperCase(),
                closerName
            ];
        });
        exportTableToPDF("Scheduled Follow-ups Report", headers, rows, `Followups_Report_${Date.now()}.pdf`);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-1">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-slate-900">
                <div className="space-y-0.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-semibold border border-slate-200">
                        <Sparkles size={10} />
                        Smart Follow-up System
                    </div>
                    <h2 className="text-xl font-semibold tracking-tight text-slate-900 mt-1">
                        Lead Follow-Up Engine
                    </h2>
                    <p className="text-slate-500 text-xs">
                        Act on deadlines. Highlighted rows and colors segment priority levels and time remaining.
                    </p>
                </div>

                {/* PDF Export Action */}
                <Button 
                    onClick={handleExportPDF} 
                    className="bg-slate-950 hover:bg-slate-900 text-white text-xs h-9 px-4 rounded gap-2 shadow-sm"
                >
                    <FileDown size={14} />
                    Export to PDF
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4">
                <Card className="border border-slate-200 bg-white hover:border-slate-300 transition-all duration-200">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Due</span>
                            <h3 className="text-2xl font-semibold text-slate-900">{stats.total}</h3>
                        </div>
                        <Calendar size={16} className="text-slate-400" />
                    </CardContent>
                </Card>

                <Card className="border border-slate-200 bg-white hover:border-slate-300 transition-all duration-200">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                Overdue
                            </span>
                            <h3 className="text-2xl font-semibold text-slate-900">{stats.overdue}</h3>
                        </div>
                        <AlertTriangle size={16} className="text-slate-400" />
                    </CardContent>
                </Card>

                <Card className="border border-slate-200 bg-white hover:border-slate-300 transition-all duration-200">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Due in 24h</span>
                            <h3 className="text-2xl font-semibold text-slate-900">{stats.dueSoon}</h3>
                        </div>
                        <Hourglass size={16} className="text-slate-400" />
                    </CardContent>
                </Card>

                <Card className="border border-slate-200 bg-white hover:border-slate-300 transition-all duration-200">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Unclaimed</span>
                            <h3 className="text-2xl font-semibold text-slate-900">{stats.unclaimed}</h3>
                        </div>
                        <User size={16} className="text-slate-400" />
                    </CardContent>
                </Card>
            </div>

            {/* Filters & Sorting Panel */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
                <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:max-w-xs">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <Input
                            placeholder="Search lead..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 h-9 text-xs w-full bg-white border-slate-200 focus:bg-white"
                        />
                    </div>
                    <Button type="submit" className="h-9 bg-slate-950 hover:bg-slate-900 text-xs text-white px-3">
                        Search
                    </Button>
                </form>

                <div className="flex flex-wrap md:flex-nowrap gap-2 w-full md:w-auto">
                    {/* Sort Filter Dropdown */}
                    <div className="flex items-center gap-1 px-2.5 bg-white border border-slate-200 rounded-md w-full sm:w-40">
                        <ArrowUpDown size={12} className="text-slate-400" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-transparent text-[11px] w-full h-8 text-slate-700 font-medium focus:outline-none cursor-pointer"
                        >
                            <option value="soonest">Date: Soonest First</option>
                            <option value="furthest">Date: Furthest First</option>
                            <option value="highest-priority">Priority: Urgent-to-Low</option>
                            <option value="lowest-priority">Priority: Low-to-Urgent</option>
                            <option value="sql-first">Temp: SQL-to-Cold</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1 px-2.5 bg-white border border-slate-200 rounded-md w-full sm:w-32">
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="bg-transparent text-[11px] w-full h-8 text-slate-700 font-medium focus:outline-none cursor-pointer"
                        >
                            <option value="all">All Priorities</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1 px-2.5 bg-white border border-slate-200 rounded-md w-full sm:w-32">
                        <select
                            value={tempFilter}
                            onChange={(e) => setTempFilter(e.target.value)}
                            className="bg-transparent text-[11px] w-full h-8 text-slate-700 font-medium focus:outline-none cursor-pointer"
                        >
                            <option value="all">All Temps</option>
                            <option value="cold">Cold</option>
                            <option value="warm">Warm</option>
                            <option value="sql">SQL</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-slate-900"></div>
                        <span className="text-xs font-semibold text-slate-500 tracking-wider">Loading...</span>
                    </div>
                ) : currentLeads.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="w-12 h-12 bg-slate-50 text-slate-650 rounded-full flex items-center justify-center mx-auto mb-3">
                            <CheckCircle2 size={24} />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-800">All caught up!</h3>
                        <p className="text-slate-500 text-xs mt-1">No matching leads found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse table-auto">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
                                    <th className="px-4 py-3 w-[25%]">Company Info</th>
                                    <th className="px-4 py-3 w-[15%]">Remaining Time</th>
                                    <th className="px-4 py-3 w-[20%]">Due Date & Time</th>
                                    <th className="px-4 py-3 w-[12%]">Badges</th>
                                    <th className="px-4 py-3 w-[13%]">Claimed Closer</th>
                                    <th className="px-4 py-3 text-right pr-6 w-[15%]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                                {currentLeads.map((lead) => {
                                    const timeInfo = getRemainingTime(lead.followUpDate);
                                    const closerName = lead.workingCloser?.name || lead.assignedCloser?.name || null;

                                    return (
                                        <tr 
                                            key={lead._id} 
                                            className={`hover:bg-slate-50/80 transition-colors duration-150 ${
                                                timeInfo.isOverdue ? 'bg-red-50/15 border-l border-l-red-500' : 'border-l border-l-transparent'
                                            }`}
                                        >
                                            <td className="px-4 py-2.5">
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-[12px] text-slate-900 truncate">
                                                        {lead.companyName}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                                                        <span className="text-slate-800">{lead.contactName || 'No Contact'}</span>
                                                        {lead.phone && (
                                                            <>
                                                                <span className="text-slate-350">•</span>
                                                                <span className="inline-flex items-center gap-0.5 text-slate-700"><Phone size={8} className="text-slate-400" /> {lead.phone}</span>
                                                            </>
                                                        )}
                                                        {lead.email && (
                                                            <>
                                                                <span className="text-slate-350">•</span>
                                                                <span className="inline-flex items-center gap-0.5 text-slate-700"><Mail size={8} className="text-slate-400" /> {lead.email}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-2.5">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border ${getRemainingTimeStyle(timeInfo.severity)}`}>
                                                    <Clock size={10} />
                                                    {timeInfo.text}
                                                </span>
                                            </td>

                                            <td className="px-4 py-2.5">
                                                <div className="font-semibold text-slate-850 flex items-center gap-1">
                                                    <Calendar size={10} className="text-slate-450" />
                                                    {new Date(lead.followUpDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                                <div className="text-[9px] text-slate-400 font-semibold ml-3.5 uppercase">
                                                    {new Date(lead.followUpDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>

                                            <td className="px-4 py-2.5">
                                                <div className="flex gap-1">
                                                    <Badge variant="outline" className={`text-[9px] font-medium px-1.5 py-0 rounded ${getPriorityStyle(lead.priority)}`}>
                                                        {lead.priority}
                                                    </Badge>
                                                    <Badge variant="outline" className={`text-[9px] font-medium px-1.5 py-0 rounded ${getTempStyle(lead.temperature)}`}>
                                                        {lead.temperature}
                                                    </Badge>
                                                </div>
                                            </td>

                                            <td className="px-4 py-2.5">
                                                {closerName ? (
                                                    <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-100 pl-1 pr-2 py-0.5 rounded">
                                                        <div className="w-4 h-4 rounded bg-slate-900 text-white flex items-center justify-center text-[9px] font-semibold uppercase">
                                                            {closerName[0]}
                                                        </div>
                                                        <span className="font-semibold text-slate-700 text-[10px]">{closerName}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[9px] text-slate-500 bg-slate-50/50 border border-slate-200 px-1.5 py-0.5 rounded">
                                                        Unclaimed
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-2.5 text-right pr-6">
                                                <div className="flex gap-2 justify-end items-center">
                                                    <Button 
                                                        onClick={() => openActionDialog(lead)}
                                                        className="h-7 text-[10px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all duration-150 px-2"
                                                    >
                                                        Update Outcome
                                                    </Button>
                                                    <Link to={`/leads/details/${lead._id}`}>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="h-7 text-[10px] font-semibold text-slate-900 hover:bg-slate-100 rounded-md transition-all duration-150 gap-1 border border-slate-200 px-2"
                                                        >
                                                            <span>View</span>
                                                            <ArrowRight size={10} />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white px-4 py-3 border border-slate-200 rounded-lg shadow-sm">
                    <div className="flex flex-1 justify-between sm:hidden">
                        <Button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            variant="outline" 
                            size="sm"
                        >
                            Previous
                        </Button>
                        <Button 
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            variant="outline" 
                            size="sm"
                        >
                            Next
                        </Button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs text-slate-500 font-semibold">
                                Showing <span className="font-semibold text-slate-800">{indexOfFirstLead + 1}</span> to{' '}
                                <span className="font-semibold text-slate-800">
                                    {Math.min(indexOfLastLead, sortedLeads.length)}
                                </span>{' '}
                                of <span className="font-semibold text-slate-800">{sortedLeads.length}</span> leads
                            </p>
                        </div>
                        <div>
                            <nav className="inline-flex -space-x-px rounded-md shadow-sm gap-1.5">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="h-8 w-8 p-0 rounded-md border-slate-200 hover:bg-slate-50"
                                >
                                    <ChevronLeft size={16} />
                                </Button>
                                
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <Button
                                        key={page}
                                        variant={currentPage === page ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(page)}
                                        className={`h-8 w-8 p-0 rounded-md font-semibold text-xs border-slate-200 ${
                                            currentPage === page ? 'bg-slate-950 text-white hover:bg-slate-900 border-slate-950' : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        {page}
                                    </Button>
                                ))}

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="h-8 w-8 p-0 rounded-md border-slate-200 hover:bg-slate-50"
                                >
                                    <ChevronRight size={16} />
                                </Button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}

            {/* Follow-up Action Outcomes Dialog */}
            <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
                <DialogContent className="max-w-md bg-white rounded-xl border border-slate-200 p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-slate-900">
                            Update Follow-up Outcome
                        </DialogTitle>
                    </DialogHeader>
                    {selectedLead && (
                        <div className="space-y-4 py-3">
                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-slate-700 text-xs">
                                <span className="font-bold block text-slate-900">{selectedLead.companyName}</span>
                                <span className="text-[10px] text-slate-500">{selectedLead.contactName || 'No Contact Person'}</span>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Outcome Action</Label>
                                <select 
                                    value={actionType} 
                                    onChange={(e) => setActionType(e.target.value)}
                                    className="w-full h-10 border border-slate-200 rounded-lg bg-white text-xs px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                >
                                    <option value="spoke">Spoke to client (Bat ho gayi / Complete)</option>
                                    <option value="close">Deal Closed (Lead stage updated to Close)</option>
                                    <option value="reject">Deal Rejected (Lead stage updated to Rejected)</option>
                                    <option value="postpone">Next time manga (Reschedule/Postpone)</option>
                                </select>
                            </div>

                            {actionType === 'postpone' && (
                                <div className="space-y-2 animate-in fade-in duration-200">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Follow-up Date & Time</Label>
                                    <Input 
                                        type="datetime-local" 
                                        value={nextFollowUpDate} 
                                        onChange={(e) => setNextFollowUpDate(e.target.value)}
                                        className="h-10 border-slate-200 bg-white text-xs"
                                        required
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Outcome / Activity Notes</Label>
                                <textarea
                                    value={actionNotes}
                                    onChange={(e) => setActionNotes(e.target.value)}
                                    placeholder="Enter details of conversation or next steps..."
                                    className="w-full min-h-[80px] p-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter className="flex gap-2 justify-end border-t border-slate-100 pt-4">
                        <Button 
                            variant="outline" 
                            onClick={() => setActionDialogOpen(false)} 
                            className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs h-9 rounded-lg"
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleActionSubmit} 
                            disabled={actionSubmitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 px-4 rounded-lg font-semibold shadow-sm"
                        >
                            {actionSubmitting ? 'Saving...' : 'Save Outcome'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Followups;
