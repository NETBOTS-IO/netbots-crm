import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useToast } from "@/hooks/use-toast";
import api from '@/lib/api';
import { jsPDF } from 'jspdf';
import { FileDown, Search, ShieldAlert, ExternalLink, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AuditLogs() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [userSearch, setUserSearch] = useState('');
    const [pathSearch, setPathSearch] = useState('');
    
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/audit-logs?page=${pagination.page}&limit=50`);
            if (res.success) {
                setLogs(res.data);
                setPagination(res.pagination);
            }
        } catch (err) {
            console.error('Failed to fetch logs', err);
            toast({ variant: "destructive", title: "Error", description: "Failed to fetch audit logs." });
        } finally {
            setLoading(false);
        }
    }, [pagination.page, toast]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    if (user?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
                <ShieldAlert className="text-red-500 mb-4 animate-pulse" size={48} />
                <h3 className="text-lg font-black uppercase tracking-wider text-slate-700">Access Denied</h3>
                <p className="text-xs text-slate-400 font-bold uppercase mt-1">This module is reserved exclusively for System Administrators</p>
            </div>
        );
    }

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Filter Logs Client-Side
    const filteredLogs = logs.filter(log => {
        const nameMatch = (log.userId?.name || log.username || '').toLowerCase().includes(userSearch.toLowerCase());
        
        const logPath = log.action === 'PAGE_VIEW' ? log.target : (log.details?.path || '');
        const pathMatch = logPath.toLowerCase().includes(pathSearch.toLowerCase());
        
        return nameMatch && pathMatch;
    });

    // Export PDF
    const exportToPDF = () => {
        if (filteredLogs.length === 0) {
            toast({ variant: "destructive", title: "No Data", description: "There are no logs matching the current filters to export." });
            return;
        }

        try {
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.text("NetBots CRM - System Audit Logs Report", 14, 15);
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Generated on: ${new Date().toLocaleString()} | Filtered Count: ${filteredLogs.length}`, 14, 21);

            doc.setDrawColor(200, 200, 200);
            doc.line(14, 25, 282, 25);

            // Print Headers
            let y = 32;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.text("Timestamp", 14, y);
            doc.text("Username", 55, y);
            doc.text("Role", 95, y);
            doc.text("Action", 115, y);
            doc.text("Path / Target Link", 145, y);
            doc.text("IP Address", 230, y);

            doc.line(14, y + 2, 282, y + 2);
            y += 7;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);

            filteredLogs.forEach((log) => {
                if (y > 190) {
                    doc.addPage();
                    y = 20;
                    // reprint headers
                    doc.setFont("helvetica", "bold");
                    doc.text("Timestamp", 14, y);
                    doc.text("Username", 55, y);
                    doc.text("Role", 95, y);
                    doc.text("Action", 115, y);
                    doc.text("Path / Target Link", 145, y);
                    doc.text("IP Address", 230, y);
                    doc.line(14, y + 2, 282, y + 2);
                    y += 7;
                    doc.setFont("helvetica", "normal");
                }

                const path = log.action === 'PAGE_VIEW' ? log.target : (log.details?.path || 'N/A');
                const name = log.userId?.name || log.username || 'System';

                doc.text(formatDate(log.createdAt), 14, y);
                doc.text(name.substring(0, 22), 55, y);
                doc.text(log.role || 'N/A', 95, y);
                doc.text(log.action || 'N/A', 115, y);
                doc.text(path.substring(0, 48), 145, y);
                doc.text(log.ipAddress || 'Unknown', 230, y);

                y += 6;
            });

            doc.save(`Audit_Logs_Report_${Date.now()}.pdf`);
            toast({ title: "Export Complete", description: "Audit logs PDF report generated successfully." });
        } catch (err) {
            console.error("PDF generation failed", err);
            toast({ variant: "destructive", title: "Error", description: "Failed to generate PDF report." });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-lg border shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Audit Logs Registry</h1>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Granular click tracking, page navigation logs, and security events</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchLogs} className="font-bold gap-2">
                        <RefreshCcw size={14} /> Refresh
                    </Button>
                    <Button size="sm" onClick={exportToPDF} className="font-bold gap-2 bg-blue-600 hover:bg-blue-700">
                        <FileDown size={14} /> Export to PDF
                    </Button>
                </div>
            </div>

            {/* Filter Dashboard */}
            <Card className="shadow-sm">
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label htmlFor="userSearch" className="text-[10px] font-black uppercase text-slate-500">Filter by User</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <Input 
                                id="userSearch"
                                placeholder="Search by name or email..." 
                                value={userSearch} 
                                onChange={(e) => setUserSearch(e.target.value)} 
                                className="pl-9 h-9 font-bold"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="pathSearch" className="text-[10px] font-black uppercase text-slate-500">Filter by Path</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <Input 
                                id="pathSearch"
                                placeholder="Search by page path (e.g. /leads)..." 
                                value={pathSearch} 
                                onChange={(e) => setPathSearch(e.target.value)} 
                                className="pl-9 h-9 font-bold"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardContent className="p-0 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="font-bold text-slate-700">Timestamp</TableHead>
                                <TableHead className="font-bold text-slate-700">Username</TableHead>
                                <TableHead className="font-bold text-slate-700">Role</TableHead>
                                <TableHead className="font-bold text-slate-700">Action</TableHead>
                                <TableHead className="font-bold text-slate-700">Target Element / Path Link</TableHead>
                                <TableHead className="font-bold text-slate-700">IP Address</TableHead>
                                <TableHead className="font-bold text-slate-700">Extra Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && filteredLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">Loading logs...</TableCell>
                                </TableRow>
                            ) : filteredLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-slate-400 italic font-medium">No logs matched your filter criteria</TableCell>
                                </TableRow>
                            ) : filteredLogs.map((log) => {
                                const path = log.action === 'PAGE_VIEW' ? log.target : (log.details?.path || '');
                                return (
                                    <TableRow key={log._id} className="hover:bg-slate-50/50">
                                        <TableCell className="font-mono text-xs whitespace-nowrap text-slate-600">
                                            {formatDate(log.createdAt)}
                                        </TableCell>
                                        <TableCell className="font-bold text-slate-900">
                                            {log.userId?.name || log.username}
                                        </TableCell>
                                        <TableCell className="capitalize text-xs font-semibold">
                                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                                                log.role === 'admin' ? 'bg-red-50 text-red-700 border border-red-200' :
                                                log.role === 'sales' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                'bg-slate-50 text-slate-700 border border-slate-200'
                                            }`}>
                                                {log.role}
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs uppercase text-blue-700 font-bold">
                                            {log.action}
                                        </TableCell>
                                        <TableCell className="text-xs max-w-[280px] font-semibold text-slate-800">
                                            {path ? (
                                                <Link to={path} className="text-blue-600 hover:underline flex items-center gap-1" title="Click to inspect page view">
                                                    {path} <ExternalLink size={12} className="inline opacity-60" />
                                                </Link>
                                            ) : (
                                                log.target || 'N/A'
                                            )}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-slate-500">
                                            {log.ipAddress || 'Unknown'}
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-500 font-mono max-w-[200px] truncate" title={JSON.stringify(log.details)}>
                                            {log.details ? JSON.stringify(log.details) : '-'}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50">
                        <div className="text-xs text-slate-500 font-bold uppercase">
                            Showing page {pagination.page} of {pagination.pages} (Total: {pagination.total} entries)
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                disabled={pagination.page <= 1}
                                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                            >
                                Previous
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                disabled={pagination.page >= pagination.pages}
                                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
