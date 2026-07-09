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
import { Plus, Pencil, Trash2, FileDown } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from "@/hooks/use-toast";
import { AddTeamMemberDialog } from '@/components/AddTeamMemberDialog';
import { useAuth } from '@/context/AuthContext';
import { exportTableToPDF } from '../utils/pdfExport';

export default function TeamManagement() {
    const { user } = useAuth();
    const [members, setMembers] = useState([]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [memberToEdit, setMemberToEdit] = useState(null);
    const { toast } = useToast();

    const handleExportPDF = () => {
        const headers = ["Name", "Email", "Role", "Designation", "Joining Date"];
        const rows = members.map(m => [
            m.name || 'N/A',
            m.email || 'N/A',
            m.role || 'N/A',
            m.designation || 'N/A',
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

    if (loading) return <div>Loading team...</div>;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xl font-bold">Team Members</CardTitle>
                    <div className="flex gap-2">
                        {user?.role === 'admin' && (
                            <Button variant="outline" size="sm" className="gap-2 border-red-200 text-red-700 hover:bg-red-50" onClick={handleExportPDF}>
                                <FileDown size={14} /> Export to PDF
                            </Button>
                        )}
                        <Button size="sm" className="gap-2" onClick={() => { setMemberToEdit(null); setIsDialogOpen(true); }}>
                            <Plus size={14} /> Add Member
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Designation</TableHead>
                                <TableHead>Role</TableHead>
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
                                        {member.designation || '-'}
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
                                        <Button variant="outline" size="icon" title="Edit Member" onClick={() => handleEdit(member)}>
                                            <Pencil size={14} />
                                        </Button>
                                        <Button variant="outline" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" title="Delete Member" onClick={() => handleDelete(member._id)}>
                                            <Trash2 size={14} />
                                        </Button>
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
