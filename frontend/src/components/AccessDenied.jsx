import { ShieldOff, Phone, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { usePermissions, PERMISSION_LABELS } from '@/hooks/usePermissions';

/**
 * AccessDenied component — shown when a user lacks permission for a page or action.
 *
 * Props:
 *   @param {string}  permission     - The permission key that was required (e.g., 'manage_clients')
 *   @param {string}  action         - Human-readable description of the blocked action (e.g., 'Manage Clients')
 *   @param {boolean} inline         - If true, renders a compact inline card instead of full-page
 *   @param {boolean} showBackButton - If true (default), shows a "Go Back" button
 */
const AccessDenied = ({
    permission = null,
    action = null,
    inline = false,
    showBackButton = true,
}) => {
    const navigate = useNavigate();
    const { role, designation, isAdmin } = usePermissions();

    const friendlyAction = action || (permission ? (PERMISSION_LABELS[permission] || permission) : 'this page');
    const roleLabel = role ? role.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Unknown';
    const designationLabel = designation.length > 0 ? designation.join(', ') : null;

    if (inline) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mb-4">
                    <ShieldOff className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Access Restricted</h3>
                <p className="text-sm text-slate-500 max-w-xs mb-4">
                    You don't have permission to <span className="font-semibold text-slate-700">{friendlyAction}</span>.
                    {permission && (
                        <> Required: <code className="bg-slate-100 px-1 rounded text-xs">{permission}</code></>
                    )}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 mb-4">
                    <span>Your Role: <strong className="text-slate-600">{roleLabel}</strong></span>
                    {designationLabel && <><span>·</span><span>Designation: <strong className="text-slate-600">{designationLabel}</strong></span></>}
                </div>
                <p className="text-xs text-slate-400">
                    If you need access, please contact your <strong>Administrator</strong>.
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                {/* Icon */}
                <div className="relative mx-auto w-24 h-24 mb-6">
                    <div className="absolute inset-0 rounded-full bg-rose-100 animate-ping opacity-30" />
                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-rose-50 to-rose-100 border-2 border-rose-200 flex items-center justify-center shadow-sm">
                        <ShieldOff className="w-10 h-10 text-rose-500" />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
                <p className="text-slate-500 mb-6 leading-relaxed">
                    You do not have permission to{' '}
                    <span className="font-semibold text-slate-700">{friendlyAction}</span>.{' '}
                    This area is restricted based on your current role and permissions.
                </p>

                {/* Role Badge */}
                <div className="inline-flex flex-col items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-6 py-3 mb-6">
                    <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                            {roleLabel[0]}
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-slate-800">{roleLabel}</p>
                            {designationLabel && (
                                <p className="text-xs text-slate-500">{designationLabel}</p>
                            )}
                        </div>
                    </div>
                    {permission && (
                        <p className="text-xs text-slate-400 mt-1">
                            Required permission: <code className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">{permission}</code>
                        </p>
                    )}
                </div>

                {/* Contact Admin Info */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
                    <p className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                        <span>📋</span> Need Access?
                    </p>
                    <p className="text-xs text-amber-700 leading-relaxed">
                        Contact your <strong>Administrator</strong> to grant you the required permissions. 
                        Provide them with the following details:
                    </p>
                    <ul className="mt-2 text-xs text-amber-700 space-y-1 list-disc list-inside">
                        <li>Required permission: <strong>{permission || friendlyAction}</strong></li>
                        <li>Your current role: <strong>{roleLabel}</strong></li>
                    </ul>
                    <div className="flex gap-2 mt-3">
                        <a
                            href="mailto:admin@netbots.io"
                            className="flex items-center gap-1 text-xs text-amber-800 hover:text-amber-900 underline"
                        >
                            <Mail className="w-3 h-3" />
                            admin@netbots.io
                        </a>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center gap-3">
                    {showBackButton && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(-1)}
                            className="gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Go Back
                        </Button>
                    )}
                    <Button
                        size="sm"
                        onClick={() => navigate('/')}
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    >
                        Go to Dashboard
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AccessDenied;
