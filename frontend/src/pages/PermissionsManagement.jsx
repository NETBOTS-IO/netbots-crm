import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { Search, ShieldAlert, CheckSquare, Square, RefreshCcw, Shield, UserCheck } from 'lucide-react';

const CATEGORIZED_PERMISSIONS = [
    {
        category: 'Workspace & General',
        permissions: [
            { key: 'view_dashboard', label: 'View Dashboard', desc: 'Allows access to the main dashboard screens' },
            { key: 'view_leaderboard', label: 'View Leaderboard', desc: 'Allows viewing team rankings and stats' },
        ]
    },
    {
        category: 'Sales Pipeline',
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
        category: 'Team & Administration',
        permissions: [
            { key: 'manage_team', label: 'Manage Team', desc: 'Allows viewing member activity and modifying user stats' },
            { key: 'manage_permissions', label: 'Manage Permissions Matrix', desc: 'Allows updating granular role distribution permissions' },
            { key: 'view_commissions', label: 'View Commissions Ledger', desc: 'Allows viewing personal or team commission records' },
            { key: 'manage_payouts', label: 'Manage Payouts & Invoices', desc: 'Allows processing commission payouts' },
        ]
    }
];

const ALL_KEYS = CATEGORIZED_PERMISSIONS.reduce((acc, cat) => [...acc, ...cat.permissions.map(p => p.key)], []);

