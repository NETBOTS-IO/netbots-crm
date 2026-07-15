import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileType, CheckCircle2, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import api from '@/lib/api';

const ImportWizard = () => {
    const [file, setFile] = useState(null);
    const [priority, setPriority] = useState('medium');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);

        const formData = new FormData();
        formData.append('priority', priority);
        formData.append('file', file);

        try {
            // Using raw axios/fetch since our api client is JSON-centric
            const token = localStorage.getItem('token');
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
            const res = await fetch(`${apiBaseUrl}/import/leads`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                setResult(data);
                let message = `Successfully imported ${data.summary.success} leads.`;
                if (data.summary.duplicates > 0) {
                    message += ` (${data.summary.duplicates} duplicates skipped)`;
                }
                toast({ title: "Import Complete", description: message });
            } else {
                toast({ variant: "destructive", title: "Error", description: data.error || "Import failed" });
            }
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: "Connection failed" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">Import Data Wizard</h2>
                <p className="text-xs text-slate-500 font-medium">Bulk import business leads from CSV files directly into your sales pipeline.</p>
            </div>

            {!result ? (
                <Card className="border border-slate-200 shadow-sm bg-white">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold text-slate-900">Upload CSV File</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center py-8">
                        <Upload size={36} className="text-slate-400 mb-4" />
                        <Input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="max-w-xs mb-4 border-slate-200"
                        />
                        <p className="text-[11px] text-slate-500 max-w-lg text-center mt-2 leading-relaxed">
                            Supported columns: Name, Phone, Email, Website, Address, Instagram, Facebook, Twitter, Linkedin, Yelp, Youtube, PlaceID, CID, Category, ReviewCount, AverageRating, Latitude, Longitude, and Working Hours.
                        </p>
                    </CardContent>
                    <CardContent className="border-t border-slate-100 px-6 py-4 bg-slate-50/50">
                        <div className="flex flex-col gap-2 max-w-xs mx-auto">
                            <Label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Default Lead Priority</Label>
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger className="border-slate-200 bg-white"><SelectValue placeholder="Select priority" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low Priority</SelectItem>
                                    <SelectItem value="medium">Medium Priority</SelectItem>
                                    <SelectItem value="high">High Priority</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-slate-450 mt-1">This priority will be applied to all leads in the CSV.</p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-3 border-t border-slate-100 pt-4 px-6 pb-6">
                        <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50" onClick={() => navigate('/leads')}>Cancel</Button>
                        <Button className="bg-slate-950 hover:bg-slate-900 text-white" onClick={handleUpload} disabled={!file || loading}>
                            {loading ? 'Processing...' : 'Start Import'}
                        </Button>
                    </CardFooter>
                </Card>
            ) : (
                <div className="space-y-4">
                    <Card className="border border-emerald-500 bg-emerald-50/30">
                        <CardContent className="flex items-center gap-4 py-6">
                            <CheckCircle2 className="text-emerald-600" size={24} />
                            <div>
                                <h3 className="font-semibold text-base text-slate-900">Import Successful</h3>
                                <p className="text-xs text-slate-650 mt-0.5">
                                    Processed {result.summary.total} rows:
                                    <span className="font-semibold text-emerald-700"> {result.summary.success} success</span>,
                                    <span className="font-semibold text-rose-600"> {result.summary.failed} failed</span>
                                    {result.summary.duplicates > 0 && (
                                        <span> (including <span className="font-semibold text-slate-800">{result.summary.duplicates} duplicates</span>)</span>
                                    )}.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {result.errors.length > 0 && (
                        <Card className="border border-slate-200">
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900">
                                    <AlertCircle size={16} className="text-slate-500" />
                                    Error Logs (Last 10)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {result.errors.map((err, i) => (
                                        <div key={i} className="text-xs p-2 bg-slate-50 border border-slate-100 rounded">
                                            <span className="font-semibold text-slate-700">Row {i + 1}:</span> {err.error}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="flex justify-center">
                        <Button className="bg-slate-950 hover:bg-slate-900 text-white" onClick={() => navigate('/leads')}>Go to Pipeline</Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImportWizard;
