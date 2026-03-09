import { useState, useEffect, useRef } from 'react';
import API from '../utils/api';
import './Orders.css';

const TRACKING_STEPS = [
    { key: 'Pending', label: 'Order Placed', icon: '📋', description: 'Order placed' },
    { key: 'Confirmed', label: 'Warehouse', icon: '🏭', description: 'Order confirmed' },
    { key: 'Processing', label: 'Sorting Center', icon: '📦', description: 'Package being prepared' },
    { key: 'Shipped', label: 'In Transit', icon: '🚚', description: 'On its way' },
    { key: 'Out for Delivery', label: 'Dist. Center', icon: '📍', description: 'Near your location' },
    { key: 'Delivered', label: 'Delivered', icon: '🏠', description: 'Package delivered' }
];

function getStepIndex(status) {
    const idx = TRACKING_STEPS.findIndex(s => s.key === status);
    return idx >= 0 ? idx : 0;
}

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLive, setIsLive] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const intervalRef = useRef(null);

    const fetchOrders = async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const res = await API.get('/orders');
            setOrders(res.data);
            setLastUpdated(new Date());
        } catch (err) {
            console.error(err);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders(true);
    }, []);

    // Live polling every 5 seconds
    useEffect(() => {
        if (isLive) {
            intervalRef.current = setInterval(() => fetchOrders(false), 5000);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isLive]);

    const getStatusBadge = (status) => {
        const map = {
            'Awaiting Payment': 'badge-awaiting',
            Pending: 'badge-warning',
            Confirmed: 'badge-confirmed',
            Processing: 'badge-info',
            Shipped: 'badge-primary',
            'Out for Delivery': 'badge-outdelivery',
            Delivered: 'badge-success',
            Cancelled: 'badge-danger'
        };
        return map[status] || 'badge-info';
    };

    const getStatusMessage = (status) => {
        const map = {
            'Awaiting Payment': '⏳ Your Order is Not taken yet. Till the online payment is not received.',
            Pending: '📋 Your order has been placed',
            Confirmed: '✅ Your order is confirmed',
            Processing: '📦 Your order is being processed',
            Shipped: '🚚 Your order is in transit',
            'Out for Delivery': '📍 Your order is out for delivery',
            Delivered: '🎉 Your order has been delivered!',
            Cancelled: '❌ Your order has been cancelled'
        };
        return map[status] || '';
    };

    if (loading) return <div className="page container"><div className="spinner"></div></div>;

    return (
        <div className="page container">
            <div className="page-header orders-page-header">
                <div className="orders-title-row">
                    <h1 className="page-title">📦 My Orders</h1>
                    <div className="live-indicator-group">
                        <button
                            className={`live-badge ${isLive ? 'live-active' : 'live-paused'}`}
                            onClick={() => setIsLive(!isLive)}
                            title={isLive ? 'Click to pause live updates' : 'Click to resume live updates'}
                        >
                            <span className={`live-dot ${isLive ? 'dot-active' : ''}`}></span>
                            {isLive ? 'Live Updates' : 'Paused'}
                        </button>
                        {lastUpdated && (
                            <span className="last-updated">
                                Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {orders.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">📦</div>
                    <h3>No orders yet</h3>
                    <p>Your order history will appear here</p>
                </div>
            ) : (
                <div className="orders-list">
                    {orders.map(order => (
                        <div key={order._id} className="order-card card">
                            {/* Header */}
                            <div className="order-header">
                                <div className="order-header-left">
                                    <span className="order-id-label">Order ID</span>
                                    <span className="order-date-label">
                                        📅 {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        , {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                    </span>
                                </div>
                                <span className={`badge ${getStatusBadge(order.status)}`}>{order.status}</span>
                            </div>

                            {/* Tracking / Delivered / Cancelled */}
                            {order.status === 'Awaiting Payment' ? (
                                <div className="tracking-section tracking-awaiting-payment">
                                    <div className="awaiting-payment-card">
                                        <div className="awaiting-payment-icon">⏳</div>
                                        <div className="awaiting-payment-text">
                                            <h4>Awaiting Online Payment</h4>
                                            <p>Your Order is Not taken yet. Till the online payment is not received.</p>
                                            <span className="awaiting-payment-hint">
                                                💳 Please complete your payment. Your order will be confirmed once payment is verified.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : order.status === 'Delivered' ? (
                                <div className="tracking-section tracking-delivered-success">
                                    <div className="delivered-success-card">
                                        <div className="delivered-success-icon">✅</div>
                                        <div className="delivered-success-text">
                                            <h4>Delivered Successfully!</h4>
                                            <p>Your order has been delivered to your address.</p>
                                            <span className="delivered-success-date">
                                                🎉 Thank you for shopping with Buyzera!
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : order.status === 'Cancelled' ? (
                                <div className="tracking-section tracking-cancelled">
                                    <div className="tracking-message cancelled-msg">
                                        ❌ This order has been cancelled
                                    </div>
                                </div>
                            ) : (
                                <div className="tracking-section">
                                    <div className="tracking-title">
                                        <span className="tracking-icon">📍</span>
                                        Live Tracking Map
                                    </div>
                                    <div className="tracking-progress">
                                        {TRACKING_STEPS.map((step, i) => {
                                            const currentStep = getStepIndex(order.status);
                                            const isCompleted = i <= currentStep;
                                            const isCurrent = i === currentStep;
                                            return (
                                                <div key={step.key} className={`tracking-step ${isCompleted ? 'step-completed' : ''} ${isCurrent ? 'step-current' : ''}`}>
                                                    <div className="step-icon-wrapper">
                                                        <div className={`step-circle ${isCompleted ? 'circle-completed' : ''} ${isCurrent ? 'circle-current' : ''}`}>
                                                            {isCompleted ? (
                                                                <span className="step-emoji">{step.icon}</span>
                                                            ) : (
                                                                <span className="step-emoji-dim">{step.icon}</span>
                                                            )}
                                                        </div>
                                                        {i < TRACKING_STEPS.length - 1 && (
                                                            <div className={`step-line ${i < currentStep ? 'line-completed' : ''} ${i === currentStep ? 'line-active' : ''}`}></div>
                                                        )}
                                                    </div>
                                                    <span className={`step-label ${isCompleted ? 'label-completed' : ''}`}>{step.label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="tracking-message">
                                        {getStatusMessage(order.status)}
                                    </div>
                                </div>
                            )}

                            {/* Items */}
                            <div className="order-items">
                                {order.items.map((item, i) => (
                                    <div key={i} className="order-item">
                                        <img src={item.image} alt={item.name} className="order-item-img" onError={(e) => { e.target.src = 'https://via.placeholder.com/60x60'; }} />
                                        <div className="order-item-info">
                                            <span className="order-item-name">{item.name}</span>
                                            <span className="order-item-qty">Qty: {item.qty} × ₹{item.price?.toLocaleString()}</span>
                                        </div>
                                        <span className="order-item-total">₹{(item.qty * item.price).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="order-footer">
                                <div className="order-address">
                                    <span>📍 {order.shippingAddress?.city}, {order.shippingAddress?.state}</span>
                                    <span>💳 {order.paymentMethod}</span>
                                </div>
                                <div className="order-total">
                                    Total: <strong>₹{order.totalPrice?.toLocaleString()}</strong>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
