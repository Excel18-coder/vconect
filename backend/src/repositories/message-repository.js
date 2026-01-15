/**
 * Message Repository
 * Handles all database operations for messages
 */

const { sql } = require("../config/database");
const logger = require("../utils/logger");

class MessageRepository {
  /**
   * Create message
   */
  async create(messageData) {
    try {
      const result = await sql`
        INSERT INTO messages (
          sender_id, receiver_id, listing_id, subject, message
        )
        VALUES (
          ${messageData.sender_id}, 
          ${messageData.receiver_id}, 
          ${messageData.listing_id},
          ${messageData.subject}, 
          ${messageData.message}
        )
        RETURNING *
      `;

      logger.debug("Message created in database", { messageId: result[0]?.id });
      return result[0];
    } catch (error) {
      // Check if error is because table doesn't exist
      if (error.message && error.message.includes("does not exist")) {
        logger.error(
          "Messages table does not exist. Please run database migration.",
          error
        );
        throw new Error(
          "Messaging system is not yet set up. Please contact support."
        );
      }
      logger.error("Failed to create message", error, messageData);
      throw error;
    }
  }

  /**
   * Find message by ID
   */
  async findById(messageId) {
    try {
      const result = await sql`
        SELECT * FROM messages
        WHERE id = ${messageId}
        LIMIT 1
      `;

      return result[0] || null;
    } catch (error) {
      logger.error("Failed to find message", error, { messageId });
      throw error;
    }
  }

  /**
   * Find message by ID with sender/receiver details
   */
  async findByIdWithDetails(messageId) {
    try {
      const result = await sql`
        SELECT 
          m.*,
          sender_prof.display_name as sender_name,
          sender_prof.avatar_url as sender_avatar,
          sender_prof.phone_number as sender_phone_number,
          sender_user.email as sender_email,
          receiver_prof.display_name as receiver_name,
          receiver_prof.avatar_url as receiver_avatar,
          receiver_prof.phone_number as receiver_phone_number,
          receiver_user.email as receiver_email
        FROM messages m
        JOIN profiles sender_prof ON m.sender_id = sender_prof.user_id
        JOIN users sender_user ON m.sender_id = sender_user.id
        JOIN profiles receiver_prof ON m.receiver_id = receiver_prof.user_id
        JOIN users receiver_user ON m.receiver_id = receiver_user.id
        WHERE m.id = ${messageId}
        LIMIT 1
      `;

      return result[0] || null;
    } catch (error) {
      logger.error("Failed to find message with details", error, { messageId });
      throw error;
    }
  }

