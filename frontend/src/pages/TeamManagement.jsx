import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, FileDown, UserRoundCog, KeyRound } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from "@/hooks/use-toast";
import { AddTeamMemberDialog } from '@/components/AddTeamMemberDialog';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { exportTableToPDF } from '../utils/pdfExport';

export default function TeamManagement() {
    const { user, impersonateUser, isImpersonating } = useAuth();
    const { isAdmin } = usePermissions();
    const [members, setMembers] = useState([]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [memberToEdit, setMemberToEdit] = useState(null);
    const { toast } = useToast();

    const handleImpersonate = async (member) => {
        if (!window.confirm(`Switch to ${member.name}'s account? You can exit anytime from the banner at the top.`)) return;
        try {
            await impersonateUser(member._id);
        } catch (err) {
            const msg = typeof err === 'string' ? err : (err.error || err.message || 'Failed to switch account');
            toast({ variant: 'destructive', title: 'Switch Failed', description: msg });
        }
    };

    const handleExportPDF = () => {
        const headers = ["Name", "Email", "Role (Multiple)", "Title (Single)", "Joining Date"];
        const rows = members.map(m => [
            m.name || 'N/A',
            m.email || 'N/A',
            Array.isArray(m.designation) ? m.designation.join(', ') : (m.designation || 'N/A'),
            m.role || 'N/A',
            m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : 'N/A'
        ]);
        exportTableToPDF("Team Members Registry Report", headers, rows, `Team_Members_${Date.now()}.pdf`);
    };

    const fetchTeam = async () => {
        setLoading(true);
        try {
            const res = await api.get('/team');
            if (res.success) setMembers(res.data);
            
            try {
                const statsRes = await api.get('/time-tracking/stats');
                if (statsRes.success) setStats(statsRes.data);
            } catch (err) {
                console.error("Failed to fetch time tracking stats", err);
            }
        } catch (err) {
            console.error("Failed to fetch team", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeam();
    }, []);

    const formatTime = (totalSeconds) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    const handleEdit = (member) => {
        setMemberToEdit(member);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
        try {
            const res = await api.delete(`/team/${id}`);
            if (res.success) {
                toast({ title: "User Deleted", description: "Team member has been removed." });
                fetchTeam();
            }
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete user." });
        }
    };
    const handleResetPasswordPrompt = async (member) => {
        const newPassword = window.prompt(`Enter new password for ${member.name}:`);
        if (newPassword === null) return;
        if (newPassword.trim().length < 6) {
            toast({ variant: "destructive", title: "Validation Error", description: "Password must be at least 6 characters long." });
            return;
        }
        try {
            const res = await api.put(`/team/${member._id}/reset-password`, { password: newPassword });
            if (res.success) {
                toast({ title: "Success", description: `Password reset successfully for ${member.name}` });
            } else {
                toast({ variant: "destructive", title: "Error", description: res.error || "Failed to reset password." });
            }
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: err.response?.data?.error || "Failed to reset password." });
        }
    };

    if (loading) return <div>Loading team...</div>;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xl font-bold">Team Members</CardTitle>
                    <div className="flex gap-2">
                    {isAdmin && (
                        <Button variant="outline" size="sm" className="gap-2 border-red-200 text-red-700 hover:bg-red-50" onClick={handleExportPDF}>
                            <FileDown size={14} /> Export to PDF
                        </Button>
                    )}
                    {isAdmin && (
                        <Button size="sm" className="gap-2" onClick={() => { setMemberToEdit(null); setIsDialogOpen(true); }}>
                            <Plus size={14} /> Add Member
                        </Button>
                    )}
                    </div>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Rank</TableHead>
                                <TableHead>Points</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.map((member) => (
                                <TableRow key={member._id}>
                                    <TableCell className="font-medium">{member.name}</TableCell>
                                    <TableCell className="text-sm font-semibold text-slate-500">
                                        {Array.isArray(member.designation) ? member.designation.join(', ') : (member.designation || '-')}
                                    </TableCell>
                                    <TableCell className="capitalize">{member.role?.replace('_', ' ')}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {member.rank ? member.rank.replace('_', ' ') : 'Trainee'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{member.points || 0}</TableCell>
                                    <TableCell>{member.email}</TableCell>
                                    <TableCell className="text-right flex items-center justify-end gap-2">
                                        {/* Switch Account — Admin only, not for other admins */}
                                        {isAdmin && !isImpersonating && member.role !== 'admin' && (
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 border-violet-200"
                                                title={`Switch to ${member.name}'s account`}
                                                onClick={() => handleImpersonate(member)}
                                            >
                                                <UserRoundCog size={14} />
                                            </Button>
                                        )}
                                        {isAdmin && (
                                            <Button variant="outline" size="icon" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200" title="Reset Password" onClick={() => handleResetPasswordPrompt(member)}>
                                                <KeyRound size={14} />
                                            </Button>
                                        )}
                                        {isAdmin && (
                                            <Button variant="outline" size="icon" title="Edit Member" onClick={() => handleEdit(member)}>
                                                <Pencil size={14} />
                                            </Button>
                                        )}
                                        {isAdmin && (
                                            <Button variant="outline" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" title="Delete Member" onClick={() => handleDelete(member._id)}>
                                                <Trash2 size={14} />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {stats.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl font-bold">Active Screen Time</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Today</TableHead>
                                    <TableHead>This Week</TableHead>
                                    <TableHead>This Month</TableHead>
                                    <TableHead>This Year</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stats.map((stat) => (
                                    <TableRow key={stat.user._id}>
                                        <TableCell className="font-medium">{stat.user.name}</TableCell>
                                        <TableCell className="capitalize text-slate-500 text-sm">
                                            {stat.user.role?.replace('_', ' ')}
                                        </TableCell>
                                        <TableCell className="font-semibold text-blue-600">
                                            {formatTime(stat.today)}
                                        </TableCell>
                                        <TableCell>{formatTime(stat.week)}</TableCell>
                                        <TableCell>{formatTime(stat.month)}</TableCell>
                                        <TableCell>{formatTime(stat.year)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            <AddTeamMemberDialog
                open={isDialogOpen}
                setOpen={setIsDialogOpen}
                onSuccess={fetchTeam}
                memberToEdit={memberToEdit}
            />
        </div>
    );
}
