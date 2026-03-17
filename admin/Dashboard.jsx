import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../utils/api';
import './Admin.css';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editingRevenue, setEditingRevenue] = useState(false);
    const [revenueInput, setRevenueInput] = useState('');
    const [savingRevenue, setSavingRevenue] = useState(false);

    const fetchStats = () => {
        API.get('/admin/stats')
            .then(res => setStats(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchStats(); }, []);

    const handleEditRevenue = () => {
        setRevenueInput(String(stats?.totalRevenue || 0));
        setEditingRevenue(true);
    };

    const handleSaveRevenue = async () => {
        const value = Number(revenueInput);
        if (isNaN(value) || value < 0) return alert('Please enter a valid amount');
        setSavingRevenue(true);
        try {
            await API.put('/admin/revenue', { totalRevenue: value });
            setStats(prev => ({ ...prev, totalRevenue: value }));
            setEditingRevenue(false);
        } catch (err) {
            alert('Failed to update revenue');
            console.error(err);
        } finally {
            setSavingRevenue(false);
        }
    };

    const handleCancelRevenue = () => {
        setEditingRevenue(false);
    };

    if (loading) return <div className="page container"><div className="spinner"></div></div>;

    return (
        <div className="page container">
            <div className="page-header">
                <h1 className="page-title">🛡️ Admin Dashboard</h1>
                <p className="page-subtitle">Welcome to Buyzera admin panel</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-4 admin-stats-grid">
                <div className="stat-card" style={{ position: 'relative' }}>
                    <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>💰</div>
                    {editingRevenue ? (
                        <>
                            <div className="revenue-edit-group">
                                <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>₹</span>
                                <input
                                    type="number"
                                    className="revenue-edit-input"
                                    value={revenueInput}
                                    onChange={e => setRevenueInput(e.target.value)}
                                    autoFocus
                                    min="0"
                                    onKeyDown={e => { if (e.key === 'Enter') handleSaveRevenue(); if (e.key === 'Escape') handleCancelRevenue(); }}
                                />
                            </div>
                            <div className="revenue-edit-actions">
                                <button className="btn-revenue-save" onClick={handleSaveRevenue} disabled={savingRevenue}>
                                    {savingRevenue ? '...' : '✓'}
                                </button>
                                <button className="btn-revenue-cancel" onClick={handleCancelRevenue} disabled={savingRevenue}>
                                    ✕
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="stat-value">₹{(stats?.totalRevenue || 0).toLocaleString()}</div>
                            <div className="stat-label">Total Revenue</div>
                            <button className="btn-revenue-edit" onClick={handleEditRevenue} title="Edit Total Revenue">✏️</button>
                        </>
                    )}
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>📦</div>
                    <div className="stat-value">{stats?.totalOrders || 0}</div>
                    <div className="stat-label">Total Orders</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7' }}>🛍️</div>
                    <div className="stat-value">{stats?.totalProducts || 0}</div>
                    <div className="stat-label">Products</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>👥</div>
                    <div className="stat-value">{stats?.totalUsers || 0}</div>
                    <div className="stat-label">Customers</div>
                </div>
            </div>

            {/* Quick Links */}
            <div className="admin-quicklinks">
                <Link to="/admin/products" className="btn btn-secondary">🛍️ Manage Products</Link>
                <Link to="/admin/orders" className="btn btn-secondary">📦 Manage Orders</Link>
                <Link to="/admin/users" className="btn btn-secondary">👥 Manage Users</Link>
                <Link to="/products" className="btn btn-secondary">🏪 View Store</Link>
            </div>

            {/* Stock Alerts */}
            {stats?.lowStockProducts && stats.lowStockProducts.length > 0 && (
                <div className="card admin-dashboard-card stock-alerts-card">
                    <div className="stock-alerts-header">
                        <h3 style={{ fontWeight: '700' }}>
                            ⚠️ Stock Alerts
                            <span className="stock-alert-count">{stats.lowStockProducts.length}</span>
                        </h3>
                        <Link to="/admin/products" className="btn btn-secondary btn-sm">Manage Products →</Link>
                    </div>
                    <div className="stock-alerts-list">
                        {stats.lowStockProducts.map(p => (
                            <div key={p._id} className="stock-alert-item">
                                <img
                                    src={p.image}
                                    alt={p.name}
                                    className="stock-alert-img"
                                    onError={e => { e.target.src = 'https://via.placeholder.com/48x48?text=?'; }}
                                />
                                <div className="stock-alert-info">
                                    <span className="stock-alert-name">{p.name}</span>
                                    <span className="stock-alert-category">{p.category}</span>
                                </div>
                                <div className="stock-alert-right">
                                    <span className={`badge ${p.stock === 0 ? 'badge-danger' : 'badge-warning'}`}>
                                        {p.status}
                                    </span>
                                    <span className="stock-alert-qty">
                                        {p.stock === 0 ? 'No stock' : `${p.stock} left`}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Order Status Breakdown */}
            {stats?.ordersByStatus && stats.ordersByStatus.length > 0 && (
                <div className="card admin-dashboard-card">
                    <h3 style={{ marginBottom: '20px', fontWeight: '700' }}>Order Status Breakdown</h3>
                    <div className="status-bars">
                        {stats.ordersByStatus.map(s => (
                            <div key={s._id} className="status-bar-item">
                                <span className="status-bar-label">{s._id}</span>
                                <div className="status-bar-track">
                                    <div className="status-bar-fill" style={{ width: `${(s.count / stats.totalOrders) * 100}%` }}></div>
                                </div>
                                <span className="status-bar-count">{s.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Orders */}
            {stats?.recentOrders && stats.recentOrders.length > 0 && (
                <div className="card admin-dashboard-card">
                    <h3 style={{ marginBottom: '20px', fontWeight: '700' }}>Recent Orders</h3>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentOrders.map(order => (
                                    <tr key={order._id}>
                                        <td>#{order._id.slice(-8).toUpperCase()}</td>
                                        <td>{order.userName || order.user?.name || 'N/A'}</td>
                                        <td>₹{order.totalPrice?.toLocaleString()}</td>
                                        <td>
                                            <span className={`badge ${order.status === 'Delivered' ? 'badge-success' :
                                                order.status === 'Cancelled' ? 'badge-danger' :
                                                    order.status === 'Shipped' ? 'badge-primary' :
                                                        'badge-warning'
                                                }`}>{order.status}</span>
                                        </td>
                                        <td>{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
