import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { Search, ShieldAlert, CheckSquare, Square, RefreshCcw, Shield, UserCheck, Mail, Users, FileText, Globe, Clock, FileSignature, VenetianMask } from 'lucide-react';

const CATEGORIZED_PERMISSIONS = [
    {
        category: 'Workspace & General',
        icon: Shield,
        permissions: [
            { key: 'view_dashboard', label: 'View Dashboard', desc: 'Allows access to the main dashboard screens' },
            { key: 'view_sales_dashboard', label: 'View Sales Dashboard', desc: 'Allows viewing aggregate sales analytics' },
            { key: 'view_leaderboard', label: 'View Leaderboard', desc: 'Allows viewing team rankings and stats' },
            { key: 'view_audit_logs', label: 'View Audit Logs', desc: 'Allows monitoring system changes and user clicks' },
            { key: 'view_personal_performance', label: 'Personal Performance', desc: 'Allows viewing personal activity metrics' },
            { key: 'view_time_tracking', label: 'Time Sheets', desc: 'Allows tracking work times and pings' },
        ]
    },
    {
        category: 'Sales Pipeline',
        icon: FileText,
        permissions: [
            { key: 'can_view_leads', label: 'View Leads Pipeline', desc: 'Allows viewing leads, closer view, and followups' },
            { key: 'can_add_leads', label: 'Add New Leads', desc: 'Allows adding new prospects and importing CSVs' },
            { key: 'can_edit_leads', label: 'Edit Leads', desc: 'Allows editing lead status, locks, and updating details' },
            { key: 'can_delete_leads', label: 'Delete Leads', desc: 'Allows deleting leads from the pipeline' },
            { key: 'can_bulk_manage_leads', label: 'Bulk Manage Leads', desc: 'Allows mass changing stage, temp, or deleting' },
            { key: 'manage_clients', label: 'Manage Clients', desc: 'Allows managing active customers and conversions' },
        ]
    },
    {
        category: 'Email Marketing',
        icon: Mail,
        permissions: [
            { key: 'view_email_dashboard', label: 'Email Dashboard', desc: 'Allows viewing outreach status and SMTP metrics' },
            { key: 'manage_smtp_accounts', label: 'SMTP Accounts', desc: 'Allows adding, testing, and deleting sender mailboxes' },
            { key: 'manage_email_templates', label: 'Email Templates', desc: 'Allows creating and editing outreach copy' },
            { key: 'manage_email_campaigns', label: 'Email Campaigns', desc: 'Allows launching campaigns and tracking replies' },
            { key: 'manage_email_lists', label: 'Mailing Lists', desc: 'Allows creating subscriber and target contact lists' },
            { key: 'manage_email_audiences', label: 'Audiences Builder', desc: 'Allows grouping leads by location/source tags' },
            { key: 'manage_email_sequences', label: 'Sequences (Funnels)', desc: 'Allows building multi-step automated email workflows' },
            { key: 'view_email_analytics', label: 'Email Analytics', desc: 'Allows tracking open, reply, bounce, and click rates' },
            { key: 'manage_unsubscribes', label: 'Unsubscribe List', desc: 'Allows tracking blacklisted domains and emails' },
        ]
    },
    {
        category: 'Team & Administration',
        icon: Users,
        permissions: [
            { key: 'manage_team', label: 'Manage Team', desc: 'Allows viewing member activity and modifying user stats' },
            { key: 'manage_permissions', label: 'Manage Permissions Matrix', desc: 'Allows updating granular role distribution permissions' },
            { key: 'view_commissions', label: 'View Commissions Ledger', desc: 'Allows viewing personal or team commission records' },
            { key: 'manage_payouts', label: 'Manage Payouts & Invoices', desc: 'Allows processing contractor payouts' },
            { key: 'can_impersonate', label: 'Impersonate Members', desc: 'Allows admins to log in as another user' },
            { key: 'manage_partners', label: 'Manage Partners', desc: 'Allows managing referral connections' },
            { key: 'manage_agreements', label: 'Manage Agreements', desc: 'Allows creating and tracking contract signatures' },
        ]
    }
];

