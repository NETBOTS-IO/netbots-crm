import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, BarElement, PointElement,
    LineElement, ArcElement, RadialLinearScale,
    Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Line, Doughnut, Pie, Radar } from 'react-chartjs-2';
import {
    RefreshCcw, Users, Mail, Wallet, Shield, Target, TrendingUp,
    AlertTriangle, CheckCircle2, Clock, BarChart3, Activity,
    Zap, Globe, UserCheck, ChevronRight
} from 'lucide-react';

ChartJS.register(
    CategoryScale, LinearScale, BarElement, PointElement,
    LineElement, ArcElement, RadialLinearScale,
    Title, Tooltip, Legend, Filler
);

// ── palette ──────────────────────────────────────────────────────────────────
const INDIGO  = '#6366f1';
const EMERALD = '#10b981';
const AMBER   = '#f59e0b';
const ROSE    = '#f43f5e';
const VIOLET  = '#8b5cf6';
const SKY     = '#0ea5e9';
const SLATE   = '#64748b';
const TEAL    = '#14b8a6';
const ORANGE  = '#f97316';

const PALETTE_8 = [INDIGO, EMERALD, AMBER, ROSE, VIOLET, SKY, TEAL, ORANGE];

// ── option presets ─────────────────────────────────────────────────────────
const baseOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };
const stackedBarOpts = {
    ...baseOpts,
    scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, grid: { color: '#f1f5f9' } } }
};
const groupedBarOpts = {
    ...baseOpts,
    scales: { x: { grid: { display: false } }, y: { grid: { color: '#f1f5f9' } } }
};
const lineOpts = {
    ...baseOpts,
    scales: {
        x: { grid: { display: false }, ticks: { maxRotation: 30 } },
        y: { grid: { color: '#f1f5f9' } }
    }
};
const arcOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 11 } } } }
};
const radarOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { r: { grid: { color: '#e2e8f0' }, ticks: { display: false } } }
};

// ── helpers ────────────────────────────────────────────────────────────────
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtMonth = m => `${MONTH_NAMES[m._id.month - 1]} ${String(m._id.year).slice(2)}`;
const currency = n => n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n ?? 0);

// ── skeleton ───────────────────────────────────────────────────────────────
function ChartSkeleton({ h = 260 }) {
    return (
        <div className="animate-pulse bg-slate-100 rounded-lg" style={{ height: h }} />
    );
}

