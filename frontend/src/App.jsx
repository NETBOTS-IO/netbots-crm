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
import { Toaster } from "@/components/ui/toaster"


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

            {/* Packages & Pricing — admin only */}
            <Route path="packages" element={
              <RoleGate adminOnly action="Manage Packages & Pricing">
                <PackagesPricing />
              </RoleGate>
            } />

            {/* Help — open to all */}
            <Route path="help" element={<HelpPage />} />

          </Route>
        </Routes>
      </Router>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
