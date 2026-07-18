import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileType, CheckCircle2, AlertCircle, Download, FileJson } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const STATE_CITY_PACKAGES = [
    {
        name: "Punjab (Pakistan)",
        state: "Punjab",
        cities: ["Lahore", "Faisalabad", "Rawalpindi", "Multan", "Gujranwala", "Sargodha", "Sialkot", "Bahawalpur"]
    },
    {
        name: "Sindh (Pakistan)",
        state: "Sindh",
        cities: ["Karachi", "Hyderabad", "Sukkur", "Larkana", "Mirpur Khas", "Nawabshah"]
    },
    {
        name: "Khyber Pakhtunkhwa (Pakistan)",
        state: "Khyber Pakhtunkhwa",
        cities: ["Peshawar", "Mardan", "Mingora", "Abbottabad", "Kohat", "Dera Ismail Khan"]
    },
    {
        name: "Balochistan (Pakistan)",
        state: "Balochistan",
        cities: ["Quetta", "Turbat", "Khuzdar", "Hub", "Chaman", "Gwadar"]
    },
    {
        name: "Islamabad Capital (Pakistan)",
        state: "Islamabad Capital",
        cities: ["Islamabad"]
    }
];

const ImportWizard = () => {
    const [file, setFile] = useState(null);
    const [priority, setPriority] = useState('medium');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [industry, setIndustry] = useState('');
    const [selectedPackage, setSelectedPackage] = useState('custom');
    const [state, setState] = useState('');
    const [city, setCity] = useState('');
    const [customCity, setCustomCity] = useState('');
    
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handlePackageChange = (val) => {
        setSelectedPackage(val);
        if (val === 'custom') {
            setState('');
            setCity('');
        } else {
            const pkg = STATE_CITY_PACKAGES.find(p => p.name === val);
            if (pkg) {
                setState(pkg.state);
                setCity(pkg.cities[0] || '');
            }
        }
    };

    const downloadSample = (type) => {
        let content = '';
        let filename = '';
        let mime = '';

        if (type === 'csv') {
            content = 'Name,Phone,Email,Website,Category,ReviewCount,AverageRating,Industry,State,City,Notes\n"La Piazza Cafe","+923001234567","info@lapiazza.com","https://lapiazza.com","Italian Restaurant",125,4.5,"Food & Beverage","Punjab","Lahore","Needs Google Maps SEO"';
            filename = 'leads_sample.csv';
            mime = 'text/csv';
        } else {
            const sampleObj = [
                {
                    "name": "La Piazza Cafe",
                    "phone": "+923001234567",
                    "email": "info@lapiazza.com",
                    "website": "https://lapiazza.com",
                    "category": "Italian Restaurant",
                    "reviewCount": 125,
                    "averageRating": 4.5,
                    "industry": "Food & Beverage",
                    "state": "Punjab",
                    "city": "Lahore",
                    "notes": "Needs Google Maps SEO"
                }
            ];
            content = JSON.stringify(sampleObj, null, 2);
            filename = 'leads_sample.json';
            mime = 'application/json';
        }

        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);

        const formData = new FormData();
        formData.append('priority', priority);
        formData.append('file', file);
        if (industry.trim()) formData.append('industry', industry.trim());
        if (state.trim()) formData.append('state', state.trim());
        
        const finalCity = city === 'custom' ? customCity : city;
        if (finalCity && finalCity.trim()) {
            formData.append('city', finalCity.trim());
        }

        try {
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

    // Get current package definition
    const currentPkg = STATE_CITY_PACKAGES.find(p => p.name === selectedPackage);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900">Import Data Wizard</h2>
                <p className="text-xs text-slate-500 font-medium mt-1">Bulk import business leads from CSV or JSON files directly into your sales pipeline.</p>
            </div>

            {!result ? (
                <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-slate-100">
                        <CardTitle className="text-base font-semibold text-slate-900">Upload Leads File (CSV / JSON)</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center py-8">
                        <Upload size={36} className="text-slate-400 mb-4" />
                        <Input
                            type="file"
                            accept=".csv,.json"
                            onChange={handleFileChange}
                            className="max-w-xs mb-4 border-slate-200 bg-slate-50/50"
                        />
                        <p className="text-[11px] text-slate-500 max-w-lg text-center mt-2 leading-relaxed">
                            Supported properties/columns: Name, Phone, Email, Website, Category, ReviewCount, AverageRating, Industry, State, City, Notes, and Address.
                        </p>

                        <div className="flex gap-3 mt-6">
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                className="text-xs gap-2 border-slate-200" 
                                onClick={() => downloadSample('csv')}
                            >
                                <Download size={14} /> Download CSV Sample
                            </Button>
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                className="text-xs gap-2 border-slate-200" 
                                onClick={() => downloadSample('json')}
                            >
                                <Download size={14} /> Download JSON Sample
                            </Button>
                        </div>
                    </CardContent>
                    <CardContent className="border-t border-slate-100 px-6 py-6 bg-slate-50/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto">
                            <div className="flex flex-col gap-2">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Default Lead Priority</Label>
                                <Select value={priority} onValueChange={setPriority}>
                                    <SelectTrigger className="border-slate-200 bg-white"><SelectValue placeholder="Select priority" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low Priority</SelectItem>
                                        <SelectItem value="medium">Medium Priority</SelectItem>
                                        <SelectItem value="high">High Priority</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Industry (Manual Override)</Label>
                                <Input 
                                    type="text" 
                                    placeholder="e.g. Real Estate, Retail (overrides CSV)"
                                    value={industry}
                                    onChange={(e) => setIndustry(e.target.value)}
                                    className="border-slate-200 bg-white"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">State & City Package</Label>
                                <Select value={selectedPackage} onValueChange={handlePackageChange}>
                                    <SelectTrigger className="border-slate-200 bg-white"><SelectValue placeholder="Select a package" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="custom">Custom / Manual Entry</SelectItem>
                                        {STATE_CITY_PACKAGES.map(pkg => (
                                            <SelectItem key={pkg.name} value={pkg.name}>{pkg.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">State (Manual Override)</Label>
                                <Input 
                                    type="text" 
                                    placeholder="e.g. Punjab"
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                    className="border-slate-200 bg-white"
                                    disabled={selectedPackage !== 'custom'}
                                />
                            </div>

                            {selectedPackage !== 'custom' && currentPkg ? (
                                <div className="flex flex-col gap-2 col-span-1 md:col-span-2">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">City Selector</Label>
                                    <div className="flex gap-2">
                                        <Select value={city} onValueChange={setCity} className="flex-1">
                                            <SelectTrigger className="border-slate-200 bg-white"><SelectValue placeholder="Select a city" /></SelectTrigger>
                                            <SelectContent>
                                                {currentPkg.cities.map(c => (
                                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                                ))}
                                                <SelectItem value="custom">Custom City (Type below)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {city === 'custom' && (
                                        <Input
                                            type="text"
                                            placeholder="Type custom city name"
                                            value={customCity}
                                            onChange={(e) => setCustomCity(e.target.value)}
                                            className="border-slate-200 bg-white mt-1"
                                        />
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">City (Manual Override)</Label>
                                    <Input 
                                        type="text" 
                                        placeholder="e.g. Lahore"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        className="border-slate-200 bg-white"
                                    />
                                </div>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-3 border-t border-slate-100 pt-4 px-6 pb-6 bg-white">
                        <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl" onClick={() => navigate('/leads')}>Cancel</Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold px-6 shadow-sm" onClick={handleUpload} disabled={!file || loading}>
                            {loading ? 'Processing...' : 'Start Import'}
                        </Button>
                    </CardFooter>
                </Card>
            ) : (
                <div className="space-y-4">
                    <Card className="border border-emerald-500 bg-emerald-50/30 rounded-2xl">
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
                        <Card className="border border-slate-200 rounded-2xl">
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
                        <Button className="bg-slate-950 hover:bg-slate-900 text-white rounded-xl" onClick={() => navigate('/leads')}>Go to Pipeline</Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImportWizard;
