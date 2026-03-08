const express = require('express');
const router = express.Router();
const {
    ordersCollection,
    cartsCollection,
    productsCollection,
    usersCollection
} = require('../firebase');

const { protect, adminOnly } = require('../middleware/auth');

/* =========================================
   📍 SOURCE ADDRESS (Store Location)
   Ambadi Naka, K. K. Jewellers, Bhiwandi
========================================= */
const SOURCE_LAT = 19.4683128;
const SOURCE_LNG = 73.0827643;
const RATE_PER_KM = 10; // ₹10 per km
const MAX_DELIVERY_KM = 50; // max 50 km

/* =========================================
   📐 Haversine Distance (km) — Fallback only
========================================= */
function getHaversineKm(lat1, lng1, lat2, lng2) {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/* =========================================
   🛣️ Road Distance via OSRM (free, no API key)
   Returns actual driving distance in km
   Falls back to Haversine if OSRM is unavailable
========================================= */
async function getRoadDistanceKm(lat1, lng1, lat2, lng2) {
    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=false`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            // OSRM returns distance in meters
            return data.routes[0].distance / 1000;
        }
    } catch (err) {
        console.log('OSRM API failed, using Haversine fallback:', err.message);
    }

    // Fallback to Haversine
    return getHaversineKm(lat1, lng1, lat2, lng2);
}

router.use(protect);

/* =========================================
   GET /api/orders/shipping — Calculate shipping
========================================= */
router.get('/shipping', async (req, res) => {
    try {
        let destLat = parseFloat(req.query.lat);
        let destLng = parseFloat(req.query.lng);

        // Fallback to user's profile location if no coords provided
        if (!destLat || !destLng || isNaN(destLat) || isNaN(destLng)) {
            const userDoc = await usersCollection.doc(req.user._id).get();
            if (!userDoc.exists) return res.status(400).json({ message: 'User not found' });
            const userData = userDoc.data();
            if (!userData.location?.lat || !userData.location?.lng) {
                return res.status(400).json({ message: 'Smart Location must be enabled' });
            }
            destLat = userData.location.lat;
            destLng = userData.location.lng;
        }

        const distance = await getRoadDistanceKm(SOURCE_LAT, SOURCE_LNG, destLat, destLng);
        const distanceRounded = Math.round(distance * 10) / 10;
        const shippingCharge = Math.ceil(distance) * RATE_PER_KM;
        const deliverable = distance <= MAX_DELIVERY_KM;
        res.json({
            distance: distanceRounded,
            shippingCharge,
            deliverable,
            maxKm: MAX_DELIVERY_KM,
            ratePerKm: RATE_PER_KM,
            source: { lat: SOURCE_LAT, lng: SOURCE_LNG },
            destination: { lat: destLat, lng: destLng }
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to calculate shipping', error: error.message });
    }
});

/* =========================================
   POST /api/orders — Place Order
========================================= */
router.post('/', async (req, res) => {
    try {
        const { shippingAddress, paymentMethod = 'COD', destLat, destLng } = req.body;

        /* 🔒 1️⃣ CHECK SMART LOCATION ENABLED */
        const userDoc = await usersCollection.doc(req.user._id).get();

        if (!userDoc.exists) {
            return res.status(400).json({ message: 'User profile not found' });
        }

        const userData = userDoc.data();

        if (!userData.location?.lat || !userData.location?.lng) {
            return res.status(400).json({
                message: 'Smart Location must be enabled before placing an order'
            });
        }

        /* 📏 1.5️⃣ DISTANCE & SHIPPING CHECK */
        // Use destination coords from checkout if provided, else use user profile GPS
        const deliveryLat = destLat || userData.location.lat;
        const deliveryLng = destLng || userData.location.lng;
        const distance = await getRoadDistanceKm(SOURCE_LAT, SOURCE_LNG, deliveryLat, deliveryLng);
        if (distance > MAX_DELIVERY_KM) {
            return res.status(400).json({
                message: `Sorry, we only deliver within ${MAX_DELIVERY_KM} km. Your location is ${Math.round(distance * 10) / 10} km away.`
            });
        }
        const shippingCharge = Math.ceil(distance) * RATE_PER_KM;

        /* 🛒 2️⃣ GET CART */
        const cartSnap = await cartsCollection
            .where('userId', '==', req.user._id)
            .get();

        if (cartSnap.empty) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        const cartData = cartSnap.docs[0].data();

        if (!cartData.items || cartData.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        /* 📦 3️⃣ BUILD ORDER ITEMS */
        const orderItems = [];
        let subtotal = 0;

        for (const item of cartData.items) {
            const prodDoc = await productsCollection
                .doc(item.productId)
                .get();

            if (!prodDoc.exists) continue;

            const prodData = prodDoc.data();

            orderItems.push({
                productId: item.productId,
                name: prodData.name,
                image: prodData.image,
                qty: item.qty,
                price: prodData.price
            });

            subtotal += prodData.price * item.qty;

            // Update stock
            const newStock = Math.max(
                0,
                (prodData.stock || 0) - item.qty
            );

            await productsCollection
                .doc(item.productId)
                .update({ stock: newStock });
        }

        const totalPrice = subtotal + shippingCharge;

        /* 🧾 4️⃣ CREATE ORDER */
        const orderData = {
            userId: req.user._id,
            userName: req.user.name,
            userEmail: req.user.email,
            items: orderItems,
            shippingAddress,
            subtotal,
            shippingCharge,
            distance: Math.round(distance * 10) / 10,
            totalPrice,
            paymentMethod,
            status: paymentMethod === 'Online' ? 'Awaiting Payment' : 'Pending',
            createdAt: new Date().toISOString(),
            userLocation: userData.location
        };

        const orderRef = await ordersCollection.add(orderData);

        /* 🧹 5️⃣ CLEAR CART */
        await cartSnap.docs[0].ref.delete();

        res.status(201).json({
            _id: orderRef.id,
            ...orderData
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to place order',
            error: error.message
        });
    }
});

/* =========================================
   GET /api/orders — User Orders
========================================= */
router.get('/', async (req, res) => {
    try {
        const snapshot = await ordersCollection
            .where('userId', '==', req.user._id)
            .get();

        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

        const orders = [];
        const deletePromises = [];

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const orderDate = data.createdAt ? new Date(data.createdAt) : null;

            // Auto-delete delivered orders older than 2 months
            if (data.status === 'Delivered' && orderDate && orderDate < twoMonthsAgo) {
                deletePromises.push(ordersCollection.doc(doc.id).delete());
                return; // skip adding to response
            }

            orders.push({ _id: doc.id, ...data });
        });

        // Execute all deletions in parallel
        if (deletePromises.length > 0) {
            await Promise.all(deletePromises);
        }

        orders.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        res.json(orders);

    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch orders',
            error: error.message
        });
    }
});

/* =========================================
   GET /api/orders/all — Admin
========================================= */
router.get('/all', adminOnly, async (req, res) => {
    try {
        const snapshot = await ordersCollection
            .orderBy('createdAt', 'desc')
            .get();

        const orders = snapshot.docs.map(doc => ({
            _id: doc.id,
            ...doc.data()
        }));

        res.json(orders);

    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch orders',
            error: error.message
        });
    }
});

/* =========================================
   GET /api/orders/:id
========================================= */
router.get('/:id', async (req, res) => {
    try {
        const doc = await ordersCollection
            .doc(req.params.id)
            .get();

        if (!doc.exists) {
            return res.status(404).json({
                message: 'Order not found'
            });
        }

        const order = {
            _id: doc.id,
            ...doc.data()
        };

        if (
            order.userId !== req.user._id &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({
                message: 'Not authorized'
            });
        }

        res.json(order);

    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch order',
            error: error.message
        });
    }
});

/* =========================================
   PUT /api/orders/:id/status — Admin
========================================= */
router.put('/:id/status', adminOnly, async (req, res) => {
    try {
        const { status } = req.body;

        const docRef = ordersCollection.doc(req.params.id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({
                message: 'Order not found'
            });
        }

        await docRef.update({ status });

        const updated = await docRef.get();

        res.json({
            _id: updated.id,
            ...updated.data()
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to update order status',
            error: error.message
        });
    }
});

module.exports = router;