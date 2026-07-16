import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { UserX2, Plus } from 'lucide-react';

export default function Unsubscribes() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  const fetchUnsubscribes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/email-webhooks/suppression-list');
      if (res) setList(res);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch unsubscribed registry.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnsubscribes();
  }, []);

  const handleManualAdd = async (e) => {
    e.preventDefault();
    if (!email) return;
    try {
      await api.post('/email-webhooks/suppression-list', { email });
      toast({ title: 'Suppressed', description: `${email} is now unsubscribed manually.` });
      setEmail('');
      fetchUnsubscribes();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.error || 'Failed to add.' });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Unsubscribe suppressing list</h1>
        <p className="text-sm text-slate-500 mt-1">Opt-out registry logs to prevent spam bounces.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Suppress Address Manually</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleManualAdd} className="space-y-4">
              <Input
                placeholder="email@example.com"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
                <Plus size={16} /> Suppress Email
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <UserX2 className="text-slate-500 h-5 w-5" />
              Suppressed Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-6 text-slate-500">Loading suppresses...</div>
            ) : list.length === 0 ? (
              <div className="text-center py-6 text-slate-500">No opt-out records yet.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email Address</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Unsubscribed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="font-semibold text-slate-800">{item.email}</TableCell>
                      <TableCell className="capitalize text-slate-650">{item.reason}</TableCell>
                      <TableCell>{new Date(item.unsubscribedAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
