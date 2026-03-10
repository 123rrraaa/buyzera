import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar({ cartCount = 0 }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    // Get favourites count from localStorage
    const favCount = (() => {
        try {
            return JSON.parse(localStorage.getItem('buyzera_favourites') || '[]').length;
        } catch {
            return 0;
        }
    })();

    const handleLogout = () => {
        logout();
        navigate('/');
        setMenuOpen(false);
    };

    const closeMenu = () => setMenuOpen(false);

    return (
        <nav className="navbar">
            <div className="container navbar-inner">
                <Link to="/" className="navbar-brand">
                    <span className="brand-icon">⚡</span>
                    <span className="brand-text">Buyzera</span>
                </Link>

                {/* Hamburger button — mobile only */}
                <button
                    className="mobile-menu-btn"
                    onClick={() => setMenuOpen(prev => !prev)}
                    aria-label="Toggle menu"
                >
                    {menuOpen ? '✕' : '☰'}
                </button>

                {/* Overlay */}
                {menuOpen && <div className="navbar-overlay" onClick={closeMenu} />}

                <div className={`navbar-links${menuOpen ? ' open' : ''}`}>
                    <Link to="/" className="nav-link" onClick={closeMenu}>Home</Link>
                    <Link to="/products" className="nav-link" onClick={closeMenu}>Products</Link>

                    {user ? (
                        <>
                            <Link to="/cart" className="nav-link nav-cart" onClick={closeMenu}>
                                🛒
                                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                            </Link>
                            <Link to="/favourites" className="nav-link" onClick={closeMenu}>
                                ❤️ <span className="nav-label-text">Favourites</span>
                                {favCount > 0 && <span className="cart-badge">{favCount}</span>}
                            </Link>
                            <Link to="/orders" className="nav-link" onClick={closeMenu}>Orders</Link>
                            <div className="nav-user-menu">
                                <button className="nav-user-btn">
                                    <span className="user-avatar">{user.name?.charAt(0).toUpperCase()}</span>
                                    <span className="user-name">{user.name}</span>
                                </button>
                                <div className="nav-dropdown">
                                    <Link to="/profile" className="dropdown-item" onClick={closeMenu}>👤 Profile</Link>
                                    <Link to="/orders" className="dropdown-item" onClick={closeMenu}>📦 My Orders</Link>
                                    <hr className="dropdown-divider" />
                                    <button className="dropdown-item" onClick={handleLogout}>🚪 Logout</button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="nav-auth">
                            <Link to="/login" className="btn btn-secondary btn-sm" onClick={closeMenu}>Login</Link>
                            <Link to="/register" className="btn btn-primary btn-sm" onClick={closeMenu}>Sign Up</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
