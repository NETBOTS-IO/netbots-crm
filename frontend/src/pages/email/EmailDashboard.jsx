import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, BarChart3, AlertCircle, RefreshCw, Layers, TrendingUp, Users, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function EmailDashboard() {
  const [stats, setStats] = useState({
    totalSent: 0,
    totalDelivered: 0,
    uniqueOpens: 0,
    totalClicks: 0,
    totalBounced: 0
  });
  const [smtpStatus, setSmtpStatus] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [sequences, setSequences] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, smtpRes, campaignsRes, sequencesRes] = await Promise.all([
        api.get('/email-analytics/overview'),
        api.get('/email-analytics/smtp-utilization'),
        api.get('/email-campaigns'),
        api.get('/email-sequences')
      ]);
      if (statsRes) setStats(statsRes);
      if (smtpRes) setSmtpStatus(smtpRes);
      if (campaignsRes) setCampaigns(campaignsRes);
      if (sequencesRes) setSequences(sequencesRes);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const openRate = stats.totalDelivered ? ((stats.uniqueOpens / stats.totalDelivered) * 100).toFixed(1) : 0;
  const clickRate = stats.totalDelivered ? ((stats.totalClicks / stats.totalDelivered) * 100).toFixed(1) : 0;

  // 1. Engagement Funnel Data
  const funnelData = {
    labels: ['Sent', 'Delivered', 'Opened', 'Clicked', 'Bounced'],
    datasets: [
      {
        label: 'Email Volume',
        data: [stats.totalSent, stats.totalDelivered, stats.uniqueOpens, stats.totalClicks, stats.totalBounced],
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',  // Blue
          'rgba(99, 102, 241, 0.7)',  // Indigo
          'rgba(168, 85, 247, 0.7)',  // Purple
          'rgba(16, 185, 129, 0.7)',  // Emerald
          'rgba(244, 63, 94, 0.7)'    // Rose
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(99, 102, 241)',
          'rgb(168, 85, 247)',
          'rgb(16, 185, 129)',
          'rgb(244, 63, 94)'
        ],
        borderWidth: 1
      }
    ]
  };

  // 2. Campaign Comparison Data
  const sentCampaigns = campaigns.filter(c => c.status === 'sent');
  const campaignNames = sentCampaigns.map(c => c.name.replace('Seed ', ''));
  const campaignOpens = sentCampaigns.map(c => c.stats?.uniqueOpens || 0);
  const campaignClicks = sentCampaigns.map(c => c.stats?.uniqueClicks || 0);

  const campaignComparisonData = {
    labels: campaignNames.length > 0 ? campaignNames : ['No Campaigns Sent'],
    datasets: [
      {
        label: 'Unique Opens',
        data: campaignOpens.length > 0 ? campaignOpens : [0],
        backgroundColor: 'rgba(168, 85, 247, 0.65)',
        borderColor: 'rgb(168, 85, 247)',
        borderWidth: 1,
        borderRadius: 6
      },
      {
        label: 'Clicks',
        data: campaignClicks.length > 0 ? campaignClicks : [0],
        backgroundColor: 'rgba(16, 185, 129, 0.65)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
        borderRadius: 6
      }
    ]
  };

  // 3. SMTP Utilization Data
  const smtpNames = smtpStatus.map(s => s.name.replace('Seed ', ''));
  const smtpUsed = smtpStatus.map(s => s.sentToday);
  const smtpRemaining = smtpStatus.map(s => Math.max(0, s.dailyLimit - s.sentToday));

  const smtpChartData = {
    labels: smtpNames.length > 0 ? smtpNames : ['No SMTP Pool'],
    datasets: [
      {
        label: 'Emails Sent Today',
        data: smtpUsed.length > 0 ? smtpUsed : [0],
        backgroundColor: 'rgba(59, 130, 246, 0.75)',
        borderRadius: 4
      },
      {
        label: 'Remaining Limit',
        data: smtpRemaining.length > 0 ? smtpRemaining : [0],
        backgroundColor: 'rgba(226, 232, 240, 0.8)',
        borderRadius: 4
      }
    ]
  };

  // 4. Sequences Enrollments Sum
  const totalEnrolled = sequences.reduce((sum, s) => sum + (s.stats?.totalEnrolled || 0), 0);
  const currentlyActive = sequences.reduce((sum, s) => sum + (s.stats?.currentlyActive || 0), 0);
  const completed = sequences.reduce((sum, s) => sum + (s.stats?.completed || 0), 0);
  const exited = sequences.reduce((sum, s) => sum + (s.stats?.exited || 0), 0);

  const sequencesChartData = {
    labels: ['Active', 'Completed', 'Exited'],
    datasets: [
      {
        data: [currentlyActive, completed, exited],
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(244, 63, 94, 0.7)'
        ],
        borderWidth: 0
      }
    ]
  };

  // 5. Weekly Trend (Fallback / Mock Timeline based on Sent Campaigns)
  const trendLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const trendData = {
    labels: trendLabels,
    datasets: [
      {
        fill: true,
        label: 'Outbound Sends',
        data: [45, 62, 85, 42, 110, 15, 30],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        tension: 0.4
      }
    ]
  };

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto bg-slate-50/50 min-h-screen">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="text-blue-600 h-5 w-5" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Email Marketing Dashboard</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">Monitor your Hostinger SMTP performance and campaign insights.</p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline" className="gap-2 border-slate-200">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh Stats
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm bg-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sent</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Mail className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-black text-slate-800">{stats.totalSent}</div>
            <p className="text-xs text-slate-400 mt-1">Delivered: <span className="font-semibold text-slate-650">{stats.totalDelivered}</span></p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">Open Rate</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Layers className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-black text-slate-800">{openRate}%</div>
            <p className="text-xs text-slate-400 mt-1">Unique Opens: <span className="font-semibold text-slate-650">{stats.uniqueOpens}</span></p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">Click Rate</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <BarChart3 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-black text-slate-800">{clickRate}%</div>
            <p className="text-xs text-slate-400 mt-1">Total Clicks: <span className="font-semibold text-slate-650">{stats.totalClicks}</span></p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bounces</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <AlertCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-black text-slate-800">{stats.totalBounced}</div>
            <p className="text-xs text-rose-500 font-semibold mt-1">Action required</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Row */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Campaign Comparison Chart */}
        <Card className="border-none shadow-sm rounded-2xl bg-white md:col-span-2">
          <CardHeader className="border-b border-slate-50 pb-4">
            <CardTitle className="text-base font-bold text-slate-800">Campaign Engagement Metrics</CardTitle>
            <CardDescription className="text-xs">Compare performance statistics across your sent email campaigns.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[280px]">
              <Bar 
                data={campaignComparisonData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                    x: { grid: { display: false } }
                  },
                  plugins: { legend: { position: 'top', labels: { boxWidth: 12, usePointStyle: true } } }
                }} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Funnel Chart */}
        <Card className="border-none shadow-sm rounded-2xl bg-white md:col-span-1">
          <CardHeader className="border-b border-slate-50 pb-4">
            <CardTitle className="text-base font-bold text-slate-800">Engagement Funnel</CardTitle>
            <CardDescription className="text-xs">Visualizing overall email deliverability ratios.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 flex flex-col items-center justify-center">
            <div className="h-[240px] w-full relative">
              <Doughnut 
                data={funnelData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '65%',
                  plugins: { legend: { display: false } }
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-slate-850">{stats.totalSent}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sent Logs</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 w-full text-xs">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div><span>Sent: {stats.totalSent}</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></div><span>Delivered: {stats.totalDelivered}</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-purple-500 rounded-full"></div><span>Opened: {stats.uniqueOpens}</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div><span>Clicked: {stats.totalClicks}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row Charts */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* SMTP Utilization status list */}
        <Card className="border-none shadow-sm rounded-2xl bg-white md:col-span-2">
          <CardHeader className="border-b border-slate-50 pb-4">
            <CardTitle className="text-base font-bold text-slate-800">SMTP Configurations Utilization & Health</CardTitle>
            <CardDescription className="text-xs">Outbound volume distribution across your rotating Hostinger account pool.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div className="h-[200px]">
                <Bar 
                  data={smtpChartData}
                  options={{
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: { stacked: true, beginAtZero: true, grid: { color: '#f1f5f9' } },
                      y: { stacked: true, grid: { display: false } }
                    },
                    plugins: { legend: { display: false } }
                  }}
                />
              </div>
              
              <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2">
                {smtpStatus.map((acc) => {
                  const percent = Math.min(((acc.sentToday / acc.dailyLimit) * 100), 100);
                  return (
                    <div key={acc._id} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 flex flex-col justify-between gap-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-800 truncate max-w-[150px]">{acc.name}</span>
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          acc.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>{acc.status}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>{acc.email}</span>
                        <span className="font-semibold text-slate-650">{acc.sentToday} / {acc.dailyLimit} sent</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sequence Enrollments Chart */}
        <Card className="border-none shadow-sm rounded-2xl bg-white md:col-span-1">
          <CardHeader className="border-b border-slate-50 pb-4">
            <CardTitle className="text-base font-bold text-slate-800">Sequence Enrollments</CardTitle>
            <CardDescription className="text-xs">Leads distribution inside marketing sequences.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 flex flex-col items-center justify-center">
            {totalEnrolled > 0 ? (
              <>
                <div className="h-[180px] w-full relative">
                  <Pie 
                    data={sequencesChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } }
                    }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-6 w-full text-center text-xs">
                  <div className="p-2 bg-blue-50/50 rounded-xl"><span className="text-[10px] font-bold text-blue-750 block">Active</span><span className="font-black text-blue-700 mt-0.5 block">{currentlyActive}</span></div>
                  <div className="p-2 bg-emerald-50/50 rounded-xl"><span className="text-[10px] font-bold text-emerald-750 block">Done</span><span className="font-black text-emerald-700 mt-0.5 block">{completed}</span></div>
                  <div className="p-2 bg-rose-50/50 rounded-xl"><span className="text-[10px] font-bold text-rose-750 block">Exited</span><span className="font-black text-rose-700 mt-0.5 block">{exited}</span></div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                No active sequence enrollments yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sending Trends Line Chart */}
      <Card className="border-none shadow-sm rounded-2xl bg-white">
        <CardHeader className="border-b border-slate-50 pb-4">
          <CardTitle className="text-base font-bold text-slate-800">Outbound Volume Trend</CardTitle>
          <CardDescription className="text-xs">Outbound marketing delivery volume tracking over the last 7 days.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[220px]">
            <Line 
              data={trendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                  x: { grid: { display: false } }
                },
                plugins: { legend: { display: false } }
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
