/**
 * Notification Service
 * Handles all notification business logic
 */

const notificationRepository = require('../../repositories/notificationRepository');
const logger = require('../../utils/logger');
const { NotFoundError, AuthorizationError, ValidationError } = require('../../errors');

class NotificationService {
  /**
   * Create notification
   */
  async createNotification(notificationData) {
    logger.debug('Creating notification', { userId: notificationData.user_id });

    const {
      user_id,
      type,
      title,
      message,
      action_url,
      related_id,
      related_type
    } = notificationData;

    if (!user_id || !type || !title || !message) {
      throw new ValidationError('user_id, type, title, and message are required');
    }

    const notification = await notificationRepository.create({
      user_id,
      type,
      title: title.trim(),
      message: message.trim(),
      action_url: action_url || null,
      related_id: related_id || null,
      related_type: related_type || null,
      is_read: false
    });

    logger.info('Notification created', { 
      userId: user_id, 
      notificationId: notification.id 
    });

    return notification;
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId, filters = {}) {
    logger.debug('Getting user notifications', { userId, filters });

    const {
      is_read,
      type,
      limit = 50,
      offset = 0
    } = filters;

    const notifications = await notificationRepository.findByUserId(userId, {
      is_read: is_read !== undefined ? is_read === 'true' || is_read === true : undefined,
      type,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return notifications;
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId) {
    logger.debug('Getting unread notification count', { userId });

    const count = await notificationRepository.countUnread(userId);

    return { unread_count: count };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    logger.debug('Marking notification as read', { notificationId, userId });

    // Verify ownership
    const notification = await notificationRepository.findById(notificationId);

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (notification.user_id !== userId) {
      throw new AuthorizationError('Not authorized to update this notification');
    }

    const updated = await notificationRepository.markAsRead(notificationId);

    logger.info('Notification marked as read', { userId, notificationId });

    return updated;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    logger.debug('Marking all notifications as read', { userId });

    const count = await notificationRepository.markAllAsReadForUser(userId);

    logger.info('All notifications marked as read', { userId, count });

    return { updated_count: count };
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId, userId) {
    logger.debug('Deleting notification', { notificationId, userId });

    // Verify ownership
    const notification = await notificationRepository.findById(notificationId);

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (notification.user_id !== userId) {
      throw new AuthorizationError('Not authorized to delete this notification');
    }

    await notificationRepository.delete(notificationId);

    logger.info('Notification deleted', { userId, notificationId });

    return { message: 'Notification deleted successfully' };
  }

  /**
   * Delete all read notifications for user
   */
  async deleteAllRead(userId) {
    logger.debug('Deleting all read notifications', { userId });

    const count = await notificationRepository.deleteAllReadForUser(userId);

    logger.info('All read notifications deleted', { userId, count });

    return { deleted_count: count };
  }

  /**
   * Send notification to multiple users
   */
  async sendBulkNotifications(userIds, notificationData) {
    logger.debug('Sending bulk notifications', { 
      userCount: userIds.length 
    });

    const { type, title, message, action_url, related_id, related_type } = notificationData;

    if (!type || !title || !message) {
      throw new ValidationError('type, title, and message are required');
    }

    const notifications = [];

    for (const userId of userIds) {
      try {
        const notification = await this.createNotification({
          user_id: userId,
          type,
          title,
          message,
          action_url,
          related_id,
          related_type
        });
        notifications.push(notification);
      } catch (error) {
        logger.error('Failed to create notification for user', error, { userId });
        // Continue with other users
      }
    }

    logger.info('Bulk notifications sent', { 
      total: userIds.length, 
      successful: notifications.length 
    });

    return {
      total: userIds.length,
      successful: notifications.length,
      failed: userIds.length - notifications.length
    };
  }
}

module.exports = new NotificationService();
