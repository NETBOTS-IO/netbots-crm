import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import RoleGate from './components/RoleGate';
import LoginPage from './pages/Login';
import CEODashboard from './pages/CEODashboard';
import SalesDashboard from './pages/SalesDashboard';
import Dashboard from './pages/Dashboard';
import LeadsPipeline from './pages/LeadsPipeline';
import Clients from './pages/Clients';
import LeadForm from './pages/LeadForm';
import TeamManagement from './pages/TeamManagement';
import CommissionsLedger from './pages/CommissionsLedger';
import Payouts from './pages/Payouts';
import Leaderboard from './pages/Leaderboard';
import ImportWizard from './pages/ImportWizard';
import LeadDetails from './pages/LeadDetails';
import PermissionsManagement from './pages/PermissionsManagement';
import AuditLogs from './pages/AuditLogs';
import Performance from './pages/Performance';
import HelpPage from './pages/HelpPage';
import PackagesPricing from './pages/PackagesPricing';
import Followups from './pages/Followups';
import { Toaster } from "@/components/ui/toaster"

// MailFlow Page Imports
import EmailDashboard from './pages/email/EmailDashboard';
import EmailAccounts from './pages/email/EmailAccounts';
import EmailTemplates from './pages/email/EmailTemplates';
import TemplateEditor from './pages/email/TemplateEditor';
import EmailCampaigns from './pages/email/EmailCampaigns';
import CampaignBuilder from './pages/email/CampaignBuilder';
import CampaignReport from './pages/email/CampaignReport';
import EmailLists from './pages/email/EmailLists';
import AudienceBuilder from './pages/email/AudienceBuilder';
import EmailSequences from './pages/email/EmailSequences';
import SequenceBuilder from './pages/email/SequenceBuilder';
import EmailAnalytics from './pages/email/EmailAnalytics';
import Unsubscribes from './pages/email/Unsubscribes';



