# NetBots CRM - System Reference & Field Guide

Welcome to the NetBots CRM. This document serves as a comprehensive guide to understanding the core fields, dropdowns, pipelines, and statuses used throughout the system.

## 1. Lead Pipeline Stages

Leads move through a unified pipeline. The stage represents the current state of engagement with a lead.

- **Identify**: The lead has been sourced or imported but no active engagement strategy has started.
- **Qualify**: The lead is currently being evaluated for fit (e.g., verifying their business, checking their digital presence).
- **Nurture**: Active conversation or marketing is ongoing. The lead is warm but hasn't committed to a deal yet.
- **Close**: The lead has verbally or formally agreed to a deal, but the onboarding is not yet complete. *(Note: moving a lead to Close automatically updates their temperature to SQL).*
- **Onboard**: The client is actively being integrated into the company’s services (contract signed, payment processed). *(Note: moving a lead to Onboard automatically updates their temperature to Closed).*
- **Retain**: An active, ongoing client receiving recurring services.
- **Refer**: A highly satisfied client who is actively referring new business to the agency.

## 2. Lead Temperature

Temperature indicates the buying intent and readiness of the prospect.

- **Cold**: Unaware or barely aware of your services. Sourced directly from scrapers or raw lists.
- **Warm**: Has shown some level of interest (e.g., replied to an email, engaged on social media, asked a question).
- **SQL (Sales Qualified Lead)**: High intent. They are actively negotiating a deal or reviewing a contract.
- **Closed**: The deal is won, and they are now a client.

## 3. Deal & Plan Types

When converting a lead to a client, you must specify the billing structure. 
**Note:** Selecting a deal type automatically impacts how commissions are generated for the sales team.

- **Monthly Subscription / Monthly Starter / Monthly Growth / Monthly Pro**: A recurring monthly payment model.
- **Weekly / Monthly / Annual**: Recurring periodic payment models.
- **One Time**: A single upfront payment (e.g., a one-off website design or a logo creation).
- **Lifetime Deal**: A single payment for lifetime access to a software or service.
- **Enterprise**: Large-scale custom pricing, which can be recurring or milestone-based.

## 4. Priority

Used by the sales team to filter and focus on the most important tasks today.

- **Low**: Background tasks, cold leads with no immediate action required.
- **Medium**: Standard priority for day-to-day follow-ups.
- **High**: Warm leads that need immediate attention or deals that are close to crossing the finish line.
- **Urgent**: Critical issues, immediate deal closures, or at-risk clients.

## 5. Target Services

The primary service the lead is interested in or that the company provides to the client.

- **Google Business SEO**: Optimizing GMB profiles for local search.
- **Website SEO**: On-page and off-page search engine optimization.
- **Social Media Management & Marketing**: Handling Facebook, Instagram, LinkedIn profiles and running ads.
- **Designing**: Graphic design, UI/UX, logos.
- **Software Development**: Custom coding, scripts, or internal tools.
- **Website Development**: Building full websites on WordPress, React, etc.
- **SaaS Product**: Selling a subscription to a proprietary software tool.

## 6. Team Roles & Designations

Access control in the CRM is governed by Roles and Designations.

- **Roles (Base Access)**:
  - `admin`: Full unrestricted access to all modules, financial data, and team management.
  - `sales`: Sales closers, restricted from financial configuration but can close deals.
  - `lead_gen`: Staff focused exclusively on sourcing and validating data.
  
- **Designations (Granular Overlays)**:
  A single user can hold multiple designations.
  - `Supervisor`: Can manage team members and view performance leaderboards.
  - `Lead Collector`: Can add new leads and view the dashboard.
  - `Lead Verifier`: Can edit and verify leads but cannot add new ones.
  - `Lead Closer`: Can close deals and manage clients, but cannot blindly add raw leads.

*System administrators can modify granular permissions per user from the Permissions page.*
