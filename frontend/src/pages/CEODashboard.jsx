import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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
import { useAuth } from '@/context/AuthContext';
import { exportTableToPDF } from '../utils/pdfExport';
import { FileDown } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon }) => (
    <Card className="border border-slate-200 bg-white hover:border-slate-300 transition-all duration-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</CardTitle>
            <Icon size={16} className="text-slate-400" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-semibold text-slate-900 tracking-tight">{value}</div>
        </CardContent>
    </Card>
);

const CEODashboard = () => {
    const { user } = useAuth();
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

    const handleExportPDF = () => {
        const headers = ["Metric", "Value"];
        const rows = [
            ["Total Leads", stats.totalLeads],
            ["Total Outreach Calls", stats.totalCalls],
            ["Closed Deals / Sales", stats.closedLeads],
            ["Commitment Status Leads", stats.commitmentLeads],
            ["Total Sales Value (PKR)", `PKR ${stats.salesAmount.toLocaleString()}`],
            ["Total Upfront Paid (PKR)", `PKR ${stats.totalUpfront.toLocaleString()}`],
            ["Total Remaining (PKR)", `PKR ${stats.totalRemaining.toLocaleString()}`]
        ];
        exportTableToPDF("Admin Analytics Performance Report", headers, rows, `Dashboard_Analytics_${Date.now()}.pdf`);
    };

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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">Admin Dashboard</h2>
                    <p className="text-xs text-slate-500 font-medium uppercase">Real-Time Performance Overview</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    {user?.role === 'admin' && (
                        <Button variant="outline" onClick={handleExportPDF} className="gap-1.5 h-9 text-slate-700 hover:bg-slate-50 border-slate-200">
                            <FileDown size={14} /> Export to PDF
                        </Button>
                    )}
                    <span className="text-xs font-semibold text-slate-500 uppercase shrink-0">Filter by Time:</span>
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

            {/* Stats Dashboard Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                    title="Total Leads"
                    value={stats.totalLeads}
                    icon={Users}
                />
                <StatCard
                    title="Total Calls"
                    value={stats.totalCalls}
                    icon={PhoneCall}
                />
                <StatCard
                    title="Commitments (SQLs)"
                    value={stats.commitmentLeads}
                    icon={Target}
                />
                <StatCard
                    title="Closed Leads"
                    value={stats.closedLeads}
                    icon={CheckCircle2}
                />
                <StatCard
                    title="Rejected / Lost Leads"
                    value={stats.rejectedLeads}
                    icon={XCircle}
                />
                <StatCard
                    title="Total Sales (Clients)"
                    value={stats.totalSales}
                    icon={TrendingUp}
                />
            </div>

            {/* Financial Stats Section */}
            <div className="pt-6 border-t border-slate-200">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Financial Overview</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="bg-white border border-slate-200 hover:border-slate-300 transition-all duration-200">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sales Value</CardTitle>
                            <DollarSign size={16} className="text-slate-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold text-slate-900 tracking-tight">PKR {(stats.salesAmount || 0).toLocaleString()}</div>
                            <p className="text-[10px] text-slate-400 uppercase mt-1">Total contract value in PKR</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border border-slate-200 hover:border-slate-300 transition-all duration-200">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Upfront Paid</CardTitle>
                            <CheckCircle2 size={16} className="text-slate-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold text-slate-900 tracking-tight">PKR {(stats.totalUpfront || 0).toLocaleString()}</div>
                            <p className="text-[10px] text-slate-400 uppercase mt-1">Received collections in PKR</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border border-slate-200 hover:border-slate-300 transition-all duration-200">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Remaining</CardTitle>
                            <AlertCircle size={16} className="text-slate-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold text-slate-900 tracking-tight">PKR {(stats.totalRemaining || 0).toLocaleString()}</div>
                            <p className="text-[10px] text-slate-400 uppercase mt-1">Outstanding receivables in PKR</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CEODashboard;
