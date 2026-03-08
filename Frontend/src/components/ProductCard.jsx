import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './ProductCard.css';

export default function ProductCard({ product, onAddToCart, distance }) {
    const navigate = useNavigate();
    const [wishlisted, setWishlisted] = useState(false);

    // Load wishlist state on mount
    useEffect(() => {
        const favs = JSON.parse(localStorage.getItem('buyzera_favourites') || '[]');
        setWishlisted(favs.includes(product._id));
    }, [product._id]);

    // Discount calculation
    const mrp = product.mrp || product.price;
    const price = product.price;
    const discountPercent = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
    const hasDiscount = mrp > price;

    // Fast delivery condition (example: under 5km)
    const isNearby = distance && distance <= 5;

    return (
        <div className="product-card card">

            {/* Category Badge */}
            {product.category && (
                <span className="product-tag tag-category">{product.category}</span>
            )}

            <Link to={`/products/${product._id}`} className="product-image-wrapper">
                <img
                    src={product.image}
                    alt={product.name}
                    className="product-image"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300x300?text=Product'; }}
                />

                {/* Discount Badge */}
                {hasDiscount && (
                    <span className="product-tag tag-discount">
                        {discountPercent}% OFF
                    </span>
                )}

                {/* Stock Badges */}
                {product.stock <= 5 && product.stock > 0 && (
                    <span className="product-tag tag-low">
                        Only {product.stock} left
                    </span>
                )}
                {product.stock === 0 && (
                    <span className="product-tag tag-out">
                        Out of Stock
                    </span>
                )}

                {/* 🔥 Distance Badge */}
                {distance && (
                    <span className="product-tag tag-distance">
                        📍 {distance.toFixed(1)} km away
                    </span>
                )}

                {/* ⚡ Fast Delivery Badge */}
                {isNearby && (
                    <span className="product-tag tag-fast">
                        ⚡ Fast Delivery
                    </span>
                )}

                {/* Wishlist Button */}
                <button
                    className={`wishlist-btn ${wishlisted ? 'wishlisted' : ''}`}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        let favs = JSON.parse(localStorage.getItem('buyzera_favourites') || '[]');

                        if (!wishlisted) {
                            if (!favs.includes(product._id)) favs.push(product._id);
                        } else {
                            favs = favs.filter(id => id !== product._id);
                        }

                        localStorage.setItem('buyzera_favourites', JSON.stringify(favs));
                        setWishlisted(!wishlisted);
                    }}
                    aria-label="Add to wishlist"
                >
                    {wishlisted ? '❤️' : '🤍'}
                </button>
            </Link>

            <div className="product-info">
                <span className="product-brand">
                    {product.brand || product.category}
                </span>

                <h3 className="product-name">
                    {product.name}
                </h3>

                {typeof product.numReviews !== 'undefined' && (
                    <div className="product-reviews">
                        <span className="review-count">
                            {product.numReviews} review{product.numReviews === 1 ? '' : 's'}
                        </span>
                    </div>
                )}

                {product.description && (
                    <p className="product-description">
                        {product.description}
                    </p>
                )}

                <div className="product-price-section">
                    <span className="product-price">
                        ₹{price.toLocaleString()}
                    </span>
                    {hasDiscount && (
                        <span className="product-original-price">
                            ₹{mrp.toLocaleString()}
                        </span>
                    )}
                </div>

                <button
                    className="product-cart-btn"
                    onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (onAddToCart) await onAddToCart(product._id);
                        navigate(`/products/${product._id}`);
                    }}
                    disabled={product.stock === 0}
                >
                    🛒 {product.stock === 0 ? 'Sold Out' : 'Add to Cart'}
                </button>
            </div>
        </div>
    );
}