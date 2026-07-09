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
import api from '@/lib/api';
import { Plus, Pencil, Upload, Search, Calendar, CheckSquare, PhoneCall, TrendingUp, Trash2, Check, X, Globe } from 'lucide-react';
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
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPriority, setFilterPriority] = useState('all');
    const [filterStage, setFilterStage] = useState('all');
    const [filterTemp, setFilterTemp] = useState('all');
    const [filterContact, setFilterContact] = useState('all');
    const [period, setPeriod] = useState('all');
    const [cardFilter, setCardFilter] = useState('all');

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
                contact: filterContact
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
    }, [pagination.page, limit, searchTerm, period, cardFilter, filterPriority, filterStage, filterTemp, filterContact]);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    // Handle filter change (reset to page 1)
    useEffect(() => {
        setPagination(p => ({ ...p, page: 1 }));
    }, [searchTerm, period, cardFilter, filterPriority, filterStage, filterTemp, filterContact]);

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
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <Input
                            className="pl-10 h-10"
                            placeholder="Search leads, contacts, emails or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
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

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t">
                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                        <SelectTrigger className="h-9">
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

                    <Select value={filterStage} onValueChange={setFilterStage}>
                        <SelectTrigger className="h-9">
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
                        </SelectContent>
                    </Select>

                    <Select value={filterTemp} onValueChange={setFilterTemp}>
                        <SelectTrigger className="h-9">
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

                    <Select value={filterContact} onValueChange={setFilterContact}>
                        <SelectTrigger className="h-9">
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
                            {isPrivileged && <TableHead>Researcher</TableHead>}
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && leads.length === 0 ? (
                            <TableRow><TableCell colSpan={9} className="text-center py-8">Loading...</TableCell></TableRow>
                        ) : leads.map((lead) => (
                            <TableRow key={lead._id} className={!canView ? "blur-sm select-none" : ""}>
                                <TableCell className="text-center">
                                    <input 
                                        type="checkbox"
                                        checked={selectedLeads.includes(lead._id)}
                                        onChange={(e) => handleSelectLead(lead._id, e.target.checked)}
                                        className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                                    />
                                </TableCell>
                                <TableCell className={`font-medium ${canView ? 'cursor-pointer hover:text-blue-600' : ''}`} onClick={() => canView && navigate(`/leads/details/${lead._id}`)}>
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
                                        disabled={!canEdit}
                                        title={!canEdit ? "You do not have permission to edit leads." : ""}
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
        </div>
    );
};

export default LeadsPipeline;
