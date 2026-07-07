import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    TrendingUp,
    Users,
    Target,
    PhoneCall,
    CheckCircle2,
    XCircle,
    DollarSign,
    Percent,
    AlertCircle
} from 'lucide-react';
import api from '@/lib/api';
import { useToast } from "@/hooks/use-toast";

const StatCard = ({ title, value, icon: Icon, colorClass = "text-slate-600 bg-slate-100" }) => (
    <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</CardTitle>
            <div className={`p-2 rounded-lg ${colorClass}`}>
                <Icon size={18} />
            </div>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-black text-slate-800">{value}</div>
        </CardContent>
    </Card>
);

const CEODashboard = () => {
    const [period, setPeriod] = useState('month');
    const [stats, setStats] = useState({
        totalLeads: 0,
        totalCalls: 0,
        closedLeads: 0,
        rejectedLeads: 0,
        commitmentLeads: 0,
        totalSales: 0,
        salesAmount: 0,
        totalUpfront: 0,
        totalRemaining: 0
    });
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/analytics/overview?period=${period}`);
            if (res.success) {
                setStats(res.data);
            }
        } catch (err) {
            console.error("Failed to load dashboard statistics", err);
            toast({ variant: "destructive", title: "Error", description: "Failed to load dashboard data." });
        } finally {
            setLoading(false);
        }
    }, [period, toast]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    if (loading && Object.values(stats).every(v => v === 0)) {
        return <div className="flex items-center justify-center h-64 text-slate-500 font-medium">Loading Dashboard Statistics...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header & Date Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-lg border shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Admin Dashboard</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase">Real-Time Performance Overview</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs font-bold text-slate-500 uppercase shrink-0">Filter by Time:</span>
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[140px] h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="day">Today</SelectItem>
                            <SelectItem value="week">Past 7 Days</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                            <SelectItem value="year">This Year</SelectItem>
                            <SelectItem value="all">All Time</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Stats Dashboard Grid - Mobile Responsive (1 col on mobile, 2 on sm, 3 on lg) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                    title="Total Leads"
                    value={stats.totalLeads}
                    icon={Users}
                    colorClass="text-blue-600 bg-blue-50"
                />
                <StatCard
                    title="Total Calls"
                    value={stats.totalCalls}
                    icon={PhoneCall}
                    colorClass="text-purple-600 bg-purple-50"
                />
                <StatCard
                    title="Commitments (SQLs)"
                    value={stats.commitmentLeads}
                    icon={Target}
                    colorClass="text-amber-600 bg-amber-50"
                />
                <StatCard
                    title="Closed Leads"
                    value={stats.closedLeads}
                    icon={CheckCircle2}
                    colorClass="text-emerald-600 bg-emerald-50"
                />
                <StatCard
                    title="Rejected / Lost Leads"
                    value={stats.rejectedLeads}
                    icon={XCircle}
                    colorClass="text-rose-600 bg-rose-50"
                />
                <StatCard
                    title="Total Sales (Clients)"
                    value={stats.totalSales}
                    icon={TrendingUp}
                    colorClass="text-sky-600 bg-sky-50"
                />
            </div>

            {/* Financial Stats Section */}
            <div className="pt-4 border-t">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Financial Overview</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100 hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Sales Value</CardTitle>
                            <div className="p-2 rounded-lg text-emerald-700 bg-emerald-100">
                                <DollarSign size={18} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-emerald-900">${(stats.salesAmount || 0).toLocaleString()}</div>
                            <p className="text-[10px] text-emerald-700 font-bold uppercase mt-1">Total contract value in USD</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-bold text-blue-800 uppercase tracking-wider">Total Upfront Paid</CardTitle>
                            <div className="p-2 rounded-lg text-blue-700 bg-blue-100">
                                <CheckCircle2 size={18} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-blue-900">${(stats.totalUpfront || 0).toLocaleString()}</div>
                            <p className="text-[10px] text-blue-700 font-bold uppercase mt-1">Received collections</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-rose-50 to-white border-rose-100 hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-bold text-rose-800 uppercase tracking-wider">Total Remaining</CardTitle>
                            <div className="p-2 rounded-lg text-rose-700 bg-rose-100">
                                <AlertCircle size={18} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-rose-900">${(stats.totalRemaining || 0).toLocaleString()}</div>
                            <p className="text-[10px] text-rose-700 font-bold uppercase mt-1">Outstanding receivables</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CEODashboard;
