import { useState, useEffect } from 'react';
import API from '../../utils/api';
import './Admin.css';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Safely parse Firestore Timestamp or ISO string
    const formatDate = (val) => {
        if (!val) return '—';
        // Firestore Timestamp object
        if (val._seconds || val.seconds) {
            return new Date((val._seconds || val.seconds) * 1000).toLocaleDateString('en-IN');
        }
        // Firestore Timestamp with toDate()
        if (typeof val.toDate === 'function') {
            return val.toDate().toLocaleDateString('en-IN');
        }
        const d = new Date(val);
        return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN');
    };

    useEffect(() => {
        API.get('/admin/users')
            .then(res => setUsers(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleDelete = async (id, name) => {
        if (!confirm(`Delete customer "${name}"? This action cannot be undone.`)) return;
        try {
            await API.delete(`/admin/users/${id}`);
            setUsers(users.filter(u => u._id !== id));
        } catch (err) { alert('Failed to delete user'); }
    };

    if (loading) return <div className="page container"><div className="spinner"></div></div>;

    return (
        <div className="page container">
            <div className="page-header">
                <h1 className="page-title">User Management</h1>
                <p className="page-subtitle">{users.length} registered customers</p>
            </div>

            {users.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">👥</div>
                    <h3>No customers yet</h3>
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Location</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user._id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '36px', height: '36px', borderRadius: '50%',
                                                background: 'var(--accent-gradient)', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.85rem', fontWeight: '700', color: 'white'
                                            }}>{user.name?.charAt(0).toUpperCase()}</div>
                                            <span style={{ fontWeight: 600 }}>{user.name}</span>
                                        </div>
                                    </td>
                                    <td>{user.email}</td>
                                    <td>{user.phone || '—'}</td>
                                    <td>{user.address?.city ? `${user.address.city}, ${user.address.state}` : '—'}</td>
                                    <td>{formatDate(user.createdAt)}</td>
                                    <td>
                                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(user._id, user.name)}>
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
