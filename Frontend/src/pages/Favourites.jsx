import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import './Favourites.css';

export default function Favourites() {
    const [favourites, setFavourites] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load favourites from localStorage
        const stored = JSON.parse(localStorage.getItem('buyzera_favourites') || '[]');
        if (stored.length > 0) {
            // Fetch product details for each favourite
            Promise.all(
                stored.map(id =>
                    API.get(`/products/${id}`)
                        .then(res => ({ ...res.data, _id: id }))
                        .catch(() => null)
                )
            ).then(products => {
                setFavourites(products.filter(Boolean));
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, []);

    const removeFavourite = (productId) => {
        const stored = JSON.parse(localStorage.getItem('buyzera_favourites') || '[]');
        const updated = stored.filter(id => id !== productId);
        localStorage.setItem('buyzera_favourites', JSON.stringify(updated));
        setFavourites(favourites.filter(f => f._id !== productId));
    };

    if (loading) return <div className="page container"><div className="spinner"></div></div>;

    return (
        <div className="page container">
            <div className="page-header">
                <h1 className="page-title">❤️ My Favourites</h1>
                <p className="page-subtitle">Products you love</p>
            </div>

            {favourites.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">❤️</div>
                    <h3>No favourites yet</h3>
                    <p>Browse products and tap the heart icon to save your favourites</p>
                    <Link to="/products" className="btn btn-primary" style={{ marginTop: 16 }}>Browse Products</Link>
                </div>
            ) : (
                <div className="favourites-grid">
                    {favourites.map(product => (
                        <div key={product._id} className="fav-card card">
                            <div className="fav-img-wrapper">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="fav-img"
                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200'; }}
                                />
                                <button
                                    className="fav-remove-btn"
                                    onClick={() => removeFavourite(product._id)}
                                    title="Remove from favourites"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="fav-info">
                                <h3 className="fav-name">{product.name}</h3>
                                <p className="fav-category">{product.category}</p>
                                <div className="fav-bottom">
                                    <span className="fav-price">₹{product.price?.toLocaleString()}</span>
                                    <Link to={`/products/${product._id}`} className="btn btn-primary btn-sm">
                                        View Product
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
