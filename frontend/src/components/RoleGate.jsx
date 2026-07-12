import { usePermissions } from '@/hooks/usePermissions';
import AccessDenied from '@/components/AccessDenied';

/**
 * RoleGate — Conditionally renders children based on user permission.
 *
 * Usage:
 *   <RoleGate permission="manage_clients">
 *     <ClientsPage />
 *   </RoleGate>
 *
 *   <RoleGate adminOnly>
 *     <AdminPage />
 *   </RoleGate>
 *
 * Props:
 *   @param {string}    permission   - Permission key to check (e.g., 'can_edit_leads')
 *   @param {boolean}   adminOnly    - If true, only admins can see children
 *   @param {string}    action       - Human-readable blocked action description
 *   @param {ReactNode} fallback     - Custom fallback component (default: <AccessDenied />)
 *   @param {ReactNode} children     - Content to render if access granted
 */
const RoleGate = ({
    permission = null,
    adminOnly = false,
    action = null,
    fallback = null,
    children,
}) => {
    const { can, isAdmin } = usePermissions();

    // Evaluate access
    let hasAccess = false;
    if (isAdmin) {
        hasAccess = true;
    } else if (adminOnly) {
        hasAccess = false;
    } else if (permission) {
        hasAccess = can(permission);
    } else {
        // No restriction specified — allow everyone
        hasAccess = true;
    }

    if (!hasAccess) {
        if (fallback !== null) return fallback;
        return (
            <AccessDenied
                permission={adminOnly ? 'admin_only' : permission}
                action={action}
            />
        );
    }

    return children;
};

export default RoleGate;
