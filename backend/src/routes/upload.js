const express = require('express');
const router = express.Router();

const uploadController = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');

// All upload routes require authentication
router.use(authenticateToken);

// Upload routes (these are middleware arrays from the controller)
router.post('/image', ...uploadController.uploadSingleImage);
router.post('/images', ...uploadController.uploadMultipleImages);
router.post('/avatar', ...uploadController.uploadAvatar);
router.post('/product-images', ...uploadController.uploadProductImages);
router.post('/listing-images', ...uploadController.uploadMultipleImages); // Alias for product images
router.post('/document', ...uploadController.uploadDocument);
router.post('/documents', ...uploadController.uploadMultipleDocuments);

// Delete routes
router.delete('/image', uploadController.deleteImage);
router.delete('/images', uploadController.deleteMultipleImages);

module.exports = router;
