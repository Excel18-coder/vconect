const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const buyerController = require('../controllers/buyer-controller');

// Message routes
router.post('/messages', authenticateToken, buyerController.sendMessage);
router.get('/messages', authenticateToken, buyerController.getUserMessages);
router.get('/messages/conversations', authenticateToken, buyerController.getConversations);
router.get('/messages/:id', authenticateToken, buyerController.getMessage);
router.patch('/messages/:id/read', authenticateToken, buyerController.markMessageAsRead);
router.delete('/messages/:id', authenticateToken, buyerController.deleteMessage);
router.post('/messages/:id/reply', authenticateToken, buyerController.replyToMessage);

module.exports = router;
