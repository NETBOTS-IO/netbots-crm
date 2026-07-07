import { useAuth } from '@/context/AuthContext';
import CEODashboard from './CEODashboard';
import SalesDashboard from './SalesDashboard';
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

    // Default for researchers/partners could be a simple summary or personal stats
    // For now, let's show SalesDashboard or a simplified version
    return <SalesDashboard />;
};

export default Dashboard;
