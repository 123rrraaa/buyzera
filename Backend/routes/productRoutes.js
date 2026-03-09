const express = require('express');
const router = express.Router();
const { productsCollection } = require('../firebase');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/products — List all products (public)
router.get('/', async (req, res) => {
    try {
        const { category, search, sort, limit = 50, includeOutOfStock } = req.query;
        let query = productsCollection;

        if (category) {
            query = query.where('category', '==', category);
        }

        const snapshot = await query.get();
        let products = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));

        // Hide out-of-stock products for customers (admin can pass includeOutOfStock=true)
        if (includeOutOfStock !== 'true') {
            products = products.filter(p => (p.stock || 0) > 0);
        }

        // Client-side search (Firestore doesn't support regex)
        if (search) {
            const searchLower = search.toLowerCase();
            products = products.filter(p => p.name.toLowerCase().includes(searchLower));
        }

        // Sort
        if (sort === 'price_asc') products.sort((a, b) => a.price - b.price);
        else if (sort === 'price_desc') products.sort((a, b) => b.price - a.price);
        else if (sort === 'rating') products.sort((a, b) => b.rating - a.rating);
        else products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        products = products.slice(0, parseInt(limit));

        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch products', error: error.message });
    }
});

// GET /api/products/:id — Product detail (public)
router.get('/:id', async (req, res) => {
    try {
        const doc = await productsCollection.doc(req.params.id).get();
        if (!doc.exists) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ _id: doc.id, ...doc.data() });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch product', error: error.message });
    }
});

// POST /api/products — Create product (admin only)
router.post('/', protect, adminOnly, async (req, res) => {
    try {
        const { name, description, price, mrp, category, image, stock, rating, numReviews } = req.body;
        const productData = {
            name,
            description,
            price: Number(price),
            mrp: Number(mrp) || Number(price),
            category,
            image: image || 'https://via.placeholder.com/300x300?text=Product',
            stock: Number(stock) || 0,
            rating: Number(rating) || 0,
            numReviews: Number(numReviews) || 0,
            createdAt: new Date().toISOString()
        };
        const docRef = await productsCollection.add(productData);
        res.status(201).json({ _id: docRef.id, ...productData });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create product', error: error.message });
    }
});

// PUT /api/products/:id — Update product (admin only)
router.put('/:id', protect, adminOnly, async (req, res) => {
    try {
        const docRef = productsCollection.doc(req.params.id);
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const updates = {};
        const fields = ['name', 'description', 'price', 'mrp', 'category', 'image', 'stock', 'rating', 'numReviews'];
        fields.forEach(f => {
            if (req.body[f] !== undefined) {
                updates[f] = ['price', 'stock', 'rating', 'mrp', 'numReviews'].includes(f) ? Number(req.body[f]) : req.body[f];
            }
        });

        await docRef.update(updates);
        const updated = await docRef.get();
        res.json({ _id: updated.id, ...updated.data() });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update product', error: error.message });
    }
});

// DELETE /api/products/:id — Delete product (admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
    try {
        const docRef = productsCollection.doc(req.params.id);
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ message: 'Product not found' });
        }
        await docRef.delete();
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete product', error: error.message });
    }
});

module.exports = router;
