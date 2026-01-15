/**
 * Profile Repository
 * Handles all database operations for user profiles
 */

const { sql } = require("../config/database");
const logger = require("../utils/logger");
const { NotFoundError } = require("../errors");

class ProfileRepository {
  /**
   * Find profile by user ID
   */
  async findByUserId(userId) {
    try {
      const result = await sql`
        SELECT 
          id, user_id, display_name, avatar_url, bio, user_type,
          phone_number, location, created_at, updated_at
        FROM profiles 
        WHERE user_id = ${userId}
        LIMIT 1
      `;

      return result[0] || null;
    } catch (error) {
      logger.error("Failed to find profile by user ID", error, { userId });
      throw error;
    }
  }

  /**
   * Find public profile (includes email from users table)
   */
  async findPublicProfile(userId) {
    try {
      const result = await sql`
        SELECT 
          p.id, p.user_id, p.display_name, p.avatar_url, p.bio, p.user_type,
          p.location, p.created_at,
          u.email
        FROM profiles p
        JOIN users u ON p.user_id = u.id
        WHERE p.user_id = ${userId}
        LIMIT 1
      `;

      return result[0] || null;
    } catch (error) {
      logger.error("Failed to find public profile", error, { userId });
      throw error;
    }
  }

  /**
   * Update profile
   */
  async update(userId, updateData) {
    try {
      // Build the SET clause parts
      const setClauses = [];
      const params = [];
      let paramIndex = 1;

      if ("display_name" in updateData) {
        setClauses.push(`display_name = $${paramIndex++}`);
        params.push(updateData.display_name);
      }
      if ("bio" in updateData) {
        setClauses.push(`bio = $${paramIndex++}`);
        params.push(updateData.bio);
      }
      if ("user_type" in updateData) {
        setClauses.push(`user_type = $${paramIndex++}`);
        params.push(updateData.user_type);
      }
      if ("phone_number" in updateData) {
        setClauses.push(`phone_number = $${paramIndex++}`);
        params.push(updateData.phone_number);
      }
      if ("location" in updateData) {
        setClauses.push(`location = $${paramIndex++}`);
        params.push(updateData.location);
      }
      if ("avatar_url" in updateData) {
        setClauses.push(`avatar_url = $${paramIndex++}`);
        params.push(updateData.avatar_url);
      }

      if (setClauses.length === 0) {
        throw new Error("No valid fields to update");
      }

      // Add userId as the last parameter
      params.push(userId);

      // Build and execute the query
      const query = `
        UPDATE profiles 
        SET ${setClauses.join(", ")}, updated_at = NOW()
        WHERE user_id = $${paramIndex}
        RETURNING 
          id, user_id, display_name, avatar_url, bio, user_type,
          phone_number, location, created_at, updated_at
      `;

      const result = await sql(query, params);

      if (result.length === 0) {
        throw new NotFoundError("Profile", userId);
      }

      logger.debug("Profile updated in database", {
        userId,
        fields: Object.keys(updateData),
      });
      return result[0];
    } catch (error) {
      logger.error("Failed to update profile", error, { userId });
      throw error;
    }
  }

  /**
   * Get active listings count for a user
   */
  async getActiveListingsCount(userId) {
    try {
      // Check if listings table exists, if not return 0
      const result = await sql`
        SELECT COUNT(*) as count 
        FROM products 
        WHERE seller_id = ${userId} AND status = 'active'
      `;

      return parseInt(result[0]?.count || 0);
    } catch (error) {
      // If table doesn't exist or error, return 0
      logger.warn("Failed to get active listings count", {
        userId,
        error: error.message,
      });
      return 0;
    }
  }

  /**
   * Search profiles
   */
  async search(criteria) {
    try {
      let where = sql`TRUE`;

      if (criteria.query) {
        const q = `%${criteria.query}%`;
        where = sql`${where} AND (display_name ILIKE ${q} OR bio ILIKE ${q})`;
      }

      if (criteria.userType) {
        where = sql`${where} AND user_type = ${criteria.userType}`;
      }

      if (criteria.location) {
        const loc = `%${criteria.location}%`;
        where = sql`${where} AND location ILIKE ${loc}`;
      }

      const whereClause = sql`WHERE ${where}`;

      const result = await sql`
        SELECT 
          id, user_id, display_name, avatar_url, bio, user_type,
          location, created_at
        FROM profiles
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ${criteria.limit} OFFSET ${criteria.offset}
      `;

      return result;
    } catch (error) {
      logger.error("Failed to search profiles", error, criteria);
      throw error;
    }
  }

  /**
   * Count search results
   */
  async countSearch(criteria) {
    try {
      let where = sql`TRUE`;

      if (criteria.query) {
        const q = `%${criteria.query}%`;
        where = sql`${where} AND (display_name ILIKE ${q} OR bio ILIKE ${q})`;
      }

      if (criteria.userType) {
        where = sql`${where} AND user_type = ${criteria.userType}`;
      }

      if (criteria.location) {
        const loc = `%${criteria.location}%`;
        where = sql`${where} AND location ILIKE ${loc}`;
      }

      const whereClause = sql`WHERE ${where}`;

      const result = await sql`
        SELECT COUNT(*) as count
        FROM profiles
        ${whereClause}
      `;

      return parseInt(result[0]?.count || 0);
    } catch (error) {
      logger.error("Failed to count search results", error, criteria);
      throw error;
    }
  }
}

module.exports = new ProfileRepository();
