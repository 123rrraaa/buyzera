import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
    const { user, loading } = useAuth();

    if (loading) return <div className="spinner"></div>;

    if (!user) {
        return <Navigate to={adminOnly ? '/admin/login' : '/login'} replace />;
    }

    // 🔒 Admin trying to access customer pages → redirect to admin dashboard
    if (!adminOnly && user.role === 'admin') {
        return <Navigate to="/admin/dashboard" replace />;
    }

    // 🔒 Customer trying to access admin pages → redirect to home
    if (adminOnly && user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return children;
}