// ── chart card ─────────────────────────────────────────────────────────────
function ChartCard({ title, icon: Icon, color = INDIGO, children, span = 1, h = 260, badge }) {
    return (
        <div
            className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col"
            style={{ gridColumn: `span ${span}` }}
        >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                        <Icon size={14} style={{ color }} />
                    </div>
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500">{title}</span>
                </div>
                {badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${color}18`, color }}>
                        {badge}
                    </span>
                )}
            </div>
            <div className="flex-1 p-5" style={{ height: h }}>
                {children}
            </div>
        </div>
    );
}

// ── mini KPI strip ─────────────────────────────────────────────────────────
function KpiCard({ label, value, color = INDIGO, icon: Icon, sub }) {
    return (
        <div className="bg-white rounded-xl border border-slate-200/80 px-4 py-3.5 flex items-center gap-3 hover:shadow-md transition-all duration-200">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
                <Icon size={16} style={{ color }} />
            </div>
            <div className="min-w-0">
                <div className="text-xl font-black text-slate-800 leading-none">{value}</div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{label}</div>
                {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
            </div>
        </div>
    );
}

// ── Section header ──────────────────────────────────────────────────────────
function SectionHeader({ label, color }) {
    return (
        <div className="flex items-center gap-3 mt-2">
            <div className="w-1 h-5 rounded-full" style={{ background: color }} />
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</span>
            <div className="flex-1 h-px bg-slate-100" />
        </div>
    );
}

// ── main component ─────────────────────────────────────────────────────────
export default function SuperDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/dashboard/super');
            if (res.success) {
                setData(res.data);
                setLastRefresh(new Date());
            }
        } catch (e) {
            console.error('Super dashboard error', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ── derived data ──────────────────────────────────────────────────────

    const d = data || {};

    // Leads
    const stageLabels   = (d.stages   || []).map(s => s._id || 'unassigned');
    const stageCounts   = (d.stages   || []).map(s => s.count);
    const tempLabels    = (d.temperatures || []).map(t => t._id);
    const tempCounts    = (d.temperatures || []).map(t => t.count);
    const monthLabels   = (d.monthly  || []).map(fmtMonth);
    const monthCounts   = (d.monthly  || []).map(m => m.count);
    const monthVerified = (d.monthly  || []).map(m => m.verified);
    const monthConverted= (d.monthly  || []).map(m => m.converted);
    const prioLabels    = (d.priorities || []).map(p => p._id);
    const prioCounts    = (d.priorities || []).map(p => p.count);
    const bizLabels     = (d.businessTypes || []).map(b => b._id?.replace(/_/g,' '));
    const bizCounts     = (d.businessTypes || []).map(b => b.count);
    const chanLabels    = (d.channels  || []).map(c => c._id);
    const chanCounts    = (d.channels  || []).map(c => c.count);
    const svcLabels     = (d.targetServices || []).map(s => s._id?.replace(/_/g,' '));
    const svcCounts     = (d.targetServices || []).map(s => s.count);
    const lostLabels    = (d.lostReasons || []).map(l => l._id);
    const lostCounts    = (d.lostReasons || []).map(l => l.count);

    const lf = d.leadFunnel || {};
    const fh = d.followupHealth || {};

    // Team
    const ctNames       = (d.contractorStats || []).map(c => c.name?.split(' ')[0]);
    const ctSubmitted   = (d.contractorStats || []).map(c => c.submitted);
    const ctVerified    = (d.contractorStats || []).map(c => c.verified);
    const ctClosed      = (d.contractorStats || []).map(c => c.closed);
    const lbNames       = (d.teamLeaderboard || []).map(l => l.name?.split(' ')[0]);
    const lbPoints      = (d.teamLeaderboard || []).map(l => l.points);
    const rankLabels    = (d.rankDistribution || []).map(r => r._id);
    const rankCounts    = (d.rankDistribution || []).map(r => r.count);
    const ttLabels      = (d.timeTracking || []).map(t => t.name?.split(' ')[0]);
    const ttHours       = (d.timeTracking || []).map(t => t.hours);

    // Clients
    const dtLabels      = (d.dealTypes || []).map(t => t._id?.replace(/_/g,' '));
    const dtCounts      = (d.dealTypes || []).map(t => t.count);
    const ch            = d.clientHealth || {};
    const mcLabels      = (d.monthlyClients || []).map(fmtMonth);
    const mcCounts      = (d.monthlyClients || []).map(m => m.count);
    const csvcLabels    = (d.clientServices || []).map(s => s._id?.replace(/_/g,' '));
    const csvcCounts    = (d.clientServices || []).map(s => s.count);

    // Commissions
    const cmLabels      = (d.commissions || []).map(c => c._id);
    const cmAmounts     = (d.commissions || []).map(c => c.total);
    const crLabels      = (d.commissionRoles || []).map(r => r._id?.replace(/_/g,' '));
    const crAmounts     = (d.commissionRoles || []).map(r => r.total);
    const pvLabels      = (d.payouts || []).map(p => p._id);
    const pvAmounts     = (d.payouts || []).map(p => p.totalAmount);
    const mcmLabels     = (d.monthlyCommissions || []).map(fmtMonth);
    const mcmAmounts    = (d.monthlyCommissions || []).map(m => m.total);

    // Email
    const ef            = d.emailFunnel || {};
    const csLabels      = (d.campaignStatus || []).map(s => s._id);
    const csCounts      = (d.campaignStatus || []).map(s => s.count);
    const smtpLabels    = (d.smtpStatus || []).map(s => s._id);
    const smtpCounts    = (d.smtpStatus || []).map(s => s.count);
    const elLabels      = (d.emailLogStatus || []).map(s => s._id);
    const elCounts      = (d.emailLogStatus || []).map(s => s.count);
    const seqEnLabels   = (d.sequenceEnrollments || []).map(s => s._id);
    const seqEnCounts   = (d.sequenceEnrollments || []).map(s => s.count);

    // Activity & Audit
    const actLabels     = (d.activityTypes || []).map(a => a._id?.replace(/_/g,' '));
    const actCounts     = (d.activityTypes || []).map(a => a.count);
    const daLabels      = (d.dailyActivity || []).map(a => `${a._id.day}/${a._id.month}`);
    const daCounts      = (d.dailyActivity || []).map(a => a.count);
    const auLabels      = (d.audits || []).map(a => a._id);
    const auCounts      = (d.audits || []).map(a => a.count);
    const arLabels      = (d.auditByRole || []).map(r => r._id || 'unknown');
    const arCounts      = (d.auditByRole || []).map(r => r.count);

    // ── render ─────────────────────────────────────────────────────────────
    return (
        <div className="space-y-5 pb-14 min-h-screen" style={{ background: '#f8fafc' }}>
            {/* ── Header ── */}
            <div className="rounded-2xl overflow-hidden shadow-lg" style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)'
            }}>
                <div className="px-6 py-5 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2.5 mb-1">
                            <div className="w-8 h-8 rounded-xl bg-indigo-500/30 flex items-center justify-center">
                                <BarChart3 size={16} className="text-indigo-300" />
                            </div>
                            <h1 className="text-white text-xl font-black tracking-tight">Super Dashboard</h1>
                        </div>
                        <p className="text-indigo-300/70 text-xs font-medium">
                            {lastRefresh
                                ? `Last updated ${lastRefresh.toLocaleTimeString()}`
                                : 'Loading live CRM metrics…'}
                            {' · '}Leads · Team · Clients · Email · Financials · Audit
                        </p>
                    </div>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-indigo-200 border border-indigo-500/30 hover:bg-indigo-500/20 active:scale-95 transition-all duration-200 disabled:opacity-50"
                    >
                        <RefreshCcw size={12} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>

                {/* quick KPI strip */}
                <div className="px-6 pb-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                    {[
                        { label: 'Total Leads',   value: lf.totalLeads      || '—', color: INDIGO },
                        { label: 'Verified',      value: lf.verifiedLeads   || '—', color: EMERALD },
                        { label: 'Converted',     value: lf.convertedLeads  || '—', color: TEAL },
                        { label: 'Demos Booked',  value: lf.demoBookedLeads || '—', color: AMBER },
                        { label: 'Active Clients',value: ch.activeClients   || '—', color: SKY },
                        { label: 'Churn Risk',    value: ch.churnRiskClients|| '—', color: ROSE },
                        { label: 'Overdue F/Ups', value: fh.overdueFollowups|| '—', color: ORANGE },
                        { label: 'Today F/Ups',   value: fh.todayFollowups  || '—', color: VIOLET },
                    ].map(k => (
                        <div key={k.label} className="rounded-xl px-3 py-2.5 text-center" style={{ background: `${k.color}20`, borderTop: `2px solid ${k.color}` }}>
                            <div className="text-lg font-black text-white">{k.value}</div>
                            <div className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color: `${k.color}cc` }}>{k.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* SECTION 1 — LEADS INTELLIGENCE */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <SectionHeader label="Leads Intelligence" color={INDIGO} />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                {/* Monthly acquisitions multi-line */}
                <ChartCard title="Monthly Acquisitions" icon={TrendingUp} color={INDIGO} span={2} h={240}>
                    {loading ? <ChartSkeleton h={240} /> : (
                        <Line
                            data={{
                                labels: monthLabels,
                                datasets: [
                                    { label: 'Created', data: monthCounts, borderColor: INDIGO, backgroundColor: `${INDIGO}18`, fill: true, tension: 0.4, pointRadius: 4 },
                                    { label: 'Verified', data: monthVerified, borderColor: EMERALD, backgroundColor: 'transparent', tension: 0.4, borderDash: [4,3], pointRadius: 3 },
                                    { label: 'Converted', data: monthConverted, borderColor: AMBER, backgroundColor: 'transparent', tension: 0.4, borderDash: [2,3], pointRadius: 3 }
                                ]
                            }}
                            options={{ ...lineOpts, plugins: { legend: { display: true, position: 'top', labels: { boxWidth: 10, font: { size: 10 } } } } }}
                        />
                    )}
                </ChartCard>

                {/* Stage distribution */}
                <ChartCard title="Lead Stages" icon={Target} color={VIOLET} h={240} badge={`${lf.totalLeads || 0} total`}>
                    {loading ? <ChartSkeleton h={240} /> : (
                        <Doughnut
                            data={{ labels: stageLabels, datasets: [{ data: stageCounts, backgroundColor: PALETTE_8, borderWidth: 2, borderColor: '#fff' }] }}
                            options={{ ...arcOpts, cutout: '60%' }}
                        />
                    )}
                </ChartCard>

                {/* Temperature / heat map */}
                <ChartCard title="Temperature Heat" icon={Zap} color={AMBER} h={220}>
                    {loading ? <ChartSkeleton h={220} /> : (
                        <Bar
                            data={{
                                labels: tempLabels,
                                datasets: [{ data: tempCounts, backgroundColor: [SKY, AMBER, ROSE, EMERALD, TEAL], borderRadius: 6 }]
                            }}
                            options={baseOpts}
                        />
                    )}
                </ChartCard>

                {/* Priority breakdown */}
                <ChartCard title="Priority Distribution" icon={AlertTriangle} color={ROSE} h={220}>
                    {loading ? <ChartSkeleton h={220} /> : (
                        <Pie
                            data={{ labels: prioLabels, datasets: [{ data: prioCounts, backgroundColor: [ROSE, AMBER, INDIGO, SLATE], borderWidth: 2, borderColor: '#fff' }] }}
                            options={arcOpts}
                        />
                    )}
                </ChartCard>

                {/* Business type horizontal bar */}
                <ChartCard title="Business Types" icon={Globe} color={TEAL} h={220}>
                    {loading ? <ChartSkeleton h={220} /> : (
                        <Bar
                            data={{
                                labels: bizLabels,
                                datasets: [{ data: bizCounts, backgroundColor: `${TEAL}99`, borderRadius: 4 }]
                            }}
                            options={{ ...baseOpts, indexAxis: 'y' }}
                        />
                    )}
                </ChartCard>

                {/* Lost reasons */}
                <ChartCard title="Lost Reasons" icon={AlertTriangle} color={ROSE} h={220} badge="stage=rejected">
                    {loading ? <ChartSkeleton h={220} /> : lostLabels.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-400 text-xs italic">No lost leads recorded</div>
                    ) : (
                        <Bar
                            data={{
                                labels: lostLabels,
                                datasets: [{ data: lostCounts, backgroundColor: ROSE, borderRadius: 4 }]
                            }}
                            options={{ ...baseOpts, indexAxis: 'y' }}
                        />
                    )}
                </ChartCard>

                {/* Services demanded */}
                <ChartCard title="Target Services (Leads)" icon={Target} color={VIOLET} h={220}>
                    {loading ? <ChartSkeleton h={220} /> : svcLabels.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-400 text-xs italic">No target services recorded</div>
                    ) : (
                        <Bar
                            data={{
                                labels: svcLabels,
                                datasets: [{ data: svcCounts, backgroundColor: PALETTE_8, borderRadius: 4 }]
                            }}
                            options={baseOpts}
                        />
                    )}
                </ChartCard>

                {/* Follow-up health mini chart */}
                <ChartCard title="Follow-up Health" icon={Clock} color={ORANGE} h={220}>
                    {loading ? <ChartSkeleton h={220} /> : (
                        <Doughnut
                            data={{
                                labels: ['Overdue', 'Today', 'Upcoming'],
                                datasets: [{ data: [fh.overdueFollowups||0, fh.todayFollowups||0, fh.upcomingFollowups||0], backgroundColor: [ROSE, AMBER, EMERALD], borderWidth: 2, borderColor: '#fff' }]
                            }}
                            options={{ ...arcOpts, cutout: '55%' }}
                        />
                    )}
                </ChartCard>

                {/* Channel source */}
                <ChartCard title="Lead Channels" icon={Globe} color={SKY} h={220}>
                    {loading ? <ChartSkeleton h={220} /> : chanLabels.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-400 text-xs italic">No channel data</div>
                    ) : (
                        <Pie
                            data={{ labels: chanLabels, datasets: [{ data: chanCounts, backgroundColor: PALETTE_8, borderWidth: 2, borderColor: '#fff' }] }}
                            options={arcOpts}
                        />
                    )}
                </ChartCard>

            </div>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* SECTION 2 — TEAM INTELLIGENCE */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <SectionHeader label="Team Intelligence" color={EMERALD} />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                {/* Contractor performance grouped bars */}
                <ChartCard title="Contractor Performance" icon={Users} color={INDIGO} span={2} h={240}>
                    {loading ? <ChartSkeleton h={240} /> : (
                        <Bar
                            data={{
                                labels: ctNames,
                                datasets: [
                                    { label: 'Submitted', data: ctSubmitted, backgroundColor: `${SLATE}88`, borderRadius: 4 },
                                    { label: 'Verified', data: ctVerified, backgroundColor: INDIGO, borderRadius: 4 },
                                    { label: 'Closed', data: ctClosed, backgroundColor: EMERALD, borderRadius: 4 }
                                ]
                            }}
                            options={{ ...groupedBarOpts, plugins: { legend: { display: true, position: 'top', labels: { boxWidth: 10, font: { size: 10 } } } } }}
                        />
                    )}
                </ChartCard>

                {/* Rank distribution */}
                <ChartCard title="Rank Distribution" icon={UserCheck} color={VIOLET} h={240}>
                    {loading ? <ChartSkeleton h={240} /> : (
                        <Doughnut
                            data={{ labels: rankLabels, datasets: [{ data: rankCounts, backgroundColor: [SLATE, INDIGO, AMBER, EMERALD, VIOLET, ROSE], borderWidth: 2, borderColor: '#fff' }] }}
                            options={{ ...arcOpts, cutout: '55%' }}
                        />
                    )}
                </ChartCard>

                {/* Leaderboard bar */}
                <ChartCard title="Points Leaderboard" icon={TrendingUp} color={AMBER} h={220} span={2}>
                    {loading ? <ChartSkeleton h={220} /> : (
                        <Bar
                            data={{
                                labels: lbNames,
                                datasets: [{ data: lbPoints, backgroundColor: PALETTE_8, borderRadius: 5 }]
                            }}
                            options={baseOpts}
                        />
                    )}
                </ChartCard>

                {/* Weekly work hours */}
                <ChartCard title="Weekly Hours Logged" icon={Clock} color={TEAL} h={220}>
                    {loading ? <ChartSkeleton h={220} /> : ttLabels.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-400 text-xs italic">No time tracked this week</div>
                    ) : (
                        <Bar
                            data={{
                                labels: ttLabels,
                                datasets: [{ data: ttHours, backgroundColor: `${TEAL}bb`, borderRadius: 4 }]
                            }}
                            options={{ ...baseOpts, indexAxis: 'y' }}
                        />
                    )}
                </ChartCard>

            </div>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* SECTION 3 — CLIENT INTELLIGENCE */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <SectionHeader label="Client Intelligence" color={SKY} />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                {/* Monthly client onboarding */}
                <ChartCard title="Monthly Client Onboarding" icon={TrendingUp} color={SKY} span={2} h={240}>
                    {loading ? <ChartSkeleton h={240} /> : (
                        <Line
                            data={{
                                labels: mcLabels,
                                datasets: [{
                                    label: 'Clients Onboarded', data: mcCounts,
                                    borderColor: SKY, backgroundColor: `${SKY}18`, fill: true, tension: 0.4, pointRadius: 4
                                }]
                            }}
                            options={lineOpts}
                        />
                    )}
                </ChartCard>

                {/* Client health */}
                <ChartCard title="Client Health Status" icon={CheckCircle2} color={EMERALD} h={240}>
                    {loading ? <ChartSkeleton h={240} /> : (
                        <Doughnut
                            data={{
                                labels: ['Active', 'Churn Risk', 'Churned'],
                                datasets: [{ data: [ch.activeClients||0, ch.churnRiskClients||0, ch.churnedClients||0], backgroundColor: [EMERALD, AMBER, ROSE], borderWidth: 2, borderColor: '#fff' }]
                            }}
                            options={{ ...arcOpts, cutout: '60%' }}
                        />
                    )}
                </ChartCard>

                {/* Deal type distribution */}
                <ChartCard title="Deal Types" icon={Wallet} color={ORANGE} h={220}>
                    {loading ? <ChartSkeleton h={220} /> : (
                        <Bar
                            data={{
                                labels: dtLabels,
                                datasets: [{ data: dtCounts, backgroundColor: PALETTE_8, borderRadius: 4 }]
                            }}
                            options={baseOpts}
                        />
                    )}
                </ChartCard>

                {/* Services used by clients */}
                <ChartCard title="Services (Clients)" icon={Target} color={TEAL} h={220} span={2}>
                    {loading ? <ChartSkeleton h={220} /> : csvcLabels.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-400 text-xs italic">No service data on clients</div>
                    ) : (
                        <Bar
                            data={{
                                labels: csvcLabels,
                                datasets: [{ data: csvcCounts, backgroundColor: PALETTE_8.map(c => `${c}cc`), borderRadius: 4 }]
                            }}
                            options={baseOpts}
                        />
                    )}
                </ChartCard>

            </div>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* SECTION 4 — FINANCIAL INTELLIGENCE */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <SectionHeader label="Financial Intelligence" color={AMBER} />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                {/* Monthly commissions trend */}
                <ChartCard title="Commission Trend (PKR)" icon={TrendingUp} color={AMBER} span={2} h={240}>
                    {loading ? <ChartSkeleton h={240} /> : (
                        <Bar
                            data={{
                                labels: mcmLabels,
                                datasets: [{
                                    label: 'Commission Earned',
                                    data: mcmAmounts,
                                    backgroundColor: `${AMBER}99`,
                                    borderRadius: 5
                                }]
                            }}
                            options={groupedBarOpts}
                        />
                    )}
                </ChartCard>

                {/* Commission status */}
                <ChartCard title="Commission by Status" icon={Wallet} color={EMERALD} h={240}>
                    {loading ? <ChartSkeleton h={240} /> : (
                        <Doughnut
                            data={{
                                labels: cmLabels,
                                datasets: [{ data: cmAmounts, backgroundColor: [AMBER, EMERALD, ROSE, INDIGO], borderWidth: 2, borderColor: '#fff' }]
                            }}
                            options={{ ...arcOpts, cutout: '55%' }}
                        />
                    )}
                </ChartCard>

                {/* Commission by role */}
                <ChartCard title="Commission by Role" icon={Users} color={VIOLET} h={220} span={2}>
                    {loading ? <ChartSkeleton h={220} /> : crLabels.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-400 text-xs italic">No commission records yet</div>
                    ) : (
                        <Bar
                            data={{
                                labels: crLabels,
                                datasets: [{ data: crAmounts, backgroundColor: PALETTE_8, borderRadius: 4 }]
                            }}
                            options={baseOpts}
                        />
                    )}
                </ChartCard>

                {/* Payout batch status */}
                <ChartCard title="Payout Batches" icon={Wallet} color={ORANGE} h={220}>
                    {loading ? <ChartSkeleton h={220} /> : pvLabels.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-400 text-xs italic">No payouts yet</div>
                    ) : (
                        <Doughnut
                            data={{
                                labels: pvLabels,
                                datasets: [{ data: pvAmounts, backgroundColor: [SLATE, AMBER, INDIGO, EMERALD], borderWidth: 2, borderColor: '#fff' }]
                            }}
                            options={{ ...arcOpts, cutout: '50%' }}
                        />
                    )}
                </ChartCard>

            </div>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* SECTION 5 — EMAIL MARKETING INTELLIGENCE */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <SectionHeader label="Email Marketing Intelligence" color={ROSE} />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                {/* Outreach funnel */}
                <ChartCard title="Outreach Campaign Funnel" icon={Mail} color={INDIGO} span={2} h={240}>
                    {loading ? <ChartSkeleton h={240} /> : (
                        <Bar
                            data={{
                                labels: ['Sent', 'Delivered', 'Opened', 'Unique Opens', 'Clicked', 'Unique Clicks', 'Bounced', 'Unsubscribed'],
                                datasets: [{
                                    data: [ef.sent||0, ef.delivered||0, ef.opened||0, ef.uniqueOpens||0, ef.clicked||0, ef.uniqueClicks||0, ef.bounced||0, ef.unsubscribed||0],
                                    backgroundColor: [INDIGO, TEAL, EMERALD, `${EMERALD}88`, SKY, `${SKY}88`, ROSE, AMBER],
                                    borderRadius: 5
                                }]
                            }}
                            options={baseOpts}
                        />
                    )}
                </ChartCard>

                {/* Campaign status pie */}
                <ChartCard title="Campaign Status" icon={Mail} color={VIOLET} h={240}>
                    {loading ? <ChartSkeleton h={240} /> : csCounts.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-400 text-xs italic">No campaigns yet</div>
                    ) : (
                        <Pie
                            data={{ labels: csLabels, datasets: [{ data: csCounts, backgroundColor: PALETTE_8, borderWidth: 2, borderColor: '#fff' }] }}
                            options={arcOpts}
                        />
                    )}
                </ChartCard>

                {/* Email Log status breakdown */}
                <ChartCard title="Email Log Breakdown (30d)" icon={Activity} color={EMERALD} h={220} span={2}>
                    {loading ? <ChartSkeleton h={220} /> : elLabels.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-400 text-xs italic">No email logs yet</div>
                    ) : (
                        <Bar
                            data={{
                                labels: elLabels,
                                datasets: [{ data: elCounts, backgroundColor: PALETTE_8, borderRadius: 4 }]
                            }}
                            options={baseOpts}
                        />
                    )}
                </ChartCard>

                {/* SMTP health */}
                <ChartCard title="SMTP Health" icon={Shield} color={TEAL} h={220}>
                    {loading ? <ChartSkeleton h={220} /> : (
                        <Doughnut
                            data={{
                                labels: smtpLabels,
                                datasets: [{ data: smtpCounts, backgroundColor: [EMERALD, ROSE, AMBER, SLATE, ORANGE], borderWidth: 2, borderColor: '#fff' }]
                            }}
                            options={{ ...arcOpts, cutout: '55%' }}
                        />
                    )}
                </ChartCard>

                {/* Sequence enrollment */}
                <ChartCard title="Sequence Enrollments" icon={Zap} color={ORANGE} h={220} span={2}>
                    {loading ? <ChartSkeleton h={220} /> : seqEnLabels.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-400 text-xs italic">No sequence enrollments yet</div>
                    ) : (
                        <Bar
                            data={{
                                labels: seqEnLabels,
                                datasets: [{ data: seqEnCounts, backgroundColor: [INDIGO, EMERALD, AMBER, ROSE], borderRadius: 4 }]
                            }}
                            options={baseOpts}
                        />
                    )}
                </ChartCard>

                {/* Campaign rates computed KPIs */}
                <ChartCard title="Campaign Rates" icon={TrendingUp} color={AMBER} h={220}>
                    {loading ? <ChartSkeleton h={220} /> : (
                        <Radar
                            data={{
                                labels: ['Open Rate', 'Click Rate', 'Bounce Rate', 'Unsub Rate', 'Delivery Rate'],
                                datasets: [{
                                    label: 'Rate %',
                                    data: [
                                        ef.sent ? +((ef.opened/ef.sent)*100).toFixed(1) : 0,
                                        ef.sent ? +((ef.clicked/ef.sent)*100).toFixed(1) : 0,
                                        ef.sent ? +((ef.bounced/ef.sent)*100).toFixed(1) : 0,
                                        ef.sent ? +((ef.unsubscribed/ef.sent)*100).toFixed(1) : 0,
                                        ef.sent ? +((ef.delivered/ef.sent)*100).toFixed(1) : 0
                                    ],
                                    borderColor: AMBER,
                                    backgroundColor: `${AMBER}25`,
                                    pointBackgroundColor: AMBER
                                }]
                            }}
                            options={radarOpts}
                        />
                    )}
                </ChartCard>

            </div>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* SECTION 6 — ACTIVITY & AUDIT */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <SectionHeader label="Activity & Audit Intelligence" color={SLATE} />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                {/* Daily activity volume line */}
                <ChartCard title="Daily Activity (14 days)" icon={Activity} color={INDIGO} span={2} h={220}>
                    {loading ? <ChartSkeleton h={220} /> : (
                        <Line
                            data={{
                                labels: daLabels,
                                datasets: [{
                                    label: 'Events',
                                    data: daCounts,
                                    borderColor: INDIGO,
                                    backgroundColor: `${INDIGO}15`,
                                    fill: true,
                                    tension: 0.4,
                                    pointRadius: 3
                                }]
                            }}
                            options={lineOpts}
                        />
                    )}
                </ChartCard>

                {/* Audit by role */}
                <ChartCard title="Audit by Role (30d)" icon={Shield} color={ROSE} h={220}>
                    {loading ? <ChartSkeleton h={220} /> : (
                        <Pie
                            data={{ labels: arLabels, datasets: [{ data: arCounts, backgroundColor: PALETTE_8, borderWidth: 2, borderColor: '#fff' }] }}
                            options={arcOpts}
                        />
                    )}
                </ChartCard>

                {/* Top activity types */}
                <ChartCard title="Activity Types (30d)" icon={Activity} color={TEAL} span={2} h={220}>
                    {loading ? <ChartSkeleton h={220} /> : actLabels.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-400 text-xs italic">No activity recorded</div>
                    ) : (
                        <Bar
                            data={{
                                labels: actLabels,
                                datasets: [{ data: actCounts, backgroundColor: PALETTE_8, borderRadius: 4 }]
                            }}
                            options={{ ...baseOpts, indexAxis: 'y' }}
                        />
                    )}
                </ChartCard>

                {/* Top audit radar */}
                <ChartCard title="Audit Event Radar (30d)" icon={Shield} color={VIOLET} h={220}>
                    {loading ? <ChartSkeleton h={220} /> : auLabels.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-400 text-xs italic">No audit events</div>
                    ) : (
                        <Radar
                            data={{
                                labels: auLabels,
                                datasets: [{
                                    label: 'Audit Count',
                                    data: auCounts,
                                    borderColor: VIOLET,
                                    backgroundColor: `${VIOLET}20`,
                                    pointBackgroundColor: VIOLET
                                }]
                            }}
                            options={radarOpts}
                        />
                    )}
                </ChartCard>

            </div>
        </div>
    );
}
