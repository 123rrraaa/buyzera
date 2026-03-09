const express = require('express');
const router = express.Router();
const { db, usersCollection, adminsCollection, ordersCollection, productsCollection, cartsCollection } = require('../firebase');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

// GET /api/admin/stats — Dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        // Count customers
        const usersSnap = await usersCollection.get();
        const totalUsers = usersSnap.size;

        // Count products
        const productsSnap = await productsCollection.get();
        const totalProducts = productsSnap.size;

        // Orders
        const ordersSnap = await ordersCollection.get();
        const totalOrders = ordersSnap.size;

        let totalRevenue = 0;
        const ordersByStatus = {};
        const recentOrders = [];

        const allOrders = ordersSnap.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
        allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        allOrders.forEach(order => {
            if (order.status === 'Delivered') {
                totalRevenue += order.totalPrice || 0;
            }
            ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
        });

        // Add manual revenue override (base revenue) if set
        const settingsDoc = await db.collection('settings').doc('dashboard').get();
        if (settingsDoc.exists && settingsDoc.data().totalRevenue !== undefined) {
            totalRevenue += settingsDoc.data().totalRevenue;
        }

        const ordersByStatusArr = Object.entries(ordersByStatus).map(([_id, count]) => ({ _id, count }));

        // Find low-stock and out-of-stock products
        const allProducts = productsSnap.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
        const lowStockProducts = allProducts
            .filter(p => (p.stock || 0) <= 20)
            .map(p => ({
                _id: p._id,
                name: p.name,
                image: p.image,
                stock: p.stock || 0,
                category: p.category,
                status: (p.stock || 0) === 0 ? 'Out of Stock' : 'Low Stock'
            }))
            .sort((a, b) => a.stock - b.stock);

        res.json({
            totalUsers,
            totalOrders,
            totalProducts,
            totalRevenue,
            recentOrders: allOrders.slice(0, 5),
            ordersByStatus: ordersByStatusArr,
            lowStockProducts
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
    }
});

// GET /api/admin/users — List all customers
router.get('/users', async (req, res) => {
    try {
        const snapshot = await usersCollection.get();
        const users = snapshot.docs.map(doc => {
            const data = doc.data();
            delete data.password;
            // Convert Firestore Timestamp to ISO string
            if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                data.createdAt = data.createdAt.toDate().toISOString();
            }
            return { _id: doc.id, ...data };
        });
        users.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch users', error: error.message });
    }
});

// DELETE /api/admin/users/:id — Delete a user and their orders + cart
router.delete('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const userDoc = await usersCollection.doc(userId).get();
        if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });

        // Delete all orders belonging to this user
        const ordersSnap = await ordersCollection.where('userId', '==', userId).get();
        const batch = db.batch();

        ordersSnap.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Delete cart belonging to this user
        const cartSnap = await cartsCollection.where('userId', '==', userId).get();
        cartSnap.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Delete the user document
        batch.delete(usersCollection.doc(userId));

        await batch.commit();

        res.json({
            message: 'User and their data deleted successfully',
            deletedOrders: ordersSnap.size
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete user', error: error.message });
    }
});

// PUT /api/admin/revenue — Update total revenue manually
router.put('/revenue', async (req, res) => {
    try {
        const { totalRevenue } = req.body;
        if (totalRevenue === undefined || isNaN(Number(totalRevenue))) {
            return res.status(400).json({ message: 'Please provide a valid totalRevenue value' });
        }
        await db.collection('settings').doc('dashboard').set(
            { totalRevenue: Number(totalRevenue) },
            { merge: true }
        );
        res.json({ message: 'Total revenue updated successfully', totalRevenue: Number(totalRevenue) });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update revenue', error: error.message });
    }
});

module.exports = router;
