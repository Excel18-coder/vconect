const express = require('express');
const router = express.Router();
const multer = require('multer');

const {
  createProduct,
  getSellerProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  browseProducts,
  addToFavorites,
  removeFromFavorites,
  getFavorites,
} = require('../controllers/product-controller');

const { authenticateToken, optionalAuth } = require('../middleware/auth');
const {
  validateProductCreation,
  validateProductUpdate,
  handleValidationErrors,
} = require('../utils/validation');

// Configure multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 8, // Max 8 images
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
    }
  },
});

// Public routes (no authentication required)
router.get('/browse', optionalAuth, browseProducts); // Browse all products with optional user context
router.get('/:id', optionalAuth, getProduct); // Get single product details

// Protected routes (authentication required)
router.use(authenticateToken);

// Seller routes for managing their products
router.post('/', upload.array('images', 8), createProduct); // Create new product with image upload
router.get('/seller/my-products', getSellerProducts); // Get seller's products
router.put('/:id', upload.array('images', 8), updateProduct); // Update product with image upload
router.delete('/:id', deleteProduct); // Delete product

// Buyer routes for favorites
router.get('/favorites/my-list', getFavorites); // Get user's favorites
router.post('/:id/favorite', addToFavorites); // Add to favorites
router.delete('/:id/favorite', removeFromFavorites); // Remove from favorites

module.exports = router;
