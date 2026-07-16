import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useParams } from 'react-router-dom';

export default function CampaignBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = id && id !== 'new';

  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState([]);
  const [segments, setSegments] = useState([]);
  const [lists, setLists] = useState([]);
  
  const [form, setForm] = useState({
    name: '',
    subject: '',
    audienceType: 'all_leads',
    templateId: '',
    segmentId: '',
    listId: '',
    htmlContent: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [templatesRes, segmentsRes, listsRes] = await Promise.all([
          api.get('/email-templates'),
          api.get('/email-segments'),
          api.get('/email-lists')
        ]);
        if (templatesRes) setTemplates(templatesRes);
        if (segmentsRes) setSegments(segmentsRes);
        if (listsRes) setLists(listsRes);

        if (isEdit) {
          const camp = await api.get(`/email-campaigns/${id}`);
          if (camp) setForm(camp);
        }
      } catch (err) {
        console.error('Error fetching campaign details:', err);
      }
    };
    fetchData();
  }, [id, isEdit]);

  const handleSelectTemplate = (tplId) => {
    const selected = templates.find(t => t._id === tplId);
    if (selected) {
      setForm(prev => ({
        ...prev,
        templateId: tplId,
        subject: selected.subject || prev.subject,
        htmlContent: selected.htmlContent || ''
      }));
    }
  };

  const handleSaveDraft = async () => {
    try {
      if (isEdit) {
        await api.put(`/email-campaigns/${id}`, form);
      } else {
        await api.post('/email-campaigns', form);
      }
      toast({ title: 'Success', description: 'Campaign saved as draft.' });
      navigate('/email/campaigns');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save campaign.' });
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header section with step indicator */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Campaign Creation Wizard</h1>
          <p className="text-sm text-slate-500 mt-1">Configure layout template content and CRM audience filters step-by-step.</p>
        </div>
        <div className="flex items-center gap-1.5 font-semibold text-sm">
          <span className={step === 1 ? 'text-blue-655' : 'text-slate-400'}>1. Setup</span>
          <span className="text-slate-300">&gt;</span>
          <span className={step === 2 ? 'text-blue-655' : 'text-slate-400'}>2. Audience</span>
          <span className="text-slate-300">&gt;</span>
          <span className={step === 3 ? 'text-blue-655' : 'text-slate-400'}>3. Content</span>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="pt-6">
          {/* STEP 1: General Setup */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Campaign Title</label>
                <Input placeholder="e.g. July Newsletter Announcement" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Email Subject Line</label>
                <Input placeholder="e.g. Big updates from NetBots Team!" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} />
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={() => setStep(2)} className="bg-blue-600 hover:bg-blue-700">Next: Choose Audience</Button>
              </div>
            </div>
          )}

          {/* STEP 2: Choose target group */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Audience Group Source</label>
                <select
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-600 outline-none text-sm"
                  value={form.audienceType}
                  onChange={e => setForm({...form, audienceType: e.target.value})}
                >
                  <option value="all_leads">All CRM Leads</option>
                  <option value="segment">Dynamic Filter Segment</option>
                  <option value="list">Static Mailing List</option>
                  <option value="all_clients">All Clients</option>
                </select>
              </div>

              {form.audienceType === 'segment' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Choose Saved Segment</label>
                  <select
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-600 outline-none text-sm"
                    value={form.segmentId}
                    onChange={e => setForm({...form, segmentId: e.target.value})}
                  >
                    <option value="">-- Select Saved Segment --</option>
                    {segments.map(seg => (
                      <option key={seg._id} value={seg._id}>{seg.name} ({seg.recipientCount} matches)</option>
                    ))}
                  </select>
                </div>
              )}

              {form.audienceType === 'list' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Choose Mailing List</label>
                  <select
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-600 outline-none text-sm"
                    value={form.listId}
                    onChange={e => setForm({...form, listId: e.target.value})}
                  >
                    <option value="">-- Select List --</option>
                    {lists.map(list => (
                      <option key={list._id} value={list._id}>{list.name} ({list.stats?.totalSubscribers || 0} contacts)</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={() => setStep(3)} className="bg-blue-600 hover:bg-blue-700">Next: Configure Content</Button>
              </div>
            </div>
          )}

          {/* STEP 3: visual templates assignment and composer HTML contents */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Import Base Template Structure</label>
                <select
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-600 outline-none text-sm"
                  value={form.templateId}
                  onChange={e => handleSelectTemplate(e.target.value)}
                >
                  <option value="">-- Select template base --</option>
                  {templates.map(t => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">HTML Layout Composer</label>
                <textarea
                  className="w-full h-80 p-3 text-sm font-mono border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                  placeholder="Composed HTML structure payload here..."
                  value={form.htmlContent}
                  onChange={e => setForm({...form, htmlContent: e.target.value})}
                />
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => navigate('/email/campaigns')}>Cancel</Button>
                  <Button onClick={handleSaveDraft} className="bg-blue-600 hover:bg-blue-700">Save Draft</Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
