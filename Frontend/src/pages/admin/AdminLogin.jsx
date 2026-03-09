import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password, true);
            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Admin login failed.');
        }
        setLoading(false);
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card" style={{ borderTop: '3px solid var(--accent-primary)' }}>
                    <div className="auth-logo">
                        <h1>🛡️ Admin Panel</h1>
                        <p>Buyzera Administration Login</p>
                    </div>
                    {error && <div className="alert alert-error">{error}</div>}
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Admin Email</label>
                            <input type="email" className="form-input" placeholder="admin@buyzera.com" value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input type="password" className="form-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                        </div>
                        <div style={{ textAlign: 'right', marginBottom: '10px' }}>
                            <Link to="/admin/forgot-password" style={{ fontSize: '0.9rem' }}>
                                Forgot Password?
                            </Link>
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Logging in...' : 'Admin Login'}
                        </button>
                    </form>
                    <div className="auth-footer">
                        <p>Need admin access? <Link to="/admin/register">Register as Admin</Link></p>
                        <p style={{ marginTop: '12px' }}>
                            <Link to="/login" style={{ fontSize: '0.85rem' }}>← Customer Login</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
