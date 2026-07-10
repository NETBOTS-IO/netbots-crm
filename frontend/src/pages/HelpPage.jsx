import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, HelpCircle, Layers, Users, Zap, Search, Key, ShieldCheck } from "lucide-react";

export default function HelpPage() {
    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-lg border shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <HelpCircle className="text-blue-600" /> System Help & Documentation
                    </h1>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
                        Comprehensive guide to CRM modules, roles, and terminology
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-6">
                    <Card className="shadow-sm">
                        <CardHeader className="bg-slate-50 border-b pb-4">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                                <Layers size={16} className="text-indigo-600" />
                                Global Pages & Modules
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4 text-sm text-slate-600">
                            <div>
                                <h4 className="font-bold text-slate-800">Dashboard</h4>
                                <p className="text-xs">High-level overview of total leads, clients, and active performance metrics.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">Leads Pipeline</h4>
                                <p className="text-xs">Manage prospective clients. Use filters to track who needs to be contacted or followed up with.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">Clients</h4>
                                <p className="text-xs">Directory of all closed deals and active customers. Manage active subscriptions here.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">Performance Stats</h4>
                                <p className="text-xs">View individual KPIs like leads submitted, conversions, and points earned.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">Permissions</h4>
                                <p className="text-xs">Admin-only page to apply granular access controls or preset templates (like Supervisor or Collector) to users.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">Commissions & Payouts</h4>
                                <p className="text-xs">Track generated commissions across the team and log batch payouts.</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="bg-slate-50 border-b pb-4">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                                <ShieldCheck size={16} className="text-emerald-600" />
                                Roles & Designations
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4 text-sm text-slate-600">
                            <div>
                                <h4 className="font-bold text-slate-800">Base Roles</h4>
                                <ul className="text-xs space-y-1 list-disc pl-4 text-slate-600 mb-4">
                                    <li><strong className="text-slate-800">admin:</strong> Full unrestricted access to all modules, financial data, and team management.</li>
                                    <li><strong className="text-slate-800">sales:</strong> Sales closers, restricted from financial configuration but can close deals.</li>
                                    <li><strong className="text-slate-800">lead_gen:</strong> Staff focused exclusively on sourcing and validating data.</li>
                                </ul>
                            </div>
                            <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider mb-2 border-b pb-1">Designations (Granular Overlays)</h4>
                            <div>
                                <h4 className="font-bold text-slate-800">Supervisor</h4>
                                <p className="text-xs">Can manage team members, view all leads, and track team leaderboards.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">Lead Collector</h4>
                                <p className="text-xs">Responsible for sourcing raw data. Can add new leads but cannot modify existing verified data.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">Lead Verifier</h4>
                                <p className="text-xs">Cannot add raw leads, but has the authority to edit, verify, and validate existing leads.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">Lead Closer</h4>
                                <p className="text-xs">Sales personnel responsible for negotiating deals and converting SQLs into paying Clients.</p>
                            </div>
                            <div className="bg-blue-50 p-2 rounded border border-blue-100 mt-2">
                                <p className="text-[10px] font-bold text-blue-800 uppercase">Note: A user can hold multiple designations simultaneously to combine these permissions.</p>
                            </div>

                            <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider mt-4 mb-2 border-b pb-1">Ranks / Tags</h4>
                            <div className="flex flex-wrap gap-2 mb-4">
                                <Badge variant="secondary">Rookie</Badge>
                                <Badge variant="secondary">Hunter</Badge>
                                <Badge variant="secondary">Closer</Badge>
                                <Badge className="bg-purple-100 text-purple-800">Elite Closer</Badge>
                                <Badge className="bg-yellow-100 text-yellow-800">Gold Closer</Badge>
                                <Badge className="bg-red-100 text-red-800">Champion</Badge>
                            </div>
                            
                            <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider mb-2 border-b pb-1">Archetypes</h4>
                            <ul className="text-xs space-y-1 list-disc pl-4 text-slate-600 mb-2">
                                <li><strong>Lead Researcher</strong> (Data collection)</li>
                                <li><strong>Facebook Manager</strong> (SMM)</li>
                                <li><strong>Reddit Specialist</strong> (Outreach)</li>
                                <li><strong>Sales Closer</strong> (Closing deals)</li>
                                <li><strong>CA Recruiter</strong> (Recruiting)</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2 space-y-6">
                    <Card className="shadow-sm">
                        <CardHeader className="bg-slate-50 border-b pb-4">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                                <Search size={16} className="text-amber-600" />
                                Lead Pipeline Dropdowns & Fields
                            </CardTitle>
                            <CardDescription className="text-xs">Definitions of every option in the Lead creation and management forms.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 space-y-6">
                            
                            {/* Stages */}
                            <div>
                                <h3 className="text-sm font-black text-slate-800 mb-2 border-b pb-1">Stages</h3>
                                <ul className="text-xs space-y-2 text-slate-600 list-disc pl-4">
                                    <li><strong className="text-slate-800">Identify:</strong> Lead has been sourced but no active engagement strategy has started.</li>
                                    <li><strong className="text-slate-800">Qualify:</strong> Currently being evaluated for fit (verifying business, digital presence).</li>
                                    <li><strong className="text-slate-800">Nurture:</strong> Active conversation or marketing is ongoing. Warm, but no commitment.</li>
                                    <li><strong className="text-slate-800">Close:</strong> Verbally or formally agreed to a deal. <span className="text-blue-600 font-bold">(Auto-updates temperature to SQL)</span></li>
                                    <li><strong className="text-slate-800">Onboard:</strong> Actively being integrated (contract signed). <span className="text-blue-600 font-bold">(Auto-updates temperature to Closed)</span></li>
                                    <li><strong className="text-slate-800">Retain:</strong> An active client receiving recurring services.</li>
                                    <li><strong className="text-slate-800">Refer:</strong> A satisfied client actively referring new business.</li>
                                </ul>
                            </div>

                            {/* Temperature */}
                            <div>
                                <h3 className="text-sm font-black text-slate-800 mb-2 border-b pb-1">Temperature</h3>
                                <ul className="text-xs space-y-2 text-slate-600 list-disc pl-4">
                                    <li><strong className="text-slate-800">Cold:</strong> Unaware of your services. Sourced directly from scrapers.</li>
                                    <li><strong className="text-slate-800">Warm:</strong> Has shown interest (replied to email, engaged on social media).</li>
                                    <li><strong className="text-slate-800">SQL:</strong> (Sales Qualified Lead) High intent. Actively negotiating a deal.</li>
                                    <li><strong className="text-slate-800">Closed:</strong> Deal won, they are now a client.</li>
                                </ul>
                            </div>

                            {/* Priority */}
                            <div>
                                <h3 className="text-sm font-black text-slate-800 mb-2 border-b pb-1">Priority</h3>
                                <ul className="text-xs space-y-2 text-slate-600 list-disc pl-4">
                                    <li><strong className="text-slate-800">Low:</strong> Background tasks, cold leads with no immediate action required.</li>
                                    <li><strong className="text-slate-800">Medium:</strong> Standard priority for day-to-day follow-ups.</li>
                                    <li><strong className="text-slate-800">High:</strong> Warm leads needing immediate attention or deals close to crossing the finish line.</li>
                                    <li><strong className="text-slate-800">Urgent:</strong> Critical issues, immediate deal closures, or at-risk clients.</li>
                                </ul>
                            </div>

                            {/* Sources */}
                            <div>
                                <h3 className="text-sm font-black text-slate-800 mb-2 border-b pb-1">Lead Sources</h3>
                                <ul className="text-xs space-y-2 text-slate-600 list-disc pl-4 mb-4">
                                    <li><strong className="text-slate-800">Direct:</strong> Inbound leads or direct outreach.</li>
                                    <li><strong className="text-slate-800">Referral:</strong> Referred by an existing client or partner.</li>
                                    <li><strong className="text-slate-800">LinkedIn:</strong> Sourced via LinkedIn outreach.</li>
                                    <li><strong className="text-slate-800">Cold Email:</strong> Sourced via cold email campaigns.</li>
                                </ul>
                            </div>

                            {/* Target Services */}
                            <div>
                                <h3 className="text-sm font-black text-slate-800 mb-2 border-b pb-1">Target Services</h3>
                                <p className="text-xs text-slate-500 mb-2">The primary service the lead is interested in.</p>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline">Google Business SEO</Badge>
                                    <Badge variant="outline">Website SEO</Badge>
                                    <Badge variant="outline">Social Media Mgmt</Badge>
                                    <Badge variant="outline">Designing</Badge>
                                    <Badge variant="outline">Software Dev</Badge>
                                    <Badge variant="outline">Website Dev</Badge>
                                    <Badge variant="outline">SaaS Product</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="bg-slate-50 border-b pb-4">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                                <Zap size={16} className="text-green-600" />
                                Client Conversion & Financial Fields
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-6">
                            
                            {/* Deal Types */}
                            <div>
                                <h3 className="text-sm font-black text-slate-800 mb-2 border-b pb-1">Deal Types & Plan Types</h3>
                                <p className="text-xs text-slate-600 mb-3">
                                    When converting a lead to a client, selecting the correct deal type is crucial as it dictates the commission structure.
                                </p>
                                <ul className="text-xs space-y-2 text-slate-600 list-disc pl-4">
                                    <li><strong className="text-slate-800">Monthly Subscription:</strong> A standard recurring monthly payment model (e.g., SEO retainer).</li>
                                    <li><strong className="text-slate-800">Weekly / Monthly / Annual:</strong> Other recurring periodic payment models.</li>
                                    <li><strong className="text-slate-800">One Time:</strong> A single upfront payment (e.g., a one-off website design).</li>
                                    <li><strong className="text-slate-800">Lifetime Deal:</strong> A single payment for lifetime access to software/service.</li>
                                    <li><strong className="text-slate-800">Enterprise:</strong> Large-scale custom pricing, which can be recurring or milestone-based.</li>
                                </ul>
                            </div>

                            {/* Checkboxes & Toggles */}
                            <div>
                                <h3 className="text-sm font-black text-slate-800 mb-2 border-b pb-1">Checkboxes & Toggles</h3>
                                <ul className="text-xs space-y-2 text-slate-600 list-disc pl-4">
                                    <li><strong className="text-slate-800">Auto Renew:</strong> Used in the Client profile. Indicates if a client's subscription automatically bills at the end of the term.</li>
                                    <li><strong className="text-slate-800">Is Churn Risk:</strong> Manually toggled if a client expresses dissatisfaction, prompting the retention team to intervene.</li>
                                </ul>
                            </div>
                            
                            <div className="bg-amber-50 p-3 rounded border border-amber-100">
                                <p className="text-xs text-amber-800">
                                    <strong className="font-black">💡 Conversion Note:</strong> Converting a lead to a client locks in their "Target Service" and generates commission records automatically based on the selected "Deal Type" and the "Engaged Team" percentages you input.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
