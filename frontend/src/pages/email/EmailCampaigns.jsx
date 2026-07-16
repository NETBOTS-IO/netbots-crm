import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { Play, Plus, RefreshCw, BarChart2 } from 'lucide-react';

export default function EmailCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await api.get('/email-campaigns');
      if (res) setCampaigns(res);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch campaigns.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleSend = async (id) => {
    if (!window.confirm('Are you sure you want to trigger this campaign to be sent immediately?')) return;
    try {
      const res = await api.post(`/email-campaigns/${id}/send`);
      toast({ title: 'Sending started', description: 'Emails are queueing in the background.' });
      fetchCampaigns();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to send campaign.' });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Email Campaigns</h1>
          <p className="text-sm text-slate-500 mt-1">Compose newsletters and monitor outreach results.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchCampaigns} variant="outline" size="icon">
            <RefreshCw size={16} />
          </Button>
          <Link to="/email/campaigns/new">
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus size={16} />
              New Campaign
            </Button>
          </Link>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-slate-500 text-center py-6">Loading campaigns...</div>
          ) : campaigns.length === 0 ? (
            <div className="text-slate-500 text-center py-10">No campaigns created yet. Click New Campaign to build one.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Audience</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((camp) => (
                  <TableRow key={camp._id}>
                    <TableCell className="font-semibold text-slate-800">{camp.name}</TableCell>
                    <TableCell>{camp.subject}</TableCell>
                    <TableCell className="capitalize">{camp.audienceType.replace('_', ' ')}</TableCell>
                    <TableCell>{camp.stats?.totalRecipients || 0} emails</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        camp.status === 'sent' ? 'bg-green-50 text-green-700' :
                        camp.status === 'sending' ? 'bg-amber-50 text-amber-700 animate-pulse' : 'bg-slate-50 text-slate-700'
                      }`}>
                        {camp.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {camp.status === 'draft' && (
                        <Button onClick={() => handleSend(camp._id)} size="sm" variant="outline" className="text-blue-600 hover:text-blue-700">
                          <Play size={14} className="mr-1" /> Send Now
                        </Button>
                      )}
                      <Link to={`/email/campaigns/${camp._id}/report`}>
                        <Button size="sm" variant="outline">
                          <BarChart2 size={14} className="mr-1" /> Stats
                        </Button>
                      </Link>
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
