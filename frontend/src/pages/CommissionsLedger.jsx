import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const CommissionsLedger = () => {
    const [commissions, setCommissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [team, setTeam] = useState([]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [adding, setAdding] = useState(false);
    const [formData, setFormData] = useState({
        earnedBy: '',
        commissionAmount: '',
        commissionRole: 'sales_closer_onetime',
        dealAmount: '',
        status: 'pending'
    });

    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const isPrivileged = currentUser?.role === 'ceo' || currentUser?.role === 'admin';

    const fetchCommissions = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/commissions');
            if (res.success) setCommissions(res.data);
        } catch (err) {
            console.error("Failed to fetch commissions", err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchTeam = useCallback(async () => {
        if (!isPrivileged) return;
        try {
            const res = await api.get('/team');
            if (res.success) setTeam(res.data);
        } catch (err) {
            console.error("Failed to load team list", err);
        }
    }, [isPrivileged]);

    useEffect(() => {
        fetchCommissions();
        fetchTeam();
    }, [fetchCommissions, fetchTeam]);

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this commission?")) return;
        try {
            const res = await api.delete(`/commissions/${id}`);
            if (res.success) {
                toast({ title: "Deleted", description: "Commission deleted successfully." });
                setCommissions(commissions.filter(c => c._id !== id));
            }
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete commission." });
        }
    };

    const handleEditAmount = async (id, currentAmount) => {
        const newAmount = window.prompt("Enter new commission amount in USD:", currentAmount);
        if (!newAmount || isNaN(newAmount)) return;
        
        try {
            const res = await api.put(`/commissions/${id}`, { commissionAmount: parseFloat(newAmount) });
            if (res.success) {
                toast({ title: "Updated", description: "Commission amount updated." });
                setCommissions(commissions.map(c => c._id === id ? { ...c, commissionAmount: parseFloat(newAmount) } : c));
            }
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: "Failed to update commission." });
        }
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        setAdding(true);
        try {
            const payload = {
                earnedBy: formData.earnedBy,
                commissionAmount: parseFloat(formData.commissionAmount),
                commissionRole: formData.commissionRole,
                dealAmount: parseFloat(formData.dealAmount || 0),
                status: formData.status
            };
            const res = await api.post('/commissions', payload);
            if (res.success) {
                toast({ title: "Created", description: "Commission added successfully." });
                setIsAddOpen(false);
                setFormData({
                    earnedBy: '',
                    commissionAmount: '',
                    commissionRole: 'sales_closer_onetime',
                    dealAmount: '',
                    status: 'pending'
                });
                fetchCommissions();
            }
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: err.error || "Failed to create commission." });
        } finally {
            setAdding(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
            case 'paid': 
                return 'bg-emerald-500 hover:bg-emerald-600';
            case 'processing': 
                return 'bg-amber-500 hover:bg-amber-600';
            default: 
                return 'bg-slate-500 hover:bg-slate-600';
        }
    };

    if (loading && commissions.length === 0) return <div className="p-8 text-center">Loading commissions...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Commissions Ledger</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase">View and manage team earnings</p>
                </div>
                {isPrivileged && (
                    <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => setIsAddOpen(true)}>
                        <Plus size={14} /> Add Commission
                    </Button>
                )}
            </div>

            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                {isPrivileged && <TableHead>User</TableHead>}
                                <TableHead>Role</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                {isPrivileged && <TableHead className="text-right">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {commissions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={isPrivileged ? 6 : 4} className="text-center py-8 text-slate-400">
                                        No commissions found.
                                    </TableCell>
                                </TableRow>
                            ) : commissions.map((comm) => (
                                <TableRow key={comm._id}>
                                    <TableCell>{new Date(comm.createdAt).toLocaleDateString()}</TableCell>
                                    {isPrivileged && <TableCell>{comm.earnedBy?.name || 'Unknown'}</TableCell>}
                                    <TableCell className="text-xs capitalize">{comm.commissionRole?.replace(/_/g, ' ')}</TableCell>
                                    <TableCell className="font-bold text-emerald-600">${(comm.commissionAmount || comm.amount || 0).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Badge className={getStatusColor(comm.status)}>
                                            {comm.status?.toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    {isPrivileged && (
                                        <TableCell className="text-right flex items-center justify-end gap-2">
                                            <Button variant="outline" size="icon" onClick={() => handleEditAmount(comm._id, comm.commissionAmount || comm.amount)}>
                                                <Pencil size={14} />
                                            </Button>
                                            <Button variant="outline" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(comm._id)}>
                                                <Trash2 size={14} />
                                            </Button>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Add Commission Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white">
                    <DialogHeader>
                        <DialogTitle>Add Manual Commission</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="earnedBy">Team Member</Label>
                            <Select 
                                value={formData.earnedBy} 
                                onValueChange={(val) => setFormData({ ...formData, earnedBy: val })}
                            >
                                <SelectTrigger><SelectValue placeholder="Select team member" /></SelectTrigger>
                                <SelectContent>
                                    {team.map((member) => (
                                        <SelectItem key={member._id} value={member._id}>{member.name} ({member.role})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="commissionAmount">Commission USD</Label>
                                <Input 
                                    id="commissionAmount"
                                    type="number"
                                    required
                                    value={formData.commissionAmount}
                                    onChange={(e) => setFormData({ ...formData, commissionAmount: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dealAmount">Deal Amount USD (Opt.)</Label>
                                <Input 
                                    id="dealAmount"
                                    type="number"
                                    value={formData.dealAmount}
                                    onChange={(e) => setFormData({ ...formData, dealAmount: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="commissionRole">Commission Type</Label>
                            <Select 
                                value={formData.commissionRole} 
                                onValueChange={(val) => setFormData({ ...formData, commissionRole: val })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sales_closer_onetime">Sales Closer (One-time)</SelectItem>
                                    <SelectItem value="sales_closer_recurring">Sales Closer (Recurring)</SelectItem>
                                    <SelectItem value="lead_gen_commission">Lead Gen Commission</SelectItem>
                                    <SelectItem value="technical_staff_commission">Technical Staff Commission</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select 
                                value={formData.status} 
                                onValueChange={(val) => setFormData({ ...formData, status: val })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="processing">Processing</SelectItem>
                                    <SelectItem value="completed">Completed / Paid</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={adding}>
                                {adding ? 'Saving...' : 'Add Commission'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CommissionsLedger;
