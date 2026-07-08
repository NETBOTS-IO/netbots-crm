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
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Weekly Payouts</h2>
                <Button size="sm" onClick={handleCreateBatch}>Create New Batch</Button>
            </div>

            <Card>
                <CardContent className="pt-6">
                    {payouts.length === 0 ? (
                        <div className="text-center p-8 text-slate-500">No payouts available. Create a batch from pending commissions.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Batch ID</TableHead>
                                        <TableHead>Label</TableHead>
                                        <TableHead>Total Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Recipients</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payouts.map((payout) => (
                                        <TableRow key={payout._id}>
                                            <TableCell className="font-mono text-xs">{payout._id.substring(0, 8)}...</TableCell>
                                            <TableCell>{payout.weekLabel}</TableCell>
                                            <TableCell className="font-bold text-emerald-600">${payout.totalAmount?.toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Badge variant={payout.status === 'completed' ? 'success' : 'secondary'}>
                                                    {payout.status?.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{payout.totalRecipients}</TableCell>
                                            <TableCell className="text-right flex items-center justify-end gap-2">
                                                {payout.status !== 'completed' && (
                                                    <Button variant="outline" size="icon" title="Mark as Completed" onClick={() => handleMarkPaid(payout._id)} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                                                        <CheckCircle size={14} />
                                                    </Button>
                                                )}
                                                <Button variant="outline" size="icon" title="Delete Batch" onClick={() => handleDelete(payout._id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
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
