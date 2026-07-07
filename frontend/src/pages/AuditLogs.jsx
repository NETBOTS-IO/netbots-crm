import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

export default function AuditLogs() {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
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
        } finally {
            setLoading(false);
        }
    }, [pagination.page]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    if (user?.role !== 'admin') {
        return <div className="p-8">Access Denied. Admin only.</div>;
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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
                <p className="text-slate-500">Industry-standard tracking of every single click, event, and activity performed on the platform.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-bold">Activity Logs</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>Username</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Target Element</TableHead>
                                <TableHead>IP Address</TableHead>
                                <TableHead>Extra Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">Loading logs...</TableCell>
                                </TableRow>
                            ) : logs.map((log) => (
                                <TableRow key={log._id}>
                                    <TableCell className="font-mono text-xs whitespace-nowrap">
                                        {formatDate(log.createdAt)}
                                    </TableCell>
                                    <TableCell className="font-semibold text-slate-800">
                                        {log.userId?.name || log.username}
                                    </TableCell>
                                    <TableCell className="capitalize text-xs font-medium">
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
                                    <TableCell className="text-xs max-w-[200px] truncate" title={log.target}>
                                        {log.target || 'N/A'}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-slate-500">
                                        {log.ipAddress || 'Unknown'}
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-500 font-mono max-w-[300px] truncate" title={JSON.stringify(log.details)}>
                                        {log.details ? JSON.stringify(log.details) : '-'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50">
                        <div className="text-xs text-slate-500">
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
