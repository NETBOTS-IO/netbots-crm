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
    FileText,
    BarChart3,
    HelpCircle,
    Tag,
    UserX2,
    KeyRound
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import TimeTrackerDisplay from './TimeTrackerDisplay';
import AgreementModal from './AgreementModal';

const SidebarLink = ({ to, icon: Icon, label, active, onClick }) => (
    <Link
        to={to}
        onClick={onClick}
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
    const { user, logout, isImpersonating, impersonatingAdminName, endImpersonation } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // Change password state
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [submittingPassword, setSubmittingPassword] = useState(false);

    const handleChangePasswordSubmit = async (e) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            toast({ variant: "destructive", title: "Error", description: "Password must be at least 6 characters." });
            return;
        }
        if (newPassword !== confirmPassword) {
            toast({ variant: "destructive", title: "Error", description: "Passwords do not match." });
            return;
        }
        setSubmittingPassword(true);
        try {
            const res = await api.put('/auth/me', { password: newPassword });
            if (res.success) {
                toast({ title: "Success", description: "Password updated successfully." });
                setIsChangePasswordOpen(false);
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: err.response?.data?.error || "Failed to update password." });
        } finally {
            setSubmittingPassword(false);
        }
    };

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
        { to: '/performance', icon: BarChart3, label: 'Performance Stats', permission: 'view_dashboard' },
        { to: '/team', icon: Users, label: 'Team', permission: 'manage_team' },
        { to: '/permissions', icon: UserSquare2, label: 'Permissions', permission: 'manage_permissions' },
        { to: '/commissions', icon: IndianRupee, label: 'Commissions', permission: 'view_commissions' },
        { to: '/payouts', icon: Wallet, label: 'Payouts', permission: 'manage_payouts' },
        { to: '/leaderboard', icon: Trophy, label: 'Leaderboard', permission: 'view_leaderboard' },
        { to: '/audit-logs', icon: FileText, label: 'Audit Logs', permission: 'manage_permissions' },
        { to: '/packages', icon: Tag, label: 'Packages & Pricing', permission: 'view_dashboard' },
        { to: '/help', icon: HelpCircle, label: 'Help & Docs', permission: 'view_dashboard' },

    ];

    const filteredMenu = menuItems.filter(item => user?.role === 'admin' || user?.permissions?.[item.permission]);

    return (
        <div className="flex min-h-screen bg-slate-50 overflow-x-hidden">
            {user && !user.agreementSigned && <AgreementModal />}
            {/* Mobile Backdrop Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity" 
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar (Responsive Drawer) */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:fixed md:h-screen md:top-0",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-4 flex items-center justify-between border-b border-slate-800 mb-2">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" className="h-7 object-contain brightness-0 invert" alt="Net Bots Logo" />
                    </div>
                    <Button variant="ghost" size="icon" className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
                        <Menu size={20} />
                    </Button>
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                    {filteredMenu.map((item) => (
                        <SidebarLink
                            key={item.to}
                            {...item}
                            active={location.pathname === item.to}
                            onClick={() => setIsMobileMenuOpen(false)}
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
                        className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800 gap-3 mt-1"
                        onClick={() => setIsChangePasswordOpen(true)}
                    >
                        <KeyRound size={20} />
                        <span>Change Password</span>
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800 gap-3 mt-1"
                        onClick={logout}
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 md:pl-64">
                {/* Impersonation Banner */}
                {isImpersonating && (
                    <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-2 bg-amber-400 text-amber-900 shadow-md">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <UserX2 size={16} className="animate-pulse" />
                            <span>
                                Admin Mode — Viewing as <strong>{user?.name}</strong>
                                <span className="ml-2 font-normal opacity-75">(impersonated by {impersonatingAdminName})</span>
                            </span>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            className="border-amber-700 text-amber-900 hover:bg-amber-500 font-bold text-xs gap-1.5"
                            onClick={endImpersonation}
                        >
                            <LogOut size={14} />
                            Exit Session
                        </Button>
                    </div>
                )}
                {/* Mobile Header */}
                <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-8">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
                            <Menu />
                        </Button>
                        <div className="flex items-center gap-2">
                            <img src="/logo.png" className="h-6 object-contain" alt="Net Bots Logo" />
                            <span className="text-slate-300">|</span>
                            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                                {location.pathname === '/' ? 'Dashboard' : location.pathname.split('/')[1].replace('-', ' ')}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Removed Add Lead button based on user request */}
                    </div>
                </header>

                <div className="p-4 md:p-8 flex-1 overflow-y-auto">
                    <Outlet />
                </div>
                <footer className="py-4 text-center text-xs text-slate-400 bg-white border-t font-semibold">
                    Intellectual property of Net Bots  (SMC-PRIVATE) LIMITED
                </footer>
            </main>

            <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
                <DialogContent className="sm:max-w-[400px] bg-white p-6 rounded-lg shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2">
                            <KeyRound className="text-blue-500" size={20} />
                            Change Password
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleChangePasswordSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">New Password</label>
                            <Input
                                type="password"
                                required
                                placeholder="Enter at least 6 characters"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Confirm Password</label>
                            <Input
                                type="password"
                                required
                                placeholder="Re-enter new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsChangePasswordOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={submittingPassword} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                                {submittingPassword ? 'Saving...' : 'Update Password'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Layout;
