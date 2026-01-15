/**
 * User Repository
 * Handles all database operations for users
 */

const { sql } = require('../config/database');
const logger = require('../utils/logger');
const { NotFoundError } = require('../errors');

class UserRepository {
  /**
   * Find user by ID
   */
  async findById(userId) {
    try {
      const result = await sql`
        SELECT 
          u.id,
          u.email,
          u.created_at,
          p.display_name,
          p.avatar_url,
          p.phone_number,
          p.location,
          p.bio
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.id = ${userId}
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find user by ID', error, { userId });
      throw error;
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    try {
      const result = await sql`
        SELECT * FROM users
        WHERE email = ${email}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find user by email', error, { email });
      throw error;
    }
  }

  /**
   * Find user by email with password hash (for authentication)
   */
  async findByEmailWithPassword(email) {
    try {
      const result = await sql`
        SELECT id, email, password_hash, created_at
        FROM users
        WHERE email = ${email}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find user by email with password', error, { email });
      throw error;
    }
  }

  /**
   * Find user by ID with profile
   */
  async findByIdWithProfile(userId) {
    try {
      const result = await sql`
        SELECT 
          u.id, u.email, u.created_at,
          p.display_name, p.avatar_url, p.bio, p.user_type, 
          p.phone_number, p.location, p.created_at as profile_created_at
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.id = ${userId}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find user by ID with profile', error, { userId });
      throw error;
    }
  }

  /**
   * Find user by verification token
   */
  async findByVerificationToken(token) {
    try {
      const result = await sql`
        SELECT id, email, verification_token
        FROM users
        WHERE verification_token = ${token}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find user by verification token', error);
      throw error;
    }
  }

  /**
   * Find user by password reset token
   */
  async findByResetToken(token) {
    try {
      const result = await sql`
        SELECT id, email, reset_password_token, reset_password_expires
        FROM users
        WHERE reset_password_token = ${token}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find user by reset token', error);
      throw error;
    }
  }

  /**
   * Create new user
   */
  async create(userData) {
    try {
      const result = await sql`
        INSERT INTO users (email, password_hash, verification_token)
        VALUES (
          ${userData.email}, 
          ${userData.password_hash}, 
          ${userData.verification_token || null}
        )
        RETURNING id, email, created_at
      `;
      
      logger.debug('User created in database', { userId: result[0]?.id });
      return result[0];
    } catch (error) {
      logger.error('Failed to create user', error, { email: userData.email });
      throw error;
    }
  }

  /**
   * Create user profile
   */
  async createProfile(userId, profileData) {
    try {
      const result = await sql`
        INSERT INTO profiles (user_id, display_name, user_type)
        VALUES (${userId}, ${profileData.display_name}, ${profileData.user_type || 'buyer'})
        RETURNING *
      `;
      
      logger.debug('Profile created in database', { userId });
      return result[0];
    } catch (error) {
      logger.error('Failed to create profile', error, { userId });
      throw error;
    }
  }

  /**
   * Update user
   */
  async update(userId, updateData) {
    try {
      const result = await sql`
        UPDATE users 
        SET ${sql(updateData)}, updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id, email, updated_at
      `;
      
      if (result.length === 0) {
        throw new NotFoundError('User', userId);
      }
      
      logger.debug('User updated in database', { userId });
      return result[0];
    } catch (error) {
      logger.error('Failed to update user', error, { userId });
      throw error;
    }
  }

  /**
   * Get or create profile
   */
  async getOrCreateProfile(userId) {
    try {
      // Check if profile exists
      let result = await sql`
        SELECT * FROM profiles
        WHERE user_id = ${userId}
      `;
      
      if (result.length > 0) {
        return result[0];
      }
      
      // Create profile if doesn't exist
      result = await sql`
        INSERT INTO profiles (user_id)
        VALUES (${userId})
        RETURNING *
      `;
      
      logger.debug('Profile created in database', { userId });
      return result[0];
    } catch (error) {
      logger.error('Failed to get or create profile', error, { userId });
      throw error;
    }
  }

  /**
   * Update profile
   */
  async updateProfile(userId, profileData) {
    try {
      const result = await sql`
        UPDATE profiles
        SET ${sql(profileData)}, updated_at = NOW()
        WHERE user_id = ${userId}
        RETURNING *
      `;
      
      if (result.length === 0) {
        throw new NotFoundError('Profile', userId);
      }
      
      logger.debug('Profile updated in database', { userId });
      return result[0];
    } catch (error) {
      logger.error('Failed to update profile', error, { userId });
      throw error;
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(userId) {
    try {
      const result = await sql`
        UPDATE users
        SET verification_token = NULL, updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id, email
      `;
      
      logger.debug('User email verified', { userId });
      return result[0];
    } catch (error) {
      logger.error('Failed to verify email', error, { userId });
      throw error;
    }
  }

  /**
   * Set password reset token
   */
  async setPasswordResetToken(userId, resetToken, resetExpires) {
    try {
      const result = await sql`
        UPDATE users
        SET reset_password_token = ${resetToken}, 
            reset_password_expires = ${resetExpires},
            updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id, email
      `;
      
      logger.debug('Password reset token set', { userId });
      return result[0];
    } catch (error) {
      logger.error('Failed to set password reset token', error, { userId });
      throw error;
    }
  }

  /**
   * Update user password
   */
  async updatePassword(userId, passwordHash) {
    try {
      const result = await sql`
        UPDATE users
        SET password_hash = ${passwordHash}, updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id, email
      `;
      
      logger.debug('User password updated', { userId });
      return result[0];
    } catch (error) {
      logger.error('Failed to update password', error, { userId });
      throw error;
    }
  }

  /**
   * Clear password reset token
   */
  async clearPasswordResetToken(userId) {
    try {
      const result = await sql`
        UPDATE users
        SET reset_password_token = NULL, 
            reset_password_expires = NULL,
            updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id, email
      `;
      
      logger.debug('Password reset token cleared', { userId });
      return result[0];
    } catch (error) {
      logger.error('Failed to clear password reset token', error, { userId });
      throw error;
    }
  }

  /**
   * Delete user (soft delete or hard delete based on requirements)
   */
  async delete(userId) {
    try {
      // For now, hard delete. Consider soft delete in production
      await sql`DELETE FROM profiles WHERE user_id = ${userId}`;
      await sql`DELETE FROM users WHERE id = ${userId}`;
      
      logger.debug('User deleted from database', { userId });
      return true;
    } catch (error) {
      logger.error('Failed to delete user', error, { userId });
      throw error;
    }
  }
}

module.exports = new UserRepository();
