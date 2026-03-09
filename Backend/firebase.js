const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
const renderSecretPath = '/etc/secrets/serviceAccountKey.json';

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Use environment variable (for Render/cloud deployment)
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('🔥 Firebase initialized with env service account');
} else if (fs.existsSync(renderSecretPath)) {
    // Use Render Secret File
    const serviceAccount = JSON.parse(fs.readFileSync(renderSecretPath, 'utf8'));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('🔥 Firebase initialized with Render secret file');
} else if (fs.existsSync(serviceAccountPath)) {
    // Use service account key file if it exists (local dev)
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
