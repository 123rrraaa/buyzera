const express = require('express');
const router = express.Router();
const { cartsCollection, productsCollection } = require('../firebase');
const { protect } = require('../middleware/auth');

// All cart routes require authentication
router.use(protect);

// GET /api/cart — Get user's cart
router.get('/', async (req, res) => {
    try {
        const snapshot = await cartsCollection.where('userId', '==', req.user._id).get();
        if (snapshot.empty) {
            return res.json({ _id: null, userId: req.user._id, items: [] });
        }
        const cartDoc = snapshot.docs[0];
        const cartData = cartDoc.data();

        // Populate product details
        const items = [];
        for (const item of cartData.items || []) {
            const prodDoc = await productsCollection.doc(item.productId).get();
            if (prodDoc.exists) {
                items.push({
                    _id: item.itemId,
                    product: { _id: prodDoc.id, ...prodDoc.data() },
                    qty: item.qty
                });
            }
        }

        res.json({ _id: cartDoc.id, userId: req.user._id, items });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch cart', error: error.message });
    }
});

// POST /api/cart — Add item to cart
router.post('/', async (req, res) => {
    try {
        const { productId, qty = 1 } = req.body;
        const snapshot = await cartsCollection.where('userId', '==', req.user._id).get();

        let cartRef;

        if (snapshot.empty) {
            // Create a new cart
            const itemId = 'item_' + Date.now();
            const cartData = {
                userId: req.user._id,
                items: [{ itemId, productId, qty }]
            };
            const docRef = await cartsCollection.add(cartData);
            cartRef = docRef;
        } else {
            // Update existing cart
            cartRef = snapshot.docs[0].ref;
            const cartData = snapshot.docs[0].data();
            const items = cartData.items || [];

            const existingIdx = items.findIndex(i => i.productId === productId);
            if (existingIdx >= 0) {
                items[existingIdx].qty += qty;
            } else {
                const itemId = 'item_' + Date.now();
                items.push({ itemId, productId, qty });
            }

            await cartRef.update({ items });
        }

        // Fetch the updated cart document
        const updatedDoc = await cartRef.get();
        const finalData = updatedDoc.data();
        const populatedItems = [];
        for (const item of finalData.items || []) {
            const prodDoc = await productsCollection.doc(item.productId).get();
            if (prodDoc.exists) {
                populatedItems.push({
                    _id: item.itemId,
                    product: { _id: prodDoc.id, ...prodDoc.data() },
                    qty: item.qty
                });
            }
        }

        res.json({ _id: updatedDoc.id, userId: req.user._id, items: populatedItems });
    } catch (error) {
        console.error('Cart POST error:', error);
        res.status(500).json({ message: 'Failed to add to cart', error: error.message });
    }
});

// PUT /api/cart/:itemId — Update item quantity
router.put('/:itemId', async (req, res) => {
    try {
        const { qty } = req.body;
        const snapshot = await cartsCollection.where('userId', '==', req.user._id).get();
        if (snapshot.empty) return res.status(404).json({ message: 'Cart not found' });

        const cartDoc = snapshot.docs[0];
        let items = cartDoc.data().items || [];

        if (qty <= 0) {
            items = items.filter(i => i.itemId !== req.params.itemId);
        } else {
            const item = items.find(i => i.itemId === req.params.itemId);
            if (!item) return res.status(404).json({ message: 'Item not found in cart' });
            item.qty = qty;
        }

        await cartDoc.ref.update({ items });

        // Return populated
        const populatedItems = [];
        for (const item of items) {
            const prodDoc = await productsCollection.doc(item.productId).get();
            if (prodDoc.exists) {
                populatedItems.push({
                    _id: item.itemId,
                    product: { _id: prodDoc.id, ...prodDoc.data() },
                    qty: item.qty
                });
            }
        }

        res.json({ _id: cartDoc.id, userId: req.user._id, items: populatedItems });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update cart', error: error.message });
    }
});

// DELETE /api/cart/:itemId — Remove item from cart
router.delete('/:itemId', async (req, res) => {
    try {
        const snapshot = await cartsCollection.where('userId', '==', req.user._id).get();
        if (snapshot.empty) return res.status(404).json({ message: 'Cart not found' });

        const cartDoc = snapshot.docs[0];
        let items = (cartDoc.data().items || []).filter(i => i.itemId !== req.params.itemId);
        await cartDoc.ref.update({ items });

        const populatedItems = [];
        for (const item of items) {
            const prodDoc = await productsCollection.doc(item.productId).get();
            if (prodDoc.exists) {
                populatedItems.push({
                    _id: item.itemId,
                    product: { _id: prodDoc.id, ...prodDoc.data() },
                    qty: item.qty
                });
            }
        }

        res.json({ _id: cartDoc.id, userId: req.user._id, items: populatedItems });
    } catch (error) {
        res.status(500).json({ message: 'Failed to remove item', error: error.message });
    }
});

// DELETE /api/cart — Clear entire cart
router.delete('/', async (req, res) => {
    try {
        const snapshot = await cartsCollection.where('userId', '==', req.user._id).get();
        if (!snapshot.empty) {
            await snapshot.docs[0].ref.delete();
        }
        res.json({ message: 'Cart cleared' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to clear cart', error: error.message });
    }
});

module.exports = router;