const ALL_KEYS = CATEGORIZED_PERMISSIONS.reduce((acc, cat) => [...acc, ...cat.permissions.map(p => p.key)], []);

const TEMPLATES = {
    Supervisor: {
        view_dashboard: true, view_sales_dashboard: true, can_view_leads: true, can_add_leads: true, can_edit_leads: true,
        can_delete_leads: true, manage_clients: true, manage_team: true, manage_permissions: true,
        view_commissions: true, manage_payouts: true, view_leaderboard: true, can_bulk_manage_leads: true,
        view_email_dashboard: true, manage_smtp_accounts: true, manage_email_templates: true, manage_email_campaigns: true,
        manage_email_lists: true, manage_email_audiences: true, manage_email_sequences: true, view_email_analytics: true,
        manage_unsubscribes: true, view_audit_logs: true, view_personal_performance: true, view_time_tracking: true,
        can_impersonate: false, manage_partners: true, manage_agreements: true
    },
    LeadCollector: {
        view_dashboard: true, view_sales_dashboard: false, can_view_leads: true, can_add_leads: true, can_edit_leads: false,
        can_delete_leads: false, manage_clients: false, manage_team: false, manage_permissions: false,
        view_commissions: true, manage_payouts: false, view_leaderboard: true, can_bulk_manage_leads: false,
        view_email_dashboard: false, manage_smtp_accounts: false, manage_email_templates: false, manage_email_campaigns: false,
        manage_email_lists: false, manage_email_audiences: false, manage_email_sequences: false, view_email_analytics: false,
        manage_unsubscribes: false, view_audit_logs: false, view_personal_performance: true, view_time_tracking: true,
        can_impersonate: false, manage_partners: false, manage_agreements: false
    },
    LeadVerifier: {
        view_dashboard: true, view_sales_dashboard: false, can_view_leads: true, can_add_leads: false, can_edit_leads: true,
        can_delete_leads: false, manage_clients: false, manage_team: false, manage_permissions: false,
        view_commissions: true, manage_payouts: false, view_leaderboard: true, can_bulk_manage_leads: false,
        view_email_dashboard: false, manage_smtp_accounts: false, manage_email_templates: false, manage_email_campaigns: false,
        manage_email_lists: false, manage_email_audiences: false, manage_email_sequences: false, view_email_analytics: false,
        manage_unsubscribes: false, view_audit_logs: false, view_personal_performance: true, view_time_tracking: true,
        can_impersonate: false, manage_partners: false, manage_agreements: false
    },
    LeadCloser: {
        view_dashboard: true, view_sales_dashboard: false, can_view_leads: true, can_edit_leads: true, can_add_leads: false,
        can_delete_leads: false, manage_clients: true, manage_team: false, manage_permissions: false,
        view_commissions: true, manage_payouts: false, view_leaderboard: true, can_bulk_manage_leads: false,
        view_email_dashboard: false, manage_smtp_accounts: false, manage_email_templates: false, manage_email_campaigns: false,
        manage_email_lists: false, manage_email_audiences: false, manage_email_sequences: false, view_email_analytics: false,
        manage_unsubscribes: false, view_audit_logs: false, view_personal_performance: true, view_time_tracking: true,
        can_impersonate: false, manage_partners: false, manage_agreements: false
    },
    Reset: {
        view_dashboard: false, view_sales_dashboard: false, can_view_leads: false, can_add_leads: false, can_edit_leads: false,
        can_delete_leads: false, manage_clients: false, manage_team: false, manage_permissions: false,
        view_commissions: false, manage_payouts: false, view_leaderboard: false, can_bulk_manage_leads: false,
        view_email_dashboard: false, manage_smtp_accounts: false, manage_email_templates: false, manage_email_campaigns: false,
        manage_email_lists: false, manage_email_audiences: false, manage_email_sequences: false, view_email_analytics: false,
        manage_unsubscribes: false, view_audit_logs: false, view_personal_performance: false, view_time_tracking: false,
        can_impersonate: false, manage_partners: false, manage_agreements: false
    }
};

