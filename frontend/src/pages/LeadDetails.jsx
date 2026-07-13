import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Phone,
    Mail,
    Globe,
    MapPin,
    Calendar,
    User,
    ArrowLeft,
    CheckCircle2,
    MessageSquare,
    TrendingUp,
    Clock,
    Pencil,
    Instagram,
    Facebook,
    Twitter,
    Linkedin,
    Youtube,
    Star,
    Link,
    Info
} from 'lucide-react';
import api from '@/lib/api';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LeadDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user: currentUser } = useAuth();
    const [lead, setLead] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [note, setNote] = useState('');
    const [activityType, setActivityType] = useState('note');
    const [submittingNote, setSubmittingNote] = useState(false);
    
    // Rejected state
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [rejectedReason, setRejectedReason] = useState('');
    const [rejecting, setRejecting] = useState(false);
    
    // Conversion & Team states
    const [team, setTeam] = useState([]);
    const [isConvertOpen, setIsConvertOpen] = useState(false);
    const [converting, setConverting] = useState(false);
    const [conversionData, setConversionData] = useState({
        planType: 'monthly_growth',
        dealType: 'monthly_subscription',
        monthlyAmount: '',
        lifetimeAmount: '',
        enterpriseAmount: '',
        startDate: new Date().toISOString().split('T')[0],
        closedBy: currentUser?.id || currentUser?._id || ''
    });

    // Sync closedBy when currentUser is loaded
    useEffect(() => {
        if (currentUser) {
            setConversionData(prev => ({
                ...prev,
                closedBy: currentUser.id || currentUser._id || ''
            }));
        }
    }, [currentUser]);

    const stages = ['identify', 'qualify', 'nurture', 'close', 'onboard', 'retain', 'refer', 'rejected'];
    const { isAdmin, can } = usePermissions();
    const myId = currentUser?._id?.toString();
    const holdsVerifierLock = lead?.workingVerifier?._id?.toString() === myId;
    const holdsCloserLock = lead?.workingCloser?._id?.toString() === myId;

    const isPrivileged = isAdmin;
    const canConvert = isAdmin || currentUser?.role === 'sales';
    const canEdit = isAdmin || can('can_edit_leads') || holdsVerifierLock || holdsCloserLock;
    const canView = isAdmin || can('can_view_leads');

    const isVerifierUser = Array.isArray(currentUser?.designation) && currentUser.designation.includes('LeadVerifier');
    const isCloserUser = Array.isArray(currentUser?.designation) && currentUser.designation.includes('LeadCloser');

    // Helper to get lock warning message for active verifier/closer
    const getLockStatusMessage = () => {
        if (isPrivileged) return null; // Admin bypasses everything
        
        if (holdsVerifierLock || holdsCloserLock) return null; // If they hold any lock, they are fully allowed
        
        // Locked by another Verifier
        if (isVerifierUser && lead?.workingVerifier && lead.workingVerifier._id?.toString() !== myId) {
            return `Lead Verifier "${lead.workingVerifier.name}" is working on this lead. You cannot perform this action.`;
        }
        // Locked by another Closer
        if (isCloserUser && lead?.workingCloser && lead.workingCloser._id?.toString() !== myId) {
            return `Lead Closer "${lead.workingCloser.name}" is working on this lead. You cannot perform this action.`;
        }

        // Unclaimed by current user (must claim first)
        if (isVerifierUser || isCloserUser) {
            return "Access denied: You must claim this lead first (Work Claim) before you can modify its stage or add notes.";
        }

        if (!can('can_edit_leads')) {
            return "Access denied: You do not have permission to edit leads.";
        }

        return null;
    };

    const lockWarning = getLockStatusMessage();

    const getDealValueUSD = () => {
        if (['monthly_subscription', 'weekly', 'monthly'].includes(conversionData.dealType)) return parseFloat(conversionData.monthlyAmount || 0);
        if (['lifetime_deal', 'one_time'].includes(conversionData.dealType)) return parseFloat(conversionData.lifetimeAmount || 0);
        if (['enterprise', 'annual'].includes(conversionData.dealType)) return parseFloat(conversionData.enterpriseAmount || 0);
        return 0;
    };

    useEffect(() => {
        fetchLeadData();
        const fetchTeam = async () => {
            try {
                const res = await api.get('/team');
                if (res.success) setTeam(res.data);
            } catch (err) {
                console.error("Failed to load team", err);
            }
        };
        fetchTeam();
    }, [id]);

    const fetchLeadData = async () => {
        try {
            const res = await api.get(`/leads/${id}`);
            if (res.success) {
                setLead(res.data.lead);
                setActivities(res.data.activities);
            }
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: "Failed to load lead details" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const total = getDealValueUSD();
        const upfront = parseFloat(conversionData.upfrontPaid || 0);
        const remaining = Math.max(0, total - upfront);
        setConversionData(prev => {
            const remStr = remaining.toString();
            if (prev.remainingAmount !== remStr) {
                return { ...prev, remainingAmount: remStr };
            }
            return prev;
        });
    }, [conversionData.monthlyAmount, conversionData.lifetimeAmount, conversionData.enterpriseAmount, conversionData.dealType, conversionData.upfrontPaid]);

    const handleConversionChange = (name, value) => {
        setConversionData(prev => ({ ...prev, [name]: value }));
    };

    const handleConvertSubmit = async (e) => {
        e.preventDefault();
        setConverting(true);
        try {
            const body = {
                planType: conversionData.planType || conversionData.dealType,
                dealType: conversionData.dealType,
                startDate: conversionData.startDate,
                closedBy: conversionData.closedBy || undefined,
                monthlyAmount: ['monthly_subscription', 'weekly', 'monthly'].includes(conversionData.dealType) ? parseFloat(conversionData.monthlyAmount || 0) : undefined,
                lifetimeAmount: ['lifetime_deal', 'one_time'].includes(conversionData.dealType) ? parseFloat(conversionData.lifetimeAmount || 0) : undefined,
                enterpriseAmount: ['enterprise', 'annual'].includes(conversionData.dealType) ? parseFloat(conversionData.enterpriseAmount || 0) : undefined,
                upfrontPaid: parseFloat(conversionData.upfrontPaid || 0),
                remainingAmount: parseFloat(conversionData.remainingAmount || 0),
                engagedTeam: conversionData.engagedTeam || []
            };

            const res = await api.post(`/leads/${id}/convert`, body);
            if (res.success) {
                toast({ title: "Lead Converted", description: "This lead has been successfully converted into an active customer." });
                setIsConvertOpen(false);
                // If admin, we can go to clients, otherwise back to pipeline
                navigate(isPrivileged ? '/clients' : '/leads');
            } else {
                toast({ variant: "destructive", title: "Error", description: res.error || "Failed to convert lead" });
            }
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: err.error || "Connection failed" });
        } finally {
            setConverting(false);
        }
    };

    const handleUpdateStage = async (newStage) => {
        if (lockWarning) {
            toast({ variant: "destructive", title: "Action Blocked", description: lockWarning });
            return;
        }
        if (newStage === 'rejected') {
            setIsRejectOpen(true);
            return;
        }
        submitStageUpdate(newStage);
    };

    const submitStageUpdate = async (newStage, reason = null) => {
        try {
            const payload = { stage: newStage };
            if (reason) payload.rejectedReason = reason;

            const res = await api.put(`/leads/${id}/stage`, payload);
            if (res.success) {
                toast({ title: "Success", description: `Stage updated to ${newStage}` });
                fetchLeadData();
                if (newStage === 'rejected') {
                    setIsRejectOpen(false);
                    setRejectedReason('');
                }
            } else {
                toast({ variant: "destructive", title: "Error", description: res.error || "Failed to update stage" });
            }
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: "Failed to update stage" });
        } finally {
            setRejecting(false);
        }
    };

    const handleMarkVerified = async () => {
        try {
            const res = await api.put(`/leads/${id}/verify`);
            if (res.success) {
                toast({ title: "Success", description: "Lead has been marked as verified." });
                fetchLeadData();
            } else {
                toast({ variant: "destructive", title: "Error", description: res.error || "Failed to verify lead" });
            }
        } catch (err) {
            const errorMsg = typeof err === 'object' && err.error ? err.error : (err.message || "Connection failed");
            toast({ variant: "destructive", title: "Error", description: errorMsg });
        }
    };

    const handleRejectSubmit = (e) => {
        e.preventDefault();
        if (!rejectedReason.trim()) return;
        setRejecting(true);
        submitStageUpdate('rejected', rejectedReason);
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (lockWarning) {
            toast({ variant: "destructive", title: "Action Blocked", description: lockWarning });
            return;
        }
        if (!note.trim()) return;
        setSubmittingNote(true);
        try {
            const descMap = {
                'note': 'Added a note',
                'call': 'Logged a phone call',
                'whatsapp': 'Logged a WhatsApp message',
                'email': 'Logged an email sent',
                'meeting': 'Logged a meeting / demo',
                'sms': 'Logged an SMS text',
                'social_media': 'Logged social media contact'
            };
            const res = await api.post(`/leads/${id}/activity`, {
                type: activityType,
                description: descMap[activityType] || 'Logged activity',
                notes: note
            });
            if (res.success) {
                setNote('');
                setActivityType('note');
                toast({ title: "Success", description: activityType === 'note' ? "Note added" : "Activity logged successfully" });
                fetchLeadData();
            }
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: "Failed to log activity" });
        } finally {
            setSubmittingNote(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading lead details...</div>;
    if (!lead) return <div className="p-8 text-center">Lead not found</div>;

    const currentStageIndex = stages.indexOf(lead.stage);

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <Button variant="ghost" className="gap-2" onClick={() => navigate('/leads')}>
                    <ArrowLeft size={16} /> Back to Pipeline
                </Button>
                <div className="flex gap-2">
                    {holdsVerifierLock && !lead?.isVerifiedByVerifier && (
                        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2 font-semibold" onClick={handleMarkVerified}>
                            <CheckCircle2 size={14} /> Mark as Verified
                        </Button>
                    )}
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-2 font-semibold" 
                        onClick={() => navigate(`/leads/edit/${id}`)}
                        disabled={!canEdit}
                        title={!canEdit ? "You do not have permission to edit leads." : ""}
                    >
                        <Pencil size={14} /> Edit Lead
                    </Button>
                    {canConvert && lead.stage !== 'onboard' && (
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setIsConvertOpen(true)}>
                            Convert to Client
                        </Button>
                    )}
                </div>
            </div>

            <div className={`grid gap-6 md:grid-cols-3 ${!canView ? 'blur-sm select-none' : ''}`}>
                {/* Main Info Card */}
                <Card className="md:col-span-2">
                    <CardHeader className="border-b bg-slate-50/50">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-2xl font-bold">
                                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.companyName)}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600 hover:text-blue-800" title="Click to search on Google Maps">
                                        {lead.companyName}
                                    </a>
                                </CardTitle>
                                <p className="text-slate-500 flex items-center gap-2 mt-1 italic">
                                    <Globe size={14} /> {lead.website ? (
                                        <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600">
                                            {lead.website}
                                        </a>
                                    ) : 'No website'}
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <Badge variant="secondary" className="uppercase font-bold tracking-wider">
                                    {lead.temperature}
                                </Badge>
                                <Badge variant="outline" className="capitalize">
                                    {lead.industry || 'General Business'}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {/* Stage Progress Bar */}
                        <div className="mb-8">
                            <h3 className="text-xs font-bold uppercase text-slate-400 mb-4 tracking-widest">Pipeline Journey</h3>
                            <div className="relative flex justify-between items-center px-2">
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-100 -z-10" />
                                <div
                                    className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-blue-500 transition-all duration-500 -z-10"
                                    style={{ width: `${(currentStageIndex / (stages.length - 1)) * 100}%` }}
                                />
                                {stages.map((s, idx) => (
                                    <div key={s} className="flex flex-col items-center">
                                        <button
                                            onClick={() => handleUpdateStage(s)}
                                            className={`w-4 h-4 rounded-full border-2 transition-all ${idx <= currentStageIndex
                                                    ? 'bg-blue-600 border-blue-600 scale-125'
                                                    : 'bg-white border-slate-300 hover:border-blue-400'
                                                }`}
                                        />
                                        <span className={`text-[10px] absolute translate-y-6 font-bold uppercase ${idx === currentStageIndex ? 'text-blue-600' : 'text-slate-400'
                                            }`}>
                                            {s}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mt-12 pt-6 border-t font-medium text-slate-700">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <User size={18} className="text-slate-400" />
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-black">Contact Person</p>
                                        <p>{lead.contactName || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone size={18} className="text-slate-400" />
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-black">Phone / WhatsApp</p>
                                        <p>
                                            {lead.phone ? (
                                                <a href={`https://web.whatsapp.com/send?phone=${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline hover:text-emerald-800" title="Click to chat on WhatsApp Web">
                                                    {lead.phone}
                                                </a>
                                            ) : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Mail size={18} className="text-slate-400" />
                                    <div className="min-w-0">
                                        <p className="text-[10px] text-slate-400 uppercase font-black">Email</p>
                                        <p className="break-all whitespace-normal text-sm">
                                            {lead.email ? (
                                                <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${lead.email}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline hover:text-blue-800" title="Click to email on Gmail Web">
                                                    {lead.email}
                                                </a>
                                            ) : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <MapPin size={18} className="text-slate-400" />
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-black">Location / Address</p>
                                        <p>
                                            {lead.address || lead.city ? (
                                                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.address || lead.city)}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline hover:text-blue-800" title="Click to locate on Google Maps">
                                                    {lead.address || lead.city}
                                                </a>
                                            ) : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar size={18} className="text-slate-400" />
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-black">Created On</p>
                                        <p>{new Date(lead.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                     <TrendingUp size={18} className="text-slate-400" />
                                     <div>
                                         <p className="text-[10px] text-slate-400 uppercase font-black">Lead Source</p>
                                         <p className="capitalize">{lead.source?.replace(/_/g, ' ')}</p>
                                     </div>
                                 </div>
                             </div>
                         </div>

                        {/* Service and Tracking Details */}
                        <div className="mt-8 pt-6 border-t bg-slate-50/50 p-4 rounded-lg border border-slate-100">
                            <h3 className="text-xs font-bold uppercase text-slate-500 mb-4 tracking-widest">Lead Tracking & Service Info</h3>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-sm text-slate-700 font-medium">
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-black">Target Service</p>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {lead.targetService && lead.targetService.length > 0 ? lead.targetService.map(service => (
                                            <Badge key={service} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 capitalize font-bold">
                                                {service.replace(/_/g, ' ')}
                                            </Badge>
                                        )) : <span className="text-slate-400 text-xs font-bold mt-1">Not Specified</span>}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-black">Lead Collected By</p>
                                    <p className="mt-1 text-slate-800 font-semibold">{lead.leadCollectedBy || lead.submittedBy?.name || 'Unknown'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-black">Lead Verified By</p>
                                    <p className="mt-1 text-slate-800 font-semibold">{lead.leadVerifiedBy || 'Not Verified Yet'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-black">Last Contacted By</p>
                                    <p className="mt-1 text-slate-800 font-semibold">
                                        {lead.contactedBy ? (
                                            <>
                                                {lead.contactedBy} 
                                                {lead.contactMethod && <span className="text-xs text-slate-500"> ({lead.contactMethod.replace(/_/g, ' ')})</span>}
                                            </>
                                        ) : 'No recorded contact'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-black">Sales Closed By</p>
                                    <p className="mt-1 text-slate-800 font-semibold">{lead.salesClosedBy || (lead.stage === 'onboard' ? 'Yes (Closer details unavailable)' : 'Not Closed Yet')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Social Media & Online Presence */}
                        {(lead.instagram || lead.facebook || lead.twitter || lead.linkedin || lead.yelp || lead.youtube) && (
                            <div className="mt-8 pt-6 border-t">
                                <h3 className="text-xs font-bold uppercase text-slate-400 mb-4 tracking-widest">Social Media & Web</h3>
                                <div className="flex flex-wrap gap-3">
                                    {lead.instagram && (
                                        <a href={lead.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-pink-50/50 hover:bg-pink-50 text-pink-700 border-pink-200 text-xs font-semibold transition-colors">
                                            <Instagram size={14} /> Instagram
                                        </a>
                                    )}
                                    {lead.facebook && (
                                        <a href={lead.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-blue-50/50 hover:bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold transition-colors">
                                            <Facebook size={14} /> Facebook
                                        </a>
                                    )}
                                    {lead.twitter && (
                                        <a href={lead.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-sky-50/50 hover:bg-sky-50 text-sky-700 border-sky-200 text-xs font-semibold transition-colors">
                                            <Twitter size={14} /> Twitter / X
                                        </a>
                                    )}
                                    {lead.linkedin && (
                                        <a href={lead.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-semibold transition-colors">
                                            <Linkedin size={14} /> LinkedIn
                                        </a>
                                    )}
                                    {lead.yelp && (
                                        <a href={lead.yelp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-red-50/50 hover:bg-red-50 text-red-700 border-red-200 text-xs font-semibold transition-colors">
                                            <Globe size={14} /> Yelp
                                        </a>
                                    )}
                                    {lead.youtube && (
                                        <a href={lead.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-rose-50/50 hover:bg-rose-50 text-rose-700 border-rose-200 text-xs font-semibold transition-colors">
                                            <Youtube size={14} /> YouTube
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Local Business Details & Google Maps */}
                        {(lead.category || lead.placeId || lead.cid || lead.reviewCount || lead.averageRating) && (
                            <div className="mt-8 pt-6 border-t">
                                <h3 className="text-xs font-bold uppercase text-slate-400 mb-4 tracking-widest">Local Business Info (Google Maps)</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm text-slate-700 font-medium">
                                    {lead.category && (
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-black">Category</p>
                                            <p className="capitalize text-slate-800">{lead.category}</p>
                                        </div>
                                    )}
                                    {lead.averageRating !== undefined && lead.averageRating !== null && (
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-black">Rating</p>
                                            <div className="flex items-center gap-1 text-slate-800">
                                                <Star size={14} className="fill-amber-400 text-amber-400" />
                                                <span>{lead.averageRating} / 5.0</span>
                                            </div>
                                        </div>
                                    )}
                                    {lead.reviewCount !== undefined && lead.reviewCount !== null && (
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-black">Reviews Count</p>
                                            <p className="text-slate-800">{lead.reviewCount} reviews</p>
                                        </div>
                                    )}
                                    {lead.placeId && (
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-black">Google Place ID</p>
                                            <p className="text-xs font-mono text-slate-500 truncate max-w-[180px]">{lead.placeId}</p>
                                        </div>
                                    )}
                                    {lead.cid && (
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-black">CID</p>
                                            <p className="text-xs font-mono text-slate-500 truncate max-w-[180px]">{lead.cid}</p>
                                        </div>
                                    )}
                                    {(lead.latitude || lead.longitude) && (
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-black">Coordinates (Lat / Lng)</p>
                                            <p className="text-xs font-mono text-slate-500">
                                                {lead.latitude || 'N/A'}, {lead.longitude || 'N/A'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Working / Opening Hours */}
                        {(lead.mondayHours || lead.tuesdayHours || lead.wednesdayHours || lead.thursdayHours || lead.fridayHours || lead.saturdayHours || lead.sundayHours) && (
                            <div className="mt-8 pt-6 border-t">
                                <h3 className="text-xs font-bold uppercase text-slate-400 mb-4 tracking-widest">Working Hours</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold text-slate-600">
                                    {lead.mondayHours && (
                                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                            <p className="text-[9px] uppercase text-slate-400 font-bold mb-0.5">Monday</p>
                                            <p className="text-slate-800">{lead.mondayHours}</p>
                                        </div>
                                    )}
                                    {lead.tuesdayHours && (
                                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                            <p className="text-[9px] uppercase text-slate-400 font-bold mb-0.5">Tuesday</p>
                                            <p className="text-slate-800">{lead.tuesdayHours}</p>
                                        </div>
                                    )}
                                    {lead.wednesdayHours && (
                                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                            <p className="text-[9px] uppercase text-slate-400 font-bold mb-0.5">Wednesday</p>
                                            <p className="text-slate-800">{lead.wednesdayHours}</p>
                                        </div>
                                    )}
                                    {lead.thursdayHours && (
                                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                            <p className="text-[9px] uppercase text-slate-400 font-bold mb-0.5">Thursday</p>
                                            <p className="text-slate-800">{lead.thursdayHours}</p>
                                        </div>
                                    )}
                                    {lead.fridayHours && (
                                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                            <p className="text-[9px] uppercase text-slate-400 font-bold mb-0.5">Friday</p>
                                            <p className="text-slate-800">{lead.fridayHours}</p>
                                        </div>
                                    )}
                                    {lead.saturdayHours && (
                                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                            <p className="text-[9px] uppercase text-slate-400 font-bold mb-0.5">Saturday</p>
                                            <p className="text-slate-800">{lead.saturdayHours}</p>
                                        </div>
                                    )}
                                    {lead.sundayHours && (
                                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                            <p className="text-[9px] uppercase text-slate-400 font-bold mb-0.5">Sunday</p>
                                            <p className="text-slate-800">{lead.sundayHours}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Sidebar: Activity & Notes */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Log Activity / Add Note</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {lockWarning && (
                                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold leading-relaxed">
                                    ⚠️ {lockWarning}
                                </div>
                            )}
                            <form onSubmit={handleAddNote} className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Activity Type</label>
                                    <Select value={activityType} onValueChange={setActivityType} disabled={!!lockWarning}>
                                        <SelectTrigger className="w-full bg-white" disabled={!!lockWarning}><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="note">Note / Remark</SelectItem>
                                            <SelectItem value="call">Phone Call</SelectItem>
                                            <SelectItem value="whatsapp">WhatsApp Message</SelectItem>
                                            <SelectItem value="email">Email Sent</SelectItem>
                                            <SelectItem value="meeting">Meeting / Demo</SelectItem>
                                            <SelectItem value="sms">SMS Text</SelectItem>
                                            <SelectItem value="social_media">Social Media DM</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Notes / Details</label>
                                    <textarea
                                        className="w-full min-h-[80px] p-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                                        placeholder={activityType === 'note' ? "Type important details here..." : `Details about the ${activityType} contact...`}
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        disabled={!!lockWarning}
                                    />
                                </div>
                                <Button className="w-full text-xs font-bold uppercase bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50" disabled={submittingNote || !!lockWarning}>
                                    {submittingNote ? 'Saving...' : (activityType === 'note' ? 'Add Note' : 'Log Activity')}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="h-[430px] flex flex-col">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                <Clock size={16} /> Activity History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto pt-4 relative">
                            <div className="absolute left-7 top-0 w-0.5 h-full bg-slate-100 -z-10" />
                            <div className="space-y-6">
                                {activities.map((act) => (
                                    <div key={act._id} className="flex gap-4 group">
                                        <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shrink-0 z-10 group-hover:border-blue-500 shadow-sm transition-colors">
                                            {act.type === 'note' ? <MessageSquare size={10} className="text-slate-600" /> : <CheckCircle2 size={10} className="text-blue-600" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-[10px] font-black uppercase text-slate-600 tracking-tight">{act.description}</p>
                                                <span className="text-[9px] text-slate-400">{new Date(act.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            {act.notes && <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded italic border-l-2 border-blue-200">{act.notes}</p>}
                                            <p className="text-[9px] text-slate-400 mt-1 font-bold">BY {act.performedBy?.name || 'SYSTEM'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={isConvertOpen} onOpenChange={setIsConvertOpen}>
                <DialogContent className="max-w-2xl bg-white p-6 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Convert Lead to Client</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleConvertSubmit} className="space-y-4 pt-2">
                        {isPrivileged ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Deal Type</label>
                                    <Select 
                                        value={conversionData.dealType} 
                                        onValueChange={(v) => {
                                            handleConversionChange('dealType', v);
                                            if (['monthly_subscription', 'weekly', 'monthly'].includes(v)) handleConversionChange('planType', 'monthly_growth');
                                            else if (['lifetime_deal', 'one_time'].includes(v)) handleConversionChange('planType', 'one_time');
                                            else if (['enterprise', 'annual'].includes(v)) handleConversionChange('planType', 'annual');
                                        }}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="monthly_subscription">Monthly Subscription</SelectItem>
                                            <SelectItem value="lifetime_deal">Lifetime Deal (One Time)</SelectItem>
                                            <SelectItem value="enterprise">Enterprise Contract</SelectItem>
                                            <SelectItem value="one_time">One Time Deal</SelectItem>
                                            <SelectItem value="weekly">Weekly Subscription</SelectItem>
                                            <SelectItem value="monthly">Monthly Plan</SelectItem>
                                            <SelectItem value="annual">Annual / Yearly Plan</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>


                                {['monthly_subscription', 'weekly', 'monthly'].includes(conversionData.dealType) && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Subscription / Plan Amount (USD)</label>
                                        <Input
                                            type="number"
                                            required
                                            value={conversionData.monthlyAmount}
                                            placeholder="e.g. 500"
                                            onChange={(e) => handleConversionChange('monthlyAmount', e.target.value)}
                                        />
                                    </div>
                                )}

                                {['lifetime_deal', 'one_time'].includes(conversionData.dealType) && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">One Time / Lifetime Amount (USD)</label>
                                        <Input
                                            type="number"
                                            required
                                            value={conversionData.lifetimeAmount}
                                            placeholder="e.g. 1500"
                                            onChange={(e) => handleConversionChange('lifetimeAmount', e.target.value)}
                                        />
                                    </div>
                                )}

                                {['enterprise', 'annual'].includes(conversionData.dealType) && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Contract / Enterprise Amount (USD)</label>
                                        <Input
                                            type="number"
                                            required
                                            value={conversionData.enterpriseAmount}
                                            placeholder="e.g. 5000"
                                            onChange={(e) => handleConversionChange('enterpriseAmount', e.target.value)}
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Upfront Paid (USD)</label>
                                    <Input
                                        type="number"
                                        value={conversionData.upfrontPaid || ''}
                                        placeholder="e.g. 100"
                                        onChange={(e) => handleConversionChange('upfrontPaid', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Remaining Amount (USD)</label>
                                    <Input
                                        type="number"
                                        value={conversionData.remainingAmount || ''}
                                        placeholder="Remaining..."
                                        disabled
                                        className="bg-slate-50 cursor-not-allowed font-bold"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Engaged Team Members & Commissions</label>
                                    {(conversionData.engagedTeam || []).map((member, index) => (
                                        <div key={index} className="flex gap-2 items-center mb-2 bg-slate-50 p-2 rounded border">
                                            <div className="flex-1">
                                                <Select 
                                                    value={member.user} 
                                                    onValueChange={(val) => {
                                                        const updated = [...(conversionData.engagedTeam || [])];
                                                        updated[index].user = val;
                                                        handleConversionChange('engagedTeam', updated);
                                                    }}
                                                >
                                                    <SelectTrigger><SelectValue placeholder="Select Team..." /></SelectTrigger>
                                                    <SelectContent>
                                                        {team.map((t) => (
                                                            <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="w-32">
                                                <Input
                                                    type="number"
                                                    placeholder="Commission %"
                                                    value={member.commissionPercentage || ''}
                                                    onChange={(e) => {
                                                        const updated = [...(conversionData.engagedTeam || [])];
                                                        updated[index].commissionPercentage = parseFloat(e.target.value || 0);
                                                        handleConversionChange('engagedTeam', updated);
                                                    }}
                                                />
                                            </div>
                                            <div className="w-32 text-xs font-bold text-emerald-600 flex items-center justify-end px-2">
                                                ${ ((getDealValueUSD() * (member.commissionPercentage || 0)) / 100).toFixed(2) }
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:text-red-700 p-1 h-auto"
                                                onClick={() => {
                                                    const updated = (conversionData.engagedTeam || []).filter((_, i) => i !== index);
                                                    handleConversionChange('engagedTeam', updated);
                                                }}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    ))}
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm" 
                                        className="w-full text-xs font-bold uppercase mt-1"
                                        onClick={() => {
                                            const updated = [...(conversionData.engagedTeam || []), { user: '', commissionPercentage: 0 }];
                                            handleConversionChange('engagedTeam', updated);
                                        }}
                                    >
                                        + Add Engaged Team Member
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Start Date</label>
                                    <Input
                                        type="date"
                                        required
                                        value={conversionData.startDate}
                                        onChange={(e) => handleConversionChange('startDate', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Closed By (Sales Closer)</label>
                                    <Select value={conversionData.closedBy} onValueChange={(v) => handleConversionChange('closedBy', v)}>
                                        <SelectTrigger><SelectValue placeholder="Select Closer..." /></SelectTrigger>
                                        <SelectContent>
                                            {team.map((member) => (
                                                <SelectItem key={member._id} value={member._id}>
                                                    {member.name} ({member.role})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6 text-slate-600">
                                <p>Are you sure you want to convert this lead into a client?</p>
                                <p className="text-sm mt-2">Only Admins can set deal values and commission breakdowns.</p>
                            </div>
                        )}

                        <DialogFooter className="pt-4 gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsConvertOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={converting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                {converting ? 'Converting...' : 'Confirm Conversion'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-rose-600 flex items-center gap-2">
                            Reject Lead
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleRejectSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="rejectedReason" className="text-xs font-bold text-slate-500 uppercase">Reason for Rejection</Label>
                            <textarea
                                id="rejectedReason"
                                required
                                className="w-full min-h-[100px] p-3 text-sm border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                                placeholder="Please explain why this lead is being rejected..."
                                value={rejectedReason}
                                onChange={(e) => setRejectedReason(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={rejecting} className="bg-rose-600 hover:bg-rose-700 text-white">
                                {rejecting ? 'Rejecting...' : 'Confirm Rejection'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default LeadDetails;
