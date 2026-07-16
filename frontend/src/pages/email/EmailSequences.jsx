import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { GitBranch, Plus, Play, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function EmailSequences() {
  const [sequences, setSequences] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSequences = async () => {
    try {
      setLoading(true);
      const res = await api.get('/email-sequences');
      if (res) setSequences(res);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch automation sequences.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSequences();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this automation sequence flow?')) return;
    try {
      await api.delete(`/email-sequences/${id}`);
      toast({ title: 'Deleted', description: 'Sequence deleted.' });
      fetchSequences();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete sequence.' });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Email Funnels</h1>
          <p className="text-sm text-slate-500 mt-1">Configure Mautic/n8n style visual drag-and-drop marketing funnels.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchSequences} variant="outline" size="icon">
            <RefreshCw size={16} />
          </Button>
          <Link to="/email/sequences/new">
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus size={16} />
              New Flow
            </Button>
          </Link>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-slate-500 text-center py-6">Loading sequences...</div>
          ) : sequences.length === 0 ? (
            <div className="text-slate-500 text-center py-10">No automation sequences created yet. Click New Flow to design one.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sequence Name</TableHead>
                  <TableHead>Trigger Type</TableHead>
                  <TableHead>Total Enrolled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sequences.map((seq) => (
                  <TableRow key={seq._id}>
                    <TableCell className="font-semibold text-slate-800 flex items-center gap-2 mt-1">
                      <GitBranch size={16} className="text-slate-400" />
                      {seq.name}
                    </TableCell>
                    <TableCell className="capitalize">{seq.trigger?.type.replace('_', ' ')}</TableCell>
                    <TableCell>{seq.stats?.totalEnrolled || 0} enrolled</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        seq.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-700'
                      }`}>
                        {seq.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link to={`/email/sequences/${seq._id}/edit`}>
                        <Button size="sm" variant="outline">Edit Canvas</Button>
                      </Link>
                      <Button onClick={() => handleDelete(seq._id)} size="sm" variant="destructive">
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
