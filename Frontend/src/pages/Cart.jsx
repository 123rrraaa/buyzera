import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import './Cart.css';

export default function Cart({ cartItems, setCartItems, fetchCart }) {
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (fetchCart) {
            fetchCart().finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const updateQty = async (itemId, qty) => {
        try {
            const { data } = await API.put(`/cart/${itemId}`, { qty });
            setCartItems(data.items || []);
        } catch (err) { console.error(err); }
    };

    const removeItem = async (itemId) => {
        try {
            const { data } = await API.delete(`/cart/${itemId}`);
            setCartItems(data.items || []);
        } catch (err) { console.error(err); }
    };

    const total = (cartItems || []).reduce((sum, item) => {
        return sum + (item.product?.price || 0) * item.qty;
    }, 0);

    if (loading) return <div className="page container"><div className="spinner"></div></div>;

    return (
        <div className="page container">
            <div className="page-header">
                <h1 className="page-title">Shopping Cart</h1>
                <p className="page-subtitle">{cartItems?.length || 0} item{(cartItems?.length || 0) !== 1 ? 's' : ''} in your cart</p>
            </div>

            {(!cartItems || cartItems.length === 0) ? (
                <div className="empty-state">
                    <div className="icon">🛒</div>
                    <h3>Your cart is empty</h3>
                    <p>Start shopping and add some products to your cart!</p>
                    <Link to="/products" className="btn btn-primary">Browse Products</Link>
                </div>
            ) : (
                <div className="cart-layout">
                    <div className="cart-items">
                        {cartItems.map(item => (
                            <div key={item._id} className="cart-item card">
                                <img
                                    src={item.product?.image}
                                    alt={item.product?.name}
                                    className="cart-item-image"
                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/120x120?text=Product'; }}
                                />
                                <div className="cart-item-info">
                                    <Link to={`/products/${item.product?._id}`}>
                                        <h3>{item.product?.name}</h3>
                                    </Link>
                                    <span className="cart-item-category">{item.product?.category}</span>
                                    <span className="cart-item-price">₹{item.product?.price?.toLocaleString()}</span>
                                </div>
                                <div className="cart-item-actions">
                                    <div className="qty-selector">
                                        <button onClick={() => updateQty(item._id, item.qty - 1)} className="qty-btn">−</button>
                                        <span className="qty-value">{item.qty}</span>
                                        <button onClick={() => updateQty(item._id, item.qty + 1)} className="qty-btn">+</button>
                                    </div>
                                    <span className="cart-item-total">₹{((item.product?.price || 0) * item.qty).toLocaleString()}</span>
                                    <button onClick={() => removeItem(item._id)} className="btn btn-danger btn-sm">Remove</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="cart-summary card">
                        <h3>Order Summary</h3>
                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>₹{total.toLocaleString()}</span>
                        </div>
                        <div className="summary-row">
                            <span>Shipping</span>
                            <span className="free-shipping">PAID</span>
                        </div>
                        <hr />
                        <div className="summary-row summary-total">
                            <span>Total</span>
                            <span>₹{total.toLocaleString()}</span>
                        </div>
                        <button className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }} onClick={() => navigate('/checkout')}>
                            Proceed to Checkout →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
