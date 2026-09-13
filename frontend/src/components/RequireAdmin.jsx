import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../api/client';

// Keeps non-admins off the page in the UI. This is not the security
// boundary - every /api/admin/* request is checked server-side by
// requireAdmin regardless of what this component does - it just avoids
// flashing admin screens at people who'll get 403s from every call.
export default function RequireAdmin({ children }) {
    const user = getCurrentUser();

    if (!user) {
        return <Navigate to="/login" replace />;
    }
    if (!user.isAdmin) {
        return (
            <div className="shell" style={{ paddingTop: 'var(--space-7)', paddingBottom: 'var(--space-8)' }}>
                <div className="card" style={{ borderColor: 'var(--danger)', maxWidth: 480 }}>
                    <span className="label" style={{ color: 'var(--danger)' }}>Not authorized</span>
                    <p className="text-small muted" style={{ margin: 'var(--space-2) 0 0' }}>
                        This account doesn&apos;t have admin access.
                    </p>
                </div>
            </div>
        );
    }
    return children;
}
