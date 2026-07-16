import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmailTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/email-templates');
      if (res) setTemplates(res);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load templates.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await api.delete(`/email-templates/${id}`);
      toast({ title: 'Deleted', description: 'Template removed.' });
      fetchTemplates();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete.' });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Email Template Gallery</h1>
          <p className="text-sm text-slate-500 mt-1">Design and customize reusable content blocks.</p>
        </div>
        <Link to="/email/templates/new">
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus size={16} />
            Create Template
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-slate-500 text-center py-6">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="text-slate-500 text-center py-10">No email templates created yet. Click Create Template to add one.</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => (
            <Card key={tpl._id} className="shadow-sm overflow-hidden flex flex-col justify-between">
              <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
                <div className="flex items-center gap-2">
                  <FileText className="text-blue-500 h-5 w-5" />
                  <CardTitle className="text-sm font-bold text-slate-800 truncate">{tpl.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4 flex-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Subject</p>
                <p className="text-sm text-slate-700 mt-1 font-medium truncate">{tpl.subject || '(None)'}</p>
                <div className="mt-4 p-2 bg-slate-50 rounded border border-slate-100 text-[10px] text-slate-400 overflow-hidden max-h-24">
                  {tpl.htmlContent ? tpl.htmlContent.substring(0, 150) + '...' : '(Empty HTML content)'}
                </div>
              </CardContent>
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                <Link to={`/email/templates/${tpl._id}/edit`}>
                  <Button size="sm" variant="outline">Edit</Button>
                </Link>
                <Button onClick={() => handleDelete(tpl._id)} size="sm" variant="destructive">
                  <Trash2 size={14} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
