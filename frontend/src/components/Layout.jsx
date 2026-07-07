import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
    LayoutDashboard,
    Users,
    UserSquare2,
    ClipboardList,
    IndianRupee,
    LogOut,
    Menu,
    ChevronRight,
    Trophy,
    Wallet,
    FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import TimeTrackerDisplay from './TimeTrackerDisplay';

const SidebarLink = ({ to, icon: Icon, label, active }) => (
    <Link
        to={to}
        className={cn(
            "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-lg",
            active
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
        )}
    >
        <Icon size={20} />
        <span>{label}</span>
    </Link>
);

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Track global clicks
    useEffect(() => {
        if (!user) return;
        const handleGlobalClick = (e) => {
            const targetEl = e.target;
            const textContent = targetEl.textContent?.trim().substring(0, 100);
            const tag = targetEl.tagName;
            
            const isInteractive = targetEl.closest('button') || 
                                  targetEl.closest('a') || 
                                  targetEl.closest('[role="button"]') ||
                                  targetEl.closest('input') ||
                                  targetEl.closest('select') ||
                                  targetEl.closest('tr');
                                  
            if (isInteractive) {
                const targetText = textContent || targetEl.getAttribute('aria-label') || targetEl.placeholder || targetEl.name || targetEl.id || tag;
                api.post('/audit-logs', {
                    action: 'CLICK',
                    target: `${tag}: ${targetText}`,
                    details: {
                        path: location.pathname
                    }
                }).catch(err => {});
            }
        };

        document.addEventListener('click', handleGlobalClick);
        return () => document.removeEventListener('click', handleGlobalClick);
    }, [user, location.pathname]);

    // Track page views
    useEffect(() => {
        if (!user) return;
        api.post('/audit-logs', {
            action: 'PAGE_VIEW',
            target: location.pathname,
            details: {}
        }).catch(err => {});
    }, [user, location.pathname]);

    const menuItems = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard', permission: 'view_dashboard' },
        { to: '/leads', icon: ClipboardList, label: 'Leads Pipeline', permission: 'can_view_leads' },
        { to: '/clients', icon: UserSquare2, label: 'Clients', permission: 'manage_clients' },
        { to: '/team', icon: Users, label: 'Team', permission: 'manage_team' },
        { to: '/permissions', icon: UserSquare2, label: 'Permissions', permission: 'manage_permissions' },
        { to: '/commissions', icon: IndianRupee, label: 'Commissions', permission: 'view_commissions' },
        { to: '/payouts', icon: Wallet, label: 'Payouts', permission: 'manage_payouts' },
        { to: '/leaderboard', icon: Trophy, label: 'Leaderboard', permission: 'view_leaderboard' },
        { to: '/audit-logs', icon: FileText, label: 'Audit Logs', permission: 'manage_permissions' }, // reuse manage_permissions or check role === admin
    ];

    const filteredMenu = menuItems.filter(item => user?.role === 'admin' || user?.permissions?.[item.permission]);

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white hidden md:flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold tracking-tight">NetBots <span className="text-blue-500">CRM</span></h1>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {filteredMenu.map((item) => (
                        <SidebarLink
                            key={item.to}
                            {...item}
                            active={location.pathname === item.to}
                        />
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs">
                            {user?.name?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user?.name}</p>
                            <p className="text-xs text-slate-500 truncate uppercase">{user?.role}</p>
                            <TimeTrackerDisplay />
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800 gap-3 mt-2"
                        onClick={logout}
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 flex flex-col">
                {/* Mobile Header */}
                <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                            <Menu />
                        </Button>
                        <h2 className="text-lg font-semibold capitalize flex items-center gap-2">
                            <span className="font-extrabold text-blue-600">NetBots CRM</span>
                            <span className="text-slate-300">|</span>
                            <span className="text-slate-500 font-normal">
                                {location.pathname === '/' ? 'Dashboard' : location.pathname.split('/')[1].replace('-', ' ')}
                            </span>
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Removed Add Lead button based on user request */}
                    </div>
                </header>

                <div className="p-4 md:p-8 flex-1 overflow-y-auto">
                    <Outlet />
                </div>
                <footer className="py-4 text-center text-xs text-slate-400 bg-white border-t">
                    Developer and property of NetBots (SMC-Private) Limited
                </footer>
            </main>
        </div>
    );
};

export default Layout;
