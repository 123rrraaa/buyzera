const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../cloudinary');
const { protect, adminOnly } = require('../middleware/auth');

// Multer memory storage (no files saved to disk)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// POST /api/upload — Upload image to Cloudinary (admin only)
router.post('/', protect, adminOnly, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        // Upload buffer to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'buyzera/products',
                    resource_type: 'image',
                    transformation: [
                        { width: 800, height: 800, crop: 'limit', quality: 'auto' }
                    ]
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(req.file.buffer);
        });

        res.json({
            url: result.secure_url,
            public_id: result.public_id,
            message: 'Image uploaded successfully'
        });
    } catch (error) {
        res.status(500).json({ message: 'Image upload failed', error: error.message });
    }
});

module.exports = router;
