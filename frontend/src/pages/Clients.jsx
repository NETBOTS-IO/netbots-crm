import { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
    Search, 
    Users, 
    ChevronDown, 
    ChevronUp, 
    Instagram, 
    Facebook, 
    Twitter, 
    Linkedin, 
    Youtube, 
    Globe, 
    Star,
    Plus,
    Pencil,
    Trash2,
    Eye,
    MessageSquare,
    CheckCircle2,
    Clock
} from "lucide-react";
import api from '@/lib/api';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { exportTableToPDF } from '../utils/pdfExport';
import { FileDown } from 'lucide-react';

const Clients = () => {
    const { user } = useAuth();
    const { isAdmin, can } = usePermissions();
    const canManage = isAdmin || can('manage_clients');
    const { toast } = useToast();
    const [clients, setClients] = useState([]);
    const [team, setTeam] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [expandedRows, setExpandedRows] = useState({});

    const handleExportPDF = () => {
        const headers = ["Company Name", "Contact Name", "Email", "Phone", "Plan Type", "Deal Amount", "Contract Status"];
        const rows = clients.map(c => [
            c.companyName || 'N/A',
            c.contactName || 'N/A',
            c.email || 'N/A',
            c.phone || 'N/A',
            c.planType || 'N/A',
            c.dealAmount ? c.dealAmount.toLocaleString() : '0',
            c.contractStatus || 'N/A'
        ]);
        exportTableToPDF("Clients Directory Registry", headers, rows, `Clients_Export_${Date.now()}.pdf`);
    };

    // CRUD States
    const [isAddEditOpen, setIsAddEditOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [formData, setFormData] = useState({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        businessType: '',
        city: '',
        dealType: 'monthly_subscription',
        planType: 'monthly_growth',
        monthlyAmount: '',
        lifetimeAmount: '',
        enterpriseAmount: '',
        startDate: new Date().toISOString().split('T')[0],
        upfrontPaid: '',
        remainingAmount: '',
        engagedTeam: []
    });

    // View Complete Detail Modal States
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedClientDetail, setSelectedClientDetail] = useState(null);
    const [leadDetails, setLeadDetails] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const res = await api.get('/clients');
            if (res.success) setClients(res.data);
        } catch (err) {
            console.error("Failed to fetch clients", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTeam = async () => {
        try {
            const res = await api.get('/team');
            if (res.success) setTeam(res.data);
        } catch (err) {
            console.error("Failed to fetch team", err);
        }
    };

    useEffect(() => {
        fetchClients();
        fetchTeam();
    }, []);

    const toggleRow = (id) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const getClientFormTotal = () => {
        if (['monthly_subscription', 'weekly', 'monthly'].includes(formData.dealType)) return parseFloat(formData.monthlyAmount || 0);
        if (['lifetime_deal', 'one_time'].includes(formData.dealType)) return parseFloat(formData.lifetimeAmount || 0);
        if (['enterprise', 'annual'].includes(formData.dealType)) return parseFloat(formData.enterpriseAmount || 0);
        return 0;
    };

    useEffect(() => {
        const total = getClientFormTotal();
        const upfront = parseFloat(formData.upfrontPaid || 0);
        const remaining = Math.max(0, total - upfront);
        setFormData(prev => {
            const remStr = remaining.toString();
            if (prev.remainingAmount !== remStr) {
                return { ...prev, remainingAmount: remStr };
            }
            return prev;
        });
    }, [formData.monthlyAmount, formData.lifetimeAmount, formData.enterpriseAmount, formData.dealType, formData.upfrontPaid]);

    const handleFormChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleOpenAdd = () => {
        setEditingClient(null);
        setFormData({
            companyName: '',
            contactName: '',
            email: '',
            phone: '',
            businessType: '',
            city: '',
            dealType: 'monthly_subscription',
            planType: 'monthly_growth',
            monthlyAmount: '',
            lifetimeAmount: '',
            enterpriseAmount: '',
            startDate: new Date().toISOString().split('T')[0],
            upfrontPaid: '',
            remainingAmount: '',
            engagedTeam: []
        });
        setIsAddEditOpen(true);
    };

    const handleOpenEdit = (client) => {
        setEditingClient(client);
        setFormData({
            companyName: client.companyName || '',
            contactName: client.contactName || '',
            email: client.email || '',
            phone: client.phone || '',
            businessType: client.businessType || '',
            city: client.city || '',
            dealType: client.dealType || 'monthly_subscription',
            planType: client.planType || 'monthly_growth',
            monthlyAmount: client.monthlyAmount || '',
            lifetimeAmount: client.lifetimeAmount || '',
            enterpriseAmount: client.enterpriseAmount || '',
            startDate: client.startDate ? new Date(client.startDate).toISOString().split('T')[0] : '',
            upfrontPaid: client.upfrontPaid || '',
            remainingAmount: client.remainingAmount || '',
            engagedTeam: (client.engagedTeam || []).map(item => ({
                user: item.user?._id || item.user,
                commissionAmount: item.commissionAmount
            }))
        });
        setIsAddEditOpen(true);
    };

    const handleDeleteClient = async (id) => {
        if (!window.confirm("Are you sure you want to delete this client?")) return;
        try {
            const res = await api.delete(`/clients/${id}`);
            if (res.success) {
                toast({ title: "Success", description: "Client deleted successfully" });
                fetchClients();
            }
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete client" });
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            planType: formData.planType || formData.dealType,
            monthlyAmount: ['monthly_subscription', 'weekly', 'monthly'].includes(formData.dealType) ? parseFloat(formData.monthlyAmount || 0) : undefined,
            lifetimeAmount: ['lifetime_deal', 'one_time'].includes(formData.dealType) ? parseFloat(formData.lifetimeAmount || 0) : undefined,
            enterpriseAmount: ['enterprise', 'annual'].includes(formData.dealType) ? parseFloat(formData.enterpriseAmount || 0) : undefined,
            upfrontPaid: parseFloat(formData.upfrontPaid || 0),
            remainingAmount: parseFloat(formData.remainingAmount || 0),
            engagedTeam: formData.engagedTeam
        };

        try {
            let res;
            if (editingClient) {
                res = await api.put(`/clients/${editingClient._id}`, payload);
            } else {
                res = await api.post('/clients', payload);
            }

            if (res.success) {
                toast({ title: "Success", description: editingClient ? "Client updated" : "Client created" });
                setIsAddEditOpen(false);
                fetchClients();
            }
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: err.error || "Operation failed" });
        }
    };

    const handleViewCompleteDetail = async (client) => {
        setSelectedClientDetail(client);
        setLeadDetails(null);
        setActivities([]);
        setIsDetailOpen(true);
        if (client.leadId) {
            setLoadingDetail(true);
            try {
                const res = await api.get(`/leads/${client.leadId}`);
                if (res.success) {
                    setLeadDetails(res.data.lead);
                    setActivities(res.data.activities);
                }
            } catch (err) {
                console.error("Failed to load original lead details", err);
            } finally {
                setLoadingDetail(false);
            }
        }
    };

    const filteredClients = clients.filter(client =>
        client.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center">Loading clients...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                    <Users className="text-slate-500" size={24} />
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">Client Directory</h2>
                        <p className="text-xs text-slate-500 font-medium uppercase mt-0.5">{filteredClients.length} Total Customers</p>
                    </div>
                </div>
                <div className="flex gap-2 items-center w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <Input
                            className="pl-10 h-10 font-medium"
                            placeholder="Search client..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {canManage && (
                        <Button variant="outline" onClick={handleExportPDF} className="gap-1.5 h-10 border-slate-200 text-slate-700 hover:bg-slate-50">
                            <FileDown size={16} /> Export to PDF
                        </Button>
                    )}
                    {canManage && (
                        <Button onClick={handleOpenAdd} className="gap-1.5 h-10 bg-slate-950 hover:bg-slate-900 text-white">
                            <Plus size={16} /> Add Client
                        </Button>
                    )}
                </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white overflow-x-auto shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50 border-b border-slate-200">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-10"></TableHead>
                            <TableHead className="text-slate-500 font-medium">Company</TableHead>
                            <TableHead className="text-slate-500 font-medium">Contact & Phone</TableHead>
                            <TableHead className="text-slate-500 font-medium">Plan & Value</TableHead>
                            <TableHead className="text-slate-500 font-medium">Upfront & Remaining</TableHead>
                            <TableHead className="text-slate-500 font-medium">Start Date</TableHead>
                            <TableHead className="text-slate-500 font-medium">Status</TableHead>
                            <TableHead className="text-right text-slate-500 font-medium">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredClients.map((client) => {
                            const isExpanded = expandedRows[client._id];
                            const currentAmount = client.monthlyAmount || client.lifetimeAmount || client.enterpriseAmount || 0;
                            return (
                                <>
                                    <TableRow key={client._id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => toggleRow(client._id)}>
                                        <TableCell>
                                            {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-semibold text-slate-900">{client.companyName}</span>
                                                <span className="text-[10px] text-slate-500">{client.email || 'No email'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs">
                                                <div className="font-semibold text-slate-800">{client.contactName || 'N/A'}</div>
                                                <div className="text-slate-500 mt-0.5">{client.phone || 'No phone'}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="capitalize text-xs font-semibold text-slate-850">{client.planType?.replace(/_/g, ' ')}</span>
                                                <span className="font-semibold text-slate-900 text-xs mt-0.5">
                                                    PKR {currentAmount.toLocaleString()}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs font-medium">
                                                <div className="text-slate-700">Upfront: PKR {(client.upfrontPaid || 0).toLocaleString()}</div>
                                                <div className="text-slate-550">Remain: PKR {(client.remainingAmount || 0).toLocaleString()}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs font-medium text-slate-500">
                                            {client.startDate ? new Date(client.startDate).toLocaleDateString() : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={client.isActive ? "border-emerald-500 text-emerald-600 bg-emerald-50/50 font-medium" : "border-slate-350 text-slate-500 bg-slate-50/50 font-medium"}>
                                                {client.isActive ? "ACTIVE" : "CHURNED"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                                            <div className="flex justify-end gap-1.5">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 border border-slate-200 hover:bg-slate-50 text-slate-700" onClick={() => handleViewCompleteDetail(client)} title="View Complete Detail">
                                                    <Eye size={14} />
                                                </Button>
                                                {canManage && (
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 border border-slate-200 hover:bg-slate-50 text-slate-700" onClick={() => handleOpenEdit(client)}>
                                                        <Pencil size={14} />
                                                    </Button>
                                                )}
                                                {isAdmin && (
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-red-600" onClick={() => handleDeleteClient(client._id)}>
                                                        <Trash2 size={14} />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>

                                    {isExpanded && (
                                        <TableRow className="bg-slate-50/20 hover:bg-slate-50/20">
                                            <TableCell colSpan={8} className="p-4 border-t border-b border-slate-200">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
                                                    {/* Engaged Team info */}
                                                    <div className="space-y-3 bg-white p-3 rounded border border-slate-200 shadow-sm">
                                                        <h4 className="font-semibold text-slate-800 border-b pb-1.5 uppercase tracking-wider text-[10px]">Engaged Team & Commissions</h4>
                                                        {client.engagedTeam && client.engagedTeam.length > 0 ? (
                                                            <div className="space-y-2">
                                                                {client.engagedTeam.map((item, idx) => (
                                                                    <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                                                                        <span className="font-medium text-slate-700">{item.user?.name || 'Unknown'}</span>
                                                                        <span className="font-semibold text-slate-900">PKR {(item.commissionAmount || 0).toLocaleString()}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-slate-400 italic">No team members assigned</p>
                                                        )}
                                                    </div>

                                                    {/* Basic info metadata */}
                                                    <div className="space-y-3 bg-white p-3 rounded border border-slate-200 shadow-sm">
                                                        <h4 className="font-semibold text-slate-800 border-b pb-1.5 uppercase tracking-wider text-[10px]">Lead Tracking & Assignment Details</h4>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Lead Collected By</span>
                                                                <span className="font-medium text-slate-800">{client.leadCollectedBy || 'Unknown'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Lead Verified By</span>
                                                                <span className="font-medium text-slate-800">{client.leadVerifiedBy || 'System/N/A'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Sales Closed By</span>
                                                                <span className="font-medium text-slate-800">{client.salesClosedBy || 'Unknown'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Lead Creation Date</span>
                                                                <span className="font-medium text-slate-800">{client.leadCreatedAt ? new Date(client.leadCreatedAt).toLocaleDateString() : 'N/A'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Business Type</span>
                                                                <span className="font-medium text-slate-800">{client.businessType || 'N/A'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] text-slate-400 font-semibold uppercase block">City</span>
                                                                <span className="font-medium text-slate-800">{client.city || 'N/A'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {filteredClients.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-lg border-2 border-dashed">
                    <Search className="text-slate-300 mb-4" size={48} />
                    <h3 className="text-lg font-bold text-slate-400">No clients found</h3>
                </div>
            )}

            {/* Add / Edit Client Modal */}
            <Dialog open={isAddEditOpen} onOpenChange={setIsAddEditOpen}>
                <DialogContent className="max-w-2xl bg-white p-6 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">{editingClient ? "Edit Client Details" : "Add Client Manually"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Company Name</label>
                                <Input required value={formData.companyName} onChange={(e) => handleFormChange('companyName', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Contact Name</label>
                                <Input value={formData.contactName} onChange={(e) => handleFormChange('contactName', e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                                <Input type="email" value={formData.email} onChange={(e) => handleFormChange('email', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Phone</label>
                                <Input value={formData.phone} onChange={(e) => handleFormChange('phone', e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Business Type</label>
                                <Input value={formData.businessType} onChange={(e) => handleFormChange('businessType', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">City</label>
                                <Input value={formData.city} onChange={(e) => handleFormChange('city', e.target.value)} />
                            </div>
                        </div>

                        <hr className="my-2" />

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Deal Type</label>
                            <Select value={formData.dealType} onValueChange={(val) => {
                                handleFormChange('dealType', val);
                                if (['monthly_subscription', 'weekly', 'monthly'].includes(val)) handleFormChange('planType', 'monthly_growth');
                                else if (['lifetime_deal', 'one_time'].includes(val)) handleFormChange('planType', 'one_time');
                                else if (['enterprise', 'annual'].includes(val)) handleFormChange('planType', 'annual');
                            }}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="monthly_subscription">Monthly Subscription</SelectItem>
                                    <SelectItem value="lifetime_deal">Lifetime Deal</SelectItem>
                                    <SelectItem value="enterprise">Enterprise</SelectItem>
                                    <SelectItem value="one_time">One Time Deal</SelectItem>
                                    <SelectItem value="weekly">Weekly Subscription</SelectItem>
                                    <SelectItem value="monthly">Monthly Plan</SelectItem>
                                    <SelectItem value="annual">Annual / Yearly Plan</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            {['monthly_subscription', 'weekly', 'monthly'].includes(formData.dealType) && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Monthly Amt</label>
                                    <Input type="number" required value={formData.monthlyAmount} onChange={(e) => handleFormChange('monthlyAmount', e.target.value)} />
                                </div>
                            )}
                            {['lifetime_deal', 'one_time'].includes(formData.dealType) && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Lifetime Amt</label>
                                    <Input type="number" required value={formData.lifetimeAmount} onChange={(e) => handleFormChange('lifetimeAmount', e.target.value)} />
                                </div>
                            )}
                            {['enterprise', 'annual'].includes(formData.dealType) && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Enterprise Amt</label>
                                    <Input type="number" required value={formData.enterpriseAmount} onChange={(e) => handleFormChange('enterpriseAmount', e.target.value)} />
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Upfront Paid</label>
                                <Input type="number" value={formData.upfrontPaid} onChange={(e) => handleFormChange('upfrontPaid', e.target.value)} />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Remaining Amt</label>
                                <Input type="number" value={formData.remainingAmount} disabled className="bg-slate-50 cursor-not-allowed font-bold" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Start Date</label>
                            <Input type="date" required value={formData.startDate} onChange={(e) => handleFormChange('startDate', e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Engaged Team & Commissions</label>
                            {(formData.engagedTeam || []).map((member, index) => (
                                <div key={index} className="flex gap-2 items-center mb-2 bg-slate-50 p-2 rounded border">
                                    <div className="flex-1">
                                        <Select 
                                            value={member.user} 
                                            onValueChange={(val) => {
                                                const updated = [...(formData.engagedTeam || [])];
                                                updated[index].user = val;
                                                handleFormChange('engagedTeam', updated);
                                            }}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Select Team..." /></SelectTrigger>
                                            <SelectContent>
                                                {team.map((t) => (
                                                    <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-32">
                                        <Input
                                            type="number"
                                            placeholder="Commission Amount"
                                            value={member.commissionAmount || ''}
                                            onChange={(e) => {
                                                const updated = [...(formData.engagedTeam || [])];
                                                updated[index].commissionAmount = parseFloat(e.target.value || 0);
                                                handleFormChange('engagedTeam', updated);
                                            }}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-700 p-1 h-auto"
                                        onClick={() => {
                                            const updated = (formData.engagedTeam || []).filter((_, i) => i !== index);
                                            handleFormChange('engagedTeam', updated);
                                        }}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            ))}
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                className="w-full text-xs font-bold uppercase mt-1"
                                onClick={() => {
                                    const updated = [...(formData.engagedTeam || []), { user: '', commissionAmount: 0 }];
                                    handleFormChange('engagedTeam', updated);
                                }}
                            >
                                + Add Engaged Team Member
                            </Button>
                        </div>

                        <DialogFooter className="pt-4 gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsAddEditOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">Save Client</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* View Complete Detail Modal */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-3xl bg-white p-6 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="border-b pb-4">
                        <DialogTitle className="text-xl font-bold flex justify-between items-center">
                            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedClientDetail?.companyName)}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600 hover:text-blue-800" title="Click to search on Google Maps">
                                {selectedClientDetail?.companyName}
                            </a>
                            <Badge className={selectedClientDetail?.isActive ? "bg-emerald-500" : "bg-slate-500"}>
                                {selectedClientDetail?.isActive ? "ACTIVE CLIENT" : "CHURNED"}
                            </Badge>
                        </DialogTitle>
                    </DialogHeader>

                    {selectedClientDetail && (
                        <div className="space-y-6 pt-4 text-slate-700">
                            {/* Client & Contract Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-4 rounded-lg border border-slate-100">
                                <div>
                                    <h4 className="text-xs font-black uppercase text-slate-400 mb-2 tracking-wider">Client & Contact Info</h4>
                                    <div className="space-y-1.5 text-sm font-semibold">
                                        <p><span className="text-slate-400 font-bold">Contact:</span> {selectedClientDetail.contactName || 'N/A'}</p>
                                        <p className="break-all whitespace-normal">
                                            <span className="text-slate-400 font-bold">Email:</span>{' '}
                                            {selectedClientDetail.email ? (
                                                <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${selectedClientDetail.email}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                    {selectedClientDetail.email}
                                                </a>
                                            ) : 'N/A'}
                                        </p>
                                        <p>
                                            <span className="text-slate-400 font-bold">Phone:</span>{' '}
                                            {selectedClientDetail.phone ? (
                                                <a href={`https://web.whatsapp.com/send?phone=${selectedClientDetail.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                                                    {selectedClientDetail.phone}
                                                </a>
                                            ) : 'N/A'}
                                        </p>
                                        <p>
                                            <span className="text-slate-400 font-bold">Location:</span>{' '}
                                            {selectedClientDetail.city || selectedClientDetail.billingAddress ? (
                                                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedClientDetail.billingAddress || selectedClientDetail.city)}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                    {selectedClientDetail.city || selectedClientDetail.billingAddress}
                                                </a>
                                            ) : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-black uppercase text-slate-400 mb-2 tracking-wider">Contract Details</h4>
                                    <div className="space-y-1.5 text-sm font-semibold">
                                        <p><span className="text-slate-400 font-bold">Plan:</span> <span className="capitalize">{selectedClientDetail.planType?.replace(/_/g, ' ')}</span></p>
                                        <p><span className="text-slate-400 font-bold">Start Date:</span> {selectedClientDetail.startDate ? new Date(selectedClientDetail.startDate).toLocaleDateString() : 'N/A'}</p>
                                        <p><span className="text-slate-400 font-bold">Upfront Paid:</span> ${(selectedClientDetail.upfrontPaid || 0).toLocaleString()}</p>
                                        <p><span className="text-slate-400 font-bold">Remaining Amount:</span> ${(selectedClientDetail.remainingAmount || 0).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Tracking & Service Info */}
                            <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-100 grid grid-cols-2 md:grid-cols-5 gap-4 text-xs font-semibold">
                                <div>
                                    <span className="text-[10px] text-slate-400 uppercase font-black block">Target Service</span>
                                    <Badge variant="outline" className="mt-1 bg-blue-50 text-blue-700 border-blue-200 capitalize font-bold">
                                        {selectedClientDetail.targetService ? selectedClientDetail.targetService.replace(/_/g, ' ') : 'Not Specified'}
                                    </Badge>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 uppercase font-black block">Lead Collected By</span>
                                    <span className="text-slate-800 font-bold block mt-1">{selectedClientDetail.leadCollectedBy || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 uppercase font-black block">Lead Verified By</span>
                                    <span className="text-slate-800 font-bold block mt-1">{selectedClientDetail.leadVerifiedBy || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 uppercase font-black block">Last Contacted By</span>
                                    <span className="text-slate-800 font-bold block mt-1">
                                        {selectedClientDetail.contactedBy || 'N/A'}
                                        {selectedClientDetail.contactMethod && <span className="text-xs text-slate-500"> ({selectedClientDetail.contactMethod})</span>}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 uppercase font-black block">Sales Closed By</span>
                                    <span className="text-slate-800 font-bold block mt-1">{selectedClientDetail.salesClosedBy || 'N/A'}</span>
                                </div>
                            </div>

                            {/* Engaged Team members */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Engaged Team Members & Commissions</h4>
                                {selectedClientDetail.engagedTeam && selectedClientDetail.engagedTeam.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        {selectedClientDetail.engagedTeam.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-2 border rounded bg-white text-sm font-bold">
                                                <span>{item.user?.name || 'Unknown'}</span>
                                                <span className="text-emerald-600">${item.commissionAmount?.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-400 italic">No team members assigned.</p>
                                )}
                            </div>

                            {/* Original Lead details */}
                            {loadingDetail ? (
                                <div className="text-center py-4 text-sm text-slate-400">Loading original lead data...</div>
                            ) : leadDetails ? (
                                <div className="space-y-6 pt-4 border-t">
                                    <h3 className="text-sm font-bold uppercase text-slate-800 tracking-wider">Original Lead Records</h3>
                                    
                                    {/* Social & online presence */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {leadDetails.instagram && <div className="p-2 border rounded bg-white text-xs font-semibold flex items-center gap-1.5"><Instagram size={14} className="text-pink-600" /> Instagram</div>}
                                        {leadDetails.facebook && <div className="p-2 border rounded bg-white text-xs font-semibold flex items-center gap-1.5"><Facebook size={14} className="text-blue-600" /> Facebook</div>}
                                        {leadDetails.twitter && <div className="p-2 border rounded bg-white text-xs font-semibold flex items-center gap-1.5"><Twitter size={14} className="text-sky-600" /> Twitter</div>}
                                        {leadDetails.linkedin && <div className="p-2 border rounded bg-white text-xs font-semibold flex items-center gap-1.5"><Linkedin size={14} className="text-indigo-600" /> LinkedIn</div>}
                                        {leadDetails.youtube && <div className="p-2 border rounded bg-white text-xs font-semibold flex items-center gap-1.5"><Youtube size={14} className="text-red-600" /> YouTube</div>}
                                        {leadDetails.website && <div className="p-2 border rounded bg-white text-xs font-semibold flex items-center gap-1.5"><Globe size={14} className="text-slate-600" /> Website</div>}
                                    </div>

                                    {/* Maps and Rating */}
                                    <div className="grid grid-cols-3 gap-4 text-xs font-semibold bg-slate-50 p-3 rounded border">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase">Maps Category</p>
                                            <p className="text-slate-800">{leadDetails.category || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase">Rating</p>
                                            <div className="flex items-center gap-1 mt-0.5 text-slate-800">
                                                <Star size={12} className="fill-amber-400 text-amber-400" />
                                                <span>{leadDetails.averageRating || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase">Reviews</p>
                                            <p className="text-slate-800">{leadDetails.reviewCount || 0} reviews</p>
                                        </div>
                                    </div>

                                    {/* Working Hours */}
                                    <div className="space-y-1.5">
                                        <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Working Hours</h5>
                                        <div className="grid grid-cols-4 gap-2 text-[10px] font-bold text-slate-600">
                                            <div>Mon: {leadDetails.mondayHours || 'Closed'}</div>
                                            <div>Tue: {leadDetails.tuesdayHours || 'Closed'}</div>
                                            <div>Wed: {leadDetails.wednesdayHours || 'Closed'}</div>
                                            <div>Thu: {leadDetails.thursdayHours || 'Closed'}</div>
                                            <div>Fri: {leadDetails.fridayHours || 'Closed'}</div>
                                            <div>Sat: {leadDetails.saturdayHours || 'Closed'}</div>
                                            <div>Sun: {leadDetails.sundayHours || 'Closed'}</div>
                                        </div>
                                    </div>

                                    {/* Activity Log Notes */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                                            <Clock size={14} /> Activity & Notes Timeline
                                        </h4>
                                        <div className="space-y-3 max-h-[200px] overflow-y-auto border p-3 rounded bg-slate-50/50">
                                            {activities.map((act) => (
                                                <div key={act._id} className="border-b last:border-0 pb-2 mb-2 text-xs">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-bold text-slate-800 uppercase text-[9px]">{act.description}</span>
                                                        <span className="text-[9px] text-slate-400">{new Date(act.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    {act.notes && <p className="italic text-slate-600 bg-white p-1.5 rounded border border-slate-100">{act.notes}</p>}
                                                    <p className="text-[8px] text-slate-400 mt-0.5">BY {act.performedBy?.name || 'SYSTEM'}</p>
                                                </div>
                                            ))}
                                            {activities.length === 0 && <p className="text-xs text-slate-400 italic">No notes or activities recorded.</p>}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400 italic border-t pt-4">No associated Lead details found.</p>
                            )}
                        </div>
                    )}
                    <DialogFooter className="pt-4 border-t">
                        <Button onClick={() => setIsDetailOpen(false)}>Close details</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Clients;
