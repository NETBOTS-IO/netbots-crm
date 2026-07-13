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
                toast({ title: "Import Complete", description: `Successfully imported ${data.summary.success} leads.` });
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
        <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold">Import Data Wizard</h2>

            {!result ? (
                <Card className="border-dashed border-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Upload CSV File</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center py-10">
                        <Upload size={48} className="text-slate-400 mb-4" />
                        <Input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="max-w-xs mb-4"
                        />
                        <p className="text-sm text-slate-500 max-w-lg text-center mt-4">
                            Supported columns: Name, Phone, Email, Website, Address, Instagram, Facebook, Twitter, Linkedin, Yelp, Youtube, PlaceID, CID, Category, ReviewCount, AverageRating, Latitude, Longitude, and Working Hours (1_Monday to 7_Sunday).
                        </p>
                    </CardContent>
                    <CardContent className="border-t px-6 py-4 bg-slate-50">
                        <div className="flex flex-col gap-2 max-w-xs mx-auto">
                            <Label className="text-xs font-bold text-slate-500 uppercase">Default Lead Priority</Label>
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low Priority</SelectItem>
                                    <SelectItem value="medium">Medium Priority</SelectItem>
                                    <SelectItem value="high">High Priority</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-slate-400 mt-1">This priority will be applied to all leads in the CSV.</p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-3 border-t pt-4">
                        <Button variant="outline" onClick={() => navigate('/leads')}>Cancel</Button>
                        <Button onClick={handleUpload} disabled={!file || loading}>
                            {loading ? 'Processing...' : 'Start Import'}
                        </Button>
                    </CardFooter>
                </Card>
            ) : (
                <div className="space-y-4">
                    <Card className="bg-emerald-50 border-emerald-200">
                        <CardContent className="flex items-center gap-4 py-6">
                            <CheckCircle2 className="text-emerald-600" size={32} />
                            <div>
                                <h3 className="font-bold text-lg text-emerald-900">Import Successful</h3>
                                <p className="text-emerald-700">
                                    Processed {result.summary.total} rows:
                                    <span className="font-bold"> {result.summary.success} success</span>,
                                    <span className="font-bold"> {result.summary.failed} failed</span>.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {result.errors.length > 0 && (
                        <Card className="border-amber-200">
                            <CardHeader>
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <AlertCircle size={16} className="text-amber-500" />
                                    Error Logs (Last 10)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {result.errors.map((err, i) => (
                                        <div key={i} className="text-xs p-2 bg-slate-50 border rounded">
                                            <span className="font-bold">Row {i + 1}:</span> {err.error}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="flex justify-center">
                        <Button onClick={() => navigate('/leads')}>Go to Pipeline</Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImportWizard;
