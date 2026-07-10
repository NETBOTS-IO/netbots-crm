import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
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
            <Route index element={<Dashboard />} />
            <Route path="sales-dashboard" element={<SalesDashboard />} />
            <Route path="leads" element={<LeadsPipeline />} />
            <Route path="leads/new" element={<LeadForm />} />
            <Route path="leads/details/:id" element={<LeadDetails />} />
            <Route path="leads/edit/:id" element={<LeadForm />} />
            <Route path="clients" element={<Clients />} />
            <Route path="performance" element={<Performance />} />
            <Route path="team" element={<TeamManagement />} />
            <Route path="permissions" element={<PermissionsManagement />} />
            <Route path="commissions" element={<CommissionsLedger />} />
            <Route path="payouts" element={<Payouts />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="import/leads" element={<ImportWizard />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="help" element={<HelpPage />} />
          </Route>
        </Routes>
      </Router>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
