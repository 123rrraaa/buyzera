const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (fs.existsSync(serviceAccountPath)) {
    // Use service account key file if it exists
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('🔥 Firebase initialized with service account key');
} else {
    // Fallback: initialize with project ID only (for environments with default credentials)
    admin.initializeApp({
        projectId: 'buyzera-ecommerce'
    });
    console.log('🔥 Firebase initialized with default project ID');
}

const db = admin.firestore();

// Collections
const usersCollection = db.collection('users');
const adminsCollection = db.collection('admins');
const productsCollection = db.collection('products');
const ordersCollection = db.collection('orders');
const cartsCollection = db.collection('carts');

module.exports = { admin, db, usersCollection, adminsCollection, productsCollection, ordersCollection, cartsCollection };
