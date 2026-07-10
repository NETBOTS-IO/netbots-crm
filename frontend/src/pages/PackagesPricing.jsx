import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
    Search, Check, X, Tag, DollarSign, Globe, Info, 
    Layers, Smartphone, Zap, ShieldCheck, ShoppingCart, Settings, ArrowRight, Sparkles 
} from "lucide-react";

export default function PackagesPricing() {
    const [market, setMarket] = useState('US'); // 'US' or 'PK'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedService, setSelectedService] = useState('all');

    // Detailed Pricing Data extracted from TRAINING_GUIDE.md
    const pricingData = {
        US: {
            currency: '$',
            services: [
                {
                    id: 'gbp_seo',
                    name: 'Google Business Profile SEO (GBP SEO)',
                    description: 'Optimizing your Google Maps listing to rank at the top when people search nearby.',
                    packages: [
                        {
                            tier: 'Starter',
                            price: 299,
                            setup: 199,
                            billing: 'monthly',
                            duration: 'Month-to-month',
                            inclusions: [
                                'Basic GBP Profile Optimization',
                                'Primary category & description configuration',
                                '2 Google Posts per week',
                                '5 optimized photos per month',
                                'Review monitoring',
                                '10 citations directories listing',
                                'Basic PDF Monthly Report'
                            ],
                            exclusions: [
                                'Google Ads / PPC management',
                                'Website design or redesign',
                                'Social media management',
                                'Physical signage or marketing materials',
                                'Advanced category optimization',
                                'NAP consistency audit',
                                'Local Schema markup',
                                'Competitor Analysis',
                                'Dedicated Account Manager',
                                'AEO (AI Search Optimization)'
                            ]
                        },
                        {
                            tier: 'Growth',
                            price: 599,
                            setup: 299,
                            billing: 'monthly',
                            duration: '3 months minimum',
                            inclusions: [
                                'Full GBP Profile Optimization',
                                'Primary + Secondary categories optimization',
                                '4 Google Posts per week',
                                '10 optimized photos per month',
                                'Review responses to all reviews',
                                '25 citations directories listing',
                                'Quarterly NAP consistency audit',
                                'Detailed PDF Monthly Report'
                            ],
                            exclusions: [
                                'Google Ads / PPC management',
                                'Website design or redesign',
                                'Social media management',
                                'Physical signage or marketing materials',
                                'Local Schema markup',
                                'Competitor Analysis',
                                'Dedicated Account Manager',
                                'AEO (AI Search Optimization)'
                            ]
                        },
                        {
                            tier: 'Pro',
                            price: 999,
                            setup: 399,
                            billing: 'monthly',
                            duration: '6 months minimum',
                            inclusions: [
                                'Advanced GBP Profile Optimization',
                                'Full category & description optimization',
                                '7 Google Posts per week (daily)',
                                '20 optimized photos per month',
                                'Review generation strategy & response',
                                '50+ citations directories listing',
                                'Monthly NAP consistency audit',
                                'Local Schema Markup',
                                'Basic Competitor Analysis',
                                'Detailed PDF Report + Live dashboard'
                            ],
                            exclusions: [
                                'Google Ads / PPC management',
                                'Website design or redesign',
                                'Social media management',
                                'Physical signage or marketing materials',
                                'Dedicated Account Manager',
                                'AEO (AI Search Optimization)'
                            ]
                        },
                        {
                            tier: 'Enterprise',
                            price: 1499,
                            setup: 499,
                            billing: 'monthly',
                            duration: '12 months minimum',
                            inclusions: [
                                'Premium + Multi-Location GBP Optimization',
                                'Full category optimization & competitive analysis',
                                '7+ Google Posts per week + event posts',
                                'Unlimited optimized photos + video per month',
                                'Automated review requests & responses',
                                '100+ citations directories listing + cleanup',
                                'Ongoing NAP consistency + corrections',
                                'Advanced Local Schema Markup',
                                'Detailed Monthly Competitor Analysis',
                                'Detailed Report + Live dashboard + Strategy Call',
                                'Dedicated Account Manager',
                                'AEO (AI Search Optimization) for ChatGPT, Gemini, Copilot'
                            ],
                            exclusions: [
                                'Google Ads / PPC management',
                                'Website design or redesign',
                                'Social media management',
                                'Physical signage or marketing materials'
                            ]
                        }
                    ]
                },
                {
                    id: 'web_seo',
                    name: 'Website SEO',
                    description: 'Making your business website rank higher in Google search results for valuable keywords.',
                    packages: [
                        {
                            tier: 'Starter',
                            price: 499,
                            setup: 299,
                            billing: 'monthly',
                            duration: '3 months minimum',
                            inclusions: [
                                '10 keywords tracked',
                                '5 pages per month On-Page SEO',
                                '2 blog/content articles per month (500 words)',
                                'Initial Technical SEO Audit only',
                                '5 backlinks per month',
                                'Basic Monthly Reporting'
                            ],
                            exclusions: [
                                'Website development or redesign',
                                'Google Ads / PPC campaigns',
                                'Social media management',
                                'Graphic design for social media',
                                'Core Web Vitals optimization',
                                'Schema Markup',
                                'Competitor Analysis',
                                'Dedicated Strategist'
                            ]
                        },
                        {
                            tier: 'Growth',
                            price: 999,
                            setup: 499,
                            billing: 'monthly',
                            duration: '6 months minimum',
                            inclusions: [
                                '25 keywords tracked',
                                '10 pages per month On-Page SEO',
                                '4 blog/content articles per month (800 words)',
                                'Quarterly Technical SEO Audit',
                                '15 backlinks per month',
                                'Basic Core Web Vitals monitoring',
                                'Basic Schema Markup',
                                'Quarterly Competitor Analysis',
                                'Detailed Monthly Reporting'
                            ],
                            exclusions: [
                                'Website development or redesign',
                                'Google Ads / PPC campaigns',
                                'Social media management',
                                'Graphic design for social media',
                                'Dedicated Strategist'
                            ]
                        },
                        {
                            tier: 'Pro',
                            price: 1999,
                            setup: 699,
                            billing: 'monthly',
                            duration: '6 months minimum',
                            inclusions: [
                                '50 keywords tracked',
                                '20 pages per month On-Page SEO',
                                '8 blog/content articles per month (1200 words)',
                                'Monthly Technical SEO Audit',
                                '30 backlinks per month',
                                'Core Web Vitals Optimization',
                                'Advanced Schema Markup',
                                'Monthly Competitor Analysis',
                                'Detailed Report + Live dashboard'
                            ],
                            exclusions: [
                                'Website development or redesign',
                                'Google Ads / PPC campaigns',
                                'Social media management',
                                'Graphic design for social media',
                                'Dedicated Strategist'
                            ]
                        },
                        {
                            tier: 'Enterprise',
                            price: 3499,
                            setup: 999,
                            billing: 'monthly',
                            duration: '12 months minimum',
                            inclusions: [
                                '100+ keywords tracked',
                                'Unlimited pages On-Page SEO',
                                '12+ blog/content articles per month (1500+ words)',
                                'Ongoing Technical SEO Audit & fixes',
                                '50+ backlinks per month',
                                'Continuous Core Web Vitals optimization',
                                'Custom Schema Markup + Rich Snippets',
                                'Bi-weekly Competitor Analysis',
                                'Detailed Report + Live dashboard + Strategy Call',
                                'Dedicated Strategist'
                            ],
                            exclusions: [
                                'Website development or redesign',
                                'Google Ads / PPC campaigns',
                                'Social media management',
                                'Graphic design for social media'
                            ]
                        }
                    ]
                },
                {
                    id: 'smm',
                    name: 'Social Media Management (SMM)',
                    description: 'Managing Facebook, Instagram, LinkedIn, and TikTok channels to build an active audience.',
                    packages: [
                        {
                            tier: 'Starter',
                            price: 499,
                            setup: 199,
                            billing: 'monthly',
                            duration: 'Month-to-month',
                            inclusions: [
                                '2 platforms managed',
                                '12 posts per month',
                                'Basic templates graphic design',
                                'Basic Monthly Reporting'
                            ],
                            exclusions: [
                                'Ad spend budget (Client pays directly)',
                                'Professional photography or videography',
                                'Website changes or development',
                                'SEO (website or GBP)',
                                'Reels/Short Videos',
                                'Community Management',
                                'Paid Ad Management',
                                'Influencer Coordination',
                                'Content Calendar Approval'
                            ]
                        },
                        {
                            tier: 'Growth',
                            price: 999,
                            setup: 299,
                            billing: 'monthly',
                            duration: '3 months minimum',
                            inclusions: [
                                '3 platforms managed',
                                '20 posts per month',
                                'Custom designed graphics',
                                '2 Reels/Short Videos per month',
                                'Community Management (Mon-Fri)',
                                'Paid Ad Management (1 campaign, min $300 client spend)',
                                'Detailed Monthly Reporting',
                                'Content Calendar Approval'
                            ],
                            exclusions: [
                                'Ad spend budget (Client pays directly)',
                                'Professional photography or videography',
                                'Website changes or development',
                                'SEO (website or GBP)',
                                'Influencer Coordination'
                            ]
                        },
                        {
                            tier: 'Pro',
                            price: 1799,
                            setup: 499,
                            billing: 'monthly',
                            duration: '6 months minimum',
                            inclusions: [
                                '4 platforms managed',
                                '30 posts per month',
                                'Premium + branded graphics',
                                '4 Reels/Short Videos per month',
                                'Community Management (7 days/week)',
                                'Paid Ad Management (3 campaigns, min $500 client spend)',
                                'Detailed Report + Strategy Call',
                                'Content Calendar Approval'
                            ],
                            exclusions: [
                                'Ad spend budget (Client pays directly)',
                                'Professional photography or videography',
                                'Website changes or development',
                                'SEO (website or GBP)',
                                'Influencer Coordination'
                            ]
                        },
                        {
                            tier: 'Enterprise',
                            price: 2999,
                            setup: 699,
                            billing: 'monthly',
                            duration: '12 months minimum',
                            inclusions: [
                                '5+ platforms managed',
                                '45+ posts per month',
                                'Premium graphics + professional video editing',
                                '8+ Reels/Short Videos per month',
                                'Community Management (7 days/week + DMs)',
                                'Paid Ad Management (Unlimited campaigns, min $1000 client spend)',
                                'Influencer Coordination',
                                'Detailed Report + Weekly updates + Strategy Call',
                                'Content Calendar Approval'
                            ],
                            exclusions: [
                                'Ad spend budget (Client pays directly)',
                                'Professional photography or videography',
                                'Website changes or development',
                                'SEO (website or GBP)'
                            ]
                        }
                    ]
                },
                {
                    id: 'design',
                    name: 'Graphic Designing',
                    description: 'Creative design solutions for digital marketing, logos, and corporate branding.',
                    packages: [
                        {
                            tier: 'Starter',
                            price: 349,
                            setup: 0,
                            billing: 'monthly',
                            duration: 'Month-to-month',
                            inclusions: [
                                '5 design requests per month',
                                '2 rounds of revisions per design',
                                'Social Media Graphics templates',
                                '48-72 hours turnaround time'
                            ],
                            exclusions: [
                                'Logo Design (add $499 one-time)',
                                'Business Cards design',
                                'Brochure/Flyer Design',
                                'Brand Guidelines Document',
                                'Video Thumbnails design',
                                'Source Files delivery'
                            ]
                        },
                        {
                            tier: 'Growth',
                            price: 699,
                            setup: 0,
                            billing: 'monthly',
                            duration: 'Month-to-month',
                            inclusions: [
                                '12 design requests per month',
                                '3 rounds of revisions per design',
                                'Social Media Graphics',
                                '1 Logo Design included',
                                'Business Cards design',
                                'Brochure/Flyer Design',
                                'Video Thumbnails',
                                '24-48 hours turnaround time',
                                'Source Files included'
                            ],
                            exclusions: [
                                'Brand Guidelines Document'
                            ]
                        },
                        {
                            tier: 'Pro',
                            price: 1299,
                            setup: 0,
                            billing: 'monthly',
                            duration: 'Month-to-month',
                            inclusions: [
                                '25 design requests per month',
                                'Unlimited revisions',
                                'Social Media Graphics',
                                '2 Logo Designs included',
                                'Business Cards design',
                                'Brochure/Flyer Design',
                                'Brand Guidelines Document',
                                'Video Thumbnails',
                                'Same day priority turnaround time',
                                'Source Files included'
                            ],
                            exclusions: []
                        }
                    ],
                    oneOffs: [
                        { name: 'Logo Design (3 concepts + 3 revisions)', price: 499 },
                        { name: 'Complete Brand Identity Package (logo + colors + fonts + guidelines)', price: 1499 },
                        { name: 'Business Card Design', price: 149 },
                        { name: 'Brochure Design (bi-fold/tri-fold)', price: 299 },
                        { name: 'Social Media Kit (templates for 3 platforms)', price: 399 }
                    ]
                },
                {
                    id: 'web_dev',
                    name: 'Website Development',
                    description: 'Professional website design and backend setup to convert online visitors.',
                    packages: [
                        {
                            tier: 'Basic',
                            price: 1499,
                            billing: 'one-time',
                            inclusions: [
                                'Up to 5 Pages',
                                'Template-based design',
                                'Mobile Responsive layout',
                                'Contact Form integration',
                                'Basic SEO setup (meta tags only)',
                                'SSL Certificate installation',
                                'CMS (WordPress) setup',
                                '15 days post-launch support',
                                '2-3 weeks delivery time'
                            ],
                            exclusions: [
                                'Blog setup',
                                'E-Commerce store features',
                                'Payment gateway integration',
                                'Training Session',
                                'Ongoing website maintenance',
                                'Domain purchase (Client buys, $10-15/yr)',
                                'Hosting fees (Client pays, $10-30/mo)',
                                'Stock photos/videos',
                                'Copywriting services',
                                'Ongoing SEO'
                            ]
                        },
                        {
                            tier: 'Business',
                            price: 3499,
                            billing: 'one-time',
                            inclusions: [
                                'Up to 10 Pages',
                                'Semi-custom design',
                                'Mobile Responsive layout',
                                'Contact Form + Live Chat integration',
                                'SEO basic setup + Sitemap generation',
                                'Blog setup',
                                'SSL Certificate installation',
                                'CMS (WordPress) setup',
                                '1 hour training session',
                                '30 days post-launch support',
                                '3-4 weeks delivery time'
                            ],
                            exclusions: [
                                'E-Commerce store features',
                                'Payment gateway integration',
                                'Ongoing website maintenance',
                                'Domain purchase',
                                'Hosting fees',
                                'Stock photos/videos',
                                'Copywriting services',
                                'Ongoing SEO'
                            ]
                        },
                        {
                            tier: 'Premium',
                            price: 5999,
                            billing: 'one-time',
                            inclusions: [
                                'Up to 20 Pages',
                                'Fully custom design',
                                'Mobile Responsive layout',
                                'Contact Form + Chatbot integration',
                                'SEO basic setup + Schema configuration',
                                'Blog setup',
                                'SSL Certificate installation',
                                'CMS (WordPress) setup',
                                '2 hours training session',
                                '60 days post-launch support',
                                '4-6 weeks delivery time'
                            ],
                            exclusions: [
                                'E-Commerce store features',
                                'Payment gateway integration',
                                'Ongoing website maintenance',
                                'Domain purchase',
                                'Hosting fees',
                                'Stock photos/videos',
                                'Copywriting services',
                                'Ongoing SEO'
                            ]
                        },
                        {
                            tier: 'E-Commerce',
                            price: 7999,
                            billing: 'one-time',
                            inclusions: [
                                'Up to 30 Pages + fully loaded store',
                                'Fully custom design + UX strategy',
                                'Mobile Responsive layout',
                                'Contact Form + Advanced Forms + Live Chat',
                                'Full SEO initial configuration',
                                'Blog setup',
                                'E-Commerce system (up to 100 products)',
                                'Payment gateway integration (Stripe/PayPal)',
                                'SSL Certificate installation',
                                'CMS (WordPress + WooCommerce)',
                                '3 hours training session',
                                '90 days post-launch support',
                                '6-8 weeks delivery time'
                            ],
                            exclusions: [
                                'Ongoing website maintenance retainer',
                                'Domain purchase',
                                'Hosting fees',
                                'Stock photos/videos',
                                'Copywriting services',
                                'Ongoing SEO'
                            ]
                        }
                    ],
                    maintenance: [
                        { name: 'Basic Maintenance', price: 99, period: 'mo', details: 'Security updates, backups, uptime monitoring' },
                        { name: 'Standard Maintenance', price: 199, period: 'mo', details: 'Basic + content updates (up to 2 hrs/mo), plugin updates' },
                        { name: 'Premium Maintenance', price: 349, period: 'mo', details: 'Standard + speed optimization, priority support, 5 hrs/mo edits' }
                    ]
                },
                {
                    id: 'software_dev',
                    name: 'Custom Software Development',
                    description: 'Internal business tools, CRMs, booking systems, and SaaS platforms built to spec.',
                    packages: [
                        { tier: 'Simple Tool', price: '5,000 - 15,000', billing: 'one-time', duration: '4-8 weeks', inclusions: ['Basic CRM', 'Inventory tracker', 'Custom spreadsheet automation'] },
                        { tier: 'Medium App', price: '15,000 - 40,000', billing: 'one-time', duration: '8-16 weeks', inclusions: ['Booking systems', 'Customer portals', 'E-commerce with custom API sync'] },
                        { tier: 'Complex Platform', price: '40,000 - 100,000+', billing: 'one-time', duration: '16-32 weeks', inclusions: ['Marketplaces', 'Full custom SaaS applications', 'Multi-tenant enterprise apps'] }
                    ]
                }
            ]
        },
        PK: {
            currency: 'Rs. ',
            services: [
                {
                    id: 'gbp_seo',
                    name: 'Google Business Profile SEO (GBP SEO)',
                    description: 'Dukan ya business ki Google Maps listing ko behtar bana kar local customers barhana.',
                    packages: [
                        {
                            tier: 'Starter',
                            price: 15000,
                            setup: 5000,
                            billing: 'monthly',
                            duration: 'Month-to-month',
                            inclusions: [
                                'Basic GBP Profile Optimization',
                                'Primary category aur description update',
                                '2 Google Posts har hafta',
                                '5 optimized photos har mahine',
                                'Review monitoring only',
                                '5 directory local listings',
                                'Basic PDF Monthly Report'
                            ],
                            exclusions: [
                                'Google Ads / PPC management (Alag fee)',
                                'Website design ya development',
                                'Social media management',
                                'Physical shop cards ya marketing board',
                                'NAP consistency audit',
                                'Local Schema setup',
                                'Competitor Analysis report',
                                'Dedicated Account Manager'
                            ]
                        },
                        {
                            tier: 'Growth',
                            price: 30000,
                            setup: 10000,
                            billing: 'monthly',
                            duration: '3 months minimum',
                            inclusions: [
                                'Full GBP Profile Optimization',
                                'Primary + Secondary categories configuration',
                                '4 Google Posts har hafta',
                                '10 optimized photos har mahine',
                                'Sab reviews ka reply dena',
                                '15 directory local listings',
                                'Quarterly NAP consistency audit',
                                'Detailed PDF Monthly Report'
                            ],
                            exclusions: [
                                'Google Ads / PPC management',
                                'Website design ya development',
                                'Social media management',
                                'Local Schema setup',
                                'Detailed Competitor analysis',
                                'Dedicated Account Manager'
                            ]
                        },
                        {
                            tier: 'Pro',
                            price: 55000,
                            setup: 15000,
                            billing: 'monthly',
                            duration: '6 months minimum',
                            inclusions: [
                                'Advanced GBP Profile Optimization',
                                'Full description + keywords categories optimization',
                                '7 Google Posts har hafta (daily)',
                                '20 optimized photos har mahine',
                                'Review generation system + replies',
                                '30+ directory local listings',
                                'Monthly NAP consistency audit',
                                'Local Schema setup',
                                'Basic Competitor Analysis',
                                'Detailed report + live client dashboard'
                            ],
                            exclusions: [
                                'Google Ads / PPC management',
                                'Website design ya development',
                                'Social media management',
                                'Dedicated Account Manager'
                            ]
                        },
                        {
                            tier: 'Enterprise',
                            price: 90000,
                            setup: 25000,
                            billing: 'monthly',
                            duration: '12 months minimum',
                            inclusions: [
                                'Premium + Multi-location GBP optimization',
                                'Full categories + complete optimization',
                                '7+ Google Posts per week + special event posts',
                                'Unlimited photos + video setup',
                                'Automated review requests & responses',
                                '50+ directory listings + list cleanup',
                                'Ongoing NAP check + corrections',
                                'Advanced Local Schema markup',
                                'Detailed Monthly Competitor Analysis',
                                'Detailed Report + Live dashboard + Strategy Call',
                                'Dedicated Account Manager',
                                'AEO (AI Search optimization ChatGPT / Gemini k liye)'
                            ],
                            exclusions: [
                                'Google Ads / PPC management',
                                'Website design ya development',
                                'Social media management'
                            ]
                        }
                    ]
                },
                {
                    id: 'web_seo',
                    name: 'Website SEO',
                    description: 'Website ko Google search main top rank dilwana.',
                    packages: [
                        {
                            tier: 'Starter',
                            price: 25000,
                            setup: 10000,
                            billing: 'monthly',
                            duration: '3 months minimum',
                            inclusions: [
                                '10 keywords setup',
                                '5 pages per month On-Page SEO',
                                '2 content articles per month (500 words)',
                                'Initial Technical SEO Audit only',
                                '5 backlinks per month',
                                'Basic Monthly Report'
                            ],
                            exclusions: [
                                'Website development ya redesign',
                                'Google Ads / PPC ads management',
                                'Social media design/management',
                                'Core Web Vitals speed optimization',
                                'Schema Markup setup',
                                'Dedicated Strategist'
                            ]
                        },
                        {
                            tier: 'Growth',
                            price: 50000,
                            setup: 20000,
                            billing: 'monthly',
                            duration: '6 months minimum',
                            inclusions: [
                                '25 keywords setup',
                                '10 pages per month On-Page SEO',
                                '4 content articles per month (800 words)',
                                'Quarterly Technical SEO Audit',
                                '15 backlinks per month',
                                'Basic Core Web Vitals monitoring',
                                'Basic Schema Markup',
                                'Quarterly Competitor Analysis',
                                'Detailed Monthly Report'
                            ],
                            exclusions: [
                                'Website development ya redesign',
                                'Google Ads / PPC',
                                'Social media',
                                'Dedicated Strategist'
                            ]
                        },
                        {
                            tier: 'Pro',
                            price: 100000,
                            setup: 35000,
                            billing: 'monthly',
                            duration: '6 months minimum',
                            inclusions: [
                                '50 keywords setup',
                                '20 pages per month On-Page SEO',
                                '8 content articles per month (1200 words)',
                                'Monthly Technical SEO Audit',
                                '30 backlinks per month',
                                'Core Web Vitals Optimization',
                                'Advanced Schema Markup',
                                'Monthly Competitor Analysis',
                                'Detailed report + Client dashboard access'
                            ],
                            exclusions: [
                                'Website development',
                                'Google Ads / PPC campaigns',
                                'Social media',
                                'Dedicated Strategist'
                            ]
                        },
                        {
                            tier: 'Enterprise',
                            price: 175000,
                            setup: 5000,
                            billing: 'monthly',
                            duration: '12 months minimum',
                            inclusions: [
                                '100+ keywords setup',
                                'Unlimited pages On-Page SEO',
                                '12+ content articles per month (1500+ words)',
                                'Ongoing Technical SEO Audit & corrections',
                                '50+ backlinks per month',
                                'Continuous Core Web Vitals optimization',
                                'Custom Schema Markup + Rich Snippets',
                                'Bi-weekly Competitor Analysis',
                                'Detailed report + Dashboard + monthly strategy call',
                                'Dedicated Strategist support'
                            ],
                            exclusions: [
                                'Website development',
                                'Google Ads / PPC campaigns',
                                'Social media management'
                            ]
                        }
                    ]
                },
                {
                    id: 'smm',
                    name: 'Social Media Management (SMM)',
                    description: 'Facebook, Instagram, aur social media accounts management.',
                    packages: [
                        {
                            tier: 'Starter',
                            price: 20000,
                            setup: 5000,
                            billing: 'monthly',
                            duration: 'Month-to-month',
                            inclusions: [
                                '2 platforms managed',
                                '12 posts per month',
                                'Basic templates graphic design',
                                'Basic Monthly Report'
                            ],
                            exclusions: [
                                'Ad spend budget (Client pays)',
                                'Professional photography/videography',
                                'Website updates',
                                'SEO optimization',
                                'Reels/Short Videos creation',
                                'Community Management',
                                'Paid Ad Campaign setups',
                                'Influencer contact'
                            ]
                        },
                        {
                            tier: 'Growth',
                            price: 45000,
                            setup: 10000,
                            billing: 'monthly',
                            duration: '3 months minimum',
                            inclusions: [
                                '3 platforms managed',
                                '20 posts per month',
                                'Custom designed graphics',
                                '2 Reels/Short Videos per month',
                                'Community Management (Mon-Fri)',
                                'Paid Ad Management (1 campaign, min Rs. 15,000 spend)',
                                'Detailed Monthly Report',
                                'Content Calendar Approval'
                            ],
                            exclusions: [
                                'Ad spend budget',
                                'Professional photography/videography',
                                'Website modifications',
                                'SEO',
                                'Influencer campaign management'
                            ]
                        },
                        {
                            tier: 'Pro',
                            price: 85000,
                            setup: 20000,
                            billing: 'monthly',
                            duration: '6 months minimum',
                            inclusions: [
                                '4 platforms managed',
                                '30 posts per month',
                                'Premium customized graphics',
                                '4 Reels/Short Videos per month',
                                'Community Management (7 days/week)',
                                'Paid Ad Management (3 campaigns, min Rs. 30,000 spend)',
                                'Detailed Report + monthly strategy call',
                                'Content Calendar Approval'
                            ],
                            exclusions: [
                                'Ad spend budget',
                                'Professional photography/videography',
                                'Website design edits',
                                'SEO'
                            ]
                        },
                        {
                            tier: 'Enterprise',
                            price: 150000,
                            setup: 35000,
                            billing: 'monthly',
                            duration: '12 months minimum',
                            inclusions: [
                                '5+ platforms managed',
                                '45+ posts per month',
                                'Premium graphics + professional video edits',
                                '8+ Reels/Short Videos per month',
                                'Community Management (7 days/week + DMs)',
                                'Paid Ad Management (Unlimited campaigns, min Rs. 60,000 spend)',
                                'Influencer coordination setup',
                                'Detailed Report + Weekly updates + Strategy Call',
                                'Content Calendar Approval'
                            ],
                            exclusions: [
                                'Ad spend budget',
                                'Professional photography/videography',
                                'Website design edits',
                                'SEO'
                            ]
                        }
                    ]
                },
                {
                    id: 'design',
                    name: 'Graphic Designing',
                    description: 'Logos, banners, brochures, social posts aur branding designs.',
                    packages: [
                        {
                            tier: 'Starter',
                            price: 12000,
                            setup: 0,
                            billing: 'monthly',
                            duration: 'Month-to-month',
                            inclusions: [
                                '5 design requests per month',
                                '2 rounds of revisions per design',
                                'Social Media Graphics basic template',
                                '48-72 hours turnaround time'
                            ],
                            exclusions: [
                                'Logo Design (add Rs. 15,000 one-time)',
                                'Business Cards design',
                                'Brochure/Flyer Design',
                                'Brand Guidelines Document',
                                'Video Thumbnails',
                                'Source Files delivery'
                            ]
                        },
                        {
                            tier: 'Growth',
                            price: 25000,
                            setup: 0,
                            billing: 'monthly',
                            duration: 'Month-to-month',
                            inclusions: [
                                '12 design requests per month',
                                '3 rounds of revisions per design',
                                'Social Media Graphics',
                                '1 Logo Design included',
                                'Business Cards design',
                                'Brochure/Flyer Design',
                                'Video Thumbnails',
                                '24-48 hours turnaround time',
                                'Source Files included'
                            ],
                            exclusions: [
                                'Brand Guidelines Document'
                            ]
                        },
                        {
                            tier: 'Pro',
                            price: 50000,
                            setup: 0,
                            billing: 'monthly',
                            duration: 'Month-to-month',
                            inclusions: [
                                '25 design requests per month',
                                'Unlimited revisions',
                                'Social Media Graphics',
                                '2 Logo Designs included',
                                'Business Cards design',
                                'Brochure/Flyer Design',
                                'Brand Guidelines Document',
                                'Video Thumbnails',
                                'Same day priority turnaround',
                                'Source Files included'
                            ],
                            exclusions: []
                        }
                    ],
                    oneOffs: [
                        { name: 'Logo Design (3 concepts + 3 revisions)', price: 15000 },
                        { name: 'Complete Brand Identity Package', price: 50000 },
                        { name: 'Business Card Design', price: 5000 },
                        { name: 'Brochure Design (bi-fold/tri-fold)', price: 10000 },
                        { name: 'Social Media Kit (templates for 3 platforms)', price: 15000 }
                    ]
                },
                {
                    id: 'web_dev',
                    name: 'Website Development',
                    description: 'Professional clean code responsive business websites.',
                    packages: [
                        {
                            tier: 'Basic',
                            price: 50000,
                            billing: 'one-time',
                            inclusions: [
                                'Up to 5 Pages',
                                'Template-based design',
                                'Mobile Responsive layout',
                                'Contact Form integration',
                                'Basic SEO setup (meta tags only)',
                                'SSL Certificate installation',
                                'CMS (WordPress) setup',
                                '15 days post-launch support',
                                '2-3 weeks delivery time'
                            ],
                            exclusions: [
                                'Blog setup',
                                'E-Commerce store features',
                                'Payment gateway integration',
                                'Training Session',
                                'Ongoing website maintenance',
                                'Domain purchase (Client buys, Rs. 2000-4000/yr)',
                                'Hosting fees (Client pays, Rs. 3000-8000/yr)',
                                'Stock photos/videos',
                                'Copywriting services',
                                'Ongoing SEO'
                            ]
                        },
                        {
                            tier: 'Business',
                            price: 12000,
                            billing: 'one-time',
                            inclusions: [
                                'Up to 10 Pages',
                                'Semi-custom design',
                                'Mobile Responsive layout',
                                'Contact Form + Live Chat integration',
                                'SEO basic setup + Sitemap generation',
                                'Blog setup',
                                'SSL Certificate installation',
                                'CMS (WordPress) setup',
                                '1 hour training session',
                                '30 days post-launch support',
                                '3-4 weeks delivery time'
                            ],
                            exclusions: [
                                'E-Commerce store features',
                                'Payment gateway integration',
                                'Ongoing website maintenance',
                                'Domain purchase',
                                'Hosting fees',
                                'Stock photos/videos',
                                'Copywriting services',
                                'Ongoing SEO'
                            ]
                        },
                        {
                            tier: 'Premium',
                            price: 250000,
                            billing: 'one-time',
                            inclusions: [
                                'Up to 20 Pages',
                                'Fully custom design',
                                'Mobile Responsive layout',
                                'Contact Form + Chatbot integration',
                                'SEO basic setup + Schema configuration',
                                'Blog setup',
                                'SSL Certificate installation',
                                'CMS (WordPress) setup',
                                '2 hours training session',
                                '60 days post-launch support',
                                '4-6 weeks delivery time'
                            ],
                            exclusions: [
                                'E-Commerce store features',
                                'Payment gateway integration',
                                'Ongoing website maintenance',
                                'Domain purchase',
                                'Hosting fees',
                                'Stock photos/videos',
                                'Copywriting services',
                                'Ongoing SEO'
                            ]
                        },
                        {
                            tier: 'E-Commerce',
                            price: 350000,
                            billing: 'one-time',
                            inclusions: [
                                'Up to 30 Pages + store setup',
                                'Fully custom design + UX strategy',
                                'Mobile Responsive layout',
                                'Contact Form + Advanced Forms + Live Chat',
                                'Full SEO initial configuration',
                                'Blog setup',
                                'E-Commerce system (up to 100 products)',
                                'Payment gateway integration (JazzCash/Easypaisa/Stripe)',
                                'SSL Certificate installation',
                                'CMS (WordPress + WooCommerce)',
                                '3 hours training session',
                                '90 days post-launch support',
                                '6-8 weeks delivery time'
                            ],
                            exclusions: [
                                'Ongoing website maintenance retainer',
                                'Domain purchase',
                                'Hosting fees',
                                'Stock photos/videos',
                                'Copywriting services',
                                'Ongoing SEO'
                            ]
                        }
                    ],
                    maintenance: [
                        { name: 'Basic Maintenance', price: 5000, period: 'mo', details: 'Security updates, backups, uptime monitoring' },
                        { name: 'Standard Maintenance', price: 10000, period: 'mo', details: 'Basic + content updates (up to 2 hrs/mo), plugin updates' },
                        { name: 'Premium Maintenance', price: 20000, period: 'mo', details: 'Standard + speed optimization, priority support, 5 hrs/mo edits' }
                    ]
                },
                {
                    id: 'software_dev',
                    name: 'Custom Software Development',
                    description: 'Custom tools, CRM solutions, portal development, SaaS products.',
                    packages: [
                        { tier: 'Simple Tool', price: '200,000 - 600,000', billing: 'one-time', duration: '4-8 weeks', inclusions: ['Basic CRM', 'Inventory tracker', 'Custom dashboard automation'] },
                        { tier: 'Medium App', price: '600,000 - 2,000,000', billing: 'one-time', duration: '8-16 weeks', inclusions: ['Booking systems', 'Customer portals', 'E-commerce with custom API sync'] },
                        { tier: 'Complex Platform', price: '2,000,000 - 5,000,000+', billing: 'one-time', duration: '16-32 weeks', inclusions: ['Marketplaces', 'Full custom SaaS applications', 'Multi-tenant enterprise apps'] }
                    ]
                }
            ]
        }
    };

    // Filter services and packages based on search query and category
    const activeMarket = pricingData[market];
    const filteredServices = activeMarket.services.filter(service => {
        const matchesCategory = selectedService === 'all' || service.id === selectedService;
        
        if (!matchesCategory) return false;

        if (!searchQuery) return true;

        const query = searchQuery.toLowerCase();
        
        // Search matches service name or description
        if (service.name.toLowerCase().includes(query) || service.description.toLowerCase().includes(query)) {
            return true;
        }

        // Search matches package tiers or inclusions/exclusions
        const hasMatchingPackage = service.packages.some(pkg => {
            return pkg.tier.toLowerCase().includes(query) || 
                   pkg.inclusions.some(inc => inc.toLowerCase().includes(query)) ||
                   pkg.exclusions.some(exc => exc.toLowerCase().includes(query));
        });

        return hasMatchingPackage;
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 blur-xl w-60 h-60 bg-blue-500 rounded-full"></div>
                <div className="relative z-10 space-y-1">
                    <div className="flex items-center gap-2">
                        <Sparkles className="text-yellow-400 animate-pulse" size={20} />
                        <h1 className="text-2xl font-black tracking-tight">Packages & Pricing Plans</h1>
                    </div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                        SOP pricing standard for USA & Pakistan local markets (Updated 2026)
                    </p>
                </div>
                
                {/* Market Switcher */}
                <div className="flex bg-slate-800 p-1.5 rounded-xl border border-slate-700 relative z-10">
                    <Button 
                        variant={market === 'US' ? 'default' : 'ghost'} 
                        className={`rounded-lg px-4 py-2 text-xs font-black transition-all ${
                            market === 'US' ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' : 'text-slate-400 hover:text-white'
                        }`}
                        onClick={() => setMarket('US')}
                    >
                        🇺🇸 USA Market (USD)
                    </Button>
                    <Button 
                        variant={market === 'PK' ? 'default' : 'ghost'} 
                        className={`rounded-lg px-4 py-2 text-xs font-black transition-all ${
                            market === 'PK' ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md' : 'text-slate-400 hover:text-white'
                        }`}
                        onClick={() => setMarket('PK')}
                    >
                        🇵🇰 Pakistan Market (PKR)
                    </Button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col md:flex-row items-center gap-4">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Search services, packages, features..." 
                        className="pl-9 h-9 border-slate-200 focus-visible:ring-blue-600 text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
                    <Button 
                        variant={selectedService === 'all' ? 'default' : 'outline'}
                        className={`h-8 text-xs font-bold ${
                            selectedService === 'all' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                        onClick={() => setSelectedService('all')}
                    >
                        All Services
                    </Button>
                    {activeMarket.services.map(service => (
                        <Button 
                            key={service.id}
                            variant={selectedService === service.id ? 'default' : 'outline'}
                            className={`h-8 text-xs font-bold ${
                                selectedService === service.id ? 'bg-slate-900 text-white hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                            onClick={() => setSelectedService(service.id)}
                        >
                            {service.name.split(' (')[0]}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Service & Package Displays */}
            {filteredServices.length === 0 ? (
                <div className="text-center py-16 bg-white border rounded-2xl shadow-sm">
                    <Layers className="mx-auto text-slate-300 mb-3" size={40} />
                    <p className="text-sm font-bold text-slate-700">No pricing plans found matching your search</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting the service filters or clearing the search query.</p>
                </div>
            ) : (
                filteredServices.map(service => (
                    <div key={service.id} className="space-y-4 border-b pb-8 last:border-b-0">
                        <div className="space-y-1">
                            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                                {service.name}
                            </h2>
                            <p className="text-xs text-slate-500 max-w-3xl font-medium">{service.description}</p>
                        </div>

                        {/* Packages Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {service.packages.map((pkg, idx) => (
                                <Card key={idx} className={`relative flex flex-col justify-between border transition-all hover:shadow-lg ${
                                    pkg.tier === 'Pro' || pkg.tier === 'Premium' || pkg.tier === 'E-Commerce'
                                        ? 'border-blue-200 ring-2 ring-blue-500/10' 
                                        : 'border-slate-200'
                                }`}>
                                    <div>
                                        <CardHeader className="pb-4 bg-slate-50/50 border-b border-slate-100 rounded-t-xl">
                                            <div className="flex justify-between items-center">
                                                <Badge className={`text-[10px] font-black tracking-wider uppercase ${
                                                    pkg.tier === 'Starter' || pkg.tier === 'Basic'
                                                        ? 'bg-slate-200 text-slate-800 hover:bg-slate-200'
                                                        : pkg.tier === 'Growth' || pkg.tier === 'Business'
                                                        ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100'
                                                        : pkg.tier === 'Pro' || pkg.tier === 'Premium'
                                                        ? 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                                                        : 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                                                }`}>
                                                    {pkg.tier}
                                                </Badge>
                                                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                                    <Zap size={10} /> {pkg.duration || 'Contracted'}
                                                </span>
                                            </div>
                                            <div className="mt-3 flex items-baseline gap-1">
                                                <span className="text-3xl font-black text-slate-900">
                                                    {activeMarket.currency}
                                                    {typeof pkg.price === 'number' ? pkg.price.toLocaleString() : pkg.price}
                                                </span>
                                                <span className="text-xs text-slate-500 font-semibold uppercase">
                                                    / {pkg.billing === 'one-time' ? 'once' : 'mo'}
                                                </span>
                                            </div>
                                            {pkg.setup > 0 && (
                                                <p className="text-[11px] font-black text-indigo-600 mt-1">
                                                    + {activeMarket.currency}{pkg.setup.toLocaleString()} setup fee
                                                </p>
                                            )}
                                        </CardHeader>
                                        
                                        <CardContent className="p-4 space-y-4">
                                            {/* Inclusions */}
                                            <div className="space-y-2">
                                                <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Inclusions</h4>
                                                <ul className="space-y-1.5">
                                                    {pkg.inclusions.map((item, i) => (
                                                        <li key={i} className="flex gap-2 items-start text-xs text-slate-600">
                                                            <Check className="text-emerald-600 mt-0.5 shrink-0" size={14} />
                                                            <span>{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Exclusions */}
                                            {pkg.exclusions && pkg.exclusions.length > 0 && (
                                                <div className="space-y-2 border-t pt-3">
                                                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Exclusions</h4>
                                                    <ul className="space-y-1.5 opacity-80">
                                                        {pkg.exclusions.map((item, i) => (
                                                            <li key={i} className="flex gap-2 items-start text-xs text-slate-400">
                                                                <X className="text-rose-500 mt-0.5 shrink-0" size={14} />
                                                                <span className="line-through">{item}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </CardContent>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* One-off projects & Extras if available */}
                        {service.oneOffs && (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-3">
                                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3">One-Time Custom Design Services</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {service.oneOffs.map((item, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded-lg border flex justify-between items-center text-xs">
                                            <span className="font-bold text-slate-700">{item.name}</span>
                                            <span className="font-black text-blue-600">{activeMarket.currency}{item.price.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {service.maintenance && (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-3">
                                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3">Ongoing Website Maintenance Retainers</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {service.maintenance.map((item, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-lg border space-y-1">
                                            <div className="flex justify-between items-center">
                                                <span className="font-black text-slate-800 text-xs">{item.name}</span>
                                                <span className="font-black text-blue-600 text-xs">{activeMarket.currency}{item.price.toLocaleString()}/{item.period}</span>
                                            </div>
                                            <p className="text-[11px] text-slate-500">{item.details}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}
