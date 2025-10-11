/**
 * Tutor Repository
 * Handles all database operations for tutor profiles
 */

const { sql } = require('../config/database');
const logger = require('../utils/logger');
const { NotFoundError } = require('../errors');

class TutorRepository {
  /**
   * Create tutor profile
   */
  async create(tutorData) {
    try {
      const result = await sql`
        INSERT INTO tutor_profiles (
          user_id, specializations, qualifications, years_of_experience,
          hourly_rate, available_hours, teaching_mode, languages_spoken,
          certifications, bio, video_intro_url
        )
        VALUES (
          ${tutorData.user_id}, ${tutorData.specializations}, ${tutorData.qualifications}, 
          ${tutorData.years_of_experience}, ${tutorData.hourly_rate}, ${tutorData.available_hours},
          ${tutorData.teaching_mode}, ${tutorData.languages_spoken}, ${tutorData.certifications},
          ${tutorData.bio}, ${tutorData.video_intro_url}
        )
        RETURNING *
      `;
      
      logger.debug('Tutor profile created in database', { tutorId: result[0]?.id });
      return result[0];
    } catch (error) {
      logger.error('Failed to create tutor profile', error, tutorData);
      throw error;
    }
  }

  /**
   * Find tutor by user ID
   */
  async findByUserId(userId) {
    try {
      const result = await sql`
        SELECT * FROM tutor_profiles
        WHERE user_id = ${userId}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find tutor profile', error, { userId });
      throw error;
    }
  }

  /**
   * Find tutor by user ID with details
   */
  async findByUserIdWithDetails(userId) {
    try {
      const result = await sql`
        SELECT 
          tp.*,
          prof.display_name,
          prof.avatar_url,
          u.email
        FROM tutor_profiles tp
        JOIN users u ON tp.user_id = u.id
        JOIN profiles prof ON tp.user_id = prof.user_id
        WHERE tp.user_id = ${userId}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find tutor profile with details', error, { userId });
      throw error;
    }
  }

  /**
   * Update tutor profile
   */
  async update(userId, updateData) {
    try {
      const result = await sql`
        UPDATE tutor_profiles
        SET ${sql(updateData)}, updated_at = NOW()
        WHERE user_id = ${userId}
        RETURNING *
      `;
      
      if (result.length === 0) {
        throw new NotFoundError('Tutor profile', userId);
      }
      
      logger.debug('Tutor profile updated in database', { userId });
      return result[0];
    } catch (error) {
      logger.error('Failed to update tutor profile', error, { userId });
      throw error;
    }
  }

  /**
   * Increment student count
   */
  async incrementStudentCount(userId) {
    try {
      await sql`
        UPDATE tutor_profiles
        SET total_students = total_students + 1
        WHERE user_id = ${userId}
      `;
      
      logger.debug('Student count incremented', { userId });
      return true;
    } catch (error) {
      logger.error('Failed to increment student count', error, { userId });
      throw error;
    }
  }

  /**
   * Update tutor rating
   */
  async updateRating(userId, rating, reviewCount) {
    try {
      await sql`
        UPDATE tutor_profiles
        SET rating = ${rating},
            total_reviews = ${reviewCount}
        WHERE user_id = ${userId}
      `;
      
      logger.debug('Tutor rating updated', { userId, rating });
      return true;
    } catch (error) {
      logger.error('Failed to update tutor rating', error, { userId });
      throw error;
    }
  }

  /**
   * Set verification status
   */
  async setVerificationStatus(userId, verified) {
    try {
      await sql`
        UPDATE tutor_profiles
        SET verified = ${verified}
        WHERE user_id = ${userId}
      `;
      
      logger.debug('Tutor verification status updated', { userId, verified });
      return true;
    } catch (error) {
      logger.error('Failed to set verification status', error, { userId });
      throw error;
    }
  }

  /**
   * Get tutor statistics
   */
  async getStatistics(userId) {
    try {
      const result = await sql`
        SELECT 
          tp.total_students,
          tp.rating,
          tp.total_reviews,
          COUNT(DISTINCT ts.id)::INTEGER as total_sessions,
          COUNT(DISTINCT CASE WHEN ts.status = 'active' THEN ts.id END)::INTEGER as active_sessions,
          COUNT(DISTINCT tb.id)::INTEGER as total_bookings,
          COUNT(DISTINCT CASE WHEN tb.status = 'completed' THEN tb.id END)::INTEGER as completed_bookings,
          COUNT(DISTINCT CASE WHEN tb.status = 'pending' THEN tb.id END)::INTEGER as pending_bookings
        FROM tutor_profiles tp
        LEFT JOIN tutoring_sessions ts ON tp.user_id = ts.tutor_id
        LEFT JOIN tutor_bookings tb ON tp.user_id = tb.tutor_id
        WHERE tp.user_id = ${userId}
        GROUP BY tp.user_id, tp.total_students, tp.rating, tp.total_reviews
      `;
      
      return result[0] || {
        total_students: 0,
        rating: 0,
        total_reviews: 0,
        total_sessions: 0,
        active_sessions: 0,
        total_bookings: 0,
        completed_bookings: 0,
        pending_bookings: 0
      };
    } catch (error) {
      logger.error('Failed to get tutor statistics', error, { userId });
      throw error;
    }
  }

  /**
   * Delete tutor profile
   */
  async delete(userId) {
    try {
      await sql`
        DELETE FROM tutor_profiles
        WHERE user_id = ${userId}
      `;
      
      logger.debug('Tutor profile deleted from database', { userId });
      return true;
    } catch (error) {
      logger.error('Failed to delete tutor profile', error, { userId });
      throw error;
    }
  }
}

module.exports = new TutorRepository();
