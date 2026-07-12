import { useAuth } from '@/context/AuthContext';

/**
 * Central permissions hook for NetBots CRM.
 *
 * Usage:
 *   const { can, isAdmin, hasDesignation, isRole, canAccessPage } = usePermissions();
 *   can('can_edit_leads')       → true/false
 *   isAdmin                     → true/false
 *   hasDesignation('LeadVerifier') → true/false
 *   isRole('sales')             → true/false
 *   canAccessPage('/clients')   → true/false
 */

// Map of route paths to the required permission key
const PAGE_PERMISSION_MAP = {
    '/': 'view_dashboard',
    '/leads': 'can_view_leads',
    '/leads/new': 'can_add_leads',
    '/clients': 'manage_clients',
    '/performance': 'view_dashboard',
    '/team': 'manage_team',
    '/permissions': 'manage_permissions',
    '/commissions': 'view_commissions',
    '/payouts': 'manage_payouts',
    '/leaderboard': 'view_leaderboard',
    '/audit-logs': 'manage_permissions',
    '/import/leads': 'can_add_leads',
    '/packages': 'admin_only',
    '/help': null, // everyone
};

// Map of permissions to human-friendly labels
export const PERMISSION_LABELS = {
    view_dashboard: 'View Dashboard',
    can_view_leads: 'View Leads Pipeline',
    can_add_leads: 'Add New Leads',
    can_edit_leads: 'Edit Leads',
    can_delete_leads: 'Delete Leads',
    manage_clients: 'Manage Clients',
    manage_team: 'Manage Team',
    manage_permissions: 'Manage Permissions',
    view_commissions: 'View Commissions',
    manage_payouts: 'Manage Payouts',
    view_leaderboard: 'View Leaderboard',
    can_bulk_manage_leads: 'Bulk Manage Leads',
    admin_only: 'Administrator Access',
};

export function usePermissions() {
    const { user } = useAuth();

    const isAdmin = user?.role === 'admin';

    /**
     * Check if the user has a given permission key.
     * Admins always return true.
     */
    const can = (permissionKey) => {
        if (!user) return false;
        if (isAdmin) return true;
        if (permissionKey === 'admin_only') return false;
        return !!user.permissions?.[permissionKey];
    };

    /**
     * Check if the user has a given designation tag (e.g., 'LeadVerifier').
     */
    const hasDesignation = (designation) => {
        if (!user) return false;
        return Array.isArray(user.designation) && user.designation.includes(designation);
    };

    /**
     * Check if the user has a given role (e.g., 'sales', 'admin').
     */
    const isRole = (role) => {
        if (!user) return false;
        return user.role === role;
    };

    /**
     * Check if the user can access a given page path.
     */
    const canAccessPage = (path) => {
        if (!user) return false;
        if (isAdmin) return true;

        // Handle dynamic segments like /leads/edit/:id
        const normalizedPath = normalizePath(path);
        const requiredPermission = PAGE_PERMISSION_MAP[normalizedPath];

        if (requiredPermission === undefined) return true; // unknown paths: allow
        if (requiredPermission === null) return true;      // null means open to all
        if (requiredPermission === 'admin_only') return false;

        return !!user.permissions?.[requiredPermission];
    };

    /**
     * Returns the human-readable label for a permission key.
     */
    const permissionLabel = (permissionKey) => {
        return PERMISSION_LABELS[permissionKey] || permissionKey;
    };

    return {
        isAdmin,
        can,
        hasDesignation,
        isRole,
        canAccessPage,
        permissionLabel,
        user,
        role: user?.role,
        permissions: user?.permissions || {},
        designation: user?.designation || [],
    };
}

/**
 * Normalize dynamic route paths to match PAGE_PERMISSION_MAP keys.
 * e.g. '/leads/edit/abc123' → '/leads/edit/:id'
 */
function normalizePath(path) {
    // /leads/edit/... → /leads/edit/:id (any edit)
    if (/^\/leads\/edit\//.test(path)) return '/leads/edit/:id';
    if (/^\/leads\/details\//.test(path)) return '/leads/details/:id';
    if (/^\/leads\/new/.test(path)) return '/leads/new';
    return path;
}
