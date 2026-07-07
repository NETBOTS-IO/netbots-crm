import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

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

export default function PermissionsManagement() {
    const { user } = useAuth();
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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

    const handleSave = async (userId) => {
        setSaving(true);
        try {
            const memberToUpdate = team.find(m => m._id === userId);
            const res = await api.put(`/team/${userId}/permissions`, {
                permissions: memberToUpdate.permissions
            });
            if (res.success) {
                alert('Permissions updated successfully!');
            }
        } catch (err) {
            console.error('Failed to update permissions', err);
            alert('Error saving permissions');
        } finally {
            setSaving(false);
        }
    };

    if (user?.role !== 'admin') {
        return <div className="p-8">Access Denied. Admin only.</div>;
    }

    if (loading) return <div>Loading permissions...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Permissions Management</h1>
                <p className="text-slate-500">Manage granular access controls for each team member.</p>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 border-b">
                                <tr>
                                    <th className="px-6 py-4 font-medium">User</th>
                                    <th className="px-6 py-4 font-medium">Role</th>
                                    {AVAILABLE_PERMISSIONS.map(p => (
                                        <th key={p.key} className="px-6 py-4 font-medium text-center">
                                            {p.label}
                                        </th>
                                    ))}
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {team.map((member) => (
                                    <tr key={member._id} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{member.name}</div>
                                            <div className="text-slate-500 text-xs">{member.email}</div>
                                        </td>
                                        <td className="px-6 py-4 capitalize text-slate-500">
                                            {member.role?.replace('_', ' ')}
                                        </td>
                                        {AVAILABLE_PERMISSIONS.map(p => (
                                            <td key={p.key} className="px-6 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={!!member.permissions?.[p.key]}
                                                    onChange={() => handlePermissionToggle(member._id, p.key)}
                                                    disabled={member.role === 'admin'}
                                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                                                />
                                            </td>
                                        ))}
                                        <td className="px-6 py-4 text-right">
                                            <Button 
                                                size="sm" 
                                                onClick={() => handleSave(member._id)}
                                                disabled={member.role === 'admin' || saving}
                                            >
                                                Save
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
