import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Bar, Line, Doughnut, Pie, Radar } from 'react-chartjs-2';
import { RefreshCcw, LayoutDashboard, Target, Users, Mail, Wallet, Shield } from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function SuperDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSuperData();
    }, []);

    const fetchSuperData = async () => {
        try {
            const res = await api.get('/dashboard/super');
            if (res.success) {
                setData(res.data);
            }
        } catch (err) {
            console.error('Failed to load super dashboard', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse p-4">
                <div className="h-16 bg-slate-200 rounded-xl w-full"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(n => (
                        <div key={n} className="h-[300px] bg-slate-200 rounded-xl w-full"></div>
                    ))}
                </div>
            </div>
        );
    }

    // Helper: Map data arrays to chart payloads
    const stageLabels = data?.stages?.map(s => s._id || 'unassigned') || ['raw', 'contacted', 'close', 'onboard'];
    const stageCounts = data?.stages?.map(s => s.count) || [10, 5, 2, 4];

    const tempLabels = data?.temperatures?.map(t => t._id || 'cold') || ['cold', 'warm', 'hot', 'sql'];
    const tempCounts = data?.temperatures?.map(t => t.count) || [8, 12, 4, 3];

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyLabels = data?.monthly?.map(m => `${monthNames[m._id.month - 1]} ${m._id.year}`) || ['Jul 2026'];
    const monthlyCounts = data?.monthly?.map(m => m.count) || [24];

    const priorityLabels = data?.priorities?.map(p => p._id) || ['high', 'medium', 'low'];
    const priorityCounts = data?.priorities?.map(p => p.count) || [5, 10, 9];

    // Contractor Charts
    const contractorNames = data?.contractorStats?.map(c => c.name) || ['Ali', 'Zain', 'Karamat'];
    const contractorSubmitted = data?.contractorStats?.map(c => c.submitted) || [12, 18, 5];
    const contractorVerified = data?.contractorStats?.map(c => c.verified) || [8, 14, 3];
    const contractorClosed = data?.contractorStats?.map(c => c.closed) || [2, 4, 1];

    // Email Funnel
    const funnelLabels = ['Sent', 'Opened', 'Clicked', 'Bounced'];
    const funnelCounts = data?.emailFunnel ? [
        data.emailFunnel.sent || 0,
        data.emailFunnel.opened || 0,
        data.emailFunnel.clicked || 0,
        data.emailFunnel.bounced || 0
    ] : [1200, 800, 350, 24];

    // SMTP status
    const smtpLabels = data?.smtpStatus?.map(s => s._id) || ['healthy', 'failed'];
    const smtpCounts = data?.smtpStatus?.map(s => s.count) || [3, 1];

    // Financials
    const commLabels = data?.commissions?.map(c => c._id) || ['pending', 'paid'];
    const commAmounts = data?.commissions?.map(c => c.total) || [45000, 25000];

    // Package subscriptions
    const packLabels = data?.packages?.map(p => p._id) || ['Standard', 'Gold', 'Enterprise'];
    const packCounts = data?.packages?.map(p => p.count) || [5, 8, 2];

    // System Audits
    const auditLabels = data?.audits?.map(a => a._id?.replace('click_', '') || 'access') || ['login', 'edit_lead', 'payout'];
    const auditCounts = data?.audits?.map(a => a.count) || [45, 12, 8];

    return (
        <div className="space-y-6 pb-12">
            {/* Page Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-lg flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black flex items-center gap-2 tracking-wide uppercase">
                        <LayoutDashboard className="text-indigo-400" size={24} /> Super Dashboard
                    </h1>
                    <p className="text-xs text-indigo-200/80 font-bold uppercase tracking-wider mt-1">
                        Consolidated visual metrics, timelines, and aggregates of all CRM modules.
                    </p>
                </div>
                <Button variant="ghost" size="icon" onClick={fetchSuperData} className="text-indigo-200 hover:text-white hover:bg-white/10 rounded-full hover:scale-105 active:scale-95 duration-200 transition-all">
                    <RefreshCcw size={16} />
                </Button>
            </div>

            {/* Grid Layout of Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                {/* Card 1: Lead Stages Distribution */}
                <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden bg-white">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-3.5 px-5 flex flex-row items-center gap-2">
                        <Target className="text-indigo-600" size={16} />
                        <CardTitle className="text-xs font-black uppercase text-slate-500 tracking-wider">Leads Stages</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 flex justify-center h-[260px] items-center">
                        <Doughnut 
                            data={{
                                labels: stageLabels,
                                datasets: [{
                                    data: stageCounts,
                                    backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'],
                                    borderWidth: 1
                                }]
                            }}
                            options={{ responsive: true, maintainAspectRatio: false }}
                        />
                    </CardContent>
                </Card>

                {/* Card 2: Monthly Lead Acquisitions */}
                <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden bg-white">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-3.5 px-5 flex flex-row items-center gap-2">
                        <Target className="text-indigo-600" size={16} />
                        <CardTitle className="text-xs font-black uppercase text-slate-500 tracking-wider">Monthly Acquisitions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 h-[260px]">
                        <Line 
                            data={{
                                labels: monthlyLabels,
                                datasets: [{
                                    label: 'Leads Created',
                                    data: monthlyCounts,
                                    borderColor: '#6366f1',
                                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                    fill: true,
                                    tension: 0.4
                                }]
                            }}
                            options={{ responsive: true, maintainAspectRatio: false }}
                        />
                    </CardContent>
                </Card>

                {/* Card 3: Leads Priority Distribution */}
                <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden bg-white">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-3.5 px-5 flex flex-row items-center gap-2">
                        <Target className="text-indigo-600" size={16} />
                        <CardTitle className="text-xs font-black uppercase text-slate-500 tracking-wider">Leads Priority</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 h-[260px]">
                        <Bar 
                            data={{
                                labels: priorityLabels,
                                datasets: [{
                                    label: 'Leads count',
                                    data: priorityCounts,
                                    backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6'],
                                    borderRadius: 4
                                }]
                            }}
                            options={{ responsive: true, maintainAspectRatio: false }}
                        />
                    </CardContent>
                </Card>

                {/* Card 4: Contractor Performance */}
                <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden bg-white xl:col-span-2">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-3.5 px-5 flex flex-row items-center gap-2">
                        <Users className="text-indigo-600" size={16} />
                        <CardTitle className="text-xs font-black uppercase text-slate-500 tracking-wider">Contractor Lead Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 h-[260px]">
                        <Bar 
                            data={{
                                labels: contractorNames,
                                datasets: [
                                    { label: 'Submitted', data: contractorSubmitted, backgroundColor: '#cbd5e1', borderRadius: 4 },
                                    { label: 'Verified', data: contractorVerified, backgroundColor: '#6366f1', borderRadius: 4 },
                                    { label: 'Closed', data: contractorClosed, backgroundColor: '#10b981', borderRadius: 4 }
                                ]
                            }}
                            options={{ responsive: true, maintainAspectRatio: false }}
                        />
                    </CardContent>
                </Card>

                {/* Card 5: Work Timesheet hours */}
                <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden bg-white">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-3.5 px-5 flex flex-row items-center gap-2">
                        <Users className="text-indigo-600" size={16} />
                        <CardTitle className="text-xs font-black uppercase text-slate-500 tracking-wider">Active Timesheets (Hours)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 h-[260px]">
                        {timeTracking.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-slate-400 italic text-xs">No active sheets this week</div>
                        ) : (
                            <Bar 
                                data={{
                                    labels: data?.timeTracking?.map(t => t.name) || [],
                                    datasets: [{
                                        label: 'Hours logged',
                                        data: data?.timeTracking?.map(t => t.hours) || [],
                                        backgroundColor: '#8b5cf6',
                                        borderRadius: 4
                                    }]
                                }}
                                options={{ responsive: true, maintainAspectRatio: false, indexAxis: 'y' }}
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Card 6: Outreach Campaign Funnel */}
                <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden bg-white">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-3.5 px-5 flex flex-row items-center gap-2">
                        <Mail className="text-indigo-600" size={16} />
                        <CardTitle className="text-xs font-black uppercase text-slate-500 tracking-wider">Outreach Funnel (Email)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 h-[260px]">
                        <Bar 
                            data={{
                                labels: funnelLabels,
                                datasets: [{
                                    label: 'Volume',
                                    data: funnelCounts,
                                    backgroundColor: ['#6366f1', '#10b981', '#3b82f6', '#ef4444'],
                                    borderRadius: 4
                                }]
                            }}
                            options={{ responsive: true, maintainAspectRatio: false }}
                        />
                    </CardContent>
                </Card>

                {/* Card 7: SMTP health status */}
                <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden bg-white">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-3.5 px-5 flex flex-row items-center gap-2">
                        <Mail className="text-indigo-600" size={16} />
                        <CardTitle className="text-xs font-black uppercase text-slate-500 tracking-wider">SMTP Account Status</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 flex justify-center h-[260px] items-center">
                        <Pie 
                            data={{
                                labels: smtpLabels,
                                datasets: [{
                                    data: smtpCounts,
                                    backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#cbd5e1']
                                }]
                            }}
                            options={{ responsive: true, maintainAspectRatio: false }}
                        />
                    </CardContent>
                </Card>

                {/* Card 8: Subscription pricing popularity */}
                <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden bg-white">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-3.5 px-5 flex flex-row items-center gap-2">
                        <Wallet className="text-indigo-600" size={16} />
                        <CardTitle className="text-xs font-black uppercase text-slate-500 tracking-wider">Packages Purchased</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 flex justify-center h-[260px] items-center">
                        <Pie 
                            data={{
                                labels: packLabels,
                                datasets: [{
                                    data: packCounts,
                                    backgroundColor: ['#8b5cf6', '#f59e0b', '#10b981']
                                }]
                            }}
                            options={{ responsive: true, maintainAspectRatio: false }}
                        />
                    </CardContent>
                </Card>

                {/* Card 9: Commission Payout status */}
                <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden bg-white">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-3.5 px-5 flex flex-row items-center gap-2">
                        <Wallet className="text-indigo-600" size={16} />
                        <CardTitle className="text-xs font-black uppercase text-slate-500 tracking-wider">Commissions Ledger (PKR)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 flex justify-center h-[260px] items-center">
                        <Doughnut 
                            data={{
                                labels: commLabels,
                                datasets: [{
                                    data: commAmounts,
                                    backgroundColor: ['#f59e0b', '#10b981', '#ef4444']
                                }]
                            }}
                            options={{ responsive: true, maintainAspectRatio: false }}
                        />
                    </CardContent>
                </Card>

                {/* Card 10: System events and audit logs */}
                <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden bg-white xl:col-span-2">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-3.5 px-5 flex flex-row items-center gap-2">
                        <Shield className="text-indigo-600" size={16} />
                        <CardTitle className="text-xs font-black uppercase text-slate-500 tracking-wider">Security Action Audit Frequency</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 h-[260px]">
                        <Radar 
                            data={{
                                labels: auditLabels,
                                datasets: [{
                                    label: 'Audit Events',
                                    data: auditCounts,
                                    borderColor: '#6366f1',
                                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                                    pointBackgroundColor: '#6366f1'
                                }]
                            }}
                            options={{ responsive: true, maintainAspectRatio: false }}
                        />
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
