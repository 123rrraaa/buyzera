import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import './Home.css';

export default function Home({ onAddToCart }) {
    const [featured, setFeatured] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    // ✅ Check if smart location is enabled (GPS + address must be set)
    const isLocationEnabled =
        user?.location?.lat && user?.location?.lng &&
        user?.address?.areaStreet && user?.address?.city;

    // 🔥 Haversine Distance Formula
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) *
            Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data } = await API.get('/products?limit=8&sort=rating');

                // If location enabled → sort by distance
                if (isLocationEnabled) {

                    const userLat = user.location.lat;
                    const userLon = user.location.lng;

                    const updatedProducts = data.map(product => {
                        if (product.seller?.location?.lat && product.seller?.location?.lng) {
                            const distance = calculateDistance(
                                userLat,
                                userLon,
                                product.seller.location.lat,
                                product.seller.location.lng
                            );

                            return {
                                ...product,
                                distance
                            };
                        }
                        return product;
                    });

                    updatedProducts.sort(
                        (a, b) => (a.distance || 9999) - (b.distance || 9999)
                    );

                    setFeatured(updatedProducts);
                } else {
                    setFeatured(data);
                }

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [user]);

    const categories = [
        { name: 'Electronics', icon: '💻', color: '#3b82f6' },
        { name: 'Fashion', icon: '👗', color: '#ec4899' },
        { name: 'Home & Kitchen', icon: '🏠', color: '#10b981' },
        { name: 'Books', icon: '📚', color: '#f59e0b' },
        { name: 'Sports', icon: '⚽', color: '#ef4444' },
        { name: 'Beauty', icon: '✨', color: '#a855f7' },
        { name: 'Toys', icon: '🧸', color: '#06b6d4' },
        { name: 'Grocery', icon: '🛒', color: '#84cc16' },
    ];

    return (
        <div className="home-page">

            {/* Hero */}
            <section className="hero">
                <div className="container hero-content">
                    <div className="hero-text">
                        <span className="hero-badge">
                            🔥 Smart Location {isLocationEnabled ? "Enabled" : "Disabled"}
                        </span>

                        <h1 className="hero-title">
                            Discover <span className="gradient-text">Nearby</span> Products
                        </h1>

                        <p className="hero-desc">
                            {isLocationEnabled
                                ? "Showing products closest to your location for faster delivery."
                                : "Enable Smart Location to shop nearby products."}
                        </p>

                        {!isLocationEnabled && (
                            <div className="alert alert-error" style={{ marginTop: '15px' }}>
                                ⚠ Please enable location from Checkout page before purchasing.
                            </div>
                        )}

                        <div className="hero-actions">
                            <Link
                                to={isLocationEnabled ? "/products" : "#"}
                                className="btn btn-primary btn-lg"
                                onClick={(e) => {
                                    if (!isLocationEnabled) {
                                        e.preventDefault();
                                        alert("Enable Smart Location before shopping.");
                                    }
                                }}
                            >
                                Shop Now →
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="section container">
                <h2 className="section-title">Shop by Category</h2>
                <div className="categories-grid">
                    {categories.map(cat => (
                        <Link
                            key={cat.name}
                            to={isLocationEnabled
                                ? `/products?category=${encodeURIComponent(cat.name)}`
                                : "#"}
                            className="category-card"
                            style={{ '--cat-color': cat.color }}
                            onClick={(e) => {
                                if (!isLocationEnabled) {
                                    e.preventDefault();
                                    alert("Enable Smart Location before shopping.");
                                }
                            }}
                        >
                            <span className="cat-icon">{cat.icon}</span>
                            <span className="cat-name">{cat.name}</span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Featured Products */}
            <section className="section container">
                <div className="section-header">
                    <h2 className="section-title">Top Rated Near You</h2>

                    <Link
                        to={isLocationEnabled ? "/products" : "#"}
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                            if (!isLocationEnabled) {
                                e.preventDefault();
                                alert("Enable Smart Location before shopping.");
                            }
                        }}
                    >
                        View All →
                    </Link>
                </div>

                {loading ? (
                    <div className="spinner"></div>
                ) : (
                    <div className="grid grid-4">
                        {featured.map(product => (
                            <ProductCard
                                key={product._id}
                                product={product}
                                onAddToCart={onAddToCart}
                            />
                        ))}
                    </div>
                )}
            </section>

        </div>
    );
}