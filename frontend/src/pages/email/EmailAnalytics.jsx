import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, TrendingUp, RefreshCw, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmailAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/email-analytics/overview');
      if (res) setData(res);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch global stats.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Email Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Aggregated engagement and delivery trends across your campaigns.</p>
        </div>
        <Button onClick={fetchStats} variant="outline" size="icon">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {loading || !data ? (
        <div className="text-slate-500 text-center py-6">Calculating metrics...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-slate-500 uppercase">Deliverability</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-900">
                {data.totalSent ? ((data.totalDelivered / data.totalSent) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-xs text-slate-400 mt-1">Successful deliveries: {data.totalDelivered}</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-slate-500 uppercase">Average Open Rate</CardTitle>
              <Eye className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-900">
                {data.totalDelivered ? ((data.uniqueOpens / data.totalDelivered) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-xs text-slate-400 mt-1">Unique readers: {data.uniqueOpens}</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-slate-500 uppercase">Click CTR</CardTitle>
              <BarChart3 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-900">
                {data.totalDelivered ? ((data.totalClicks / data.totalDelivered) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-xs text-slate-400 mt-1">Total click redirections: {data.totalClicks}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
