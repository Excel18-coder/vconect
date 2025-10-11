/**
 * Notification Repository
 * Handles all database operations for notifications
 */

const { sql } = require('../config/database');
const logger = require('../utils/logger');

class NotificationRepository {
  /**
   * Create notification
   */
  async create(notificationData) {
    try {
      const result = await sql`
        INSERT INTO notifications (
          user_id, type, title, message, action_url, 
          related_id, related_type, is_read
        )
        VALUES (
          ${notificationData.user_id}, 
          ${notificationData.type}, 
          ${notificationData.title}, 
          ${notificationData.message}, 
          ${notificationData.action_url},
          ${notificationData.related_id},
          ${notificationData.related_type},
          ${notificationData.is_read}
        )
        RETURNING *
      `;
      
      logger.debug('Notification created in database', { 
        notificationId: result[0]?.id 
      });
      return result[0];
    } catch (error) {
      logger.error('Failed to create notification', error, { 
        userId: notificationData.user_id 
      });
      throw error;
    }
  }

  /**
   * Find notification by ID
   */
  async findById(notificationId) {
    try {
      const result = await sql`
        SELECT * FROM notifications
        WHERE id = ${notificationId}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find notification', error, { notificationId });
      throw error;
    }
  }

  /**
   * Find notifications by user ID with filters
   */
  async findByUserId(userId, filters = {}) {
    try {
      const { is_read, type, limit = 50, offset = 0 } = filters;

      let query = sql`
        SELECT * FROM notifications
        WHERE user_id = ${userId}
      `;

      // Add filters
      if (is_read !== undefined) {
        query = sql`${query} AND is_read = ${is_read}`;
      }

      if (type) {
        query = sql`${query} AND type = ${type}`;
      }

      query = sql`
        ${query}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const result = await query;
      return result;
    } catch (error) {
      logger.error('Failed to find notifications by user', error, { userId });
      throw error;
    }
  }

  /**
   * Count unread notifications for user
   */
  async countUnread(userId) {
    try {
      const result = await sql`
        SELECT COUNT(*)::INTEGER as count
        FROM notifications
        WHERE user_id = ${userId} AND is_read = false
      `;
      
      return result[0]?.count || 0;
    } catch (error) {
      logger.error('Failed to count unread notifications', error, { userId });
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    try {
      const result = await sql`
        UPDATE notifications
        SET is_read = true, read_at = NOW()
        WHERE id = ${notificationId}
        RETURNING *
      `;
      
      logger.debug('Notification marked as read in database', { notificationId });
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to mark notification as read', error, { notificationId });
      throw error;
    }
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsReadForUser(userId) {
    try {
      const result = await sql`
        UPDATE notifications
        SET is_read = true, read_at = NOW()
        WHERE user_id = ${userId} AND is_read = false
      `;
      
      logger.debug('All notifications marked as read in database', { 
        userId, 
        count: result.count 
      });
      return result.count;
    } catch (error) {
      logger.error('Failed to mark all notifications as read', error, { userId });
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async delete(notificationId) {
    try {
      await sql`
        DELETE FROM notifications
        WHERE id = ${notificationId}
      `;
      
      logger.debug('Notification deleted from database', { notificationId });
      return true;
    } catch (error) {
      logger.error('Failed to delete notification', error, { notificationId });
      throw error;
    }
  }

  /**
   * Delete all read notifications for user
   */
  async deleteAllReadForUser(userId) {
    try {
      const result = await sql`
        DELETE FROM notifications
        WHERE user_id = ${userId} AND is_read = true
      `;
      
      logger.debug('All read notifications deleted from database', { 
        userId, 
        count: result.count 
      });
      return result.count;
    } catch (error) {
      logger.error('Failed to delete all read notifications', error, { userId });
      throw error;
    }
  }

  /**
   * Delete old notifications (for cleanup jobs)
   */
  async deleteOlderThan(days) {
    try {
      const result = await sql`
        DELETE FROM notifications
        WHERE created_at < NOW() - INTERVAL '${days} days'
        AND is_read = true
      `;
      
      logger.debug('Old notifications deleted', { days, count: result.count });
      return result.count;
    } catch (error) {
      logger.error('Failed to delete old notifications', error, { days });
      throw error;
    }
  }

  /**
   * Get notification statistics for user
   */
  async getStats(userId) {
    try {
      const result = await sql`
        SELECT 
          COUNT(*)::INTEGER as total,
          COUNT(CASE WHEN is_read = false THEN 1 END)::INTEGER as unread,
          COUNT(CASE WHEN is_read = true THEN 1 END)::INTEGER as read,
          COUNT(CASE WHEN type = 'message' THEN 1 END)::INTEGER as messages,
          COUNT(CASE WHEN type = 'alert' THEN 1 END)::INTEGER as alerts,
          COUNT(CASE WHEN type = 'reminder' THEN 1 END)::INTEGER as reminders
        FROM notifications
        WHERE user_id = ${userId}
      `;
      
      return result[0];
    } catch (error) {
      logger.error('Failed to get notification stats', error, { userId });
      throw error;
    }
  }
}

module.exports = new NotificationRepository();