export default function PermissionsManagement() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [team, setTeam] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState({});
    const [selectedMemberId, setSelectedMemberId] = useState(null);

    useEffect(() => {
        fetchTeam();
    }, []);

    const fetchTeam = async () => {
        try {
            const res = await api.get('/team');
            if (res.success) {
                setTeam(res.data);
                if (res.data.length > 0) {
                    setSelectedMemberId(res.data[0]._id);
                }
            }
        } catch (err) {
            console.error('Failed to fetch team', err);
            toast({ variant: "destructive", title: "Fetch Failed", description: "Failed to load team database." });
        } finally {
            setLoading(false);
        }
    };

    const handlePermissionToggle = (userId, permissionKey) => {
        setTeam(prevTeam => prevTeam.map(member => {
            if (member._id === userId) {
                const updatedPermissions = {
                    ...member.permissions,
                    [permissionKey]: !member.permissions?.[permissionKey]
                };
                return { ...member, permissions: updatedPermissions };
            }
            return member;
        }));
    };

    const applyTemplate = (userId, templateName) => {
        setTeam(prevTeam => prevTeam.map(member => {
            if (member._id === userId) {
                return { ...member, permissions: { ...TEMPLATES[templateName] } };
            }
            return member;
        }));
        toast({ title: "Template Applied", description: `Applied ${templateName} permissions preset.` });
    };

    const handleSave = async (userId) => {
        setSaving(prev => ({ ...prev, [userId]: true }));
        try {
            const memberToUpdate = team.find(m => m._id === userId);
            const res = await api.put(`/team/${userId}/permissions`, {
                permissions: memberToUpdate.permissions
            });
            if (res.success) {
                toast({ title: "Saved", description: `${memberToUpdate.name}'s access permissions updated successfully.` });
            }
        } catch (err) {
            console.error('Failed to update permissions', err);
            toast({ variant: "destructive", title: "Save Error", description: "Failed to update permissions." });
        } finally {
            setSaving(prev => ({ ...prev, [userId]: false }));
        }
    };

    if (user?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
                <ShieldAlert className="text-red-500 mb-4 animate-pulse" size={48} />
                <h3 className="text-lg font-black uppercase tracking-wider text-slate-700">Access Denied</h3>
                <p className="text-xs text-slate-400 font-bold uppercase mt-1">This module is reserved exclusively for System Administrators</p>
            </div>
        );
    }

    const filteredTeam = team.filter(member => 
        member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (Array.isArray(member.designation) ? member.designation.some(d => d.toLowerCase().includes(searchTerm.toLowerCase())) : member.designation?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const selectedMember = team.find(m => m._id === selectedMemberId);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                {/* Header Skeleton */}
                <div className="h-20 bg-slate-200 rounded-xl w-full"></div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Sidebar List Skeleton */}
                    <div className="lg:col-span-3 space-y-4">
                        <div className="h-10 bg-slate-200 rounded-lg w-full"></div>
                        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <div key={n} className="flex justify-between items-center">
                                    <div className="space-y-2 flex-1">
                                        <div className="h-3.5 bg-slate-200 rounded w-2/3"></div>
                                        <div className="h-2.5 bg-slate-100 rounded w-1/2"></div>
                                    </div>
                                    <div className="h-5 bg-slate-200 rounded w-10"></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Panel Skeleton */}
                    <div className="lg:col-span-9 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
                        <div className="flex justify-between items-center border-b pb-4">
                            <div className="space-y-2 flex-1">
                                <div className="h-5 bg-slate-200 rounded w-1/4"></div>
                                <div className="h-3 bg-slate-100 rounded w-1/3"></div>
                            </div>
                            <div className="h-9 bg-slate-200 rounded-lg w-24"></div>
                        </div>

                        {/* Presets block */}
                        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl space-y-3">
                            <div className="h-2 bg-slate-200 rounded w-20"></div>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4].map(n => <div key={n} className="h-7 bg-slate-200 rounded-full w-16"></div>)}
                            </div>
                        </div>

                        {/* Categories block */}
                        <div className="space-y-6">
                            {[1, 2].map((cat) => (
                                <div key={cat} className="space-y-3">
                                    <div className="h-3.5 bg-slate-200 rounded w-32 border-b pb-1"></div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                        {[1, 2, 3].map((card) => (
                                            <div key={card} className="p-3 border border-slate-150 rounded-lg flex gap-2">
                                                <div className="h-4 bg-slate-200 rounded w-4 mt-0.5 shrink-0"></div>
                                                <div className="space-y-2 flex-1">
                                                    <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                                                    <div className="h-2.5 bg-slate-100 rounded w-5/6"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 rounded-xl text-white shadow border border-indigo-950/20">
                <h1 className="text-xl font-extrabold flex items-center gap-2 tracking-wide">
                    <Shield className="text-indigo-400" size={22} /> Permissions & Role Distribution
                </h1>
                <p className="text-[10px] text-indigo-200/80 font-bold uppercase tracking-wider mt-1">
                    Manage granular access levels and template presets for each contractor.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* LEFT SIDEBAR: Members List */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="relative shadow-sm rounded-lg">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <Input
                            className="pl-9 h-10 border-slate-200 bg-white rounded-lg text-xs"
                            placeholder="Search team member..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm max-h-[650px] overflow-y-auto divide-y divide-slate-100 scrollbar-none">
                        {filteredTeam.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 italic text-xs">
                                No team members found
                            </div>
                        ) : (
                            filteredTeam.map((member) => {
                                const isSelected = member._id === selectedMemberId;
                                return (
                                    <div
                                        key={member._id}
                                        onClick={() => setSelectedMemberId(member._id)}
                                        className={`p-3.5 cursor-pointer transition-all duration-200 flex items-center justify-between border-l-4 ${
                                            isSelected 
                                                ? 'bg-gradient-to-r from-indigo-50/50 to-white border-l-indigo-600 font-bold' 
                                                : 'hover:bg-slate-50/50 border-l-transparent'
                                        }`}
                                    >
                                        <div className="min-w-0 pr-2">
                                            <p className={`text-xs truncate ${isSelected ? 'text-indigo-750 font-black' : 'text-slate-800 font-bold'}`}>{member.name}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider truncate mt-0.5">
                                                {Array.isArray(member.designation) && member.designation.length > 0 ? member.designation.join(', ') : (member.designation || member.role)}
                                            </p>
                                        </div>
                                        {member.role === 'admin' ? (
                                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-slate-900 text-white shrink-0 shadow-sm">
                                                Admin
                                            </span>
                                        ) : (
                                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0 shadow-sm">
                                                Staff
                                            </span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* RIGHT DETAIL PANEL: Permissions Grid */}
                <div className="lg:col-span-9">
                    {selectedMember ? (
                        <Card className="border border-slate-200 shadow bg-white rounded-xl overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-indigo-50/10 border-b border-slate-100 py-4 px-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <CardTitle className="text-base font-black text-slate-800 flex items-center gap-2">
                                            <UserCheck className="text-indigo-600" size={18} /> {selectedMember.name}
                                        </CardTitle>
                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                                            Role: {selectedMember.role} &middot; Designations: {Array.isArray(selectedMember.designation) && selectedMember.designation.length > 0 ? selectedMember.designation.join(', ') : (selectedMember.designation || 'None')}
                                        </p>
                                    </div>
                                    <div>
                                        <Button
                                            size="sm"
                                            onClick={() => handleSave(selectedMember._id)}
                                            disabled={selectedMember.role === 'admin' || saving[selectedMember._id]}
                                            className="font-bold text-xs uppercase bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-4 rounded-lg shadow hover:shadow-md hover:scale-[1.03] active:scale-[0.97] transition-all duration-300"
                                        >
                                            {saving[selectedMember._id] ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-5 space-y-6">
                                {/* Template Presets */}
                                <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl space-y-2">
                                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Apply Template Presets:</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        <Button variant="outline" size="xs" className="h-7 text-[9px] font-black uppercase border-slate-200 hover:bg-indigo-600 hover:text-white rounded-full bg-white transition-all shadow-sm px-3 hover:scale-[1.03] active:scale-[0.97] duration-300" onClick={() => applyTemplate(selectedMember._id, 'Supervisor')} disabled={selectedMember.role === 'admin'}>Supervisor</Button>
                                        <Button variant="outline" size="xs" className="h-7 text-[9px] font-black uppercase border-slate-200 hover:bg-indigo-600 hover:text-white rounded-full bg-white transition-all shadow-sm px-3 hover:scale-[1.03] active:scale-[0.97] duration-300" onClick={() => applyTemplate(selectedMember._id, 'LeadCollector')} disabled={selectedMember.role === 'admin'}>Collector</Button>
                                        <Button variant="outline" size="xs" className="h-7 text-[9px] font-black uppercase border-slate-200 hover:bg-indigo-600 hover:text-white rounded-full bg-white transition-all shadow-sm px-3 hover:scale-[1.03] active:scale-[0.97] duration-300" onClick={() => applyTemplate(selectedMember._id, 'LeadVerifier')} disabled={selectedMember.role === 'admin'}>Verifier</Button>
                                        <Button variant="outline" size="xs" className="h-7 text-[9px] font-black uppercase border-slate-200 hover:bg-indigo-600 hover:text-white rounded-full bg-white transition-all shadow-sm px-3 hover:scale-[1.03] active:scale-[0.97] duration-300" onClick={() => applyTemplate(selectedMember._id, 'LeadCloser')} disabled={selectedMember.role === 'admin'}>Closer</Button>
                                        <Button variant="ghost" size="xs" className="h-7 text-[9px] font-black uppercase text-red-650 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-full transition-all px-3 hover:scale-[1.03] active:scale-[0.97] duration-300" onClick={() => applyTemplate(selectedMember._id, 'Reset')} disabled={selectedMember.role === 'admin'}>Clear All</Button>
                                    </div>
                                </div>

                                {/* Permissions Categories Checklist */}
                                <div className="space-y-6">
                                    {CATEGORIZED_PERMISSIONS.map((category) => {
                                        const CatIcon = category.icon;
                                        return (
                                            <div key={category.category} className="space-y-2.5">
                                                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b pb-1.5 border-slate-100 flex items-center gap-1.5">
                                                    {CatIcon && <CatIcon size={12} className="text-indigo-500" />}
                                                    {category.category}
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                                    {category.permissions.map((p) => {
                                                        const isChecked = !!selectedMember.permissions?.[p.key];
                                                        return (
                                                            <div 
                                                                key={p.key} 
                                                                onClick={() => {
                                                                    if (selectedMember.role !== 'admin') {
                                                                        handlePermissionToggle(selectedMember._id, p.key);
                                                                    }
                                                                }}
                                                                className={`p-2.5 rounded-lg border flex items-start gap-2 select-none cursor-pointer transition-all duration-200 shadow-sm ${
                                                                    isChecked 
                                                                        ? 'bg-indigo-50/10 border-indigo-200 hover:bg-indigo-50/20' 
                                                                        : 'bg-white border-slate-200 hover:bg-slate-50/30'
                                                                } ${selectedMember.role === 'admin' ? 'cursor-not-allowed opacity-75' : ''}`}
                                                            >
                                                                <div className="mt-0.5 shrink-0 text-indigo-600">
                                                                    {isChecked ? <CheckSquare size={14} /> : <Square size={14} className="text-slate-350" />}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-[11px] font-bold text-slate-800 leading-tight">{p.label}</p>
                                                                    <p className="text-[9px] text-slate-400 mt-0.5 leading-normal truncate" title={p.desc}>{p.desc}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 italic text-xs">
                            Select a team member to configure permissions
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
