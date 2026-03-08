const jwt = require('jsonwebtoken');
const { usersCollection, adminsCollection } = require('../firebase');

// Verify JWT token
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check the correct collection based on the role stored in the JWT
            let userDoc;
            if (decoded.role === 'admin') {
                userDoc = await adminsCollection.doc(decoded.id).get();
                // Fallback: check old users collection for admins created before separation
                if (!userDoc.exists) {
                    userDoc = await usersCollection.doc(decoded.id).get();
                }
            } else {
                userDoc = await usersCollection.doc(decoded.id).get();
            }

            if (!userDoc.exists) {
                return res.status(401).json({ message: 'User not found' });
            }
            req.user = { _id: userDoc.id, ...userDoc.data() };
            delete req.user.password;
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Admin-only guard
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
};

module.exports = { protect, adminOnly };
