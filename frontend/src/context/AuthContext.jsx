import { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check if currently impersonating (admin_token_backup is in storage)
    const [isImpersonating, setIsImpersonating] = useState(
        () => !!localStorage.getItem('admin_token_backup')
    );
    const [impersonatingAdminName, setImpersonatingAdminName] = useState(
        () => localStorage.getItem('admin_impersonator_name') || ''
    );

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await api.get('/auth/me');
                    if (res.success) {
                        setUser(res.data);
                    }
                } catch (err) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        if (res.success) {
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setUser(res.data.user);
        }
        return res;
    };

    const logout = () => {
        // If impersonating, end impersonation first instead of logging out
        if (localStorage.getItem('admin_token_backup')) {
            endImpersonation();
            return;
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = '/login';
    };

    const refreshUser = async () => {
        try {
            const res = await api.get('/auth/me');
            if (res.success) {
                setUser(res.data);
                localStorage.setItem('user', JSON.stringify(res.data));
            }
        } catch (err) {
            console.error(err);
        }
    };

    /**
     * Switch the current session to impersonate a team member.
     * Saves the current admin token as backup so we can restore it later.
     */
    const impersonateUser = async (memberId) => {
        try {
            const res = await api.post(`/team/${memberId}/impersonate`);
            if (res.success) {
                // Backup the current admin token
                const currentToken = localStorage.getItem('token');
                const currentUser = localStorage.getItem('user');
                localStorage.setItem('admin_token_backup', currentToken);
                localStorage.setItem('admin_user_backup', currentUser);
                localStorage.setItem('admin_impersonator_name', res.data.impersonatedBy.name);

                // Switch to the target user's token
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));

                setUser(res.data.user);
                setIsImpersonating(true);
                setImpersonatingAdminName(res.data.impersonatedBy.name);
                
                // Navigate to dashboard as the new user
                window.location.href = '/';
            }
            return res;
        } catch (err) {
            throw err;
        }
    };

    /**
     * Restore the original admin session.
     */
    const endImpersonation = () => {
        const adminToken = localStorage.getItem('admin_token_backup');
        const adminUser = localStorage.getItem('admin_user_backup');

        if (!adminToken) return;

        localStorage.setItem('token', adminToken);
        localStorage.setItem('user', adminUser || '');
        localStorage.removeItem('admin_token_backup');
        localStorage.removeItem('admin_user_backup');
        localStorage.removeItem('admin_impersonator_name');

        setIsImpersonating(false);
        setImpersonatingAdminName('');

        // Navigate to team page on return
        window.location.href = '/team';
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            logout,
            refreshUser,
            isAuthenticated: !!user,
            isImpersonating,
            impersonatingAdminName,
            impersonateUser,
            endImpersonation,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
