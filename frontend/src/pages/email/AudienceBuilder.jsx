import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users, Trash2, Filter, Eye, Tag, Sparkles, AlertCircle } from 'lucide-react';

const STAGE_COLORS = {
  identify: 'bg-slate-100 text-slate-700 border-slate-200',
  qualify: 'bg-blue-50 text-blue-700 border-blue-200',
  nurture: 'bg-amber-50 text-amber-700 border-amber-200',
  close: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  onboard: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200'
};

const TEMP_COLORS = {
  cold: 'bg-sky-50 text-sky-700 border-sky-200',
  warm: 'bg-orange-50 text-orange-700 border-orange-200',
  sql: 'bg-purple-50 text-purple-700 border-purple-200',
  closed: 'bg-emerald-50 text-emerald-700 border-emerald-200'
};

const PRIORITY_COLORS = {
  low: 'bg-slate-100 text-slate-650 border-slate-200',
  medium: 'bg-blue-50 text-blue-700 border-blue-200',
  high: 'bg-orange-50 text-orange-700 border-orange-205',
  urgent: 'bg-rose-50 text-rose-700 border-rose-200'
};

export default function AudienceBuilder() {
  const [segments, setSegments] = useState([]);
  const [mailingLists, setMailingLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [name, setName] = useState('');
  const [preview, setPreview] = useState({ count: 0, sample: [] });

  const [filters, setFilters] = useState({
    stage: [],
    temperature: [],
    priority: [],
    channel: [],
    listId: []
  });

  const { toast } = useToast();

  const fetchSegments = async () => {
    try {
      setLoading(true);
      const [segRes, listRes] = await Promise.all([
        api.get('/email-segments'),
        api.get('/email-lists')
      ]);
      if (segRes) setSegments(segRes);
      if (listRes) setMailingLists(listRes);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch segments configuration.' });
    } finally {
      setLoading(false);
    }
  };

  const getPreview = async () => {
    try {
      setPreviewLoading(true);
      const res = await api.post('/email-segments/preview', { filters });
      if (res) setPreview(res);
    } catch (err) {
      console.error(err);
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    fetchSegments();
  }, []);

  useEffect(() => {
    getPreview();
  }, [filters]);

  const toggleFilter = (type, value) => {
    setFilters(prev => {
      const current = prev[type] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [type]: updated };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name) return;
    try {
      await api.post('/email-segments', { name, filters });
      toast({ title: 'Segment Saved', description: 'Dynamic list segment added successfully.' });
      setName('');
      setFilters({ stage: [], temperature: [], priority: [], channel: [], listId: [] });
      fetchSegments();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save segment.' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this segment?')) return;
    try {
      await api.delete(`/email-segments/${id}`);
      toast({ title: 'Deleted', description: 'Segment removed.' });
      fetchSegments();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete.' });
    }
  };

  const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto bg-slate-50/50 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="text-blue-600 h-5 w-5" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dynamic Audiences</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Design auto-updating contact segments based on live CRM fields and status conditions.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl">
          <Users className="text-blue-600 h-4 w-4" />
          <span className="text-xs font-semibold text-blue-750">{segments.length} Saved Segments</span>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Left builder filter checklist panel */}
        <Card className="md:col-span-1 border border-slate-200/80 shadow-sm rounded-2xl bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
              <Filter className="text-blue-600" size={18} />
              Filter Designer
            </CardTitle>
            <CardDescription className="text-xs">
              Check attributes to narrow down your audience pool.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Stage filter checklist */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">CRM Lead Stage</label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['identify', 'qualify', 'nurture', 'close', 'onboard', 'rejected'].map(stage => {
                  const active = filters.stage.includes(stage);
                  return (
                    <button
                      type="button"
                      key={stage}
                      onClick={() => toggleFilter('stage', stage)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-all font-semibold capitalize ${
                        active 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                          : 'bg-white text-slate-650 hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      {stage}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Temperature filter checklist */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Lead Temperature</label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['cold', 'warm', 'sql', 'closed'].map(temp => {
                  const active = filters.temperature.includes(temp);
                  return (
                    <button
                      type="button"
                      key={temp}
                      onClick={() => toggleFilter('temperature', temp)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-all font-semibold capitalize ${
                        active 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                          : 'bg-white text-slate-650 hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      {temp}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority filter checklist */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Priority Level</label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['low', 'medium', 'high', 'urgent'].map(pri => {
                  const active = filters.priority.includes(pri);
                  return (
                    <button
                      type="button"
                      key={pri}
                      onClick={() => toggleFilter('priority', pri)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-all font-semibold capitalize ${
                        active 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                          : 'bg-white text-slate-650 hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      {pri}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mailing List Membership Filter */}
            {mailingLists.length > 0 && (
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Mailing List Membership</label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {mailingLists.map(list => {
                    const active = filters.listId.includes(list._id);
                    return (
                      <button
                        type="button"
                        key={list._id}
                        onClick={() => toggleFilter('listId', list._id)}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition-all font-semibold capitalize ${
                          active 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                            : 'bg-white text-slate-650 hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        {list.name.replace('Seed ', '')} ({list.stats?.totalSubscribers || 0})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Save Segment config input form */}
            <form onSubmit={handleSave} className="space-y-4 pt-4 border-t border-slate-100">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Save Target Segment</label>
                <Input 
                  placeholder="e.g. Warm Nurture Leads" 
                  required 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="bg-slate-50 border-slate-200 focus-visible:ring-blue-600"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                disabled={!name || previewLoading}
              >
                <Plus size={16} />
                Save segment ({preview.count} leads)
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right lists and segments display table dashboard panel */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                <Eye className="text-blue-600" size={18} />
                Live Segment Match Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 p-5 rounded-2xl border border-blue-100 flex items-center justify-between shadow-inner">
                <div>
                  <span className="text-xs font-bold text-blue-750 uppercase tracking-wide block">Audience Match Count</span>
                  <span className="text-xs text-slate-500 mt-1 block">Based on selected filters designer criteria</span>
                </div>
                <span className="text-3xl font-black text-blue-700">{preview.count} matches</span>
              </div>
              
              {previewLoading ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  Calculating match previews...
                </div>
              ) : preview.sample.length > 0 ? (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Sample Match Previews</span>
                  <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-150">
                    {preview.sample.map((s, idx) => (
                      <div key={idx} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm hover:bg-slate-50/50 transition-colors">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">{s.contactName || s.companyName}</span>
                          <span className="text-xs text-slate-500 mt-0.5">{s.email}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {s.stage && (
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded border capitalize ${STAGE_COLORS[s.stage] || 'bg-slate-100'}`}>
                              {s.stage}
                            </span>
                          )}
                          {s.temperature && (
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded border capitalize ${TEMP_COLORS[s.temperature] || 'bg-slate-100'}`}>
                              {s.temperature}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/30 flex flex-col items-center justify-center space-y-2">
                  <AlertCircle className="text-slate-350 h-8 w-8" />
                  <span className="text-slate-400 text-xs">
                    {hasActiveFilters 
                      ? 'No leads match the selected filter designer criteria.' 
                      : 'Select filter criteria on the left to preview matching leads.'}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
              <CardTitle className="text-base font-bold text-slate-800">Saved Dynamic Segments</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-center py-12 text-slate-450 text-sm">Loading segments...</div>
              ) : segments.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-250 rounded-xl bg-slate-50/30 text-slate-400 text-xs">
                  No saved dynamic segments yet. Design filters and save to populate.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {segments.map((seg) => {
                    const filtersList = [];
                    const formatFilter = (val) => Array.isArray(val) ? val.join(', ') : val;

                    if (seg.filters?.stage && (Array.isArray(seg.filters.stage) ? seg.filters.stage.length > 0 : seg.filters.stage)) {
                      filtersList.push({ name: `Stage: ${formatFilter(seg.filters.stage)}`, type: 'stage' });
                    }
                    if (seg.filters?.temperature && (Array.isArray(seg.filters.temperature) ? seg.filters.temperature.length > 0 : seg.filters.temperature)) {
                      filtersList.push({ name: `Temp: ${formatFilter(seg.filters.temperature)}`, type: 'temp' });
                    }
                    if (seg.filters?.priority && (Array.isArray(seg.filters.priority) ? seg.filters.priority.length > 0 : seg.filters.priority)) {
                      filtersList.push({ name: `Priority: ${formatFilter(seg.filters.priority)}`, type: 'priority' });
                    }
                    if (seg.filters?.listId && (Array.isArray(seg.filters.listId) ? seg.filters.listId.length > 0 : seg.filters.listId)) {
                      const listIds = Array.isArray(seg.filters.listId) ? seg.filters.listId : [seg.filters.listId];
                      const names = listIds.map(id => mailingLists.find(l => l._id === id)?.name?.replace('Seed ', '')).filter(Boolean).join(', ');
                      if (names) {
                        filtersList.push({ name: `Lists: ${names}`, type: 'list' });
                      }
                    }

                    return (
                      <div key={seg._id} className="p-4 border border-slate-200/80 rounded-2xl flex flex-col justify-between hover:shadow-md hover:border-blue-200 transition-all bg-white relative group">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <Users size={16} />
                              </div>
                              <span className="text-sm font-bold text-slate-800 leading-tight block">{seg.name}</span>
                            </div>
                            <Button 
                              onClick={() => handleDelete(seg._id)} 
                              size="icon" 
                              variant="ghost" 
                              className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {filtersList.length > 0 ? (
                              filtersList.map((f, i) => (
                                <span key={i} className="px-1.5 py-0.5 text-[9px] font-semibold text-slate-500 bg-slate-100 rounded flex items-center gap-1 border border-slate-200 capitalize">
                                  <Tag size={8} /> {f.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-400">All leads included</span>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                          <span className="text-slate-400">Matched Target Group</span>
                          <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">{seg.recipientCount} leads</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
