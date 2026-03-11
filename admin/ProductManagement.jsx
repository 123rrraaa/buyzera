import { useState, useEffect } from 'react';
import API from '../../utils/api';
import './Admin.css';

export default function ProductManagement() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editProduct, setEditProduct] = useState(null);
    const [form, setForm] = useState({
        name: '', description: '', price: '', mrp: '', category: 'Electronics', stock: '', rating: '', numReviews: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [uploading, setUploading] = useState(false);

    const categories = ['Electronics', 'Fashion', 'Home & Kitchen', 'Books', 'Sports', 'Beauty', 'Toys', 'Grocery'];

    const fetchProducts = () => {
        API.get('/products?includeOutOfStock=true')
            .then(res => setProducts(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchProducts(); }, []);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const openAdd = () => {
        setEditProduct(null);
        setForm({ name: '', description: '', price: '', mrp: '', category: 'Electronics', stock: '', rating: '', numReviews: '' });
        setImageFile(null);
        setImagePreview('');
        setShowModal(true);
    };

    const openEdit = (p) => {
        setEditProduct(p);
        setForm({
            name: p.name, description: p.description, price: p.price, mrp: p.mrp || '',
            category: p.category, stock: p.stock, rating: p.rating, numReviews: p.numReviews || ''
        });
        setImageFile(null);
        setImagePreview(p.image || '');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            let imageUrl = editProduct?.image || '';

            // Upload new image to Cloudinary if a file was selected
            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                const uploadRes = await API.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                imageUrl = uploadRes.data.url;
            }

            const productData = { ...form, image: imageUrl };
            if (productData.numReviews === '') productData.numReviews = 0;
            if (productData.mrp === '') productData.mrp = productData.price;

            if (editProduct) {
                await API.put(`/products/${editProduct._id}`, productData);
            } else {
                await API.post('/products', productData);
            }
            setShowModal(false);
            setImageFile(null);
            setImagePreview('');
            fetchProducts();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed');
        }
        setUploading(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this product?')) return;
        try {
            await API.delete(`/products/${id}`);
            fetchProducts();
        } catch (err) { alert('Failed to delete'); }
    };

    if (loading) return <div className="page container"><div className="spinner"></div></div>;

    return (
        <div className="page container">
            <div className="admin-header">
                <div className="page-header">
                    <h1 className="page-title">Product Management</h1>
                    <p className="page-subtitle">{products.length} products in store</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>
            </div>

            {products.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">🛍️</div>
                    <h3>No products yet</h3>
                    <p>Add your first product to get started</p>
                </div>
            ) : (
                <div className="product-mgmt-grid">
                    {products.map(p => (
                        <div key={p._id} className="admin-product-card card">
                            <img src={p.image} alt={p.name} className="admin-product-image" onError={(e) => { e.target.src = 'https://via.placeholder.com/300x300?text=No+Image'; }} />
                            <div className="admin-product-info">
                                <h4>{p.name}</h4>
                                <span className="badge badge-primary" style={{ marginBottom: '8px' }}>{p.category}</span>
                                <div className="admin-product-meta">
                                    <span className="price">₹{p.price?.toLocaleString()}</span>
                                    <span>Stock: {p.stock}</span>
                                </div>
                                <div className="admin-product-actions">
                                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>✏️ Edit</button>
                                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p._id)}>🗑️</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editProduct ? 'Edit Product' : 'Add New Product'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            {/* Image Upload */}
                            <div className="form-group">
                                <label>Product Image</label>
                                <div className="image-upload-area">
                                    <input type="file" accept="image/*" onChange={handleImageChange} id="modal-image-upload" style={{ display: 'none' }} />
                                    <label htmlFor="modal-image-upload" className="image-upload-label">
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className="image-upload-preview" />
                                        ) : (
                                            <div className="image-upload-placeholder">
                                                <span style={{ fontSize: '2rem' }}>📷</span>
                                                <span>Click to upload image</span>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>JPG, PNG up to 5MB</span>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Product Name</label>
                                <input type="text" name="name" className="form-input" value={form.name} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea name="description" className="form-input" rows="3" value={form.description} onChange={handleChange} required style={{ resize: 'vertical' }}></textarea>
                            </div>
                            <div className="admin-form-row">
                                <div className="form-group">
                                    <label>Price (₹)</label>
                                    <input type="number" name="price" className="form-input" value={form.price} onChange={handleChange} required min="0" />
                                </div>
                                <div className="form-group">
                                    <label>MRP (₹)</label>
                                    <input type="number" name="mrp" className="form-input" value={form.mrp} onChange={handleChange} required min="0" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <select name="category" className="form-input" value={form.category} onChange={handleChange}>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="admin-form-row">
                                <div className="form-group">
                                    <label>Stock</label>
                                    <input type="number" name="stock" className="form-input" value={form.stock} onChange={handleChange} min="0" />
                                </div>
                                <div className="form-group">
                                    <label>Rating (0-5)</label>
                                    <input type="number" name="rating" className="form-input" value={form.rating} onChange={handleChange} min="0" max="5" step="0.1" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Number of Reviews</label>
                                <input type="number" name="numReviews" className="form-input" value={form.numReviews} onChange={handleChange} min="0" />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={uploading}>
                                {uploading ? '⏳ Uploading Image & Saving...' : editProduct ? 'Update Product' : 'Add Product'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
