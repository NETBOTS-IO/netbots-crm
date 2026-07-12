import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { Search, ShieldAlert, CheckSquare, Square, RefreshCcw } from 'lucide-react';

const AVAILABLE_PERMISSIONS = [
    { key: 'view_dashboard', label: 'View Dashboard' },
    { key: 'can_view_leads', label: 'View Leads' },
    { key: 'can_add_leads', label: 'Add Leads' },
    { key: 'can_edit_leads', label: 'Edit Leads' },
    { key: 'can_delete_leads', label: 'Delete Leads' },
    { key: 'manage_clients', label: 'Manage Clients' },
    { key: 'manage_team', label: 'Manage Team' },
    { key: 'manage_permissions', label: 'Manage Permissions' },
    { key: 'view_commissions', label: 'View Commissions' },
    { key: 'manage_payouts', label: 'Manage Payouts' },
    { key: 'view_leaderboard', label: 'View Leaderboard' },
    { key: 'can_bulk_manage_leads', label: 'Bulk Manage Leads' },
];

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

    useEffect(() => {
        fetchTeam();
    }, []);

    const fetchTeam = async () => {
        try {
            const res = await api.get('/team');
            if (res.success) {
                setTeam(res.data);
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
                AVAILABLE_PERMISSIONS.forEach(p => {
                    updated[p.key] = checkAll;
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
        member.designation?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
                <RefreshCcw className="animate-spin text-blue-600 mb-4" size={32} />
                <p className="font-bold uppercase text-xs tracking-widest">Loading granular permission schema...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-lg border shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Permissions & Access Controls</h1>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Manage templates and granular access levels for each team member.</p>
                </div>
                <div className="relative w-full md:w-64 shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input
                        className="pl-10 h-10 font-bold"
                        placeholder="Search team member..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card className="shadow-sm">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 border-b">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-slate-700">User / Role</th>
                                    <th className="px-6 py-4 font-bold text-slate-700 text-center">Presets / Templates</th>
                                    {AVAILABLE_PERMISSIONS.map(p => (
                                        <th key={p.key} className="px-6 py-4 font-medium text-center text-xs tracking-tight uppercase whitespace-nowrap">
                                            {p.label}
                                        </th>
                                    ))}
                                    <th className="px-6 py-4 font-bold text-slate-700 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredTeam.length === 0 ? (
                                    <tr>
                                        <td colSpan={ AVAILABLE_PERMISSIONS.length + 3 } className="text-center py-8 text-slate-400 italic">No team members match your criteria</td>
                                    </tr>
                                ) : filteredTeam.map((member) => {
                                    const allChecked = AVAILABLE_PERMISSIONS.every(p => !!member.permissions?.[p.key]);
                                    return (
                                        <tr key={member._id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">{member.name}</div>
                                                <div className="text-slate-500 text-[10px] uppercase font-semibold">{Array.isArray(member.designation) && member.designation.length > 0 ? member.designation.join(', ') : (member.designation || member.role?.replace('_', ' '))}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1.5 justify-center">
                                                    <Button variant="outline" size="xs" className="h-6 text-[9px] font-black uppercase py-0 px-2" onClick={() => applyTemplate(member._id, 'Supervisor')} disabled={member.role === 'admin'}>Supervisor</Button>
                                                    <Button variant="outline" size="xs" className="h-6 text-[9px] font-black uppercase py-0 px-2" onClick={() => applyTemplate(member._id, 'LeadCollector')} disabled={member.role === 'admin'}>Collector</Button>
                                                    <Button variant="outline" size="xs" className="h-6 text-[9px] font-black uppercase py-0 px-2" onClick={() => applyTemplate(member._id, 'LeadVerifier')} disabled={member.role === 'admin'}>Verifier</Button>
                                                    <Button variant="outline" size="xs" className="h-6 text-[9px] font-black uppercase py-0 px-2" onClick={() => applyTemplate(member._id, 'LeadCloser')} disabled={member.role === 'admin'}>Closer</Button>
                                                    <Button variant="ghost" size="xs" className="h-6 text-[9px] font-black uppercase py-0 px-2 text-rose-600 hover:bg-rose-50" onClick={() => applyTemplate(member._id, 'Reset')} disabled={member.role === 'admin'}>Clear</Button>
                                                </div>
                                            </td>
                                            {AVAILABLE_PERMISSIONS.map(p => (
                                                <td key={p.key} className="px-6 py-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!member.permissions?.[p.key]}
                                                        onChange={() => handlePermissionToggle(member._id, p.key)}
                                                        disabled={member.role === 'admin'}
                                                        className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                                                    />
                                                </td>
                                            ))}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <Button 
                                                        variant="ghost"
                                                        size="icon"
                                                        title={allChecked ? "Uncheck All" : "Select All"}
                                                        onClick={() => toggleAllForUser(member._id, !allChecked)}
                                                        disabled={member.role === 'admin'}
                                                        className="h-8 w-8 text-slate-500"
                                                    >
                                                        {allChecked ? <CheckSquare size={16} /> : <Square size={16} />}
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        onClick={() => handleSave(member._id)}
                                                        disabled={member.role === 'admin' || saving[member._id]}
                                                        className="font-bold text-xs uppercase"
                                                    >
                                                        {saving[member._id] ? 'Saving...' : 'Save'}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
