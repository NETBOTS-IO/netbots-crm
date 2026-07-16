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
    ChevronLeft,
    Trophy,
    Wallet,
    FileText,
    BarChart3,
    HelpCircle,
    Tag,
    UserX2,
    KeyRound,
    Clock
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import packageJson from '../../package.json';

import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import TimeTrackerDisplay from './TimeTrackerDisplay';
import AgreementModal from './AgreementModal';

const SidebarLink = ({ to, icon: Icon, label, active, onClick, collapsed }) => (
    <Link
        to={to}
        onClick={onClick}
        title={collapsed ? label : undefined}
        className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm font-semibold transition-all rounded-md border-l-2 border-transparent",
            active
                ? "bg-indigo-50 text-indigo-700 font-bold border-l-indigo-600"
                : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/40",
            collapsed && "md:justify-center md:px-2"
        )}
    >
        <Icon size={18} className={active ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-500"} />
        <span className={cn("truncate", collapsed && "md:hidden")}>{label}</span>
    </Link>
);


const tabGroups = [
    {
        pattern: /^\/(leads|followups|clients)/,
        tabs: [
            { to: '/leads', label: 'Leads Pipeline', permission: 'can_view_leads' },
            { to: '/followups', label: 'Follow-ups', permission: 'can_view_leads' },
            { to: '/clients', label: 'Clients', permission: 'manage_clients' },
        ]
    },
    {
        pattern: /^\/email/,
        tabs: [
            { to: '/email', label: 'Dashboard', permission: 'view_dashboard' },
            { to: '/email/campaigns', label: 'Campaigns', permission: 'view_dashboard' },
            { to: '/email/templates', label: 'Templates', permission: 'view_dashboard' },
            { to: '/email/sequences', label: 'Funnels', permission: 'view_dashboard' },
            { to: '/email/audiences', label: 'Audiences', permission: 'view_dashboard' },
            { to: '/email/lists', label: 'Mailing Lists', permission: 'view_dashboard' },
            { to: '/email/accounts', label: 'SMTP Accounts', permission: 'view_dashboard' },
            { to: '/email/analytics', label: 'Analytics', permission: 'view_dashboard' },
            { to: '/email/unsubscribes', label: 'Unsubscribes', permission: 'view_dashboard' },
        ]
    },
    {
        pattern: /^\/(team|permissions|commissions|payouts|audit-logs)/,
        tabs: [
            { to: '/team', label: 'Team Directory', permission: 'manage_team' },
            { to: '/permissions', label: 'Permissions Matrix', permission: 'manage_permissions' },
            { to: '/commissions', label: 'Commissions Ledger', permission: 'view_commissions' },
            { to: '/payouts', label: 'Payouts Summary', permission: 'manage_payouts' },
            { to: '/audit-logs', label: 'Audit Logs', permission: 'manage_permissions' },
        ]
    },
    {
        pattern: /^\/(packages|help)/,
        tabs: [
            { to: '/packages', label: 'Packages & Pricing', permission: 'view_dashboard' },
            { to: '/help', label: 'Help & Docs', permission: 'view_dashboard' },
        ]
    }
];

