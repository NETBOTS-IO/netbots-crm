import { useEffect, useState, useCallback } from 'react';
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
import { Plus, Pencil, Trash2, FileDown, UserRoundCog, KeyRound, ChevronDown, ChevronUp, BarChart3, Users, CheckCircle2, TrendingUp, Clock, Activity, Wifi, WifiOff } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from "@/hooks/use-toast";
import { AddTeamMemberDialog } from '@/components/AddTeamMemberDialog';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { exportTableToPDF } from '../utils/pdfExport';

// ─── Mini SVG Bar Chart ───────────────────────────────────────────────────────
const MiniBarChart = ({ data, color = '#3b82f6' }) => {
    const maxVal = Math.max(...data.map(d => d.seconds), 1);
    const width = 140;
    const height = 36;
    const barW = 14;
    const gap = 4;

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {data.map((d, i) => {
                const barH = Math.max(2, (d.seconds / maxVal) * (height - 4));
                const x = i * (barW + gap);
                const y = height - barH;
                const dayLabel = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1);
                return (
                    <g key={i}>
                        <rect x={x} y={y} width={barW} height={barH} rx={2} fill={color} opacity={d.seconds > 0 ? 0.8 : 0.15} />
                        <text x={x + barW / 2} y={height + 10} textAnchor="middle" fontSize={8} fill="#94a3b8">{dayLabel}</text>
                    </g>
                );
            })}
        </svg>
    );
};

// ─── Format seconds ───────────────────────────────────────────────────────────
const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
};

