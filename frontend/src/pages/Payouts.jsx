import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import api from '@/lib/api';
import { Download, Trash2, CheckCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const Payouts = () => {
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchPayouts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/payouts');
            if (res.success) setPayouts(res.data);
        } catch (err) {
            console.error("Failed to fetch payouts", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayouts();
    }, []);

    const handleCreateBatch = async () => {
        try {
            const now = new Date();
            const res = await api.post('/payouts', {
                weekLabel: `Week of ${now.toLocaleDateString()}`,
                weekNumber: Math.ceil(now.getDate() / 7)
            });
            if (res.success) {
                toast({ title: "Batch Created", description: "Successfully created payout batch." });
                fetchPayouts();
            } else {
                toast({ variant: "destructive", title: "Failed", description: res.error });
            }
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: err.error || "Failed to create batch." });
        }
    };

    const handleMarkPaid = async (id) => {
        try {
            const res = await api.put(`/payouts/${id}/status`, { status: 'completed' });
            if (res.success) {
                toast({ title: "Marked Completed", description: "Payout batch has been marked as completed." });
                fetchPayouts();
            }
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: "Failed to mark as paid." });
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this batch? Commissions will be reverted to pending.")) return;
        try {
            const res = await api.delete(`/payouts/${id}`);
            if (res.success) {
                toast({ title: "Batch Deleted", description: "Batch deleted and commissions reverted." });
                fetchPayouts();
            }
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete batch." });
        }
    };

    if (loading && payouts.length === 0) return <div className="p-8 text-center">Loading payouts...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">Weekly Payouts</h2>
                    <p className="text-xs text-slate-500 font-medium uppercase">Manage weekly payouts and pending commissions</p>
                </div>
                <Button size="sm" className="bg-slate-950 hover:bg-slate-900 text-white" onClick={handleCreateBatch}>Create New Batch</Button>
            </div>

            <Card className="border border-slate-200">
                <CardContent className="pt-6">
                    {payouts.length === 0 ? (
                        <div className="text-center p-8 text-slate-400 text-sm">No payouts available. Create a batch from pending commissions.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="text-slate-500 font-medium">Batch ID</TableHead>
                                        <TableHead className="text-slate-500 font-medium">Label</TableHead>
                                        <TableHead className="text-slate-500 font-medium">Total Amount</TableHead>
                                        <TableHead className="text-slate-500 font-medium">Status</TableHead>
                                        <TableHead className="text-slate-500 font-medium">Recipients</TableHead>
                                        <TableHead className="text-right text-slate-500 font-medium">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payouts.map((payout) => (
                                        <TableRow key={payout._id} className="hover:bg-slate-50/50">
                                            <TableCell className="font-mono text-xs text-slate-500">{payout._id.substring(0, 8)}...</TableCell>
                                            <TableCell className="font-medium text-slate-900">{payout.weekLabel}</TableCell>
                                            <TableCell className="font-semibold text-slate-900">PKR {payout.totalAmount?.toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={payout.status === 'completed' ? "border-emerald-500 text-emerald-600 bg-emerald-50/50" : "border-slate-300 text-slate-500 bg-slate-50/50"}>
                                                    {payout.status?.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-650">{payout.totalRecipients}</TableCell>
                                            <TableCell className="text-right flex items-center justify-end gap-2">
                                                {payout.status !== 'completed' && (
                                                    <Button variant="outline" size="icon" title="Mark as Completed" onClick={() => handleMarkPaid(payout._id)} className="h-8 w-8 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-emerald-600">
                                                        <CheckCircle size={14} />
                                                    </Button>
                                                )}
                                                <Button variant="outline" size="icon" title="Delete Batch" onClick={() => handleDelete(payout._id)} className="h-8 w-8 border-slate-200 text-slate-650 hover:bg-slate-50 hover:text-red-600">
                                                    <Trash2 size={14} />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Payouts;
