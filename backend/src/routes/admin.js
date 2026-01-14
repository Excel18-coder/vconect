/**
 * Admin Routes
 * Protected routes for admin operations
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole(['admin']));

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/activity', adminController.getActivityLogs);
router.get('/stats/platform', adminController.getPlatformStats);

// User Management
router.get('/users', adminController.getUsers);
router.patch('/users/:id/role', adminController.updateUserRole);
router.patch('/users/:id/suspend', adminController.suspendUser);
router.patch('/users/:id/verify', adminController.verifyUser);

// Product Management
router.get('/products', adminController.getProducts);
router.patch('/products/:id/status', adminController.updateProductStatus);
router.patch('/products/:id/featured', adminController.toggleFeaturedProduct);
router.delete('/products/:id', adminController.deleteProduct);
router.post('/products/bulk-delete', adminController.bulkDeleteProducts);
router.post('/products/bulk-status', adminController.bulkUpdateProductStatus);

// Message Management
router.get('/messages', adminController.getMessages);
router.delete('/messages/:id', adminController.deleteMessage);

// Category Management
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.patch('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

module.exports = router;
