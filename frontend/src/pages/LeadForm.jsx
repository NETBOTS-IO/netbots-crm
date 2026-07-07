import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from '@/lib/api';
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Info } from 'lucide-react';

const LeadForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        contactName: '',
        phone: '',
        secondaryPhone: '',
        email: '',
        website: '',
        address: '',
        city: '',
        industry: '',
        businessType: 'other',
        source: 'outbound_cold_call',
        temperature: 'cold',
        priority: 'medium',
        budgetRange: '',
        decisionMaker: false,
        timelineToClose: '',
        notes: '',
        instagram: '',
        facebook: '',
        twitter: '',
        linkedin: '',
        yelp: '',
        youtube: '',
        placeId: '',
        cid: '',
        category: '',
        reviewCount: '',
        averageRating: '',
        latitude: '',
        longitude: '',
        mondayHours: '',
        tuesdayHours: '',
        wednesdayHours: '',
        thursdayHours: '',
        fridayHours: '',
        saturdayHours: '',
        sundayHours: '',
        lastContactedAt: '',
        followUpDate: ''
    });

    useEffect(() => {
        if (id) {
            const fetchLead = async () => {
                try {
                    const res = await api.get(`/leads/${id}`);
                    if (res.success) {
                        const leadData = res.data.lead || res.data;
                        const formatDate = (dateVal) => {
                            if (!dateVal) return '';
                            const d = new Date(dateVal);
                            const pad = (num) => String(num).padStart(2, '0');
                            return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                        };
                        setFormData(prev => ({
                            ...prev,
                            ...leadData,
                            lastContactedAt: formatDate(leadData.lastContactedAt),
                            followUpDate: formatDate(leadData.followUpDate)
                        }));
                    }
                } catch (err) {
                    toast({ variant: "destructive", title: "Error", description: "Failed to load lead" });
                }
            };
            fetchLead();
        }
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...formData };
            if (payload.lastContactedAt === '') payload.lastContactedAt = null;
            if (payload.followUpDate === '') payload.followUpDate = null;
            if (payload.demoDate === '') payload.demoDate = null;

            const res = id
                ? await api.put(`/leads/${id}`, payload)
                : await api.post('/leads', payload);

            if (res.success) {
                toast({ title: "Success", description: id ? "Lead updated" : "Lead created" });
                navigate('/leads');
            }
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: err.error || "Submission failed" });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>{id ? 'Edit Lead' : 'Submit New Lead'}</CardTitle>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <Tabs defaultValue="core" className="w-full">
                            <TabsList className="grid w-full grid-cols-5 mb-6">
                                <TabsTrigger value="core">Core Info</TabsTrigger>
                                <TabsTrigger value="social">Social Media</TabsTrigger>
                                <TabsTrigger value="local">Local/Maps</TabsTrigger>
                                <TabsTrigger value="hours">Hours</TabsTrigger>
                                <TabsTrigger value="action">Action</TabsTrigger>
                            </TabsList>

                            <TabsContent value="core" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="companyName">Company Name / Business Name *</Label>
                                        <Input
                                            id="companyName"
                                            value={formData.companyName}
                                            onChange={(e) => handleChange('companyName', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="website">Website URL</Label>
                                        <Input
                                            id="website"
                                            value={formData.website}
                                            placeholder="https://..."
                                            onChange={(e) => handleChange('website', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contactName">Contact Person</Label>
                                        <Input
                                            id="contactName"
                                            value={formData.contactName}
                                            onChange={(e) => handleChange('contactName', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleChange('email', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone / WhatsApp *</Label>
                                        <Input
                                            id="phone"
                                            value={formData.phone}
                                            onChange={(e) => handleChange('phone', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="secondaryPhone">Secondary Phone</Label>
                                        <Input
                                            id="secondaryPhone"
                                            value={formData.secondaryPhone}
                                            onChange={(e) => handleChange('secondaryPhone', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label htmlFor="address">Address</Label>
                                        <Input
                                            id="address"
                                            value={formData.address}
                                            placeholder="Full physical address..."
                                            onChange={(e) => handleChange('address', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t">
                                    <h3 className="text-sm font-bold mb-3 uppercase tracking-wider text-slate-500">Business Details</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Industry</Label>
                                            <Input
                                                value={formData.industry}
                                                onChange={(e) => handleChange('industry', e.target.value)}
                                                placeholder="e.g. Healthcare, Tech"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Budget Range</Label>
                                            <Input
                                                value={formData.budgetRange}
                                                onChange={(e) => handleChange('budgetRange', e.target.value)}
                                                placeholder="PKR 50k - 100k"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-1">Priority</Label>
                                            <Select value={formData.priority} onValueChange={(v) => handleChange('priority', v)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="low">Low</SelectItem>
                                                    <SelectItem value="medium">Medium</SelectItem>
                                                    <SelectItem value="high">High</SelectItem>
                                                    <SelectItem value="urgent">Urgent</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <div className="flex items-start gap-1.5 mt-1 text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-100">
                                                <Info size={12} className="text-blue-500 mt-0.5 shrink-0" />
                                                <span>
                                                    <strong>Low:</strong> Raw database. <strong>Medium:</strong> Default. <strong>High:</strong> Warm prospect. <strong>Urgent:</strong> Responding lead; must contact today.
                                                </span>
                                            </div>
                                        </div>
                                        <div className="space-y-2 flex items-center gap-3 pt-6">
                                            <input
                                                type="checkbox"
                                                id="decisionMaker"
                                                checked={formData.decisionMaker}
                                                onChange={(e) => handleChange('decisionMaker', e.target.checked)}
                                                className="w-4 h-4"
                                            />
                                            <Label htmlFor="decisionMaker" className="cursor-pointer">Direct Decision Maker?</Label>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Business Type</Label>
                                        <Select value={formData.businessType} onValueChange={(v) => handleChange('businessType', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pharmacy">Pharmacy</SelectItem>
                                                <SelectItem value="retail">Retail</SelectItem>
                                                <SelectItem value="distribution">Distribution</SelectItem>
                                                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Source</Label>
                                        <Select value={formData.source} onValueChange={(v) => handleChange('source', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="outbound_cold_call">Cold Call</SelectItem>
                                                <SelectItem value="outbound_door_to_door">Door to Door</SelectItem>
                                                <SelectItem value="referral">Referral</SelectItem>
                                                <SelectItem value="inbound">Inbound</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <textarea
                                        id="notes"
                                        className="w-full min-h-[80px] border rounded-md p-2 text-sm"
                                        value={formData.notes}
                                        onChange={(e) => handleChange('notes', e.target.value)}
                                        placeholder="Additional details about the business..."
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="social" className="space-y-4 pt-2">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="instagram">Instagram</Label>
                                        <Input
                                            id="instagram"
                                            value={formData.instagram || ''}
                                            placeholder="Instagram profile link..."
                                            onChange={(e) => handleChange('instagram', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="facebook">Facebook</Label>
                                        <Input
                                            id="facebook"
                                            value={formData.facebook || ''}
                                            placeholder="Facebook page link..."
                                            onChange={(e) => handleChange('facebook', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="twitter">Twitter / X</Label>
                                        <Input
                                            id="twitter"
                                            value={formData.twitter || ''}
                                            placeholder="Twitter profile link..."
                                            onChange={(e) => handleChange('twitter', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="linkedin">LinkedIn</Label>
                                        <Input
                                            id="linkedin"
                                            value={formData.linkedin || ''}
                                            placeholder="LinkedIn profile link..."
                                            onChange={(e) => handleChange('linkedin', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="yelp">Yelp</Label>
                                        <Input
                                            id="yelp"
                                            value={formData.yelp || ''}
                                            placeholder="Yelp page URL..."
                                            onChange={(e) => handleChange('yelp', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="youtube">YouTube</Label>
                                        <Input
                                            id="youtube"
                                            value={formData.youtube || ''}
                                            placeholder="YouTube channel link..."
                                            onChange={(e) => handleChange('youtube', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="local" className="space-y-4 pt-2">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="category">Category</Label>
                                        <Input
                                            id="category"
                                            value={formData.category || ''}
                                            placeholder="e.g. Italian Restaurant, Pharmacy..."
                                            onChange={(e) => handleChange('category', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="placeId">Google Place ID</Label>
                                        <Input
                                            id="placeId"
                                            value={formData.placeId || ''}
                                            placeholder="Google Maps Place ID..."
                                            onChange={(e) => handleChange('placeId', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cid">CID (Google Business ID)</Label>
                                        <Input
                                            id="cid"
                                            value={formData.cid || ''}
                                            placeholder="Google maps CID..."
                                            onChange={(e) => handleChange('cid', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reviewCount">Review Count</Label>
                                        <Input
                                            id="reviewCount"
                                            type="number"
                                            value={formData.reviewCount || ''}
                                            placeholder="e.g. 150"
                                            onChange={(e) => handleChange('reviewCount', e.target.value ? parseInt(e.target.value, 10) : '')}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="averageRating">Average Rating</Label>
                                        <Input
                                            id="averageRating"
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="5"
                                            value={formData.averageRating || ''}
                                            placeholder="e.g. 4.7"
                                            onChange={(e) => handleChange('averageRating', e.target.value ? parseFloat(e.target.value) : '')}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="latitude">Latitude</Label>
                                        <Input
                                            id="latitude"
                                            type="number"
                                            step="any"
                                            value={formData.latitude || ''}
                                            placeholder="e.g. 33.6844"
                                            onChange={(e) => handleChange('latitude', e.target.value ? parseFloat(e.target.value) : '')}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="longitude">Longitude</Label>
                                        <Input
                                            id="longitude"
                                            type="number"
                                            step="any"
                                            value={formData.longitude || ''}
                                            placeholder="e.g. 73.0479"
                                            onChange={(e) => handleChange('longitude', e.target.value ? parseFloat(e.target.value) : '')}
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="hours" className="space-y-4 pt-2">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Opening Hours / Schedule</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="mondayHours">Monday</Label>
                                        <Input
                                            id="mondayHours"
                                            value={formData.mondayHours || ''}
                                            placeholder="e.g. 9:00 AM - 5:00 PM"
                                            onChange={(e) => handleChange('mondayHours', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="tuesdayHours">Tuesday</Label>
                                        <Input
                                            id="tuesdayHours"
                                            value={formData.tuesdayHours || ''}
                                            placeholder="e.g. 9:00 AM - 5:00 PM"
                                            onChange={(e) => handleChange('tuesdayHours', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="wednesdayHours">Wednesday</Label>
                                        <Input
                                            id="wednesdayHours"
                                            value={formData.wednesdayHours || ''}
                                            placeholder="e.g. 9:00 AM - 5:00 PM"
                                            onChange={(e) => handleChange('wednesdayHours', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="thursdayHours">Thursday</Label>
                                        <Input
                                            id="thursdayHours"
                                            value={formData.thursdayHours || ''}
                                            placeholder="e.g. 9:00 AM - 5:00 PM"
                                            onChange={(e) => handleChange('thursdayHours', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="fridayHours">Friday</Label>
                                        <Input
                                            id="fridayHours"
                                            value={formData.fridayHours || ''}
                                            placeholder="e.g. 9:00 AM - 5:00 PM"
                                            onChange={(e) => handleChange('fridayHours', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="saturdayHours">Saturday</Label>
                                        <Input
                                            id="saturdayHours"
                                            value={formData.saturdayHours || ''}
                                            placeholder="e.g. 10:00 AM - 2:00 PM"
                                            onChange={(e) => handleChange('saturdayHours', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="sundayHours">Sunday</Label>
                                        <Input
                                            id="sundayHours"
                                            value={formData.sundayHours || ''}
                                            placeholder="e.g. Closed"
                                            onChange={(e) => handleChange('sundayHours', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="action" className="space-y-4 pt-2">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Lead Action & Status Controls</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="lastContactedAt">Last Contacted Date & Time</Label>
                                        <Input
                                            id="lastContactedAt"
                                            type="datetime-local"
                                            value={formData.lastContactedAt || ''}
                                            onChange={(e) => handleChange('lastContactedAt', e.target.value)}
                                        />
                                        <p className="text-[10px] text-slate-400">Determines if the lead count goes to "Contacted Today" statistic.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="followUpDate">Next Scheduled Follow-up Date & Time</Label>
                                        <Input
                                            id="followUpDate"
                                            type="datetime-local"
                                            value={formData.followUpDate || ''}
                                            onChange={(e) => handleChange('followUpDate', e.target.value)}
                                        />
                                        <p className="text-[10px] text-slate-400">Determines if the lead is scheduled under "Scheduled Follow-ups" statistic.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-1">Lead Temperature / Interest Level</Label>
                                        <Select value={formData.temperature} onValueChange={(v) => handleChange('temperature', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="cold">Cold (Score: 1)</SelectItem>
                                                <SelectItem value="warm">Warm (Score: 3)</SelectItem>
                                                <SelectItem value="sql">SQL - Commitment Made (Score: 7)</SelectItem>
                                                <SelectItem value="closed">Closed Deal (Score: 20)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <div className="flex items-start gap-1.5 mt-1 text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-100">
                                            <Info size={12} className="text-blue-500 mt-0.5 shrink-0" />
                                            <span>
                                                <strong>Cold:</strong> Cold call. <strong>Warm:</strong> Responding/interested. <strong>SQL:</strong> Commitment made (e.g. booked demo). <strong>Closed:</strong> Deal closed.
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-1">Pipeline Stage</Label>
                                        <Select value={formData.stage} onValueChange={(v) => handleChange('stage', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="identify">Identify</SelectItem>
                                                <SelectItem value="qualify">Qualify</SelectItem>
                                                <SelectItem value="nurture">Nurture</SelectItem>
                                                <SelectItem value="close">Close (Commitment Stage)</SelectItem>
                                                <SelectItem value="onboard">Onboard</SelectItem>
                                                <SelectItem value="retain">Retain</SelectItem>
                                                <SelectItem value="refer">Refer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <div className="flex items-start gap-1.5 mt-1 text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-100">
                                            <Info size={12} className="text-blue-500 mt-0.5 shrink-0" />
                                            <span>
                                                <strong>Identify:</strong> Initial profiling. <strong>Qualify:</strong> Validated details. <strong>Nurture:</strong> Discussion/Demo. <strong>Close:</strong> Final negotiation. <strong>Onboard:</strong> Handover to client.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button type="button" variant="outline" onClick={() => navigate('/leads')}>Cancel</Button>
                        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Lead'}</Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default LeadForm;
