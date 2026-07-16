import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, HeartPulse, Trash2, ShieldAlert, Sparkles, CheckCircle2, RefreshCw, Flame, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function EmailAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '',
    email: '',
    smtpHost: 'smtp.hostinger.com',
    smtpPort: 465,
    smtpSecure: true,
    smtpUser: '',
    smtpPass: '',
    fromName: 'NetBots',
    replyTo: '',
    dailyLimit: 300,
    isWarmingUp: false
  });

  const [settingsForm, setSettingsForm] = useState({
    isWarmingUp: false,
    warmUpDayCount: 1,
    warmUpDailyTarget: 10,
    dailyLimit: 300
  });

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/email-accounts');
      if (res) setAccounts(res);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch accounts.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        status: form.isWarmingUp ? 'warming_up' : 'active'
      };
      await api.post('/email-accounts', payload);
      toast({ title: 'Success', description: 'SMTP Connection Added to Pool.' });
      setIsOpen(false);
      setForm({
        name: '',
        email: '',
        smtpHost: 'smtp.hostinger.com',
        smtpPort: 465,
        smtpSecure: true,
        smtpUser: '',
        smtpPass: '',
        fromName: 'NetBots',
        replyTo: '',
        dailyLimit: 300,
        isWarmingUp: false
      });
      fetchAccounts();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.error || 'Failed to create.' });
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    if (!selectedAccount) return;
    try {
      const payload = {
        ...settingsForm,
        status: settingsForm.isWarmingUp ? 'warming_up' : 'active'
      };
      await api.put(`/email-accounts/${selectedAccount._id}`, payload);
      toast({ title: 'Settings Saved', description: 'Account warmup details updated successfully.' });
      setIsSettingsOpen(false);
      fetchAccounts();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update configurations.' });
    }
  };

  const openSettings = (acc) => {
    setSelectedAccount(acc);
    setSettingsForm({
      isWarmingUp: acc.isWarmingUp || false,
      warmUpDayCount: acc.warmUpDayCount || 1,
      warmUpDailyTarget: acc.warmUpDailyTarget || 10,
      dailyLimit: acc.dailyLimit || 300
    });
    setIsSettingsOpen(true);
  };

  const handleTest = async (id) => {
    toast({ title: 'Testing Connection', description: 'SMTP handshake in progress...' });
    try {
      const res = await api.post(`/email-accounts/${id}/test`);
      if (res.success) {
        toast({ title: 'Connected', description: 'Handshake succeeded!' });
      } else {
        toast({ variant: 'destructive', title: 'Failed', description: res.error || 'Check login credentials.' });
      }
      fetchAccounts();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'SMTP verification failed.' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this account from the rotation pool?')) return;
    try {
      await api.delete(`/email-accounts/${id}`);
      toast({ title: 'Deleted', description: 'SMTP Account removed.' });
      fetchAccounts();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete.' });
    }
  };

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="text-orange-500 h-5 w-5 animate-pulse" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">SMTP Accounts Pool</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Configure rotating SMTP accounts and automate warmups to secure email deliverability.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchAccounts} variant="outline" className="border-slate-200">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </Button>
          <Button onClick={() => setIsOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus size={16} />
            Add SMTP Connection
          </Button>
        </div>
      </div>

      {/* Main accounts pool table */}
      <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-16 text-slate-450 text-sm">Loading SMTP configurations...</div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-16 text-slate-450 text-sm">
              No SMTP connection details configured yet. Add your get/try/hello domain email addresses.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/70">
                <TableRow>
                  <TableHead className="py-4 font-bold text-slate-700">Display Name</TableHead>
                  <TableHead className="font-bold text-slate-700">Address (User)</TableHead>
                  <TableHead className="font-bold text-slate-700">Sending Pool Status</TableHead>
                  <TableHead className="font-bold text-slate-700">Warmup Progress</TableHead>
                  <TableHead className="text-right pr-6 font-bold text-slate-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((acc) => (
                  <TableRow key={acc._id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-semibold text-slate-900 py-4">{acc.name}</TableCell>
                    <TableCell className="text-slate-600 font-medium">{acc.email}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        acc.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                        acc.status === 'warming_up' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        acc.status === 'exhausted' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {acc.status === 'warming_up' ? 'warming up' : acc.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {acc.isWarmingUp ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-orange-600 flex items-center gap-1">
                            <Flame size={12} className="fill-orange-600" />
                            Day {acc.warmUpDayCount} (Active)
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Limit: {acc.sentToday} / {acc.warmUpDailyTarget || 10} sent today
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Inactive</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-6 space-x-2">
                      <Button onClick={() => openSettings(acc)} size="sm" variant="outline" className="border-slate-200" title="Warmup Settings">
                        <Settings size={14} className="mr-1" /> Config
                      </Button>
                      <Button onClick={() => handleTest(acc._id)} size="sm" variant="outline" className="border-slate-200" title="Verify Connection">
                        <HeartPulse size={14} className="mr-1" /> Test
                      </Button>
                      <Button onClick={() => handleDelete(acc._id)} size="sm" variant="destructive" className="bg-rose-600 hover:bg-rose-700">
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

      {/* DNS Record Setup Checklist Guide */}
      <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
            <ShieldAlert className="text-blue-600" size={18} />
            Outbound Domain & DNS Setup Guide
          </CardTitle>
          <CardDescription className="text-xs">
            Important checklist parameters to secure your primary domain reputation and optimize email inbox placement rates.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="strategy" className="w-full">
            <TabsList className="bg-slate-100 p-1 rounded-xl mb-6">
              <TabsTrigger value="strategy" className="text-xs font-semibold rounded-lg">1. Domain Strategy</TabsTrigger>
              <TabsTrigger value="spf" className="text-xs font-semibold rounded-lg">2. SPF Record</TabsTrigger>
              <TabsTrigger value="dkim" className="text-xs font-semibold rounded-lg">3. DKIM Record</TabsTrigger>
              <TabsTrigger value="dmarc" className="text-xs font-semibold rounded-lg">4. DMARC Policy</TabsTrigger>
              <TabsTrigger value="mx" className="text-xs font-semibold rounded-lg">5. MX Records</TabsTrigger>
            </TabsList>
            
            <TabsContent value="strategy" className="space-y-4">
              <div className="bg-orange-50/50 border border-orange-200 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-slate-700">
                <ShieldAlert className="text-orange-600 h-5 w-5 shrink-0" />
                <div>
                  <h4 className="font-bold text-orange-850 mb-1">Cold Email Reputation Protection Rules:</h4>
                  <p>
                    Apni primary business domain (<strong>netbots.io</strong>) se kabhi bulk cold emails mat send karein. 
                    Agar spam complaints ya bounce rate high hui, to aapke client updates aur invoice invoices emails bhi spam folder mein jana shuru ho jayenge.
                  </p>
                  <p className="mt-2">
                    <strong>Solution:</strong> Hostinger par 2-3 saste domains register karein (jaise <em>getnetbots.com</em>, <em>trynetbots.co</em>) aur unhe sirf cold campaigns ke liye use karein.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="spf" className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800">Sender Policy Framework (SPF)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                SPF record aapki domain host ko batata hai ke kaunse servers is domain ki taraf se email send karne ke liye certified hain.
              </p>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 font-mono text-xs select-all text-blue-700">
                TXT Record Value: v=spf1 include:_spf.mail.hostinger.com ~all
              </div>
              <p className="text-[10px] text-slate-400">Host: @ | Type: TXT</p>
            </TabsContent>

            <TabsContent value="dkim" className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800">DomainKeys Identified Mail (DKIM)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                DKIM record aapki emails mein cryptographic digital signatures add karta hai jo authenticity prove karte hain aur spam filters ko bypass karte hain.
              </p>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs leading-relaxed">
                <span className="font-bold text-slate-700 block">How to configure on Hostinger:</span>
                <ol className="list-decimal pl-4 mt-2 space-y-1 text-[11px] text-slate-600">
                  <li>Hostinger Control Panel (hPanel) mein email business account settings open karein.</li>
                  <li>DKIM tab par click kar ke "Generate DKIM" select karein.</li>
                  <li>Generated TXT record (selector: x) ko copy kar ke domain DNS settings mein add karein.</li>
                </ol>
              </div>
            </TabsContent>

            <TabsContent value="dmarc" className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800">Domain-based Message Authentication, Reporting & Conformance (DMARC)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                DMARC batata hai ke agar SPF/DKIM authentication fail ho jaye to receiving mailboxes ko kya action lena chahiye.
              </p>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 font-mono text-xs select-all text-blue-700">
                TXT Record Name: _dmarc.yourdomain.com<br/>
                Value: v=DMARC1; p=none; rua=mailto:dmarc-reports@yourdomain.com
              </div>
              <p className="text-[10px] text-slate-400">Note: Start warmup mein hamesha p=none rakhein. 4 weeks warmup complete hone ke baad p=quarantine pe switch karein.</p>
            </TabsContent>

            <TabsContent value="mx" className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800">Mail Exchange (MX) Records</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                MX records batate hain ke aapke domain par incoming replies kis server par delivery honge. Agar MX record set nahi hoga, to aap client replies capture nahi kar sakenge.
              </p>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs leading-relaxed space-y-1 text-slate-700 font-mono">
                <div>MX 1: mx1.hostinger.com (Priority: 10)</div>
                <div>MX 2: mx2.hostinger.com (Priority: 20)</div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog for adding connection */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Add New SMTP Connection</DialogTitle>
            <DialogDescription className="text-xs">Configure Hostinger or custom SMTP details to expand the rotative pool.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            
            {/* Field Explanations Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-[11px] text-blue-800 space-y-1.5">
              <p className="font-bold text-blue-900 text-xs">📋 Field Guide:</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div><span className="font-bold">Account Label:</span> CRM ke andar yeh account kaise pahchana jaye (sirf team dekhti hai)</div>
                <div><span className="font-bold">From Name:</span> Recipient ke inbox mein dikhne wala sender naam (e.g. "Ali from NetBots")</div>
                <div><span className="font-bold">Email Address:</span> Actual email address jisse mail bheji jayegi (e.g. outreach@getnetbots.com)</div>
                <div><span className="font-bold">Username:</span> SMTP server login credential — aksar Email se same hota hai lekin alag bhi ho sakta hai</div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Account Label <span className="text-slate-400 normal-case font-normal">(Internal name for this SMTP slot)</span></label>
              <Input placeholder='e.g. "Hostinger Outbound 1" or "Cold Outreach A"' required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-slate-50 border-slate-200" />
              <p className="text-[10px] text-slate-400">Sirf CRM ke andar dikhega — recipients ko nahi dikhega.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address <span className="text-slate-400 normal-case font-normal">(Sending email address)</span></label>
              <Input placeholder="e.g. outreach@getnetbots.com" type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="bg-slate-50 border-slate-200" />
              <p className="text-[10px] text-slate-400">Yeh woh email hai jisse mail bheji jayegi aur Reply-To set hogi.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Host Server</label>
                <Input placeholder="smtp.hostinger.com" required value={form.smtpHost} onChange={e => setForm({...form, smtpHost: e.target.value})} className="bg-slate-50 border-slate-200" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Port</label>
                <Input placeholder="465" type="number" required value={form.smtpPort} onChange={e => setForm({...form, smtpPort: parseInt(e.target.value)})} className="bg-slate-50 border-slate-200" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Username <span className="text-slate-400 normal-case font-normal">(SMTP login)</span></label>
                <Input placeholder="e.g. outreach@getnetbots.com" required value={form.smtpUser} onChange={e => setForm({...form, smtpUser: e.target.value})} className="bg-slate-50 border-slate-200" />
                <p className="text-[10px] text-slate-400">SMTP server ka login username. Hostinger pe usually Email se same hota hai.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
                <Input placeholder="SMTP Password" type="password" required value={form.smtpPass} onChange={e => setForm({...form, smtpPass: e.target.value})} className="bg-slate-50 border-slate-200" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">From Name <span className="text-slate-400 normal-case font-normal">(Inbox display name)</span></label>
                <Input placeholder='e.g. "Ali from NetBots"' required value={form.fromName} onChange={e => setForm({...form, fromName: e.target.value})} className="bg-slate-50 border-slate-200" />
                <p className="text-[10px] text-slate-400">Recipient ke inbox mein yahi naam dikhega.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Daily Limit</label>
                <Input placeholder="300" type="number" required value={form.dailyLimit} onChange={e => setForm({...form, dailyLimit: parseInt(e.target.value)})} className="bg-slate-50 border-slate-200" />
                <p className="text-[10px] text-slate-400">Roz kitni emails bheji ja sakti hain is account se.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 p-3 bg-orange-50 rounded-xl border border-orange-100">
              <input 
                type="checkbox" 
                id="warmup-check"
                checked={form.isWarmingUp} 
                onChange={e => setForm({...form, isWarmingUp: e.target.checked})}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <label htmlFor="warmup-check" className="text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-1">
                <Flame size={14} className="text-orange-500" /> Enable Auto-Warmup on creation
              </label>
            </div>

            <DialogFooter className="pt-2 border-t border-slate-100">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 w-full rounded-xl">Save Account</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog for Warmup settings */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Flame className="text-orange-500" size={18} />
              Warmup & Speed Settings
            </DialogTitle>
            <DialogDescription className="text-xs">Adjust warmup progression parameters for {selectedAccount?.email}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSettings} className="space-y-4 pt-2">
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <input 
                type="checkbox" 
                id="warmup-check-settings"
                checked={settingsForm.isWarmingUp} 
                onChange={e => setSettingsForm({...settingsForm, isWarmingUp: e.target.checked})}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <label htmlFor="warmup-check-settings" className="text-xs font-bold text-slate-800 cursor-pointer">
                Enable Warmup Mode
              </label>
            </div>

            {settingsForm.isWarmingUp && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Current Warmup Day</label>
                  <Input 
                    type="number" 
                    value={settingsForm.warmUpDayCount} 
                    onChange={e => setSettingsForm({...settingsForm, warmUpDayCount: parseInt(e.target.value)})}
                    className="bg-slate-50 border-slate-200" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Daily Target</label>
                  <Input 
                    type="number" 
                    value={settingsForm.warmUpDailyTarget} 
                    onChange={e => setSettingsForm({...settingsForm, warmUpDailyTarget: parseInt(e.target.value)})}
                    className="bg-slate-50 border-slate-200" 
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Standard Outbound Daily Limit</label>
              <Input 
                type="number" 
                value={settingsForm.dailyLimit} 
                onChange={e => setSettingsForm({...settingsForm, dailyLimit: parseInt(e.target.value)})}
                className="bg-slate-50 border-slate-200" 
              />
              <p className="text-[9px] text-slate-400 mt-1">Normal daily limit once warmed up (typically 100-300 per day).</p>
            </div>

            <DialogFooter className="pt-2 border-t border-slate-100">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 w-full rounded-xl">Save Settings</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
