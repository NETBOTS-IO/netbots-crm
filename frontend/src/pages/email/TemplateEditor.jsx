import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Eye } from 'lucide-react';

export default function TemplateEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = id && id !== 'new';

  const [form, setForm] = useState({
    name: '',
    category: 'custom',
    subject: '',
    htmlContent: '',
  });

  useEffect(() => {
    if (isEdit) {
      const fetchTemplate = async () => {
        try {
          const res = await api.get(`/email-templates/${id}`);
          if (res) setForm(res);
        } catch (err) {
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to load template.' });
        }
      };
      fetchTemplate();
    }
  }, [id, isEdit]);

  const handleSave = async () => {
    if (!form.name || !form.htmlContent) {
      toast({ variant: 'destructive', title: 'Error', description: 'Template name and content are required.' });
      return;
    }
    try {
      if (isEdit) {
        await api.put(`/email-templates/${id}`, form);
        toast({ title: 'Template updated', description: 'Your email visual design layout is updated.' });
      } else {
        await api.post('/email-templates', form);
        toast({ title: 'Template created', description: 'Saved successfully.' });
      }
      navigate('/email/templates');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save template.' });
    }
  };

  const insertMergeTag = (tag) => {
    setForm(prev => ({
      ...prev,
      htmlContent: prev.htmlContent + tag
    }));
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate('/email/templates')}>
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{isEdit ? 'Modify Template' : 'Design Template'}</h1>
            <p className="text-xs text-slate-500">Configure visual layout structure blocks</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Save size={16} /> Save Design
          </Button>
        </div>
      </div>

      {/* Main panel split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left config form panel */}
        <div className="w-1/3 bg-white border-r border-slate-200 p-6 overflow-y-auto space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Template Title</label>
            <Input placeholder="e.g. Welcome onboard mail" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Category</label>
            <select
              className="w-full p-2 bg-white border rounded-md text-sm"
              value={form.category}
              onChange={e => setForm({...form, category: e.target.value})}
            >
              <option value="welcome">Welcome Email</option>
              <option value="newsletter">Monthly Newsletter</option>
              <option value="promotional">Promotional Offer</option>
              <option value="follow_up">Sales Follow-up</option>
              <option value="custom">Custom Design</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Subject Line Default</label>
            <Input placeholder="e.g. Hello {{firstName}}, Welcome!" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} />
          </div>

          {/* Merge tag list helpers */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dynamic Fields Integration</label>
            <div className="flex flex-wrap gap-1">
              {['{{firstName}}', '{{companyName}}', '{{email}}', '{{phone}}', '{{stage}}'].map(tag => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => insertMergeTag(tag)}
                  className="px-2.5 py-1 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center/Right canvas designer panel */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email HTML Body Editor</span>
              <span className="text-[10px] text-slate-400">Insert custom HTML layout blocks directly</span>
            </div>
            <textarea
              className="flex-1 p-4 font-mono text-sm resize-none focus:outline-none focus:ring-0 w-full"
              placeholder="<html><body><h1>Hi {{firstName}}!</h1><p>We are glad to have you on board.</p></body></html>"
              value={form.htmlContent}
              onChange={e => setForm({...form, htmlContent: e.target.value})}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
