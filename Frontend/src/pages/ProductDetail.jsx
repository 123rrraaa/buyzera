import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './ProductDetail.css';

export default function ProductDetail({ onAddToCart }) {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [qty, setQty] = useState(1);
    const [loading, setLoading] = useState(true);
    const [added, setAdded] = useState(false);
    const [isFav, setIsFav] = useState(false);

    useEffect(() => {
        API.get(`/products/${id}`)
            .then(res => setProduct(res.data))
            .catch(() => navigate('/products'))
            .finally(() => setLoading(false));
    }, [id]);

    // Check if already favourited
    useEffect(() => {
        const favs = JSON.parse(localStorage.getItem('buyzera_favourites') || '[]');
        setIsFav(favs.includes(id));
    }, [id]);

    const toggleFavourite = () => {
        const favs = JSON.parse(localStorage.getItem('buyzera_favourites') || '[]');
        let updated;
        if (favs.includes(id)) {
            updated = favs.filter(f => f !== id);
        } else {
            updated = [...favs, id];
        }
        localStorage.setItem('buyzera_favourites', JSON.stringify(updated));
        setIsFav(!isFav);
    };

    const handleAdd = async () => {
        if (!user) return navigate('/login');
        if (onAddToCart) await onAddToCart(product._id, qty);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    if (loading) return <div className="page container"><div className="spinner"></div></div>;
    if (!product) return null;

    return (
        <div className="page container">
            <div className="product-detail">
                <div className="pd-image-section">
                    <div className="pd-image-wrapper">
                        <img
                            src={product.image}
                            alt={product.name}
                            className="pd-image"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/500x500?text=Product'; }}
                        />
                    </div>
                </div>
                <div className="pd-info-section">
                    <span className="pd-category">{product.category}</span>
                    <div className="pd-name-row">
                        <h1 className="pd-name">{product.name}</h1>
                        <button
                            className={`fav-heart-btn ${isFav ? 'fav-active' : ''}`}
                            onClick={toggleFavourite}
                            title={isFav ? 'Remove from favourites' : 'Add to favourites'}
                        >
                            {isFav ? '❤️' : '🤍'}
                        </button>
                    </div>
                    <div className="pd-rating">
                        <span className="stars">{'★'.repeat(Math.floor(product.rating))}{'☆'.repeat(5 - Math.floor(product.rating))}</span>
                        <span className="rating-text">{product.rating} ({product.numReviews} reviews)</span>
                    </div>
                    <div className="pd-price">₹{product.price.toLocaleString()}</div>
                    <p className="pd-description">{product.description}</p>

                    <div className="pd-meta">
                        <div className="meta-item">
                            <span className="meta-label">Availability</span>
                            <span className={`badge ${product.stock > 0 ? 'badge-success' : 'badge-danger'}`}>
                                {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                            </span>
                        </div>
                    </div>

                    {product.stock > 0 && (
                        <div className="pd-actions">
                            <div className="qty-selector">
                                <button onClick={() => setQty(Math.max(1, qty - 1))} className="qty-btn">−</button>
                                <span className="qty-value">{qty}</span>
                                <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="qty-btn">+</button>
                            </div>
                            <button className="btn btn-primary btn-lg" onClick={handleAdd} disabled={added}>
                                {added ? '✓ Added to Cart!' : '🛒 Add to Cart'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
