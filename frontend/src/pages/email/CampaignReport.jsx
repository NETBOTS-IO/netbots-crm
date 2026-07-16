import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Mail, CheckCircle, AlertTriangle, Eye, MousePointer } from 'lucide-react';

export default function CampaignReport() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/email-campaigns/${id}/report`);
        if (res) setData(res);
      } catch (err) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch campaign stats.' });
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  if (loading) return <div className="p-6 text-slate-500 text-center">Loading campaign report...</div>;
  if (!data) return <div className="p-6 text-slate-500 text-center">Report not found.</div>;

  const { campaign, logs } = data;
  const uniqueOpens = campaign.stats?.uniqueOpens || 0;
  const clickCount = campaign.stats?.clicked || 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link to="/email/campaigns">
          <Button variant="outline" size="icon">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{campaign.name} Report</h1>
          <p className="text-sm text-slate-500 mt-1">Subject: "{campaign.subject}"</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">Recipients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.stats?.totalRecipients || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">Unique Opens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueOpens}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clickCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">Failed/Bounces</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{campaign.stats?.failed || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Delivery Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-slate-500 text-center py-6">No recipients have been dispatched yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Opens</TableHead>
                  <TableHead>Clicks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell className="font-medium">{log.recipientEmail}</TableCell>
                    <TableCell>{log.recipientName || '-'}</TableCell>
                    <TableCell className="capitalize">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        log.status === 'opened' || log.status === 'clicked' ? 'bg-green-50 text-green-700' :
                        log.status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-700'
                      }`}>
                        {log.status}
                      </span>
                    </TableCell>
                    <TableCell>{log.openCount}</TableCell>
                    <TableCell>{log.clickCount}</TableCell>
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
