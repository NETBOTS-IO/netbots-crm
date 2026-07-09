import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
    Users, 
    BarChart3, 
    TrendingUp, 
    CheckCircle2, 
    AlertCircle,
    UserCheck,
    Coins,
    Percent,
    Sliders
} from "lucide-react";
import api from '@/lib/api';
import { useToast } from "@/hooks/use-toast";

const Performance = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ collectors: [], verifiers: [], closers: [] });

    // Calculator States
    const [projectBudget, setProjectBudget] = useState('100000');
    const [selectedCollector, setSelectedCollector] = useState('');
    const [selectedVerifier, setSelectedVerifier] = useState('');
    const [selectedCloser, setSelectedCloser] = useState('');

    const [calculatorResult, setCalculatorResult] = useState(null);

    const fetchPerformanceData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/performance');
            if (res.success) {
                setData(res.data);
                if (res.data.collectors.length > 0) setSelectedCollector(res.data.collectors[0].name);
                if (res.data.verifiers.length > 0) setSelectedVerifier(res.data.verifiers[0].name);
                if (res.data.closers.length > 0) setSelectedCloser(res.data.closers[0].name);
            }
        } catch (err) {
            console.error("Failed to load performance data", err);
            toast({ variant: "destructive", title: "Error", description: "Failed to load team performance metrics." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPerformanceData();
    }, []);

    const calculateSplit = () => {
        const budget = parseFloat(projectBudget || 0);
        if (budget <= 0) {
            toast({ variant: "destructive", title: "Invalid Input", description: "Please enter a valid project budget." });
            return;
        }

        const collectorObj = data.collectors.find(c => c.name === selectedCollector);
        const verifierObj = data.verifiers.find(v => v.name === selectedVerifier);
        const closerObj = data.closers.find(c => c.name === selectedCloser);

        const collectorRate = collectorObj ? collectorObj.suggestedCommission : 1.0;
        const verifierRate = verifierObj ? verifierObj.suggestedCommission : 2.5;
        const closerRate = closerObj ? closerObj.suggestedCommission : 7.0;

        const collectorAmount = (budget * collectorRate) / 100;
        const verifierAmount = (budget * verifierRate) / 100;
        const closerAmount = (budget * closerRate) / 100;

        const totalCommissionRate = collectorRate + verifierRate + closerRate;
        const totalCommissionAmount = collectorAmount + verifierAmount + closerAmount;

        setCalculatorResult({
            collectorRate,
            verifierRate,
            closerRate,
            collectorAmount,
            verifierAmount,
            closerAmount,
            totalCommissionRate,
            totalCommissionAmount
        });
    };

    // Calculate calculators when selections change
    useEffect(() => {
        if (selectedCollector || selectedVerifier || selectedCloser) {
            calculateSplit();
        }
    }, [selectedCollector, selectedVerifier, selectedCloser, projectBudget, data]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
                <BarChart3 className="animate-bounce mb-4 text-blue-600" size={40} />
                <p className="font-bold uppercase text-xs tracking-wider">Analyzing remote team performance metrics...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex items-center gap-3 bg-white p-6 rounded-lg border shadow-sm">
                <BarChart3 className="text-blue-600" size={32} />
                <div>
                    <h2 className="text-2xl font-black text-slate-800">Performance Analytics & Commission Dashboard</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Deep performance ratios and project commission splitting for remote teams</p>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-sm">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] uppercase font-black text-slate-400">Collector Commission Suggestion</p>
                            <h3 className="text-2xl font-black text-blue-800 mt-1">Upto 2%</h3>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-full text-blue-600"><Percent size={20} /></div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100 shadow-sm">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] uppercase font-black text-slate-400">Verifier Commission Suggestion</p>
                            <h3 className="text-2xl font-black text-amber-800 mt-1">Upto 5%</h3>
                        </div>
                        <div className="p-3 bg-amber-500/10 rounded-full text-amber-600"><Percent size={20} /></div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100 shadow-sm">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] uppercase font-black text-slate-400">Closer Commission Suggestion</p>
                            <h3 className="text-2xl font-black text-emerald-800 mt-1">Upto 10%</h3>
                        </div>
                        <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-600"><Percent size={20} /></div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-rose-50 to-white border-rose-100 shadow-sm">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] uppercase font-black text-slate-400">Total Project Split Budget</p>
                            <h3 className="text-2xl font-black text-rose-800 mt-1">Max 15%</h3>
                        </div>
                        <div className="p-3 bg-rose-500/10 rounded-full text-rose-600"><Coins size={20} /></div>
                    </CardContent>
                </Card>
            </div>

            {/* Dynamic Commission Calculator Splitter */}
            <Card className="border border-slate-200 shadow-md">
                <CardHeader className="bg-slate-50 border-b pb-4">
                    <CardTitle className="text-sm font-black uppercase text-slate-700 tracking-wider flex items-center gap-2">
                        <Sliders size={16} className="text-blue-600" />
                        Project Commission Split Suggestions
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-slate-500">Project Value / Budget (PKR/USD)</Label>
                            <Input 
                                type="number" 
                                value={projectBudget} 
                                onChange={(e) => setProjectBudget(e.target.value)} 
                                className="h-10 font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-slate-500">Lead Collector</Label>
                            <select 
                                value={selectedCollector} 
                                onChange={(e) => setSelectedCollector(e.target.value)}
                                className="w-full h-10 px-3 border rounded-md bg-white text-sm font-bold border-slate-200"
                            >
                                <option value="">Select Collector</option>
                                {data.collectors.map(c => <option key={c.name} value={c.name}>{c.name} ({c.suggestedCommission}%)</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-slate-500">Lead Verifier</Label>
                            <select 
                                value={selectedVerifier} 
                                onChange={(e) => setSelectedVerifier(e.target.value)}
                                className="w-full h-10 px-3 border rounded-md bg-white text-sm font-bold border-slate-200"
                            >
                                <option value="">Select Verifier</option>
                                {data.verifiers.map(v => <option key={v.name} value={v.name}>{v.name} ({v.suggestedCommission}%)</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-slate-500">Lead Closer</Label>
                            <select 
                                value={selectedCloser} 
                                onChange={(e) => setSelectedCloser(e.target.value)}
                                className="w-full h-10 px-3 border rounded-md bg-white text-sm font-bold border-slate-200"
                            >
                                <option value="">Select Closer</option>
                                {data.closers.map(c => <option key={c.name} value={c.name}>{c.name} ({c.suggestedCommission}%)</option>)}
                            </select>
                        </div>
                    </div>

                    {calculatorResult && (
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t">
                            <div className="bg-slate-50 p-4 rounded border text-center">
                                <span className="text-[10px] text-slate-400 uppercase font-black">Collector Suggested Payout</span>
                                <h4 className="text-lg font-black text-blue-700 mt-1">{calculatorResult.collectorRate}%</h4>
                                <p className="text-xs text-slate-500 font-bold mt-1">PKR {calculatorResult.collectorAmount.toLocaleString()}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded border text-center">
                                <span className="text-[10px] text-slate-400 uppercase font-black">Verifier Suggested Payout</span>
                                <h4 className="text-lg font-black text-amber-700 mt-1">{calculatorResult.verifierRate}%</h4>
                                <p className="text-xs text-slate-500 font-bold mt-1">PKR {calculatorResult.verifierAmount.toLocaleString()}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded border text-center">
                                <span className="text-[10px] text-slate-400 uppercase font-black">Closer Suggested Payout</span>
                                <h4 className="text-lg font-black text-emerald-700 mt-1">{calculatorResult.closerRate}%</h4>
                                <p className="text-xs text-slate-500 font-bold mt-1">PKR {calculatorResult.closerAmount.toLocaleString()}</p>
                            </div>
                            <div className="bg-blue-600 p-4 rounded text-white text-center shadow-md">
                                <span className="text-[10px] text-blue-200 uppercase font-black">Total Commission Suggestion</span>
                                <h4 className="text-lg font-black mt-1">{calculatorResult.totalCommissionRate}%</h4>
                                <p className="text-xs text-blue-100 font-bold mt-1">PKR {calculatorResult.totalCommissionAmount.toLocaleString()}</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Detailed Analytics Tables */}
            <div className="grid grid-cols-1 gap-8">
                {/* 1. Lead Collectors */}
                <Card className="shadow-sm">
                    <CardHeader className="bg-slate-50/50 pb-4 border-b">
                        <CardTitle className="text-sm font-black uppercase text-slate-700 flex items-center gap-2">
                            <Users size={16} className="text-blue-600" />
                            Lead Collectors (Raw Data Quality)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Staff Name</TableHead>
                                    <TableHead className="text-center">Leads Collected</TableHead>
                                    <TableHead className="text-center">Verified by Verifier</TableHead>
                                    <TableHead className="text-center">Closed by Closer</TableHead>
                                    <TableHead className="text-center">Verification Ratio</TableHead>
                                    <TableHead className="text-center">Conversion Ratio</TableHead>
                                    <TableHead className="text-right">Suggested Rate</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.collectors.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-slate-400 italic py-6">No collector statistics found</TableCell>
                                    </TableRow>
                                ) : data.collectors.map((c) => (
                                    <TableRow key={c.name} className="hover:bg-slate-50/50">
                                        <TableCell className="font-bold text-slate-900">{c.name}</TableCell>
                                        <TableCell className="text-center font-semibold">{c.totalCollected}</TableCell>
                                        <TableCell className="text-center font-semibold text-amber-600">{c.verifiedCount}</TableCell>
                                        <TableCell className="text-center font-semibold text-emerald-600">{c.closedCount}</TableCell>
                                        <TableCell className="text-center font-bold">
                                            <Badge variant="outline" className={c.verificationRatio > 70 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-100 text-slate-700"}>
                                                {c.verificationRatio}%
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center font-bold">
                                            <Badge variant="outline" className={c.conversionRatio > 20 ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-slate-100 text-slate-700"}>
                                                {c.conversionRatio}%
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-black text-blue-700">{c.suggestedCommission}%</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* 2. Lead Verifiers */}
                <Card className="shadow-sm">
                    <CardHeader className="bg-slate-50/50 pb-4 border-b">
                        <CardTitle className="text-sm font-black uppercase text-slate-700 flex items-center gap-2">
                            <UserCheck size={16} className="text-amber-600" />
                            Lead Verifiers (Verification Authenticity)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Staff Name</TableHead>
                                    <TableHead className="text-center">Leads Verified</TableHead>
                                    <TableHead className="text-center">Verified Leads Closed</TableHead>
                                    <TableHead className="text-center">Verify-to-Close Ratio</TableHead>
                                    <TableHead className="text-right">Suggested Rate</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.verifiers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-slate-400 italic py-6">No verifier statistics found</TableCell>
                                    </TableRow>
                                ) : data.verifiers.map((v) => (
                                    <TableRow key={v.name} className="hover:bg-slate-50/50">
                                        <TableCell className="font-bold text-slate-900">{v.name}</TableCell>
                                        <TableCell className="text-center font-semibold">{v.totalVerified}</TableCell>
                                        <TableCell className="text-center font-semibold text-emerald-600">{v.closedCount}</TableCell>
                                        <TableCell className="text-center font-bold">
                                            <Badge variant="outline" className={v.closeRatio > 30 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-100 text-slate-700"}>
                                                {v.closeRatio}%
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-black text-amber-700">{v.suggestedCommission}%</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* 3. Lead Closers */}
                <Card className="shadow-sm">
                    <CardHeader className="bg-slate-50/50 pb-4 border-b">
                        <CardTitle className="text-sm font-black uppercase text-slate-700 flex items-center gap-2">
                            <TrendingUp size={16} className="text-emerald-600" />
                            Lead Closers (Sales Performance)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Staff Name</TableHead>
                                    <TableHead className="text-center">Leads Converted / Closed</TableHead>
                                    <TableHead className="text-right">Suggested Rate</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.closers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-slate-400 italic py-6">No closer statistics found</TableCell>
                                    </TableRow>
                                ) : data.closers.map((c) => (
                                    <TableRow key={c.name} className="hover:bg-slate-50/50">
                                        <TableCell className="font-bold text-slate-900">{c.name}</TableCell>
                                        <TableCell className="text-center font-semibold text-emerald-600">{c.totalClosed}</TableCell>
                                        <TableCell className="text-right font-black text-emerald-700">{c.suggestedCommission}%</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Performance;
