import { useState, useEffect } from 'react';
import API from '../../utils/api';
import './Admin.css';

export default function OrderManagement() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.get('/orders/all')
            .then(res => setOrders(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const updateStatus = async (id, status) => {
        try {
            const { data } = await API.put(`/orders/${id}/status`, { status });
            setOrders(orders.map(o => o._id === id ? { ...o, status: data.status } : o));
        } catch (err) { alert('Failed to update status'); }
    };

    const getStatusBadgeClass = (status) => {
        const map = {
            'Awaiting Payment': 'admin-badge-awaiting',
            Pending: 'admin-badge-warning',
            Confirmed: 'admin-badge-confirmed',
            Processing: 'admin-badge-processing',
            Shipped: 'admin-badge-shipped',
            'Out for Delivery': 'admin-badge-outdelivery',
            Delivered: 'admin-badge-delivered',
            Cancelled: 'admin-badge-cancelled'
        };
        return map[status] || 'admin-badge-processing';
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            + ', ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    if (loading) return <div className="page container"><div className="spinner"></div></div>;

    return (
        <div className="page container">
            <div className="page-header">
                <h1 className="page-title">Order Management</h1>
                <p className="page-subtitle">{orders.length} total orders</p>
            </div>

            {orders.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">📦</div>
                    <h3>No orders yet</h3>
                </div>
            ) : (
                <div className="admin-order-cards">
                    {orders.map(order => (
                        <div key={order._id} className="admin-order-card">
                            {/* Header Row */}
                            <div className="admin-order-header">
                                <div className="admin-order-meta">
                                    <div className="admin-order-meta-item">
                                        <span className="admin-order-label">Order ID</span>
                                        <span className="admin-order-value admin-order-id">{order._id}</span>
                                    </div>
                                    <div className="admin-order-meta-item">
                                        <span className="admin-order-label">Date</span>
                                        <span className="admin-order-value">{formatDate(order.createdAt)}</span>
                                    </div>
                                    <div className="admin-order-meta-item">
                                        <span className="admin-order-label">Total</span>
                                        <span className="admin-order-value admin-order-total">₹{order.totalPrice?.toLocaleString()}</span>
                                    </div>
                                    <span className={`admin-order-badge ${getStatusBadgeClass(order.status)}`}>
                                        {order.status}
                                    </span>
                                    <span className={`admin-order-badge ${order.paymentMethod === 'Online' ? 'admin-badge-online-pay' : 'admin-badge-cod-pay'}`}>
                                        {order.paymentMethod === 'Online' ? '💳 Online' : '🏠 COD'}
                                    </span>
                                </div>
                                {order.status === 'Delivered' ? (
                                    <div className="admin-order-status-update">
                                        <span className="admin-order-status-locked" style={{ color: '#059669', fontWeight: 700, fontSize: '0.88rem' }}>
                                            ✅ Delivered — Status Locked
                                        </span>
                                    </div>
                                ) : order.status === 'Cancelled' ? (
                                    <div className="admin-order-status-update">
                                        <span className="admin-order-status-locked" style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.88rem' }}>
                                            ❌ Cancelled — Status Locked
                                        </span>
                                    </div>
                                ) : order.status === 'Awaiting Payment' ? (
                                    <div className="admin-order-status-update">
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#d97706' }}>
                                            ⏳ Verify payment received, then:
                                        </span>
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                            <button
                                                className="btn btn-sm"
                                                style={{ background: '#059669', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                                                onClick={() => updateStatus(order._id, 'Confirmed')}
                                            >
                                                ✅ Payment Received — Confirm
                                            </button>
                                            <button
                                                className="btn btn-sm"
                                                style={{ background: '#dc2626', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                                                onClick={() => updateStatus(order._id, 'Cancelled')}
                                            >
                                                ❌ Reject
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="admin-order-status-update">
                                        <span className="admin-order-status-label">Update Status:</span>
                                        <select
                                            className="admin-order-select"
                                            value={order.status}
                                            onChange={(e) => updateStatus(order._id, e.target.value)}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Confirmed">Confirmed</option>
                                            <option value="Processing">Processing</option>
                                            <option value="Shipped">Shipped</option>
                                            <option value="Out for Delivery">Out for Delivery</option>
                                            <option value="Delivered">Delivered</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Body — Address + Items */}
                            <div className="admin-order-body">
                                <div className="admin-order-address">
                                    <div className="admin-order-address-title">
                                        <span className="admin-order-address-icon">📍</span>
                                        Delivery Address
                                    </div>
                                    <div className="admin-order-address-details">
                                        <p className="admin-order-customer-name">{order.userName || 'N/A'}</p>
                                        <p>{order.shippingAddress?.flatHouse || ''}</p>
                                        <p>{order.shippingAddress?.areaStreet || ''}</p>
                                        <p>
                                            {[order.shippingAddress?.city, order.shippingAddress?.state].filter(Boolean).join(', ')}
                                            {order.shippingAddress?.zipCode ? ` - ${order.shippingAddress.zipCode}` : ''}
                                        </p>
                                        {order.userEmail && <p className="admin-order-email">✉ {order.userEmail}</p>}
                                        {(order.userLocation?.lat && order.userLocation?.lng) ? (
                                            <p style={{ marginTop: '8px', fontSize: '0.82rem' }}>
                                                📌 <strong>Lat:</strong> {order.userLocation.lat.toFixed(6)}, <strong>Lng:</strong> {order.userLocation.lng.toFixed(6)}
                                                {' '}
                                                <a
                                                    href={`https://www.google.com/maps?q=${order.userLocation.lat},${order.userLocation.lng}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'underline' }}
                                                >
                                                    View Map ↗
                                                </a>
                                            </p>
                                        ) : (
                                            <p style={{ marginTop: '8px', fontSize: '0.82rem', color: '#9ca3af' }}>📌 Location: Not available</p>
                                        )}
                                        {order.shippingAddress?.phone && (
                                            <p style={{ marginTop: '6px', fontSize: '0.85rem', fontWeight: 600 }}>📞 {order.shippingAddress.phone}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="admin-order-items">
                                    <div className="admin-order-items-title">
                                        Items ({order.items?.length || 0})
                                    </div>
                                    <div className="admin-order-items-list">
                                        {order.items?.map((item, i) => (
                                            <div key={i} className="admin-order-item-row">
                                                <span className="admin-order-item-name">
                                                    {item.name} {item.qty > 1 ? `x${item.qty}` : `x${item.qty}`}
                                                </span>
                                                <span className="admin-order-item-price">₹{(item.price * item.qty).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
