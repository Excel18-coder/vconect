const { wishlistService, notificationService, messageService, reviewService } = require('../services/buyers');
const { 
  sendSuccess, 
  sendError, 
  sendCreated, 
  sendNotFound 
} = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

// ============= WISHLIST =============

const createWishlist = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { name, description, is_public = false } = req.body;

  const wishlist = await wishlistService.createWishlist(userId, { name, description, is_public });
  return sendCreated(res, 'Wishlist created', { wishlist });
});

const getUserWishlists = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const wishlists = await wishlistService.getUserWishlists(userId);
  return sendSuccess(res, 'Wishlists retrieved', { wishlists });
});

const addToWishlist = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { wishlist_id, item_type, item_id } = req.body;

  const item = await wishlistService.addItemToWishlist(userId, { wishlist_id, item_type, item_id });
  return sendCreated(res, 'Item added to wishlist', { item });
});

const getWishlistItems = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const items = await wishlistService.getWishlistItems(id, userId);
  return sendSuccess(res, 'Wishlist items retrieved', { items });
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  await wishlistService.removeItemFromWishlist(id, userId);
  return sendSuccess(res, 'Item removed from wishlist');
});

const updateWishlist = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const updateData = req.body;

  const wishlist = await wishlistService.updateWishlist(id, userId, updateData);
  return sendSuccess(res, 'Wishlist updated', { wishlist });
});

const deleteWishlist = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  await wishlistService.deleteWishlist(id, userId);
  return sendSuccess(res, 'Wishlist deleted');
});

// ============= NOTIFICATIONS =============

const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { type, is_read, page = 1, limit = 20 } = req.query;

  const result = await notificationService.getUserNotifications(userId, {
    type,
    is_read: is_read === 'true' ? true : is_read === 'false' ? false : undefined,
    page: parseInt(page),
    limit: parseInt(limit)
  });

  return sendSuccess(res, 'Notifications retrieved', result);
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const count = await notificationService.getUnreadCount(userId);
  return sendSuccess(res, 'Unread count retrieved', { count });
});

const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const notification = await notificationService.markAsRead(id, userId);
  return sendSuccess(res, 'Notification marked as read', { notification });
});

const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  await notificationService.markAllAsRead(userId);
  return sendSuccess(res, 'All notifications marked as read');
});

const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  await notificationService.deleteNotification(id, userId);
  return sendSuccess(res, 'Notification deleted');
});

// ============= MESSAGES =============

const sendMessage = asyncHandler(async (req, res) => {
  const senderId = req.user.id;
  const { receiver_id, subject, message_body, attachment_url } = req.body;

  const message = await messageService.sendMessage(senderId, {
    receiver_id,
    subject,
    message_body,
    attachment_url
  });

  return sendCreated(res, 'Message sent', { message });
});

const getUserMessages = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { conversation_with, page = 1, limit = 20 } = req.query;

  const result = await messageService.getUserMessages(userId, {
    conversation_with,
    page: parseInt(page),
    limit: parseInt(limit)
  });

  return sendSuccess(res, 'Messages retrieved', result);
});

const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const conversations = await messageService.getConversationList(userId);
  return sendSuccess(res, 'Conversations retrieved', { conversations });
});

const getMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const message = await messageService.getMessage(id, userId);
  return sendSuccess(res, 'Message retrieved', { message });
});

const markMessageAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const message = await messageService.markAsRead(id, userId);
  return sendSuccess(res, 'Message marked as read', { message });
});

const deleteMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  await messageService.deleteMessage(id, userId);
  return sendSuccess(res, 'Message deleted');
});

const replyToMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { message_body, attachment_url } = req.body;

  const message = await messageService.replyToMessage(id, userId, {
    message_body,
    attachment_url
  });

  return sendCreated(res, 'Reply sent', { message });
});

// ============= REVIEWS =============

const createReview = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { review_type, target_user_id, rating, comment } = req.body;

  const review = await reviewService.createReview(userId, {
    review_type,
    target_user_id,
    rating,
    comment
  });

  return sendCreated(res, 'Review submitted', { review });
});

const getUserReviews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { review_type, page = 1, limit = 20 } = req.query;

  const result = await reviewService.getUserReviews(id, {
    review_type,
    page: parseInt(page),
    limit: parseInt(limit)
  });

  return sendSuccess(res, 'Reviews retrieved', result);
});

const getReviewStats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { review_type } = req.query;

  const stats = await reviewService.getReviewStats(id, review_type);
  return sendSuccess(res, 'Review stats retrieved', { stats });
});

const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { rating, comment } = req.body;

  const review = await reviewService.updateReview(id, userId, { rating, comment });
  return sendSuccess(res, 'Review updated', { review });
});

const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  await reviewService.deleteReview(id, userId);
  return sendSuccess(res, 'Review deleted');
});

const reportReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { reason } = req.body;

  const review = await reviewService.reportReview(id, userId, reason);
  return sendSuccess(res, 'Review reported', { review });
});

module.exports = {
  // Wishlists
  createWishlist,
  getUserWishlists,
  addToWishlist,
  getWishlistItems,
  removeFromWishlist,
  updateWishlist,
  deleteWishlist,
  
  // Notifications
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  
  // Messages
  sendMessage,
  getUserMessages,
  getConversations,
  getMessage,
  markMessageAsRead,
  deleteMessage,
  replyToMessage,
  
  // Reviews
  createReview,
  getUserReviews,
  getReviewStats,
  updateReview,
  deleteReview,
  reportReview
};