const TEMPLATES = {
    Supervisor: {
        view_dashboard: true, can_view_leads: true, can_add_leads: true, can_edit_leads: true,
        can_delete_leads: true, manage_clients: true, manage_team: true, manage_permissions: true,
        view_commissions: true, manage_payouts: true, view_leaderboard: true, can_bulk_manage_leads: true
    },
    LeadCollector: {
        view_dashboard: true, can_view_leads: true, can_add_leads: true, can_edit_leads: false,
        can_delete_leads: false, manage_clients: false, manage_team: false, manage_permissions: false,
        view_commissions: true, manage_payouts: false, view_leaderboard: true, can_bulk_manage_leads: false
    },
    LeadVerifier: {
        view_dashboard: true, can_view_leads: true, can_add_leads: false, can_edit_leads: true,
        can_delete_leads: false, manage_clients: false, manage_team: false, manage_permissions: false,
        view_commissions: true, manage_payouts: false, view_leaderboard: true, can_bulk_manage_leads: false
    },
    LeadCloser: {
        view_dashboard: true, can_view_leads: true, can_edit_leads: true, can_add_leads: false,
        can_delete_leads: false, manage_clients: true, manage_team: false, manage_permissions: false,
        view_commissions: true, manage_payouts: false, view_leaderboard: true, can_bulk_manage_leads: false
    },
    Reset: {
        view_dashboard: false, can_view_leads: false, can_add_leads: false, can_edit_leads: false,
        can_delete_leads: false, manage_clients: false, manage_team: false, manage_permissions: false,
        view_commissions: false, manage_payouts: false, view_leaderboard: false, can_bulk_manage_leads: false
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

    const toggleAllForUser = (userId, checkAll) => {
        setTeam(prevTeam => prevTeam.map(member => {
            if (member._id === userId) {
                const updated = {};
                ALL_KEYS.forEach(k => {
                    updated[k] = checkAll;
                });
                return { ...member, permissions: updated };
            }
            return member;
        }));
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
            <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
                <RefreshCcw className="animate-spin text-indigo-600 mb-4" size={32} />
                <p className="font-bold uppercase text-xs tracking-widest">Loading granular permission schema...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Shield className="text-indigo-600" size={24} /> Permissions & Role Distribution
                </h1>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mt-1">
                    Manage granular access levels and template presets for each contractor.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* LEFT SIDEBAR: Members List */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <Input
                            className="pl-10 h-10 border-slate-200"
                            placeholder="Search team member..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm max-h-[600px] overflow-y-auto divide-y divide-slate-100">
                        {filteredTeam.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 italic text-sm">
                                No team members found
                            </div>
                        ) : (
                            filteredTeam.map((member) => {
                                const isSelected = member._id === selectedMemberId;
                                return (
                                    <div
                                        key={member._id}
                                        onClick={() => setSelectedMemberId(member._id)}
                                        className={`p-4 cursor-pointer transition-colors flex items-center justify-between ${
                                            isSelected ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-slate-50/50'
                                        }`}
                                    >
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm text-slate-800 truncate">{member.name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight truncate mt-0.5">
                                                {Array.isArray(member.designation) && member.designation.length > 0 ? member.designation.join(', ') : (member.designation || member.role)}
                                            </p>
                                        </div>
                                        {member.role === 'admin' ? (
                                            <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-slate-900 text-white shrink-0">
                                                Admin
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                                                Staff
                                            </span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* RIGHT SIDEBAR: Permissions Detail */}
                <div className="lg:col-span-8">
                    {selectedMember ? (
                        <Card className="border border-slate-200 shadow-sm bg-white">
                            <CardHeader className="border-b border-slate-100 pb-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                            <UserCheck className="text-indigo-600" size={20} /> {selectedMember.name}
                                        </CardTitle>
                                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                            Role: {selectedMember.role} &mdash; Designations: {Array.isArray(selectedMember.designation) && selectedMember.designation.length > 0 ? selectedMember.designation.join(', ') : (selectedMember.designation || 'None')}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => handleSave(selectedMember._id)}
                                            disabled={selectedMember.role === 'admin' || saving[selectedMember._id]}
                                            className="font-bold text-xs uppercase bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-4 rounded shadow-sm"
                                        >
                                            {saving[selectedMember._id] ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                {/* Template Presets */}
                                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-lg space-y-3">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Apply Template Presets:</span>
                                    <div className="flex flex-wrap gap-2">
                                        <Button variant="outline" size="xs" className="h-7 text-[9px] font-bold uppercase border-slate-200 hover:bg-white bg-transparent" onClick={() => applyTemplate(selectedMember._id, 'Supervisor')} disabled={selectedMember.role === 'admin'}>Supervisor</Button>
                                        <Button variant="outline" size="xs" className="h-7 text-[9px] font-bold uppercase border-slate-200 hover:bg-white bg-transparent" onClick={() => applyTemplate(selectedMember._id, 'LeadCollector')} disabled={selectedMember.role === 'admin'}>Collector</Button>
                                        <Button variant="outline" size="xs" className="h-7 text-[9px] font-bold uppercase border-slate-200 hover:bg-white bg-transparent" onClick={() => applyTemplate(selectedMember._id, 'LeadVerifier')} disabled={selectedMember.role === 'admin'}>Verifier</Button>
                                        <Button variant="outline" size="xs" className="h-7 text-[9px] font-bold uppercase border-slate-200 hover:bg-white bg-transparent" onClick={() => applyTemplate(selectedMember._id, 'LeadCloser')} disabled={selectedMember.role === 'admin'}>Closer</Button>
                                        <Button variant="ghost" size="xs" className="h-7 text-[9px] font-bold uppercase text-red-650 hover:bg-red-50 border border-transparent hover:border-red-200" onClick={() => applyTemplate(selectedMember._id, 'Reset')} disabled={selectedMember.role === 'admin'}>Clear All</Button>
                                    </div>
                                </div>

                                {/* Permissions Categories Checklist */}
                                <div className="space-y-6">
                                    {CATEGORIZED_PERMISSIONS.map((category) => (
                                        <div key={category.category} className="space-y-3">
                                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b pb-1 border-slate-100">
                                                {category.category}
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                                            className={`p-3 rounded-lg border flex items-start gap-3 select-none cursor-pointer transition-colors ${
                                                                isChecked 
                                                                    ? 'bg-indigo-50/20 border-indigo-200 hover:bg-indigo-50/40' 
                                                                    : 'bg-white border-slate-200 hover:bg-slate-50/30'
                                                            } ${selectedMember.role === 'admin' ? 'cursor-not-allowed opacity-75' : ''}`}
                                                        >
                                                            <div className="mt-0.5 shrink-0 text-indigo-650">
                                                                {isChecked ? <CheckSquare size={16} /> : <Square size={16} className="text-slate-350" />}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-bold text-slate-800">{p.label}</p>
                                                                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{p.desc}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-400 italic">
                            Select a team member to configure permissions
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
