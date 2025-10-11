/**
 * Review Repository
 * Handles all database operations for user reviews
 */

const { sql } = require('../config/database');
const logger = require('../utils/logger');

class ReviewRepository {
  /**
   * Create review
   */
  async create(reviewData) {
    try {
      const result = await sql`
        INSERT INTO user_reviews (
          reviewer_id, reviewed_user_id, review_type,
          rating, review_title, review_text, booking_id
        )
        VALUES (
          ${reviewData.reviewer_id}, 
          ${reviewData.reviewed_user_id}, 
          ${reviewData.review_type},
          ${reviewData.rating}, 
          ${reviewData.review_title}, 
          ${reviewData.review_text}, 
          ${reviewData.booking_id}
        )
        RETURNING *
      `;
      
      logger.debug('Review created in database', { reviewId: result[0]?.id });
      return result[0];
    } catch (error) {
      logger.error('Failed to create review', error, reviewData);
      throw error;
    }
  }

  /**
   * Find review by ID
   */
  async findById(reviewId) {
    try {
      const result = await sql`
        SELECT * FROM user_reviews
        WHERE id = ${reviewId}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find review', error, { reviewId });
      throw error;
    }
  }

  /**
   * Find review by ID with reviewer details
   */
  async findByIdWithDetails(reviewId) {
    try {
      const result = await sql`
        SELECT 
          ur.*,
          p.display_name as reviewer_name,
          p.avatar_url as reviewer_avatar
        FROM user_reviews ur
        JOIN profiles p ON ur.reviewer_id = p.user_id
        WHERE ur.id = ${reviewId}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find review with details', error, { reviewId });
      throw error;
    }
  }

  /**
   * Find reviews by user ID
   */
  async findByUserId(userId, options = {}) {
    try {
      const { review_type, limit = 50, offset = 0 } = options;

      let query = sql`
        SELECT 
          ur.*,
          p.display_name as reviewer_name,
          p.avatar_url as reviewer_avatar
        FROM user_reviews ur
        JOIN profiles p ON ur.reviewer_id = p.user_id
        WHERE ur.reviewed_user_id = ${userId}
      `;

      if (review_type) {
        query = sql`${query} AND ur.review_type = ${review_type}`;
      }

      query = sql`
        ${query}
        ORDER BY ur.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const result = await query;
      return result;
    } catch (error) {
      logger.error('Failed to find reviews by user', error, { userId });
      throw error;
    }
  }

  /**
   * Find review by booking
   */
  async findByBooking(reviewerId, bookingId, reviewType) {
    try {
      const result = await sql`
        SELECT * FROM user_reviews
        WHERE reviewer_id = ${reviewerId} 
          AND booking_id = ${bookingId}
          AND review_type = ${reviewType}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find review by booking', error, { 
        reviewerId, 
        bookingId 
      });
      throw error;
    }
  }

  /**
   * Get review statistics for user
   */
  async getStatsForUser(userId, reviewType = null) {
    try {
      let query = sql`
        SELECT 
          COUNT(*)::INTEGER as total_reviews,
          AVG(rating)::DECIMAL(3,2) as average_rating,
          COUNT(CASE WHEN rating = 5 THEN 1 END)::INTEGER as five_star,
          COUNT(CASE WHEN rating = 4 THEN 1 END)::INTEGER as four_star,
          COUNT(CASE WHEN rating = 3 THEN 1 END)::INTEGER as three_star,
          COUNT(CASE WHEN rating = 2 THEN 1 END)::INTEGER as two_star,
          COUNT(CASE WHEN rating = 1 THEN 1 END)::INTEGER as one_star
        FROM user_reviews
        WHERE reviewed_user_id = ${userId}
      `;

      if (reviewType) {
        query = sql`${query} AND review_type = ${reviewType}`;
      }

      const result = await query;
      
      return result[0] || {
        total_reviews: 0,
        average_rating: 0,
        five_star: 0,
        four_star: 0,
        three_star: 0,
        two_star: 0,
        one_star: 0
      };
    } catch (error) {
      logger.error('Failed to get review stats', error, { userId, reviewType });
      throw error;
    }
  }

  /**
   * Update review
   */
  async update(reviewId, updateData) {
    try {
      const result = await sql`
        UPDATE user_reviews
        SET ${sql(updateData)}, updated_at = NOW()
        WHERE id = ${reviewId}
        RETURNING *
      `;
      
      logger.debug('Review updated in database', { reviewId });
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to update review', error, { reviewId });
      throw error;
    }
  }

  /**
   * Delete review
   */
  async delete(reviewId) {
    try {
      await sql`
        DELETE FROM user_reviews
        WHERE id = ${reviewId}
      `;
      
      logger.debug('Review deleted from database', { reviewId });
      return true;
    } catch (error) {
      logger.error('Failed to delete review', error, { reviewId });
      throw error;
    }
  }

  /**
   * Flag review as inappropriate
   */
  async flagReview(reviewId, reporterId, reason) {
    try {
      await sql`
        UPDATE user_reviews
        SET is_flagged = true,
            flagged_by = ${reporterId},
            flag_reason = ${reason},
            flagged_at = NOW()
        WHERE id = ${reviewId}
      `;
      
      logger.debug('Review flagged in database', { reviewId, reporterId });
      return true;
    } catch (error) {
      logger.error('Failed to flag review', error, { reviewId });
      throw error;
    }
  }

  /**
   * Update tutor profile rating
   */
  async updateTutorRating(userId, rating, totalReviews) {
    try {
      await sql`
        UPDATE tutor_profiles
        SET rating = ${rating || 0},
            total_reviews = ${totalReviews || 0}
        WHERE user_id = ${userId}
      `;
      
      logger.debug('Tutor rating updated', { userId, rating, totalReviews });
      return true;
    } catch (error) {
      logger.error('Failed to update tutor rating', error, { userId });
      // Don't throw error if profile doesn't exist
      return false;
    }
  }

  /**
   * Update landlord profile rating
   */
  async updateLandlordRating(userId, rating, totalReviews) {
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
      return false;
    }
  }

  /**
   * Update employer profile rating
   */
  async updateEmployerRating(userId, rating, totalReviews) {
    try {
      await sql`
        UPDATE employer_profiles
        SET rating = ${rating || 0},
            total_reviews = ${totalReviews || 0}
        WHERE user_id = ${userId}
      `;
      
      logger.debug('Employer rating updated', { userId, rating, totalReviews });
      return true;
    } catch (error) {
      logger.error('Failed to update employer rating', error, { userId });
      return false;
    }
  }

  /**
   * Update doctor profile rating
   */
  async updateDoctorRating(userId, rating, totalReviews) {
    try {
      await sql`
        UPDATE doctor_profiles
        SET rating = ${rating || 0},
            total_reviews = ${totalReviews || 0}
        WHERE user_id = ${userId}
      `;
      
      logger.debug('Doctor rating updated', { userId, rating, totalReviews });
      return true;
    } catch (error) {
      logger.error('Failed to update doctor rating', error, { userId });
      return false;
    }
  }
}

module.exports = new ReviewRepository();
