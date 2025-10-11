/**
 * Employer Repository
 * Handles all database operations for employer profiles
 */

const { sql } = require('../config/database');
const logger = require('../utils/logger');
const { NotFoundError } = require('../errors');

class EmployerRepository {
  /**
   * Create employer profile
   */
  async create(employerData) {
    try {
      const result = await sql`
        INSERT INTO employer_profiles (
          user_id, company_name, company_logo, industry, company_size,
          founded_year, website, company_description, headquarters,
          registration_number, social_links
        )
        VALUES (
          ${employerData.user_id}, ${employerData.company_name}, ${employerData.company_logo}, 
          ${employerData.industry}, ${employerData.company_size}, ${employerData.founded_year},
          ${employerData.website}, ${employerData.company_description}, ${employerData.headquarters},
          ${employerData.registration_number}, ${employerData.social_links}
        )
        RETURNING *
      `;
      
      logger.debug('Employer profile created in database', { employerId: result[0]?.id });
      return result[0];
    } catch (error) {
      logger.error('Failed to create employer profile', error, employerData);
      throw error;
    }
  }

  /**
   * Find employer by user ID
   */
  async findByUserId(userId) {
    try {
      const result = await sql`
        SELECT * FROM employer_profiles
        WHERE user_id = ${userId}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find employer profile', error, { userId });
      throw error;
    }
  }

  /**
   * Find employer by user ID with details
   */
  async findByUserIdWithDetails(userId) {
    try {
      const result = await sql`
        SELECT 
          ep.*,
          prof.display_name,
          prof.avatar_url,
          u.email
        FROM employer_profiles ep
        JOIN users u ON ep.user_id = u.id
        JOIN profiles prof ON ep.user_id = prof.user_id
        WHERE ep.user_id = ${userId}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find employer profile with details', error, { userId });
      throw error;
    }
  }

  /**
   * Update employer profile
   */
  async update(userId, updateData) {
    try {
      const result = await sql`
        UPDATE employer_profiles
        SET ${sql(updateData)}, updated_at = NOW()
        WHERE user_id = ${userId}
        RETURNING *
      `;
      
      if (result.length === 0) {
        throw new NotFoundError('Employer profile', userId);
      }
      
      logger.debug('Employer profile updated in database', { userId });
      return result[0];
    } catch (error) {
      logger.error('Failed to update employer profile', error, { userId });
      throw error;
    }
  }

  /**
   * Increment job count
   */
  async incrementJobCount(userId) {
    try {
      await sql`
        UPDATE employer_profiles
        SET total_jobs_posted = total_jobs_posted + 1
        WHERE user_id = ${userId}
      `;
      
      logger.debug('Job count incremented', { userId });
      return true;
    } catch (error) {
      logger.error('Failed to increment job count', error, { userId });
      throw error;
    }
  }

  /**
   * Set verification status
   */
  async setVerificationStatus(userId, verified) {
    try {
      await sql`
        UPDATE employer_profiles
        SET verified = ${verified}
        WHERE user_id = ${userId}
      `;
      
      logger.debug('Employer verification status updated', { userId, verified });
      return true;
    } catch (error) {
      logger.error('Failed to set verification status', error, { userId });
      throw error;
    }
  }

  /**
   * Get employer statistics
   */
  async getStatistics(userId) {
    try {
      const result = await sql`
        SELECT 
          ep.total_jobs_posted,
          COUNT(DISTINCT jp.id)::INTEGER as total_jobs,
          COUNT(DISTINCT CASE WHEN jp.status = 'active' THEN jp.id END)::INTEGER as active_jobs,
          COUNT(DISTINCT ja.id)::INTEGER as total_applications,
          COUNT(DISTINCT CASE WHEN ja.status = 'pending' THEN ja.id END)::INTEGER as pending_applications,
          COUNT(DISTINCT CASE WHEN ja.status = 'shortlisted' THEN ja.id END)::INTEGER as shortlisted_applications,
          COUNT(DISTINCT ja.applicant_id)::INTEGER as unique_applicants
        FROM employer_profiles ep
        LEFT JOIN job_postings jp ON ep.user_id = jp.employer_id
        LEFT JOIN job_applications ja ON ep.user_id = ja.employer_id
        WHERE ep.user_id = ${userId}
        GROUP BY ep.user_id, ep.total_jobs_posted
      `;
      
      return result[0] || {
        total_jobs_posted: 0,
        total_jobs: 0,
        active_jobs: 0,
        total_applications: 0,
        pending_applications: 0,
        shortlisted_applications: 0,
        unique_applicants: 0
      };
    } catch (error) {
      logger.error('Failed to get employer statistics', error, { userId });
      throw error;
    }
  }

  /**
   * Delete employer profile
   */
  async delete(userId) {
    try {
      await sql`
        DELETE FROM employer_profiles
        WHERE user_id = ${userId}
      `;
      
      logger.debug('Employer profile deleted from database', { userId });
      return true;
    } catch (error) {
      logger.error('Failed to delete employer profile', error, { userId });
      throw error;
    }
  }
}

module.exports = new EmployerRepository();
