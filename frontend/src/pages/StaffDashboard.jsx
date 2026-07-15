import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    TrendingUp,
    Users,
    Target,
    Activity as ActivityIcon,
    CheckCircle2,
    Clock,
    IndianRupee,
    Award,
    Flame,
    Share2
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, description, children }) => (
    <Card className="border border-slate-200 bg-white hover:border-slate-300 transition-all duration-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</CardTitle>
            <Icon size={16} className="text-slate-400" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-semibold text-slate-900 tracking-tight">{value}</div>
            {description && <p className="text-xs text-slate-500 mt-1 font-medium">{description}</p>}
            {children}
        </CardContent>
    </Card>
);

const StaffDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const res = await api.get('/dashboard/staff');
                if (res.success) {
                    setData(res.data);
                }
            } catch (err) {
                console.error("Failed to load staff dashboard", err);
            } finally {
                setLoading(false);
            }
        };
        loadDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-bold uppercase text-xs tracking-widest animate-pulse">Loading Personalized Dashboard...</p>
            </div>
        );
    }

    const stats = data?.stats || {
        totalLeads: 0,
        warmLeads: 0,
        sqlLeads: 0,
        closedDeals: 0,
        points: 0,
        rank: 'rookie',
        totalCommissionEarned: 0,
        partnerTier: null,
        referralCode: '',
        totalClientsReferred: 0
    };

    const commissions = data?.commissions || [];
    const activities = data?.activities || [];
    const team = data?.team || [];
    const claimedLeads = data?.claimedLeads || [];

    // Calculate progress to next rank
    const getNextRankInfo = (points) => {
        if (points >= 200) return { nextRank: 'Max RankReached', nextPoints: 200, progress: 100 };
        if (points >= 100) return { nextRank: 'Champion', nextPoints: 200, progress: ((points - 100) / 100) * 100 };
        if (points >= 50) return { nextRank: 'Gold Closer', nextPoints: 100, progress: ((points - 50) / 50) * 100 };
        if (points >= 20) return { nextRank: 'Elite Closer', nextPoints: 50, progress: ((points - 20) / 30) * 100 };
        if (points >= 10) return { nextRank: 'Closer', nextPoints: 20, progress: ((points - 10) / 10) * 100 };
        return { nextRank: 'Hunter', nextPoints: 10, progress: (points / 10) * 100 };
    };

    const rankInfo = getNextRankInfo(stats.points);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header / Welcome Banner */}
            <div className="bg-white text-slate-900 rounded-lg p-6 border border-slate-200 shadow-sm">
                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-slate-100 text-slate-800 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded border border-slate-200">
                                {user?.role?.replace('_', ' ')}
                            </span>
                            {stats.partnerTier && (
                                <span className="bg-slate-900 text-white text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded">
                                    {stats.partnerTier} Tier
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                            Welcome back, {user?.name}!
                        </h1>
                        <p className="text-slate-500 text-sm mt-1 max-w-lg font-medium">
                            Check out your personalized performance stats, commission reports, and team progress.
                        </p>
                    </div>

                    {stats.referralCode && (
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 shrink-0">
                            <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold uppercase tracking-wider mb-1">
                                <Share2 size={14} />
                                Referral Program
                            </div>
                            <div className="text-lg font-semibold tracking-widest text-slate-900">{stats.referralCode}</div>
                            <div className="text-[10px] text-slate-500 mt-1 font-medium">
                                {stats.totalClientsReferred} Clients referred successfully
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Leads Submitted"
                    value={stats.totalLeads}
                    icon={Target}
                >
                    <div className="flex gap-2 mt-2">
                        <span className="text-[10px] font-semibold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                            {stats.warmLeads} Warm
                        </span>
                        <span className="text-[10px] font-semibold uppercase bg-slate-900 text-white px-2 py-0.5 rounded">
                            {stats.sqlLeads} SQL
                        </span>
                    </div>
                </StatCard>

                <StatCard
                    title="Closed Deals"
                    value={stats.closedDeals}
                    icon={CheckCircle2}
                    description="Successfully onboarded clients"
                />

                <StatCard
                    title="Earnings Ledger"
                    value={`PKR ${stats.totalCommissionEarned.toLocaleString()}`}
                    icon={IndianRupee}
                    description="Total commission approved"
                />

                <StatCard
                    title="Current Rank"
                    value={stats.rank.replace('_', ' ').toUpperCase()}
                    icon={Award}
                >
                    <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-[10px] font-medium text-slate-500">
                            <span>{stats.points} pts</span>
                            <span>Next: {rankInfo.nextRank} ({rankInfo.nextPoints} pts)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-slate-900 h-1.5 rounded-full transition-all duration-500" style={{ width: `${rankInfo.progress}%` }}></div>
                        </div>
                    </div>
                </StatCard>
            </div>

            {/* Main Sections: Activities, Earnings, and Team */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Activity Log */}
                <Card className="lg:col-span-1 border border-slate-200">
                    <CardHeader className="border-b border-slate-100">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                            <Clock size={16} className="text-slate-400" />
                            My Recent Activities
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                            {activities.map((act) => (
                                <div key={act._id} className="flex items-start gap-3 border-l border-slate-200 pl-3 pb-3 last:pb-0">
                                    <div className="flex flex-col">
                                        <p className="text-xs font-medium text-slate-800">{act.description}</p>
                                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                                            {new Date(act.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {activities.length === 0 && (
                                <div className="text-center py-12 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                                    No recorded activities
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Earnings & Commission */}
                <Card className="lg:col-span-2 border border-slate-200">
                    <CardHeader className="border-b border-slate-100">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                            <IndianRupee size={16} className="text-slate-400" />
                            Personal Commission Ledger
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="rounded-lg border border-slate-200 overflow-hidden shadow-sm bg-white">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-2.5 text-left font-medium text-slate-500 uppercase tracking-wider text-[9px]">Client</th>
                                        <th className="px-4 py-2.5 text-left font-medium text-slate-500 uppercase tracking-wider text-[9px]">Date Approved</th>
                                        <th className="px-4 py-2.5 text-left font-medium text-slate-500 uppercase tracking-wider text-[9px]">Status</th>
                                        <th className="px-4 py-2.5 text-right font-medium text-slate-500 uppercase tracking-wider text-[9px]">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {commissions.map((comm) => (
                                        <tr key={comm._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3 font-semibold text-slate-700">{comm.clientId?.companyName || 'N/A'}</td>
                                            <td className="px-4 py-3 font-medium text-slate-500">
                                                {new Date(comm.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full ${comm.status === 'paid' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-800 border border-slate-200'}`}>
                                                    {comm.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-900 font-semibold">
                                                PKR {comm.commissionAmount.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {commissions.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-4 py-16 text-center text-slate-400 font-semibold uppercase text-[10px] tracking-widest bg-slate-50/20">
                                                No Earnings Recorded Yet
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* My Active Claimed Leads */}
            <Card className="border border-slate-200">
                <CardHeader className="border-b border-slate-100">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                        <Target size={16} className="text-slate-400" />
                        My Active Claimed Leads
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="rounded-lg border border-slate-200 overflow-hidden shadow-sm bg-white">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-2.5 text-left font-medium text-slate-500 uppercase tracking-wider text-[9px]">Company Name</th>
                                    <th className="px-4 py-2.5 text-left font-medium text-slate-500 uppercase tracking-wider text-[9px]">Stage</th>
                                    <th className="px-4 py-2.5 text-left font-medium text-slate-500 uppercase tracking-wider text-[9px]">Temperature</th>
                                    <th className="px-4 py-2.5 text-right font-medium text-slate-500 uppercase tracking-wider text-[9px]">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {claimedLeads.map((lead) => (
                                    <tr key={lead._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3 font-semibold text-slate-700">{lead.companyName}</td>
                                        <td className="px-4 py-3">
                                            <span className="inline-block text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                                                {lead.stage}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-block text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-950 text-white">
                                                {lead.temperature}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button 
                                                onClick={() => navigate(`/leads/${lead._id}`)}
                                                className="text-[10px] font-semibold uppercase text-slate-900 hover:underline"
                                            >
                                                View / Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {claimedLeads.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-16 text-center text-slate-400 font-semibold uppercase text-[10px] tracking-widest bg-slate-50/20">
                                            You haven't claimed any leads yet
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Team Leaderboard / Coworkers */}
            <Card className="border border-slate-200">
                <CardHeader className="border-b border-slate-100">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                        <Flame size={16} className="text-slate-400" />
                        Team Leaderboard & Activity Standings
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        {team.map((member, index) => {
                            const isSelf = member.name === user?.name;
                            return (
                                <div
                                    key={member._id}
                                    className={`relative p-4 rounded-lg border transition-all duration-200 ${isSelf ? 'bg-slate-100 border-slate-300 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                                >
                                    <div className="absolute top-2 right-2 text-xs font-semibold text-slate-300">
                                        #{index + 1}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-semibold uppercase tracking-wider text-slate-600 border border-slate-200 shrink-0">
                                            {member.name.substring(0, 2)}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-xs font-semibold text-slate-800 truncate flex items-center gap-1.5">
                                                {member.name}
                                                {isSelf && <span className="bg-slate-950 text-white text-[8px] font-semibold uppercase px-1 rounded-sm">You</span>}
                                            </h4>
                                            <p className="text-[10px] text-slate-400 uppercase font-semibold truncate tracking-wider">
                                                {member.designation && member.designation.length > 0 ? member.designation[0] : member.role}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex justify-between items-center text-[10px]">
                                        <span className="font-semibold text-slate-500 uppercase tracking-widest text-[9px]">{member.rank.replace('_', ' ')}</span>
                                        <span className="font-semibold text-slate-900">{member.points} Points</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default StaffDashboard;
