/**
 * Token Repository
 * Handles all database operations for user sessions and refresh tokens
 */

const { sql } = require('../config/database');
const logger = require('../utils/logger');

class TokenRepository {
  /**
   * Create new refresh token session
   */
  async create(sessionData) {
    try {
      const result = await sql`
        INSERT INTO user_sessions (user_id, refresh_token, expires_at)
        VALUES (${sessionData.user_id}, ${sessionData.refresh_token}, ${sessionData.expires_at})
        RETURNING id, user_id, expires_at, created_at
      `;
      
      logger.debug('Session created in database', { userId: sessionData.user_id });
      return result[0];
    } catch (error) {
      logger.error('Failed to create session', error, { userId: sessionData.user_id });
      throw error;
    }
  }

  /**
   * Find session by refresh token
   */
  async findByRefreshToken(refreshToken) {
    try {
      const result = await sql`
        SELECT id, user_id, refresh_token, expires_at, created_at
        FROM user_sessions 
        WHERE refresh_token = ${refreshToken}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find session by refresh token', error);
      throw error;
    }
  }

  /**
   * Find all sessions for a user
   */
  async findByUserId(userId) {
    try {
      const result = await sql`
        SELECT id, user_id, refresh_token, expires_at, created_at
        FROM user_sessions 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `;
      
      return result;
    } catch (error) {
      logger.error('Failed to find sessions by user ID', error, { userId });
      throw error;
    }
  }

  /**
   * Delete session by refresh token
   */
  async deleteByRefreshToken(refreshToken) {
    try {
      const result = await sql`
        DELETE FROM user_sessions 
        WHERE refresh_token = ${refreshToken}
      `;
      
      logger.debug('Session deleted by refresh token');
      return result.count;
    } catch (error) {
      logger.error('Failed to delete session by refresh token', error);
      throw error;
    }
  }

  /**
   * Delete all sessions for a user
   */
  async deleteByUserId(userId) {
    try {
      const result = await sql`
        DELETE FROM user_sessions 
        WHERE user_id = ${userId}
      `;
      
      logger.debug('All sessions deleted for user', { userId });
      return result.count;
    } catch (error) {
      logger.error('Failed to delete sessions by user ID', error, { userId });
      throw error;
    }
  }

  /**
   * Delete expired sessions (for cleanup jobs)
   */
  async deleteExpired() {
    try {
      const result = await sql`
        DELETE FROM user_sessions 
        WHERE expires_at < NOW()
      `;
      
      logger.debug('Expired sessions deleted', { count: result.count });
      return result.count;
    } catch (error) {
      logger.error('Failed to delete expired sessions', error);
      throw error;
    }
  }

  /**
   * Count active sessions for a user
   */
  async countByUserId(userId) {
    try {
      const result = await sql`
        SELECT COUNT(*) as count
        FROM user_sessions 
        WHERE user_id = ${userId} AND expires_at > NOW()
      `;
      
      return parseInt(result[0].count);
    } catch (error) {
      logger.error('Failed to count user sessions', error, { userId });
      throw error;
    }
  }

  /**
   * Update session expiry
   */
  async updateExpiry(refreshToken, newExpiresAt) {
    try {
      const result = await sql`
        UPDATE user_sessions 
        SET expires_at = ${newExpiresAt}
        WHERE refresh_token = ${refreshToken}
        RETURNING id, user_id, expires_at
      `;
      
      if (result.length > 0) {
        logger.debug('Session expiry updated', { userId: result[0].user_id });
      }
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to update session expiry', error);
      throw error;
    }
  }
}

module.exports = new TokenRepository();
