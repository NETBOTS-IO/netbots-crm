import { useEffect, useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Camera, CheckCircle2, ShieldAlert, Download, RefreshCw } from 'lucide-react';

const AgreementModal = () => {
    const { user, refreshUser } = useAuth();
    const { toast } = useToast();
    const [step, setStep] = useState(1); // 1: Read Terms, 2: Camera Selfie, 3: Success
    const [cameraStream, setCameraStream] = useState(null);
    const [selfieDataUrl, setSelfieDataUrl] = useState(null);
    const [signing, setSigning] = useState(false);
    const [hasCamera, setHasCamera] = useState(true);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // Stop camera on unmount
    useEffect(() => {
        return () => {
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [cameraStream]);

    // Start camera stream
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 300, height: 300 } });
            setCameraStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setHasCamera(true);
        } catch (err) {
            console.warn('Camera stream request failed', err);
            setHasCamera(false);
            toast({ 
                variant: "destructive", 
                title: "Camera Unavailable", 
                description: "Webcam access could not be established. Falling back to signature log." 
            });
        }
    };

    // Capture Frame
    const captureSelfie = () => {
        if (!hasCamera) {
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#f8fafc';
                ctx.fillRect(0, 0, 300, 300);
                ctx.font = 'bold 16px sans-serif';
                ctx.fillStyle = '#0f172a';
                ctx.fillText('Digital Signature Log', 20, 100);
                ctx.font = 'italic 14px sans-serif';
                ctx.fillStyle = '#334155';
                ctx.fillText(user?.name || 'Contractor', 20, 140);
                ctx.fillText(`Designation: ${user?.designation || 'Staff'}`, 20, 170);
                ctx.fillText(new Date().toLocaleString(), 20, 200);
                setSelfieDataUrl(canvas.toDataURL('image/jpeg'));
            }
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, 300, 300);
            const dataUrl = canvas.toDataURL('image/jpeg');
            setSelfieDataUrl(dataUrl);

            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
                setCameraStream(null);
            }
        }
    };

    // Retry capture
    const handleRetry = () => {
        setSelfieDataUrl(null);
        startCamera();
    };

    // Sign Terms and Generate PDF
    const handleSignAndAccept = async () => {
        setSigning(true);
        try {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const today = new Date().toLocaleDateString();

            doc.setFont("helvetica", "bold");
            doc.setFontSize(18);
            doc.setTextColor(15, 23, 42);
            doc.text("INDEPENDENT CONTRACTOR AGREEMENT", 105, 20, { align: "center" });
            doc.setFontSize(12);
            doc.text("Sales / Lead Closer — Commission-Based Model", 105, 28, { align: "center" });

            doc.setDrawColor(226, 232, 240);
            doc.line(20, 33, 190, 33);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.text("1. Parties", 20, 42);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(`This Agreement is made between Net Bots  (SMC-PRIVATE) LIMITED ("Company") and the Contractor:`, 20, 48);
            
            doc.setFont("helvetica", "bold");
            doc.text(`Contractor Name: ${user?.name || 'Unknown'}`, 25, 54);
            doc.text(`Role / Designation: ${user?.designation || 'Staff'}`, 25, 60);
            doc.text(`Effective Date: ${today}`, 25, 66);

            doc.setFont("helvetica", "bold");
            doc.text("2. Nature of Engagement & Sourced Services", 20, 75);
            doc.setFont("helvetica", "normal");
            const textEngagement = `The Contractor is engaged strictly as an independent contractor. Sourced services under this platform include Website Development, Search Engine Optimization (SEO), Google Business Profile Optimization (SEO), Social Media Management & Marketing, Graphic Designing, Custom Software Development, and SaaS Products. Contractor is not responsible for post-sale service delivery or fulfillment.`;
            const splitEngagement = doc.splitTextToSize(textEngagement, 170);
            doc.text(splitEngagement, 20, 81);

            doc.setFont("helvetica", "bold");
            doc.text("3. Commission Splits & Limits (Max 15% combined split)", 20, 105);
            doc.setFont("helvetica", "normal");
            const commissionText = `Compensation is 100% commission-based. Maximum combined project commission splits shared among all involved roles on any single client deal shall not exceed 15%:\n` +
                                   `• Lead Collector: Sourced lead commission split up to 2% maximum.\n` +
                                   `• Lead Verifier: Qualified lead commission split up to 5% maximum.\n` +
                                   `• Lead Closer: Closed deal commission split up to 10% maximum.`;
            const splitComms = doc.splitTextToSize(commissionText, 170);
            doc.text(splitComms, 20, 111);

            doc.setFont("helvetica", "bold");
            doc.text("4. Terms, Non-Compete, and Ownership Details", 20, 138);
            doc.setFont("helvetica", "normal");
            const termsText = `• Clawbacks: Commissions are clawed back if a client cancels within 30 days or is refunded.\n` +
                               `• Non-Solicitation & Non-Circumvention: Sourced leads/clients remain sole property of the Company. Contractor is strictly prohibited from bypassing Net Bots  (SMC-PRIVATE) LIMITED to deal directly with any lead or client. Any direct engagement or bypassing will lead to immediate legal action and heavy financial penalties.\n` +
                               `• Termination: Either party may terminate with 7 days written notice.`;
            const splitTerms = doc.splitTextToSize(termsText, 170);
            doc.text(splitTerms, 20, 144);

            doc.setFont("helvetica", "bold");
            doc.text("5. Electronic Signature and Visual Selfie Verification", 20, 168);
            doc.setFont("helvetica", "normal");
            doc.text("By proceeding, the Contractor accepts all clauses above and logs the visual capture below as proof of digital acknowledgement.", 20, 174);

            if (selfieDataUrl) {
                doc.addImage(selfieDataUrl, 'JPEG', 20, 182, 45, 45);
            }

            doc.setFont("helvetica", "bold");
            doc.text(`Digital Signee: ${user?.name}`, 80, 192);
            doc.text(`Access IP Logged`, 80, 200);
            doc.setFont("helvetica", "normal");
            doc.text(`Logged Timestamp: ${new Date().toLocaleString()}`, 80, 208);

            const pdfBase64 = doc.output('datauristring').split(',')[1];

            const res = await api.post('/agreement/sign', { pdfBase64 });
            if (res.success) {
                await refreshUser();
                toast({ title: "Success", description: "Independent Contractor Agreement signed and visual signature recorded." });
                setStep(3);
                doc.save(`Signed_Agreement_${user?.name?.replace(/\s+/g, '_')}.pdf`);
            } else {
                toast({ variant: "destructive", title: "Error", description: res.error || "Failed to submit agreement signature." });
            }

        } catch (err) {
            console.error(err);
            toast({ variant: "destructive", title: "Error", description: "An error occurred compiling the agreement document." });
        } finally {
            setSigning(false);
        }
    };

    if (!user || user.agreementSigned) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-2xl border max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                <div className="bg-slate-900 text-white p-5 shrink-0 flex items-center gap-3">
                    <ShieldAlert className="text-amber-500" size={24} />
                    <div>
                        <h2 className="text-lg font-black uppercase tracking-wider">Independent Contractor Onboarding</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Review, selfie verify, and sign terms to unlock CRM</p>
                    </div>
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-6">
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="bg-slate-50 border p-4 rounded-lg text-slate-700 text-xs leading-relaxed space-y-4 max-h-[45vh] overflow-y-auto font-medium font-sans">
                                <h3 className="font-extrabold text-slate-900 text-center uppercase tracking-wide text-sm border-b pb-2">Sales / Lead Closer Agreement</h3>
                                
                                <p><strong>1. Parties:</strong> This Independent Contractor Agreement is entered into between Net Bots  (SMC-PRIVATE) LIMITED ("Company") and the signed Contractor (<strong>{user.name}</strong>), designated as a <strong>{user.designation || 'Staff'}</strong>.</p>
                                
                                <p><strong>2. Nature of Engagement & Sourced Services:</strong> The Contractor is engaged strictly as an independent contractor. Contractor is fully responsible for all taxes, hardware, and internet/communication costs. Sourced services offered under this platform include:</p>
                                <ul className="list-disc pl-5 space-y-1 font-bold text-slate-800">
                                    <li>Website Development</li>
                                    <li>Search Engine Optimization (SEO)</li>
                                    <li>Google Business Profile SEO</li>
                                    <li>Social Media Management & Marketing</li>
                                    <li>Graphic Designing</li>
                                    <li>Custom Software Development</li>
                                    <li>SaaS Products</li>
                                </ul>
                                <p>The Contractor is responsible strictly for client acquisition, validation, and closing. Post-sale service delivery and fulfillment are handled entirely by the fulfillment team.</p>

                                <p><strong>3. Commission Splits & Limits (Max 15% combined split limit):</strong></p>
                                <ul className="list-disc pl-5 space-y-1 font-semibold text-slate-900">
                                    <li>Lead Collector Split: Up to 2% max of project budget.</li>
                                    <li>Lead Verifier Split: Up to 5% max of project budget.</li>
                                    <li>Lead Closer Split: Up to 10% max of project budget.</li>
                                    <li>First payment commissions are capped at 50% of the split total, released once 2nd payment is confirmed. Unpaid amounts never accrue commissions.</li>
                                </ul>

                                <p><strong>4. Refund & Guarantee Clawback:</strong> Commissions paid are clawed back if a client cancels within 30 days or is issued a refund under the Agency guarantee.</p>

                                <p><strong>5. Non-Solicitation, Non-Circumvention & Ownership:</strong> All client data, leads, and recordings inside the CRM are sole property of the Company. Contractor is strictly prohibited from bypassing Net Bots  (SMC-PRIVATE) LIMITED to deal directly with any lead or client. Doing so will result in a heavy financial fine and immediate legal prosecution.</p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button className="font-bold text-xs uppercase h-10 px-5" onClick={() => { setStep(2); startCamera(); }}>
                                    I Agree, Proceed to Selfie Capture
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 flex flex-col items-center">
                            <div className="text-center">
                                <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Live Camera Selfie Acknowledgment</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase mt-1">Please look directly at the webcam and capture a selfie to bind this agreement</p>
                            </div>

                            <div className="relative w-[300px] h-[300px] rounded-lg overflow-hidden border bg-slate-950 shadow-inner flex items-center justify-center">
                                {!selfieDataUrl ? (
                                    hasCamera ? (
                                        <video ref={videoRef} autoPlay playsInline muted className="w-[300px] h-[300px] object-cover scale-x-[-1]"></video>
                                    ) : (
                                        <div className="p-4 text-center text-xs font-bold text-slate-400 uppercase">
                                            Webcam permission denied or unavailable.<br/>Click Capture to proceed with log fallback.
                                        </div>
                                    )
                                ) : (
                                    <img src={selfieDataUrl} className="w-[300px] h-[300px] object-cover" alt="Captured Selfie" />
                                )}
                                <canvas ref={canvasRef} width="300" height="300" className="hidden"></canvas>
                            </div>

                            <div className="flex gap-3 justify-center w-full pt-4 border-t">
                                {!selfieDataUrl ? (
                                    <Button className="font-bold text-xs uppercase h-10 gap-2 px-6" onClick={captureSelfie}>
                                        <Camera size={16} /> Capture Selfie
                                    </Button>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button variant="outline" className="font-bold text-xs uppercase h-10 gap-2 px-5" onClick={handleRetry} disabled={signing}>
                                            <RefreshCw size={14} /> Retake
                                        </Button>
                                        <Button className="font-bold text-xs uppercase h-10 gap-2 px-6 bg-emerald-600 hover:bg-emerald-700" onClick={handleSignAndAccept} disabled={signing}>
                                            {signing ? 'Signing ICA...' : 'Sign and Accept Agreement'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 flex flex-col items-center py-6 text-center">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2">
                                <CheckCircle2 size={40} />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 text-lg uppercase tracking-wide">Agreement Signed Successfully</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase mt-1">Your onboarding process is complete, and your CRM access has been unlocked.</p>
                            </div>

                            <div className="flex gap-3 pt-6 border-t w-full justify-center">
                                <Button className="font-bold text-xs uppercase h-10 gap-2" onClick={() => window.location.reload()}>
                                    Enter Dashboard / CRM
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AgreementModal;
