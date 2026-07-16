import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users, Trash2 } from 'lucide-react';

export default function EmailLists() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '',
    description: '',
    subscribers: []
  });

  const fetchLists = async () => {
    try {
      setLoading(true);
      const res = await api.get('/email-lists');
      if (res) setLists(res);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch mailing lists.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/email-lists', form);
      toast({ title: 'Success', description: 'Mailing list created successfully.' });
      setIsOpen(false);
      fetchLists();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create list.' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this mailing list?')) return;
    try {
      await api.delete(`/email-lists/${id}`);
      toast({ title: 'Deleted', description: 'Mailing list deleted.' });
      fetchLists();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete.' });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Mailing Lists</h1>
          <p className="text-sm text-slate-500 mt-1">Manage static subscriber contacts lists.</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus size={16} />
          Create List
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-slate-500 text-center py-6">Loading lists...</div>
          ) : lists.length === 0 ? (
            <div className="text-slate-500 text-center py-10">No lists created yet. Click Create List to add one.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>List Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Subscribers</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lists.map((list) => (
                  <TableRow key={list._id}>
                    <TableCell className="font-semibold text-slate-800 flex items-center gap-2 mt-1">
                      <Users size={16} className="text-slate-400" />
                      {list.name}
                    </TableCell>
                    <TableCell>{list.description || '(No description)'}</TableCell>
                    <TableCell>{list.stats?.totalSubscribers || 0} contacts</TableCell>
                    <TableCell className="text-right">
                      <Button onClick={() => handleDelete(list._id)} size="sm" variant="destructive">
                        <Trash2 size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Mailing List</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input placeholder="List Name (e.g. Newsletter Subscribers)" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <Input placeholder="Short Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            <DialogFooter>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Save Mailing List</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