// ─── Format last seen ─────────────────────────────────────────────────────────
const formatLastSeen = (lastActivityAt) => {
    if (!lastActivityAt) return 'Never';
    const diff = Math.floor((Date.now() - new Date(lastActivityAt).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(lastActivityAt).toLocaleDateString();
};

// ─── Rank color ───────────────────────────────────────────────────────────────
const rankColors = {
    rookie: 'bg-slate-100 text-slate-600',
    hunter: 'bg-blue-100 text-blue-700',
    closer: 'bg-amber-100 text-amber-700',
    elite_closer: 'bg-purple-100 text-purple-700',
    gold_closer: 'bg-yellow-100 text-yellow-700',
    champion: 'bg-emerald-100 text-emerald-700'
};

// ─── Member Analytics Card ────────────────────────────────────────────────────
const MemberAnalyticsCard = ({ member }) => {
    const todaySeconds = member.dailyTime?.[6]?.seconds || 0;

    return (
        <div className="border-t border-slate-100 bg-gradient-to-br from-slate-50 to-white px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Stats Row */}
            <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Lead Activity</p>
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-slate-600"><Users size={11} /> Collected</span>
                        <span className="font-black text-blue-700">{member.leadsCollected}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-slate-600"><CheckCircle2 size={11} /> Verified</span>
                        <span className="font-black text-amber-700">{member.leadsVerified}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-slate-600"><TrendingUp size={11} /> Closed</span>
                        <span className="font-black text-emerald-700">{member.dealsClosed}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Commission</p>
                <div className="flex flex-col gap-1.5">
                    <p className="text-lg font-black text-emerald-700">
                        PKR {(member.commissionEarned || 0).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-400">Total earned</p>
                </div>
                <div className="mt-2">
                    <p className="text-[10px] text-slate-400">Today Active</p>
                    <p className="text-sm font-bold text-blue-600">{formatTime(todaySeconds)}</p>
                </div>
            </div>

            <div className="space-y-3 col-span-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Activity — Last 7 Days</p>
                <div className="flex items-end gap-4">
                    <MiniBarChart data={member.dailyTime || []} color="#3b82f6" />
                    <div className="text-[10px] text-slate-400 space-y-1">
                        {(member.dailyTime || []).slice(-3).map(d => (
                            <div key={d.date} className="flex items-center gap-2">
                                <span>{new Date(d.date).toLocaleDateString('en', { weekday: 'short' })}</span>
                                <span className="font-bold text-slate-600">{formatTime(d.seconds)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function TeamManagement() {
    const { user, impersonateUser, isImpersonating } = useAuth();
    const { isAdmin } = usePermissions();
    const [members, setMembers] = useState([]);
    const [analytics, setAnalytics] = useState([]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [expandedMember, setExpandedMember] = useState(null);
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

    const fetchAnalytics = useCallback(async () => {
        if (!isAdmin) return;
        setAnalyticsLoading(true);
        try {
            const res = await api.get('/team/analytics');
            if (res.success) setAnalytics(res.data);
        } catch (err) {
            console.error("Failed to fetch team analytics", err);
        } finally {
            setAnalyticsLoading(false);
        }
    }, [isAdmin]);

    useEffect(() => {
        fetchTeam();
    }, []);

    useEffect(() => {
        fetchAnalytics();
        // Auto-refresh every 60 seconds for live presence
        const interval = setInterval(fetchAnalytics, 60000);
        return () => clearInterval(interval);
    }, [fetchAnalytics]);

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
                fetchAnalytics();
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

    // Merge analytics data with members list
    const getMemberAnalytics = (memberId) => analytics.find(a => a._id?.toString() === memberId?.toString());

    // Count online members
    const onlineCount = analytics.filter(a => a.isOnline).length;

    if (loading) return (
        <div className="space-y-4">
            {Array.from({length: 5}).map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
            ))}
        </div>
    );

    return (
        <div className="space-y-6">
            {/* ─── Online Status Banner ─────────────────────────────────────── */}
            {isAdmin && analytics.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-black text-slate-700 flex items-center gap-2">
                            <Activity size={16} className="text-emerald-600" />
                            Team Presence
                            <span className="text-xs font-bold text-slate-400 ml-1">(auto-refreshes every 60s)</span>
                        </h3>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                            {onlineCount} / {analytics.length} Online
                        </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        {analytics.map(member => (
                            <div key={member._id} className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${member.isOnline ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                <div className="relative shrink-0">
                                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-700 text-xs">
                                        {member.name?.[0]?.toUpperCase()}
                                    </div>
                                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${member.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold truncate leading-tight">{member.name?.split(' ')[0]}</p>
                                    <p className="text-[10px] leading-tight opacity-70">
                                        {member.isOnline ? (
                                            <span className="flex items-center gap-0.5"><Wifi size={9} /> Live</span>
                                        ) : (
                                            <span className="flex items-center gap-0.5"><WifiOff size={9} /> {formatLastSeen(member.lastActivityAt)}</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── Team Members Table with Expandable Analytics ─────────────── */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Users size={20} className="text-blue-600" /> Team Members
                        {analyticsLoading && <span className="text-xs text-slate-400 font-normal animate-pulse ml-2">Refreshing analytics...</span>}
                    </CardTitle>
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
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead className="font-bold">Name</TableHead>
                                <TableHead className="font-bold">Role</TableHead>
                                <TableHead className="font-bold">Title</TableHead>
                                <TableHead className="font-bold text-center">Status</TableHead>
                                <TableHead className="font-bold text-center">Last Seen</TableHead>
                                <TableHead className="font-bold text-center">Points</TableHead>
                                <TableHead className="font-bold">Email</TableHead>
                                <TableHead className="text-right font-bold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.map((member) => {
                                const ma = getMemberAnalytics(member._id);
                                const isExpanded = expandedMember === member._id;
                                return (
                                    <>
                                        <TableRow key={member._id} className="hover:bg-slate-50/70 transition-colors">
                                            <TableCell className="font-semibold text-slate-900">{member.name}</TableCell>
                                            <TableCell className="text-sm font-semibold text-slate-500">
                                                {Array.isArray(member.designation) ? member.designation.join(', ') : (member.designation || '-')}
                                            </TableCell>
                                            <TableCell className="capitalize">
                                                <Badge variant="outline" className={`text-[10px] capitalize ${rankColors[member.rank] || 'bg-slate-100 text-slate-600'}`}>
                                                    {member.rank ? member.rank.replace('_', ' ') : 'Trainee'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {ma ? (
                                                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${ma.isOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${ma.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                                        {ma.isOnline ? 'Online' : 'Offline'}
                                                    </span>
                                                ) : '—'}
                                            </TableCell>
                                            <TableCell className="text-center text-xs text-slate-500">
                                                {ma ? formatLastSeen(ma.lastActivityAt) : '—'}
                                            </TableCell>
                                            <TableCell className="text-center font-bold text-amber-700">{member.points || 0}</TableCell>
                                            <TableCell className="text-slate-500 text-sm">{member.email}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* Expand analytics */}
                                                    {isAdmin && ma && (
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8 border-blue-200 text-blue-600 hover:bg-blue-50"
                                                            title="View Analytics"
                                                            onClick={() => setExpandedMember(isExpanded ? null : member._id)}
                                                        >
                                                            {isExpanded ? <ChevronUp size={14} /> : <BarChart3 size={14} />}
                                                        </Button>
                                                    )}
                                                    {isAdmin && !isImpersonating && member.role !== 'admin' && (
                                                        <Button variant="outline" size="icon" className="h-8 w-8 text-violet-600 hover:text-violet-700 hover:bg-violet-50 border-violet-200" title={`Switch to ${member.name}'s account`} onClick={() => handleImpersonate(member)}>
                                                            <UserRoundCog size={13} />
                                                        </Button>
                                                    )}
                                                    {isAdmin && (
                                                        <Button variant="outline" size="icon" className="h-8 w-8 text-amber-600 hover:bg-amber-50 border-amber-200" title="Reset Password" onClick={() => handleResetPasswordPrompt(member)}>
                                                            <KeyRound size={13} />
                                                        </Button>
                                                    )}
                                                    {isAdmin && (
                                                        <Button variant="outline" size="icon" className="h-8 w-8" title="Edit Member" onClick={() => handleEdit(member)}>
                                                            <Pencil size={13} />
                                                        </Button>
                                                    )}
                                                    {isAdmin && (
                                                        <Button variant="outline" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" title="Delete Member" onClick={() => handleDelete(member._id)}>
                                                            <Trash2 size={13} />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                        {/* ── Expandable Analytics Row ── */}
                                        {isExpanded && ma && (
                                            <tr key={`${member._id}-analytics`}>
                                                <td colSpan={8} className="p-0 border-b border-slate-100">
                                                    <MemberAnalyticsCard member={ma} />
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* ─── Active Screen Time Table ─────────────────────────────────── */}
            {stats.length > 0 && isAdmin && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <Clock size={16} className="text-blue-600" /> Active Screen Time
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead>Name</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="text-center">Today</TableHead>
                                    <TableHead className="text-center">This Week</TableHead>
                                    <TableHead className="text-center">This Month</TableHead>
                                    <TableHead className="text-center">This Year</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stats.map((stat) => (
                                    <TableRow key={stat.user._id} className="hover:bg-slate-50/70">
                                        <TableCell className="font-medium">{stat.user.name}</TableCell>
                                        <TableCell className="capitalize text-slate-500 text-sm">
                                            {stat.user.role?.replace('_', ' ')}
                                        </TableCell>
                                        <TableCell className="text-center font-semibold text-blue-600">
                                            {formatTime(stat.today)}
                                        </TableCell>
                                        <TableCell className="text-center">{formatTime(stat.week)}</TableCell>
                                        <TableCell className="text-center">{formatTime(stat.month)}</TableCell>
                                        <TableCell className="text-center">{formatTime(stat.year)}</TableCell>
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
                onSuccess={() => { fetchTeam(); fetchAnalytics(); }}
                memberToEdit={memberToEdit}
            />
        </div>
    );
}