  /**
   * Find messages by user ID (inbox and sent)
   */
  async findByUserId(userId, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;

      const result = await sql`
        SELECT 
          m.*,
          sender_prof.display_name as sender_name,
          sender_prof.avatar_url as sender_avatar,
          sender_prof.phone_number as sender_phone_number,
          sender_user.email as sender_email,
          receiver_prof.display_name as receiver_name,
          receiver_prof.avatar_url as receiver_avatar,
          receiver_prof.phone_number as receiver_phone_number,
          receiver_user.email as receiver_email
        FROM messages m
        JOIN profiles sender_prof ON m.sender_id = sender_prof.user_id
        JOIN users sender_user ON m.sender_id = sender_user.id
        JOIN profiles receiver_prof ON m.receiver_id = receiver_prof.user_id
        JOIN users receiver_user ON m.receiver_id = receiver_user.id
        WHERE (m.sender_id = ${userId} OR m.receiver_id = ${userId})
        ORDER BY m.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      return result;
    } catch (error) {
      // Check if error is because table doesn't exist
      if (error.message && error.message.includes("does not exist")) {
        logger.warn("Messages table does not exist, returning empty array", {
          userId,
        });
        return [];
      }
      logger.error("Failed to find messages by user", error, { userId });
      throw error;
    }
  }

  /**
   * Get conversation between two users
   */
  async getConversation(userId1, userId2, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;

      const result = await sql`
        SELECT 
          m.*,
          sender_prof.display_name as sender_name,
          sender_prof.avatar_url as sender_avatar,
          sender_prof.phone_number as sender_phone_number,
          sender_user.email as sender_email,
          receiver_prof.display_name as receiver_name,
          receiver_prof.avatar_url as receiver_avatar,
          receiver_prof.phone_number as receiver_phone_number,
          receiver_user.email as receiver_email
        FROM messages m
        JOIN profiles sender_prof ON m.sender_id = sender_prof.user_id
        JOIN users sender_user ON m.sender_id = sender_user.id
        JOIN profiles receiver_prof ON m.receiver_id = receiver_prof.user_id
        JOIN users receiver_user ON m.receiver_id = receiver_user.id
        WHERE (
          (m.sender_id = ${userId1} AND m.receiver_id = ${userId2}) OR 
          (m.sender_id = ${userId2} AND m.receiver_id = ${userId1})
        )
        ORDER BY m.created_at ASC
        LIMIT ${limit} OFFSET ${offset}
      `;

      return result;
    } catch (error) {
      // Check if error is because table doesn't exist
      if (error.message && error.message.includes("does not exist")) {
        logger.warn("Messages table does not exist, returning empty array", {
          userId1,
          userId2,
        });
        return [];
      }
      logger.error("Failed to get conversation", error, { userId1, userId2 });
      throw error;
    }
  }

  /**
   * Get conversation list (unique users with last message)
   */
  async getConversationList(userId) {
    try {
      const result = await sql`
        WITH latest_messages AS (
          SELECT DISTINCT ON (
            CASE 
              WHEN sender_id = ${userId} THEN receiver_id
              ELSE sender_id
            END
          )
          *,
          CASE 
            WHEN sender_id = ${userId} THEN receiver_id
            ELSE sender_id
          END as other_user_id
          FROM messages
          WHERE (sender_id = ${userId} OR receiver_id = ${userId})
          ORDER BY 
            CASE 
              WHEN sender_id = ${userId} THEN receiver_id
              ELSE sender_id
            END,
            created_at DESC
        )
        SELECT 
          lm.*,
          p.display_name as other_user_name,
          p.avatar_url as other_user_avatar,
          p.phone_number as other_user_phone_number,
          u.email as other_user_email,
          (SELECT COUNT(*) FROM messages 
           WHERE receiver_id = ${userId} 
           AND sender_id = lm.other_user_id 
           AND is_read = false)::INTEGER as unread_count
        FROM latest_messages lm
        JOIN profiles p ON lm.other_user_id = p.user_id
        JOIN users u ON lm.other_user_id = u.id
        ORDER BY lm.created_at DESC
      `;

      return result;
    } catch (error) {
      logger.error("Failed to get conversation list", error, { userId });
      throw error;
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId) {
    try {
      const result = await sql`
        UPDATE messages
        SET is_read = true
        WHERE id = ${messageId}
        RETURNING *
      `;

      logger.debug("Message marked as read in database", { messageId });
      return result[0] || null;
    } catch (error) {
      logger.error("Failed to mark message as read", error, { messageId });
      throw error;
    }
  }

  /**
   * Count unread messages for user
   */
  async countUnread(userId) {
    try {
      const result = await sql`
        SELECT COUNT(*)::INTEGER as count
        FROM messages
        WHERE receiver_id = ${userId} AND is_read = false
      `;

      return result[0]?.count || 0;
    } catch (error) {
      logger.error("Failed to count unread messages", error, { userId });
      throw error;
    }
  }

  /**
   * Soft delete message for user
   */
  async softDelete(messageId, userId) {
    try {
      await sql`
        DELETE FROM messages
        WHERE id = ${messageId}
          AND (sender_id = ${userId} OR receiver_id = ${userId})
      `;

      logger.debug("Message deleted in database", { messageId, userId });
      return true;
    } catch (error) {
      logger.error("Failed to soft delete message", error, {
        messageId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Hard delete message (cleanup job)
   */
  async hardDelete(messageId) {
    try {
      await sql`
        DELETE FROM messages
        WHERE id = ${messageId}
      `;

      logger.debug("Message hard deleted from database", { messageId });
      return true;
    } catch (error) {
      logger.error("Failed to hard delete message", error, { messageId });
      throw error;
    }
  }

  /**
   * Delete old messages (cleanup job)
   */
  async deleteOlderThan(days) {
    try {
      const result = await sql`
        DELETE FROM messages
        WHERE created_at < NOW() - INTERVAL '${days} days'
      `;

      logger.debug("Old messages deleted", { days, count: result.count });
      return result.count;
    } catch (error) {
      logger.error("Failed to delete old messages", error, { days });
      throw error;
    }
  }
}

module.exports = new MessageRepository();
