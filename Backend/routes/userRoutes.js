const express = require('express');
const router = express.Router();
const { usersCollection } = require('../firebase');
const { protect } = require('../middleware/auth');

/**
 * @route   POST /api/users/location
 * @desc    Save user location & address
 * @access  Private
 */
router.post('/location', protect, async (req, res) => {
    try {
        const { lat, lng, address } = req.body;

        await usersCollection.doc(req.user._id).set({
            location: {
                lat,
                lng,
                updatedAt: new Date()
            },
            address: address || {},
            updatedAt: new Date()
        }, { merge: true });

        res.json({ message: 'Location & address saved successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to save location' });
    }
});

/**
 * @route   GET /api/users/profile
 * @desc    Get logged in user profile (for checkout autofill)
 * @access  Private
 */
router.get('/profile', protect, async (req, res) => {
    try {
        const userDoc = await usersCollection.doc(req.user._id).get();

        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(userDoc.data());
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch profile' });
    }
});

/**
 * @route   PUT /api/users/address
 * @desc    Update address manually
 * @access  Private
 */
router.put('/address', protect, async (req, res) => {
    try {
        const { flatHouse, areaStreet, city, state, zipCode, country } = req.body;

        const addressData = { flatHouse, areaStreet, city, state, zipCode, country };
        const updatePayload = {
            address: addressData,
            updatedAt: new Date()
        };

        // Forward-geocode the address to get lat/lng
        try {
            const queryParts = [areaStreet, city, state, zipCode, country].filter(Boolean);
            const queryString = queryParts.join(', ');

            if (queryString) {
                const geoRes = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryString)}&limit=1`,
                    { headers: { 'User-Agent': 'Buyzera/1.0' } }
                );
                const geoData = await geoRes.json();

                if (geoData && geoData.length > 0) {
                    const lat = parseFloat(geoData[0].lat);
                    const lng = parseFloat(geoData[0].lon);

                    if (!isNaN(lat) && !isNaN(lng)) {
                        updatePayload.location = {
                            lat,
                            lng,
                            updatedAt: new Date()
                        };
                    }
                }
            }
        } catch (geoError) {
            // Geocoding failed silently — address still saves
            console.error('Geocoding failed:', geoError.message);
        }

        await usersCollection.doc(req.user._id).set(updatePayload, { merge: true });

        // Return updated user data
        const updatedDoc = await usersCollection.doc(req.user._id).get();
        const data = updatedDoc.data();
        delete data.password;

        res.json({ message: 'Address updated successfully', location: data.location || null });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update address' });
    }
});

module.exports = router;