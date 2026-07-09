import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import api from '@/lib/api';
import { useToast } from "@/hooks/use-toast";

export function AddTeamMemberDialog({ open, setOpen, onSuccess, memberToEdit = null }) {
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        name: memberToEdit?.name || '',
        email: memberToEdit?.email || '',
        password: memberToEdit ? '' : 'ChangeMe123!',
        role: memberToEdit?.role || 'lead_gen',
        designation: memberToEdit?.designation || '',
        phone: memberToEdit?.phone || '',
        rank: memberToEdit?.rank || 'rookie'
    });
    const [loading, setLoading] = useState(false);

    // Update form when memberToEdit changes
    useEffect(() => {
        if (memberToEdit) {
            setFormData({
                name: memberToEdit.name || '',
                email: memberToEdit.email || '',
                password: '', // blank on edit means don't change
                role: memberToEdit.role || 'lead_gen',
                designation: memberToEdit.designation || '',
                phone: memberToEdit.phone || '',
                rank: memberToEdit.rank || 'rookie'
            });
        } else {
            setFormData({
                name: '',
                email: '',
                password: 'ChangeMe123!',
                role: 'lead_gen',
                designation: '',
                phone: '',
                rank: 'rookie'
            });
        }
    }, [memberToEdit]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (memberToEdit) {
                const payload = { ...formData };
                if (!payload.password) delete payload.password; // backend might not support password update yet, but let's just send what we have
                const res = await api.put(`/team/${memberToEdit._id}`, payload);
                if (res.success) {
                    toast({ title: "Updated", description: "Team member updated successfully." });
                    onSuccess();
                    setOpen(false);
                } else {
                    toast({ variant: "destructive", title: "Error", description: res.error || "Failed to update member." });
                }
            } else {
                const res = await api.post('/auth/register', formData);
                if (res.success) {
                    toast({ title: "Created", description: "Team member added successfully." });
                    onSuccess();
                    setOpen(false);
                } else {
                    toast({ variant: "destructive", title: "Error", description: res.error || "Failed to add member." });
                }
            }
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: err.error || "An unexpected error occurred." });
            console.error("Failed to add/update member", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{memberToEdit ? 'Edit Team Member' : 'Add New Team Member'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(val) => setFormData({ ...formData, role: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="lead_gen">Lead Gen</SelectItem>
                                    <SelectItem value="sales">Sales (Closer)</SelectItem>
                                    <SelectItem value="technical_staff">Technical Staff</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="designation">Designation</Label>
                            <Select
                                value={formData.designation}
                                onValueChange={(val) => setFormData({ ...formData, designation: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select designation" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="Supervisor">Supervisor</SelectItem>
                                    <SelectItem value="LeadCollector">Lead Collector</SelectItem>
                                    <SelectItem value="LeadVerifier">Lead Verifier</SelectItem>
                                    <SelectItem value="LeadCloser">Lead Closer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone (Optional)</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rank">Rank / Tag</Label>
                            <Select
                                value={formData.rank}
                                onValueChange={(val) => setFormData({ ...formData, rank: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select rank" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="rookie">Rookie</SelectItem>
                                    <SelectItem value="hunter">Hunter</SelectItem>
                                    <SelectItem value="closer">Closer</SelectItem>
                                    <SelectItem value="elite_closer">Elite Closer</SelectItem>
                                    <SelectItem value="gold_closer">Gold Closer</SelectItem>
                                    <SelectItem value="champion">Champion</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {!memberToEdit && (
                        <div className="space-y-2">
                            <Label htmlFor="password">Temporary Password</Label>
                            <Input
                                id="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    )}
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : (memberToEdit ? 'Save Changes' : 'Create Account')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