const Layout = () => {
    const { user, logout, isImpersonating, impersonatingAdminName, endImpersonation } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');
    
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

    // Save collapse state
    const toggleCollapse = () => {
        setIsCollapsed(prev => {
            const next = !prev;
            localStorage.setItem('sidebar_collapsed', String(next));
            return next;
        });
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

    // Define navigation groups
    const menuGroups = [
        {
            label: 'WORKSPACE',
            items: [
                { to: '/', icon: LayoutDashboard, label: 'Dashboard', permission: 'view_dashboard' },
                { to: '/performance', icon: BarChart3, label: 'Performance Stats', permission: 'view_dashboard' },
                { to: '/leaderboard', icon: Trophy, label: 'Leaderboard', permission: 'view_leaderboard' },
            ]
        },
        {
            label: 'SALES PIPELINE',
            items: [
                { to: '/leads', icon: ClipboardList, label: 'Sales Pipeline', permission: 'can_view_leads' },
            ]
        },
        {
            label: 'EMAIL MARKETING',
            adminOnly: true,
            items: [
                { to: '/email', icon: ClipboardList, label: 'Email Marketing', permission: 'view_dashboard' },
            ]
        },
        {
            label: 'ADMINISTRATION',
            items: [
                { to: '/team', icon: Users, label: 'Administration', permission: 'manage_team' },
            ]
        },
        {
            label: 'RESOURCES',
            items: [
                { to: '/packages', icon: Tag, label: 'Resources', permission: 'view_dashboard' },
            ]
        }
    ];

    return (
        <div className="flex min-h-screen bg-slate-50 overflow-x-hidden">
            {user && !user.agreementSigned && <AgreementModal />}
            {/* Mobile Backdrop Overlay */}
            {isMobileMenuOpen && (
                <div 
                     className="fixed inset-0 z-40 bg-black/40 md:hidden transition-opacity" 
                     onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar (Responsive Drawer / Collapsible Desktop) */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 text-slate-950 flex flex-col transition-all duration-300 ease-in-out md:fixed md:h-screen md:top-0",
                isCollapsed ? "md:w-16 w-60" : "w-60",
                isMobileMenuOpen ? "w-60 translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <div className="p-4 flex items-center justify-between border-b border-slate-100 min-h-[64px]">
                    {!isCollapsed ? (
                        <div className="flex items-center gap-2">
                            <img src="/logo.png" className="h-7 object-contain" alt="Net Bots Logo" />
                        </div>
                    ) : (
                        <div className="mx-auto font-black text-slate-900 text-sm tracking-widest md:block hidden">
                            NB
                        </div>
                    )}
                    {isCollapsed && (
                        <div className="md:hidden flex items-center gap-2">
                            <img src="/logo.png" className="h-7 object-contain" alt="Net Bots Logo" />
                        </div>
                    )}
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="md:hidden text-slate-500 hover:text-slate-950" 
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <ChevronLeft size={20} />
                    </Button>
                </div>

                <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
                    {menuGroups.map((group) => {
                        const filteredItems = group.items.filter(item => user?.role === 'admin' || user?.permissions?.[item.permission]);
                        if (filteredItems.length === 0) return null;
                        // Hide admin-only groups from non-admins
                        if (group.adminOnly && user?.role !== 'admin') return null;
                        
                        return (
                            <div key={group.label} className="space-y-1">
                                {!isCollapsed && (
                                    <h4 className="px-3 text-[10px] font-semibold text-slate-400 tracking-wider uppercase mb-1 mt-2">
                                        {group.label}
                                    </h4>
                                )}
                                {filteredItems.map((item) => (
                                    <SidebarLink
                                        key={item.to}
                                        {...item}
                                        collapsed={isCollapsed}
                                        active={location.pathname === item.to || location.pathname.startsWith(item.to + '/')}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    />
                                ))}
                            </div>
                        );
                    })}
                </nav>

                {/* Profile Options block */}
                <div className="p-3 border-t border-slate-200 bg-white">
                    <div className={cn("space-y-2", isCollapsed && "md:hidden")}>
                        <div className="flex items-center gap-2.5 p-2 rounded-md bg-slate-50 border border-slate-100">
                            <div className="w-8 h-8 rounded-full bg-slate-950 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                {user?.name?.[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold truncate text-slate-900">{user?.name}</p>
                                <p className="text-[10px] text-slate-500 truncate uppercase font-medium mt-0.5">{user?.role}</p>
                            </div>
                        </div>
                        <div className="px-1.5 py-1">
                            <TimeTrackerDisplay />
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                            <Button
                                variant="outline"
                                size="xs"
                                className="h-8 text-[11px] font-medium border-slate-200 hover:bg-slate-50 gap-1.5 text-slate-700 w-full"
                                onClick={() => setIsChangePasswordOpen(true)}
                            >
                                <KeyRound size={12} />
                                Password
                            </Button>
                            <Button
                                variant="outline"
                                size="xs"
                                className="h-8 text-[11px] font-medium border-slate-200 hover:bg-slate-50 hover:text-red-650 hover:border-red-200 gap-1.5 text-slate-750 w-full"
                                onClick={logout}
                            >
                                <LogOut size={12} />
                                Logout
                            </Button>
                        </div>
                    </div>

                    {isCollapsed && (
                        <div className="hidden md:flex flex-col items-center gap-2">
                            <div 
                                className="w-8 h-8 rounded-full bg-slate-950 text-white flex items-center justify-center font-bold text-xs cursor-pointer hover:opacity-90"
                                title={`${user?.name} (${user?.role})`}
                            >
                                {user?.name?.[0]}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                                onClick={() => setIsChangePasswordOpen(true)}
                                title="Change Password"
                            >
                                <KeyRound size={16} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-500 hover:text-red-650 hover:bg-red-50"
                                onClick={logout}
                                title="Logout"
                            >
                                <LogOut size={16} />
                            </Button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className={cn(
                "flex-1 flex flex-col min-w-0 transition-all duration-300",
                isCollapsed ? "md:pl-16" : "md:pl-60"
            )}>
                {/* Impersonation Banner */}
                {isImpersonating && (
                    <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-2 bg-amber-400 text-amber-905 shadow-sm">
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
                {/* Mobile Header / Desktop Top Bar */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
                            <Menu />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="hidden md:flex text-slate-500 hover:text-slate-900 hover:bg-slate-100" 
                            onClick={toggleCollapse}
                            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                        >
                            <Menu size={16} />
                        </Button>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-200 hidden md:inline">|</span>
                            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                                {location.pathname === '/' ? 'Dashboard' : location.pathname.split('/')[1].replace('-', ' ')}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Right header actions can be loaded here if needed */}
                    </div>
                </header>

                <div className="p-4 md:p-6 flex-1 overflow-y-auto flex flex-col gap-4">
                    {/* Dynamic Module Tabs */}
                    {(() => {
                        const currentGroup = tabGroups.find(group => group.pattern.test(location.pathname));
                        const segments = location.pathname.split('/').filter(Boolean);
                        const showModuleTabs = currentGroup && segments.length <= 2;

                        if (!showModuleTabs) return null;

                        return (
                            <div className="flex border border-slate-200/80 bg-white p-1.5 gap-1 overflow-x-auto shrink-0 select-none shadow-sm rounded-lg">
                                {currentGroup.tabs
                                    .filter(tab => user?.role === 'admin' || user?.permissions?.[tab.permission])
                                    .map((tab) => {
                                        const isActive = location.pathname === tab.to || (tab.to !== '/email' && location.pathname.startsWith(tab.to));
                                        return (
                                            <Link
                                                key={tab.to}
                                                to={tab.to}
                                                className={cn(
                                                    "px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all whitespace-nowrap",
                                                    isActive 
                                                        ? "bg-indigo-600 text-white shadow-sm"
                                                        : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50"
                                                )}
                                            >
                                                {tab.label}
                                            </Link>
                                        );
                                    })}
                            </div>
                        );
                    })()}
                    <div className="flex-1">
                        <Outlet />
                    </div>
                </div>
                <footer className="py-4 text-center text-[10px] text-slate-400 bg-white border-t border-slate-200 font-medium uppercase tracking-wider flex items-center justify-center gap-2">
                    <span>Intellectual property of Net Bots (SMC-PRIVATE) LIMITED</span>
                    <span className="opacity-50">|</span>
                    <span className="font-bold">v{packageJson.version}</span>
                </footer>
            </main>

            <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
                <DialogContent className="sm:max-w-[400px] bg-white p-6 rounded-lg shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold flex items-center gap-2 text-slate-900">
                            <KeyRound className="text-slate-500" size={20} />
                            Change Password
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleChangePasswordSubmit} className="space-y-4 pt-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">New Password</label>
                            <Input
                                type="password"
                                required
                                placeholder="Enter at least 6 characters"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="border-slate-200"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirm Password</label>
                            <Input
                                type="password"
                                required
                                placeholder="Re-enter new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="border-slate-200"
                            />
                        </div>
                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" className="border-slate-200" onClick={() => setIsChangePasswordOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={submittingPassword} className="bg-slate-950 hover:bg-slate-900 text-white font-medium">
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
