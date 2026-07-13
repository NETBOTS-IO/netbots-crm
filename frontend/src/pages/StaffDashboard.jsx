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

const StatCard = ({ title, value, icon: Icon, description, colorClass = "text-slate-600", bgClass = "bg-slate-100", children }) => (
    <Card className="hover:shadow-md transition-shadow duration-300 border-slate-100">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</CardTitle>
            <div className={`p-2 ${bgClass} rounded-xl ${colorClass} transition-transform duration-300 hover:scale-110`}>
                <Icon size={18} />
            </div>
        </CardHeader>
        <CardContent>
            <div className="text-3xl font-black text-slate-800 tracking-tight">{value}</div>
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
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-blue-50/10 text-blue-300 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-blue-500/30">
                                {user?.role?.replace('_', ' ')}
                            </span>
                            {stats.partnerTier && (
                                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-amber-500/30">
                                    {stats.partnerTier} Tier
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl font-black tracking-tight md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-200">
                            Welcome back, {user?.name}!
                        </h1>
                        <p className="text-slate-400 text-sm mt-1 max-w-lg font-medium">
                            Check out your personalized performance stats, commission reports, and team progress.
                        </p>
                    </div>

                    {stats.referralCode && (
                        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 shrink-0">
                            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">
                                <Share2 size={14} />
                                Referral Program
                            </div>
                            <div className="text-lg font-black tracking-widest text-slate-100">{stats.referralCode}</div>
                            <div className="text-[10px] text-slate-400 mt-1 font-bold">
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
                    bgClass="bg-blue-50/80"
                    colorClass="text-blue-600"
                >
                    <div className="flex gap-2 mt-2">
                        <span className="text-[10px] font-black uppercase bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200/50">
                            {stats.warmLeads} Warm
                        </span>
                        <span className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200/50">
                            {stats.sqlLeads} SQL
                        </span>
                    </div>
                </StatCard>

                <StatCard
                    title="Closed Deals"
                    value={stats.closedDeals}
                    icon={CheckCircle2}
                    description="Successfully onboarded clients"
                    bgClass="bg-emerald-50/80"
                    colorClass="text-emerald-600"
                />

                <StatCard
                    title="Earnings Ledger"
                    value={`PKR ${stats.totalCommissionEarned.toLocaleString()}`}
                    icon={IndianRupee}
                    description="Total commission approved"
                    bgClass="bg-indigo-50/80"
                    colorClass="text-indigo-600"
                />

                <StatCard
                    title="Current Rank"
                    value={stats.rank.replace('_', ' ').toUpperCase()}
                    icon={Award}
                    bgClass="bg-amber-50/80"
                    colorClass="text-amber-600"
                >
                    <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                            <span>{stats.points} pts</span>
                            <span>Next: {rankInfo.nextRank} ({rankInfo.nextPoints} pts)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-amber-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${rankInfo.progress}%` }}></div>
                        </div>
                    </div>
                </StatCard>
            </div>

            {/* Main Sections: Activities, Earnings, and Team */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Activity Log */}
                <Card className="lg:col-span-1 border-slate-100">
                    <CardHeader className="border-b border-slate-50">
                        <CardTitle className="flex items-center gap-2 text-md font-black text-slate-700 tracking-tight uppercase text-xs">
                            <Clock size={16} className="text-amber-500" />
                            My Recent Activities
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                            {activities.map((act) => (
                                <div key={act._id} className="flex items-start gap-3 border-l-2 border-slate-100 pl-3 pb-3 last:pb-0">
                                    <div className="flex flex-col">
                                        <p className="text-xs font-semibold text-slate-800">{act.description}</p>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                            {new Date(act.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {activities.length === 0 && (
                                <div className="text-center py-12 text-slate-400 font-bold text-xs uppercase tracking-wider">
                                    No recorded activities
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Earnings & Commission */}
                <Card className="lg:col-span-2 border-slate-100">
                    <CardHeader className="border-b border-slate-50">
                        <CardTitle className="flex items-center gap-2 text-md font-black text-slate-700 tracking-tight uppercase text-xs">
                            <IndianRupee size={16} className="text-emerald-500" />
                            Personal Commission Ledger
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-50/80 border-b border-slate-100">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-black text-slate-400 uppercase tracking-widest text-[9px]">Client</th>
                                        <th className="px-4 py-3 text-left font-black text-slate-400 uppercase tracking-widest text-[9px]">Date Approved</th>
                                        <th className="px-4 py-3 text-left font-black text-slate-400 uppercase tracking-widest text-[9px]">Status</th>
                                        <th className="px-4 py-3 text-right font-black text-slate-400 uppercase tracking-widest text-[9px]">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {commissions.map((comm) => (
                                        <tr key={comm._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3 font-semibold text-slate-700">{comm.clientId?.companyName || 'N/A'}</td>
                                            <td className="px-4 py-3 font-medium text-slate-500">
                                                {new Date(comm.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${comm.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50' : 'bg-amber-50 text-amber-600 border border-amber-200/50'}`}>
                                                    {comm.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-blue-600 font-black">
                                                PKR {comm.commissionAmount.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {commissions.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-4 py-16 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest bg-slate-50/20">
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
            <Card className="border-slate-100">
                <CardHeader className="border-b border-slate-50">
                    <CardTitle className="flex items-center gap-2 text-md font-black text-slate-700 tracking-tight uppercase text-xs">
                        <Target size={16} className="text-blue-500" />
                        My Active Claimed Leads
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50/80 border-b border-slate-100">
                                <tr>
                                    <th className="px-4 py-3 text-left font-black text-slate-400 uppercase tracking-widest text-[9px]">Company Name</th>
                                    <th className="px-4 py-3 text-left font-black text-slate-400 uppercase tracking-widest text-[9px]">Stage</th>
                                    <th className="px-4 py-3 text-left font-black text-slate-400 uppercase tracking-widest text-[9px]">Temperature</th>
                                    <th className="px-4 py-3 text-right font-black text-slate-400 uppercase tracking-widest text-[9px]">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {claimedLeads.map((lead) => (
                                    <tr key={lead._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3 font-semibold text-slate-700">{lead.companyName}</td>
                                        <td className="px-4 py-3">
                                            <span className="inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200/50">
                                                {lead.stage}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200/50">
                                                {lead.temperature}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button 
                                                onClick={() => navigate(`/leads/${lead._id}`)}
                                                className="text-[10px] font-bold uppercase text-indigo-600 hover:text-indigo-800"
                                            >
                                                View / Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {claimedLeads.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-16 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest bg-slate-50/20">
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
            <Card className="border-slate-100">
                <CardHeader className="border-b border-slate-50">
                    <CardTitle className="flex items-center gap-2 text-md font-black text-slate-700 tracking-tight uppercase text-xs">
                        <Flame size={16} className="text-orange-500 animate-bounce" />
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
                                    className={`relative p-4 rounded-2xl border transition-all duration-300 ${isSelf ? 'bg-indigo-50/40 border-indigo-200/80 shadow-md ring-1 ring-indigo-500/10' : 'bg-slate-50/50 border-slate-100 hover:border-slate-300/80 hover:bg-slate-50/80'}`}
                                >
                                    <div className="absolute top-2 right-2 text-xs font-black text-slate-300">
                                        #{index + 1}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-black uppercase tracking-wider text-slate-600 border shrink-0">
                                            {member.name.substring(0, 2)}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-xs font-black text-slate-800 truncate flex items-center gap-1.5">
                                                {member.name}
                                                {isSelf && <span className="bg-indigo-600 text-white text-[8px] font-black uppercase px-1 rounded-sm">You</span>}
                                            </h4>
                                            <p className="text-[10px] text-slate-400 uppercase font-black truncate tracking-wider">
                                                {member.designation && member.designation.length > 0 ? member.designation[0] : member.role}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex justify-between items-center text-[10px]">
                                        <span className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">{member.rank.replace('_', ' ')}</span>
                                        <span className="font-black text-indigo-600">{member.points} Points</span>
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
