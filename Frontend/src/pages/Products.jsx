import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../utils/api';
import ProductCard from '../components/ProductCard';
import './Products.css';

export default function Products({ onAddToCart }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [category, setCategory] = useState(searchParams.get('category') || '');
    const [sort, setSort] = useState('newest');

    const categories = ['All', 'Electronics', 'Fashion', 'Home & Kitchen', 'Books', 'Sports', 'Beauty', 'Toys', 'Grocery'];

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = {};
            if (search) params.search = search;
            if (category && category !== 'All') params.category = category;
            if (sort) params.sort = sort;
            const { data } = await API.get('/products', { params });
            setProducts(data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchProducts();
    }, [search, category, sort]);

    useEffect(() => {
        const cat = searchParams.get('category');
        if (cat) setCategory(cat);
    }, [searchParams]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchProducts();
    };

    return (
        <div className="page container">
            <div className="page-header">
                <h1 className="page-title">All Products</h1>
                <p className="page-subtitle">Browse our collection of premium products</p>
            </div>

            {/* Filters */}
            <div className="products-filters">
                <form className="search-form" onSubmit={handleSearch}>
                    <input
                        type="text"
                        className="form-input search-input"
                        placeholder="🔍 Search products..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary btn-sm">Search</button>
                </form>
                <div className="filter-row">
                    <div className="category-pills">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                className={`pill ${category === cat || (cat === 'All' && !category) ? 'pill-active' : ''}`}
                                onClick={() => setCategory(cat === 'All' ? '' : cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <select className="form-input sort-select" value={sort} onChange={e => setSort(e.target.value)}>
                        <option value="newest">Newest First</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                        <option value="rating">Top Rated</option>
                    </select>
                </div>
            </div>

            {/* Products Grid */}
            {loading ? (
                <div className="spinner"></div>
            ) : products.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">🔍</div>
                    <h3>No products found</h3>
                    <p>Try adjusting your search or filter criteria</p>
                </div>
            ) : (
                <>
                    <p className="results-count">{products.length} product{products.length !== 1 ? 's' : ''} found</p>
                    <div className="grid grid-4">
                        {products.map(product => (
                            <ProductCard key={product._id} product={product} onAddToCart={onAddToCart} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
