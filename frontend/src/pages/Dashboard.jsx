import { useAuth } from '@/context/AuthContext';
import CEODashboard from './CEODashboard';
import SalesDashboard from './SalesDashboard';
import StaffDashboard from './StaffDashboard';
import { Navigate } from 'react-router-dom';

const Dashboard = () => {
    const { user } = useAuth();

    if (!user) return <Navigate to="/login" />;

    if (user.role === 'admin') {
        return <CEODashboard />;
    }

    if (user.role === 'sales') {
        return <SalesDashboard />;
    }

    // lead_gen, technical_staff, etc. get the personalized StaffDashboard
    return <StaffDashboard />;
};

export default Dashboard;