const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>

            {/* Dashboard — requires view_dashboard */}
            <Route index element={
              <RoleGate permission="view_dashboard" action="View Dashboard">
                <Dashboard />
              </RoleGate>
            } />

            {/* Sales Dashboard — admin only */}
            <Route path="sales-dashboard" element={
              <RoleGate adminOnly action="View Sales Dashboard">
                <SalesDashboard />
              </RoleGate>
            } />

            {/* Leads Pipeline — requires can_view_leads */}
            <Route path="leads" element={
              <RoleGate permission="can_view_leads" action="View Leads Pipeline">
                <LeadsPipeline />
              </RoleGate>
            } />

            {/* Follow-ups — requires can_view_leads */}
            <Route path="followups" element={
              <RoleGate permission="can_view_leads" action="View Follow-ups Dashboard">
                <Followups />
              </RoleGate>
            } />

            {/* Add Lead — requires can_add_leads */}
            <Route path="leads/new" element={
              <RoleGate permission="can_add_leads" action="Add New Lead">
                <LeadForm />
              </RoleGate>
            } />

            {/* Lead Details — requires can_view_leads */}
            <Route path="leads/details/:id" element={
              <RoleGate permission="can_view_leads" action="View Lead Details">
                <LeadDetails />
              </RoleGate>
            } />

            {/* Edit Lead — requires can_edit_leads (LeadForm itself also checks lock-claim bypass) */}
            <Route path="leads/edit/:id" element={
              <LeadForm />
            } />

            {/* Clients — requires manage_clients */}
            <Route path="clients" element={
              <RoleGate permission="manage_clients" action="Manage Clients">
                <Clients />
              </RoleGate>
            } />

            {/* Performance — requires view_dashboard */}
            <Route path="performance" element={
              <RoleGate permission="view_dashboard" action="View Performance Stats">
                <Performance />
              </RoleGate>
            } />

            {/* Team — requires manage_team */}
            <Route path="team" element={
              <RoleGate permission="manage_team" action="Manage Team">
                <TeamManagement />
              </RoleGate>
            } />

            {/* Permissions — requires manage_permissions */}
            <Route path="permissions" element={
              <RoleGate permission="manage_permissions" action="Manage Permissions">
                <PermissionsManagement />
              </RoleGate>
            } />

            {/* Commissions — requires view_commissions */}
            <Route path="commissions" element={
              <RoleGate permission="view_commissions" action="View Commissions">
                <CommissionsLedger />
              </RoleGate>
            } />

            {/* Payouts — requires manage_payouts */}
            <Route path="payouts" element={
              <RoleGate permission="manage_payouts" action="Manage Payouts">
                <Payouts />
              </RoleGate>
            } />

            {/* Leaderboard — requires view_leaderboard */}
            <Route path="leaderboard" element={
              <RoleGate permission="view_leaderboard" action="View Leaderboard">
                <Leaderboard />
              </RoleGate>
            } />

            {/* Import Leads — requires can_add_leads */}
            <Route path="import/leads" element={
              <RoleGate permission="can_add_leads" action="Import Leads">
                <ImportWizard />
              </RoleGate>
            } />

            {/* Audit Logs — admin only */}
            <Route path="audit-logs" element={
              <RoleGate adminOnly action="View Audit Logs">
                <AuditLogs />
              </RoleGate>
            } />

            {/* Packages & Pricing — open to all staff with view_dashboard */}
            <Route path="packages" element={
              <RoleGate permission="view_dashboard" action="View Packages & Pricing">
                <PackagesPricing />
              </RoleGate>
            } />

            {/* Help — open to all */}
            <Route path="help" element={<HelpPage />} />

            {/* MailFlow Routes — Admin Only */}
            <Route path="email" element={<RoleGate adminOnly action="View Email Dashboard"><EmailDashboard /></RoleGate>} />
            <Route path="email/accounts" element={<RoleGate adminOnly action="Manage SMTP Accounts"><EmailAccounts /></RoleGate>} />
            <Route path="email/templates" element={<RoleGate adminOnly action="Manage Templates"><EmailTemplates /></RoleGate>} />
            <Route path="email/templates/new" element={<RoleGate adminOnly action="Create Template"><TemplateEditor /></RoleGate>} />
            <Route path="email/templates/:id/edit" element={<RoleGate adminOnly action="Edit Template"><TemplateEditor /></RoleGate>} />
            <Route path="email/campaigns" element={<RoleGate adminOnly action="Manage Campaigns"><EmailCampaigns /></RoleGate>} />
            <Route path="email/campaigns/new" element={<RoleGate adminOnly action="Create Campaign"><CampaignBuilder /></RoleGate>} />
            <Route path="email/campaigns/edit/:id" element={<RoleGate adminOnly action="Edit Campaign"><CampaignBuilder /></RoleGate>} />
            <Route path="email/campaigns/:id/report" element={<RoleGate adminOnly action="Campaign Report"><CampaignReport /></RoleGate>} />
            <Route path="email/lists" element={<RoleGate adminOnly action="Mailing Lists"><EmailLists /></RoleGate>} />
            <Route path="email/audiences" element={<RoleGate adminOnly action="Manage Audiences"><AudienceBuilder /></RoleGate>} />
            <Route path="email/sequences" element={<RoleGate adminOnly action="Manage Sequences"><EmailSequences /></RoleGate>} />
            <Route path="email/sequences/new" element={<RoleGate adminOnly action="Create Sequence"><SequenceBuilder /></RoleGate>} />
            <Route path="email/sequences/:id/edit" element={<RoleGate adminOnly action="Edit Sequence"><SequenceBuilder /></RoleGate>} />
            <Route path="email/analytics" element={<RoleGate adminOnly action="Email Analytics"><EmailAnalytics /></RoleGate>} />
            <Route path="email/unsubscribes" element={<RoleGate adminOnly action="Unsubscribes"><Unsubscribes /></RoleGate>} />

          </Route>
        </Routes>
      </Router>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
