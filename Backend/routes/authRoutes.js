const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { usersCollection, adminsCollection } = require('../firebase');
const { protect } = require('../middleware/auth');

/* =====================================================
   🔐 JWT TOKEN GENERATOR
===================================================== */
const generateToken = (id, role) => {
    return jwt.sign(
        { id, role },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

/* =====================================================
   👤 CUSTOMER REGISTRATION
   POST /api/auth/register
===================================================== */
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email and password required' });
        }

        const existingUser = await usersCollection
            .where('email', '==', email)
            .limit(1)
            .get();

        if (!existingUser.empty) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const userRef = await usersCollection.add({
            name,
            email,
            password,
            phone: phone || '',
            role: 'customer',
            address: {
                flatHouse: '',
                areaStreet: '',
                city: '',
                state: '',
                zipCode: '',
                country: 'India'
            },
            location: null,
            createdAt: new Date()
        });

        res.status(201).json({
            _id: userRef.id,
            name,
            email,
            role: 'customer',
            token: generateToken(userRef.id, 'customer')
        });

    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: 'Registration failed' });
    }
});

/* =====================================================
   🔑 CUSTOMER LOGIN
   POST /api/auth/login
===================================================== */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const snapshot = await usersCollection
            .where('email', '==', email)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const userDoc = snapshot.docs[0];
        const user = userDoc.data();

        if (password !== user.password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        res.json({
            _id: userDoc.id,
            name: user.name,
            email: user.email,
            role: 'customer',
            address: user.address || {},
            location: user.location || null,
            token: generateToken(userDoc.id, 'customer')
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Login failed' });
    }
});
/* =====================================================
   🔑 FORGOT PASSWORD — Verify Email
   POST /api/auth/forgot-password
===================================================== */
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const snapshot = await usersCollection
            .where('email', '==', email)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ message: 'No account found with this email' });
        }

        res.json({ message: 'Email verified. You can now reset your password.' });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ message: 'Something went wrong' });
    }
});

/* =====================================================
   🔑 RESET PASSWORD — Update Password
   PUT /api/auth/reset-password
===================================================== */
router.put('/reset-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({ message: 'Email and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const snapshot = await usersCollection
            .where('email', '==', email)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ message: 'No account found with this email' });
        }

        const userDoc = snapshot.docs[0];
        await usersCollection.doc(userDoc.id).set(
            { password: newPassword },
            { merge: true }
        );

        res.json({ message: 'Password updated successfully' });

    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ message: 'Failed to reset password' });
    }
});

/* =====================================================
   👑 ADMIN REGISTER
   POST /api/auth/admin/register
===================================================== */
router.post('/admin/register', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        const existing = await adminsCollection
            .where('email', '==', email)
            .limit(1)
            .get();

        if (!existing.empty) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        const adminRef = await adminsCollection.add({
            name,
            email,
            password,
            phone: phone || '',
            role: 'admin',
            address: {
                flatHouse: '',
                areaStreet: '',
                city: '',
                state: '',
                zipCode: '',
                country: 'India'
            },
            location: null,
            createdAt: new Date()
        });

        res.status(201).json({
            _id: adminRef.id,
            name,
            email,
            role: 'admin',
            token: generateToken(adminRef.id, 'admin')
        });

    } catch (error) {
        console.error("Admin Register Error:", error);
        res.status(500).json({ message: 'Admin registration failed' });
    }
});

/* =====================================================
   👑 ADMIN LOGIN
   POST /api/auth/admin/login
===================================================== */
router.post('/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const snapshot = await adminsCollection
            .where('email', '==', email)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(401).json({ message: 'Invalid admin credentials' });
        }

        const adminDoc = snapshot.docs[0];
        const admin = adminDoc.data();

        if (password !== admin.password) {
            return res.status(401).json({ message: 'Invalid admin credentials' });
        }

        res.json({
            _id: adminDoc.id,
            name: admin.name,
            email: admin.email,
            role: 'admin',
            address: admin.address || {},
            location: admin.location || null,
            token: generateToken(adminDoc.id, 'admin')
        });

    } catch (error) {
        console.error("Admin Login Error:", error);
        res.status(500).json({ message: 'Admin login failed' });
    }
});

/* =====================================================
   👑 ADMIN FORGOT PASSWORD — Verify Email
   POST /api/auth/admin/forgot-password
===================================================== */
router.post('/admin/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const snapshot = await adminsCollection
            .where('email', '==', email)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ message: 'No admin account found with this email' });
        }

        res.json({ message: 'Email verified. You can now reset your password.' });

    } catch (error) {
        console.error("Admin Forgot Password Error:", error);
        res.status(500).json({ message: 'Something went wrong' });
    }
});

/* =====================================================
   👑 ADMIN RESET PASSWORD — Update Password
   PUT /api/auth/admin/reset-password
===================================================== */
router.put('/admin/reset-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({ message: 'Email and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const snapshot = await adminsCollection
            .where('email', '==', email)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ message: 'No admin account found with this email' });
        }

        const adminDoc = snapshot.docs[0];
        await adminsCollection.doc(adminDoc.id).set(
            { password: newPassword },
            { merge: true }
        );

        res.json({ message: 'Password updated successfully' });

    } catch (error) {
        console.error("Admin Reset Password Error:", error);
        res.status(500).json({ message: 'Failed to reset password' });
    }
});

/* =====================================================
   👤 GET PROFILE
   GET /api/auth/profile
===================================================== */
router.get('/profile', protect, async (req, res) => {
    try {
        let collection =
            req.user.role === 'admin'
                ? adminsCollection
                : usersCollection;

        let doc = await collection.doc(req.user._id).get();

        if (!doc.exists && req.user.role === 'admin') {
            doc = await usersCollection.doc(req.user._id).get();
        }

        if (!doc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }

        const data = doc.data();
        delete data.password;
        // Convert Firestore Timestamp to ISO string
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            data.createdAt = data.createdAt.toDate().toISOString();
        }

        res.json({ _id: doc.id, ...data });

    } catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({ message: 'Failed to get profile' });
    }
});

/* =====================================================
   ✏️ UPDATE PROFILE
   PUT /api/auth/profile
===================================================== */
router.put('/profile', protect, async (req, res) => {
    try {
        const { name, phone, address, password, location } = req.body;
        const updates = {};

        if (name !== undefined) updates.name = name;
        if (phone !== undefined) updates.phone = phone;
        if (address !== undefined) updates.address = address;

        // 🔥 Normalize location
        if (location?.latitude && location?.longitude) {
            updates.location = {
                lat: location.latitude,
                lng: location.longitude,
                updatedAt: new Date()
            };
        }

        if (password) {
            updates.password = password;
        }

        let collection =
            req.user.role === 'admin'
                ? adminsCollection
                : usersCollection;

        const check = await collection.doc(req.user._id).get();
        if (!check.exists && req.user.role === 'admin') {
            collection = usersCollection;
        }

        await collection.doc(req.user._id).set(updates, { merge: true });

        const updatedDoc = await collection.doc(req.user._id).get();
        const data = updatedDoc.data();
        delete data.password;
        // Convert Firestore Timestamp to ISO string
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            data.createdAt = data.createdAt.toDate().toISOString();
        }

        res.json({ _id: updatedDoc.id, ...data });

    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ message: 'Failed to update profile' });
    }
});

module.exports = router;