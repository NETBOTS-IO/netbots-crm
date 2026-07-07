import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    TrendingUp,
    Users,
    Target,
    Activity as ActivityIcon,
    CheckCircle2,
    Clock,
    IndianRupee
} from 'lucide-react';
import api from '@/lib/api';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const StatCard = ({ title, value, icon: Icon, description, colorClass = "text-slate-600", bgClass = "bg-slate-100" }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</CardTitle>
            <div className={`p-2 ${bgClass} rounded-lg ${colorClass}`}>
                <Icon size={18} />
            </div>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-slate-500 mt-1">{description}</p>
        </CardContent>
    </Card>
);

const SalesDashboard = () => {
    const [stats, setStats] = useState({
        totalLeads: 0,
        sqls: 0,
        myConversions: 0,
        winRate: "0%"
    });
    const [funnelData, setFunnelData] = useState([]);
    const [performance, setPerformance] = useState({ daily: [], weekly: [], monthly: [], yearlyTotal: 0 });
    const [period, setPeriod] = useState('daily');
    const [activities, setActivities] = useState([]);
    const [commissions, setCommissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [overview, funnel, commsRes, perfRes] = await Promise.all([
                    api.get('/analytics/overview'),
                    api.get('/analytics/funnel'),
                    api.get('/commissions'),
                    api.get('/analytics/my-performance')
                ]);

                if (overview.success) {
                    setStats({
                        ...overview.data,
                        myConversions: commsRes.success ? commsRes.data.length : 0,
                        winRate: "12%"
                    });
                }
                if (funnel.success) setFunnelData(funnel.data);
                if (commsRes.success) setCommissions(commsRes.data.slice(0, 5));
                if (perfRes.success) setPerformance(perfRes.data);

                // Fetch recent global activity for visibility
                const leadsRes = await api.get('/leads');
                if (leadsRes.success) {
                    const mockActivities = leadsRes.data.slice(0, 5).map(l => ({
                        id: l._id,
                        text: `Lead "${l.companyName}" is at stage ${l.stage}`,
                        time: "Recently updated"
                    }));
                    setActivities(mockActivities);
                }

            } catch (err) {
                console.error("Failed to load sales data", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const chartData = {
        labels: funnelData.map(i => i.stage.toUpperCase()),
        datasets: [
            {
                label: 'Global Pipeline',
                data: funnelData.map(i => i.count),
                backgroundColor: '#3b82f6',
                borderRadius: 4,
            },
        ],
    };

    const chartOptions = {
        indexAxis: 'y',
        responsive: true,
        plugins: {
            legend: { display: false },
        },
        scales: {
            x: { grid: { display: false } },
            y: { grid: { display: false } }
        }
    };

    if (loading) return <div className="flex items-center justify-center h-full">Loading Sales Dashboard...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Sales Performance</h1>
                <p className="text-slate-500 text-sm italic">"Don’t close a sale, open a relationship."</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Yearly Sales"
                    value={performance.yearlyTotal}
                    icon={CheckCircle2}
                    description="Closed deals this year"
                    bgClass="bg-emerald-50"
                    colorClass="text-emerald-600"
                />
                <StatCard
                    title="Active SQLs"
                    value={stats.sqls}
                    icon={Target}
                    description="Ready to be closed"
                    bgClass="bg-amber-50"
                    colorClass="text-amber-600"
                />
                <StatCard
                    title="Conversion Goal"
                    value="15%"
                    icon={TrendingUp}
                    description="Target for this quarter"
                    bgClass="bg-blue-50"
                    colorClass="text-blue-600"
                />
                <StatCard
                    title="Avg Deal Value"
                    value="PKR 4,200"
                    icon={ActivityIcon}
                    description="Per client average"
                    bgClass="bg-indigo-50"
                    colorClass="text-indigo-600"
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg font-bold">
                            <TrendingUp size={18} className="text-blue-600" />
                            Sales Velocity
                        </CardTitle>
                        <div className="flex gap-1">
                            {['daily', 'weekly', 'monthly'].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`px-2 py-1 text-[10px] font-bold uppercase border rounded transition-colors ${period === p ? 'bg-slate-900 text-white border-slate-900' : 'hover:bg-slate-50'}`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent className="h-[250px] flex items-end justify-between px-4 pb-4">
                        {(performance[period] || []).map((p, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-2 group">
                                <div
                                    className="w-8 bg-blue-500 rounded-t transition-all group-hover:bg-blue-600 shadow-sm"
                                    style={{ height: `${(p.count || 0) * 40 + 10}px` }}
                                ></div>
                                <span className="text-[9px] text-slate-500 font-bold">{p._id}</span>
                            </div>
                        ))}
                        {performance[period]?.length === 0 && (
                            <div className="w-full text-center text-slate-400 text-sm italic py-20">No recent sales data to plot</div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-bold">
                            <Target size={18} className="text-indigo-600" />
                            Conversion Funnel
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px] pb-6">
                        <Bar data={chartData} options={chartOptions} />
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-bold">
                            <Clock size={18} className="text-amber-600" />
                            Recent Pipeline Alerts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {activities.map((act) => (
                                <div key={act.id} className="flex items-start gap-4 text-sm border-b pb-3 last:border-0">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border">
                                        <CheckCircle2 size={16} className="text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800">{act.text}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{act.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-bold">
                            <IndianRupee size={18} className="text-emerald-600" />
                            Personal Commission Ledger
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-xl border overflow-hidden shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-bold text-slate-600 uppercase text-[10px]">Client</th>
                                        <th className="px-4 py-3 text-left font-bold text-slate-600 uppercase text-[10px]">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {commissions.map((comm) => (
                                        <tr key={comm._id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-slate-700">{comm.clientId?.companyName || 'Unknown'}</td>
                                            <td className="px-4 py-3 text-blue-700 font-black">PKR {comm.commissionAmount.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {commissions.length === 0 && (
                                        <tr>
                                            <td colSpan="2" className="px-4 py-12 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest bg-slate-50/30">
                                                No Earnings Recorded
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SalesDashboard;
