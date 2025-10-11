const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const buyerController = require('../controllers/buyerController');

// Wishlist routes
router.post('/wishlists', authenticateToken, buyerController.createWishlist);
router.get('/wishlists', authenticateToken, buyerController.getUserWishlists);
router.post('/wishlists/items', authenticateToken, buyerController.addToWishlist);
router.get('/wishlists/:id/items', authenticateToken, buyerController.getWishlistItems);
router.delete('/wishlists/items/:id', authenticateToken, buyerController.removeFromWishlist);
router.put('/wishlists/:id', authenticateToken, buyerController.updateWishlist);
router.delete('/wishlists/:id', authenticateToken, buyerController.deleteWishlist);

// Notification routes
router.get('/notifications', authenticateToken, buyerController.getNotifications);
router.get('/notifications/unread-count', authenticateToken, buyerController.getUnreadCount);
router.patch('/notifications/:id/read', authenticateToken, buyerController.markNotificationAsRead);
router.patch('/notifications/mark-all-read', authenticateToken, buyerController.markAllNotificationsAsRead);
router.delete('/notifications/:id', authenticateToken, buyerController.deleteNotification);

// Message routes
router.post('/messages', authenticateToken, buyerController.sendMessage);
router.get('/messages', authenticateToken, buyerController.getUserMessages);
router.get('/messages/conversations', authenticateToken, buyerController.getConversations);
router.get('/messages/:id', authenticateToken, buyerController.getMessage);
router.patch('/messages/:id/read', authenticateToken, buyerController.markMessageAsRead);
router.delete('/messages/:id', authenticateToken, buyerController.deleteMessage);
router.post('/messages/:id/reply', authenticateToken, buyerController.replyToMessage);

// Review routes
router.post('/reviews', authenticateToken, buyerController.createReview);
router.get('/reviews/user/:id', buyerController.getUserReviews);
router.get('/reviews/user/:id/stats', buyerController.getReviewStats);
router.put('/reviews/:id', authenticateToken, buyerController.updateReview);
router.delete('/reviews/:id', authenticateToken, buyerController.deleteReview);
router.post('/reviews/:id/report', authenticateToken, buyerController.reportReview);

module.exports = router;
