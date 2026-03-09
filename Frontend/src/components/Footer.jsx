import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <h3><span className="brand-icon">⚡</span> Buyzera</h3>
                        <p>Your premium destination for quality products. Shop the latest trends with confidence.</p>
                    </div>
                    <div className="footer-links">
                        <h4>Quick Links</h4>
                        <Link to="/">Home</Link>
                        <Link to="/products">Products</Link>
                        <Link to="/cart">Cart</Link>
                        <Link to="/orders">Orders</Link>
                    </div>
                    <div className="footer-links">
                        <h4>Categories</h4>
                        <Link to="/products?category=Electronics">Electronics</Link>
                        <Link to="/products?category=Fashion">Fashion</Link>
                        <Link to="/products?category=Home & Kitchen">Home & Kitchen</Link>
                        <Link to="/products?category=Books">Books</Link>
                    </div>
                    <div className="footer-links">
                        <h4>Account</h4>
                        <Link to="/login">Login</Link>
                        <Link to="/register">Register</Link>
                        <Link to="/profile">Profile</Link>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2026 Buyzera. All rights reserved. Built with ❤️</p>
                </div>
            </div>
        </footer>
    );
}
