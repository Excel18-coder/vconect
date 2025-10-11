/**
 * Landlord Repository
 * Handles all database operations for landlord profiles
 */

const { sql } = require('../config/database');
const logger = require('../utils/logger');
const { NotFoundError } = require('../errors');

class LandlordRepository {
  /**
   * Create landlord profile
   */
  async create(profileData) {
    try {
      const result = await sql`
        INSERT INTO landlord_profiles (
          user_id, company_name, license_number, years_in_business,
          insurance_details, emergency_contact, bio
        )
        VALUES (
          ${profileData.user_id}, 
          ${profileData.company_name}, 
          ${profileData.license_number}, 
          ${profileData.years_in_business},
          ${profileData.insurance_details}, 
          ${profileData.emergency_contact}, 
          ${profileData.bio}
        )
        RETURNING *
      `;
      
      logger.debug('Landlord profile created in database', { 
        userId: profileData.user_id 
      });
      return result[0];
    } catch (error) {
      logger.error('Failed to create landlord profile', error, { 
        userId: profileData.user_id 
      });
      throw error;
    }
  }

  /**
   * Find landlord profile by user ID
   */
  async findByUserId(userId) {
    try {
      const result = await sql`
        SELECT * FROM landlord_profiles
        WHERE user_id = ${userId}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find landlord profile', error, { userId });
      throw error;
    }
  }

  /**
   * Find landlord profile with user details
   */
  async findByUserIdWithDetails(userId) {
    try {
      const result = await sql`
        SELECT 
          lp.*,
          p.display_name,
          p.avatar_url,
          u.email
        FROM landlord_profiles lp
        JOIN users u ON lp.user_id = u.id
        JOIN profiles p ON lp.user_id = p.user_id
        WHERE lp.user_id = ${userId}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find landlord profile with details', error, { userId });
      throw error;
    }
  }

  /**
   * Update landlord profile
   */
  async update(userId, updateData) {
    try {
      const result = await sql`
        UPDATE landlord_profiles
        SET ${sql(updateData)}, updated_at = NOW()
        WHERE user_id = ${userId}
        RETURNING *
      `;
      
      if (result.length === 0) {
        throw new NotFoundError('Landlord profile', userId);
      }
      
      logger.debug('Landlord profile updated in database', { userId });
      return result[0];
    } catch (error) {
      logger.error('Failed to update landlord profile', error, { userId });
      throw error;
    }
  }

  /**
   * Increment property count
   */
  async incrementPropertyCount(userId) {
    try {
      await sql`
        UPDATE landlord_profiles
        SET total_properties = total_properties + 1
        WHERE user_id = ${userId}
      `;
      
      logger.debug('Property count incremented', { userId });
      return true;
    } catch (error) {
      logger.error('Failed to increment property count', error, { userId });
      throw error;
    }
  }

  /**
   * Decrement property count
   */
  async decrementPropertyCount(userId) {
    try {
      await sql`
        UPDATE landlord_profiles
        SET total_properties = GREATEST(total_properties - 1, 0)
        WHERE user_id = ${userId}
      `;
      
      logger.debug('Property count decremented', { userId });
      return true;
    } catch (error) {
      logger.error('Failed to decrement property count', error, { userId });
      throw error;
    }
  }

  /**
   * Update rating
   */
  async updateRating(userId, rating, totalReviews) {
    try {
      await sql`
        UPDATE landlord_profiles
        SET rating = ${rating || 0},
            total_reviews = ${totalReviews || 0}
        WHERE user_id = ${userId}
      `;
      
      logger.debug('Landlord rating updated', { userId, rating, totalReviews });
      return true;
    } catch (error) {
      logger.error('Failed to update landlord rating', error, { userId });
      throw error;
    }
  }

  /**
   * Set verification status
   */
  async setVerificationStatus(userId, verified) {
    try {
      await sql`
        UPDATE landlord_profiles
        SET verified = ${verified}, verified_at = ${verified ? sql`NOW()` : null}
        WHERE user_id = ${userId}
      `;
      
      logger.debug('Landlord verification status updated', { userId, verified });
      return true;
    } catch (error) {
      logger.error('Failed to update verification status', error, { userId });
      throw error;
    }
  }

  /**
   * Get landlord statistics
   */
  async getStatistics(userId) {
    try {
      const result = await sql`
        SELECT 
          lp.total_properties,
          lp.rating,
          lp.total_reviews,
          lp.verified,
          COUNT(DISTINCT p.id)::INTEGER as active_properties,
          COUNT(DISTINCT pv.id)::INTEGER as total_viewings,
          COUNT(DISTINCT CASE WHEN pv.status = 'scheduled' THEN pv.id END)::INTEGER as scheduled_viewings
        FROM landlord_profiles lp
        LEFT JOIN properties p ON lp.user_id = p.landlord_id AND p.status = 'available'
        LEFT JOIN property_viewings pv ON lp.user_id = pv.landlord_id
        WHERE lp.user_id = ${userId}
        GROUP BY lp.id
      `;
      
      return result[0] || {
        total_properties: 0,
        rating: 0,
        total_reviews: 0,
        verified: false,
        active_properties: 0,
        total_viewings: 0,
        scheduled_viewings: 0
      };
    } catch (error) {
      logger.error('Failed to get landlord statistics', error, { userId });
      throw error;
    }
  }

  /**
   * Delete landlord profile
   */
  async delete(userId) {
    try {
      await sql`
        DELETE FROM landlord_profiles
        WHERE user_id = ${userId}
      `;
      
      logger.debug('Landlord profile deleted from database', { userId });
      return true;
    } catch (error) {
      logger.error('Failed to delete landlord profile', error, { userId });
      throw error;
    }
  }
}

module.exports = new LandlordRepository();
