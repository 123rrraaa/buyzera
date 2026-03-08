import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminNavbar.css';

export default function AdminNavbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
        setMenuOpen(false);
    };

    const isActive = (path) => location.pathname === path;
    const closeMenu = () => setMenuOpen(false);

    const navItems = [
        { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/admin/orders', label: 'Orders', icon: '📦' },
        { path: '/admin/products', label: 'Products', icon: '🛍️' },
        { path: '/admin/users', label: 'Users', icon: '👥' },
    ];

    return (
        <nav className="admin-navbar">
            <div className="admin-navbar-inner">
                <Link to="/admin/dashboard" className="admin-navbar-brand">
                    <span className="admin-brand-icon">🛡️</span>
                    <span className="admin-brand-text">Buyzera</span>
                    <span className="admin-brand-badge">Admin</span>
                </Link>

                {/* Hamburger button — mobile only */}
                <button
                    className="admin-mobile-menu-btn"
                    onClick={() => setMenuOpen(prev => !prev)}
                    aria-label="Toggle admin menu"
                >
                    {menuOpen ? '✕' : '☰'}
                </button>

                {/* Overlay */}
                {menuOpen && <div className="admin-navbar-overlay" onClick={closeMenu} />}

                <div className={`admin-navbar-center${menuOpen ? ' open' : ''}`}>
                    <div className="admin-navbar-links">
                        {navItems.map(item => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`admin-nav-link ${isActive(item.path) ? 'admin-nav-active' : ''}`}
                                onClick={closeMenu}
                            >
                                <span className="admin-nav-icon">{item.icon}</span>
                                <span className="admin-nav-label">{item.label}</span>
                            </Link>
                        ))}
                    </div>

                    <div className="admin-navbar-right-mobile">
                        {user && (
                            <div className="admin-user-section">
                                <div className="admin-user-info">
                                    <div className="admin-avatar">
                                        {user.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="admin-user-details">
                                        <span className="admin-user-name">{user.name}</span>
                                        <span className="admin-user-role">Administrator</span>
                                    </div>
                                </div>
                                <button className="admin-logout-btn" onClick={handleLogout} title="Logout">
                                    🚪
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="admin-navbar-right-desktop">
                    {user && (
                        <div className="admin-user-section">
                            <div className="admin-user-info">
                                <div className="admin-avatar">
                                    {user.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="admin-user-details">
                                    <span className="admin-user-name">{user.name}</span>
                                    <span className="admin-user-role">Administrator</span>
                                </div>
                            </div>
                            <button className="admin-logout-btn" onClick={handleLogout} title="Logout">
                                🚪
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
