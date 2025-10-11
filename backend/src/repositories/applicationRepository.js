/**
 * Application Repository
 * Handles all database operations for job applications
 */

const { sql } = require('../config/database');
const logger = require('../utils/logger');
const { NotFoundError } = require('../errors');

class ApplicationRepository {
  /**
   * Create job application
   */
  async create(applicationData) {
    try {
      const result = await sql`
        INSERT INTO job_applications (
          job_id, employer_id, applicant_id, cover_letter, resume_url,
          portfolio_url, expected_salary, available_from, status
        )
        VALUES (
          ${applicationData.job_id}, ${applicationData.employer_id}, ${applicationData.applicant_id}, 
          ${applicationData.cover_letter}, ${applicationData.resume_url}, ${applicationData.portfolio_url},
          ${applicationData.expected_salary}, ${applicationData.available_from}, ${applicationData.status}
        )
        RETURNING *
      `;
      
      logger.debug('Job application created in database', { applicationId: result[0]?.id });
      return result[0];
    } catch (error) {
      logger.error('Failed to create job application', error, applicationData);
      throw error;
    }
  }

  /**
   * Find application by ID
   */
  async findById(applicationId) {
    try {
      const result = await sql`
        SELECT * FROM job_applications
        WHERE id = ${applicationId}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find application', error, { applicationId });
      throw error;
    }
  }

  /**
   * Find application by ID with full details
   */
  async findByIdWithDetails(applicationId) {
    try {
      const result = await sql`
        SELECT 
          ja.*,
          jp.title as job_title,
          jp.employment_type,
          jp.location,
          ep.company_name,
          ep.company_logo,
          applicant_prof.display_name as applicant_name,
          applicant_prof.avatar_url as applicant_avatar,
          au.email as applicant_email,
          employer_prof.display_name as employer_name,
          employer_prof.avatar_url as employer_avatar,
          eu.email as employer_email
        FROM job_applications ja
        JOIN job_postings jp ON ja.job_id = jp.id
        LEFT JOIN employer_profiles ep ON ja.employer_id = ep.user_id
        JOIN users au ON ja.applicant_id = au.id
        JOIN profiles applicant_prof ON ja.applicant_id = applicant_prof.user_id
        JOIN users eu ON ja.employer_id = eu.id
        JOIN profiles employer_prof ON ja.employer_id = employer_prof.user_id
        WHERE ja.id = ${applicationId}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find application with details', error, { applicationId });
      throw error;
    }
  }

  /**
   * Find application by job and applicant
   */
  async findByJobAndApplicant(jobId, applicantId) {
    try {
      const result = await sql`
        SELECT * FROM job_applications
        WHERE job_id = ${jobId} AND applicant_id = ${applicantId}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find application by job and applicant', error, { jobId, applicantId });
      throw error;
    }
  }

  /**
   * Find applications by employer
   */
  async findByEmployerId(employerId, options = {}) {
    try {
      const { job_id, status, limit = 20, offset = 0 } = options;

      let conditions = [sql`ja.employer_id = ${employerId}`];

      if (job_id) {
        conditions.push(sql`ja.job_id = ${job_id}`);
      }
      if (status && status !== 'all') {
        conditions.push(sql`ja.status = ${status}`);
      }

      const whereClause = sql`WHERE ${sql.join(conditions, sql` AND `)}`;

      const result = await sql`
        SELECT 
          ja.*,
          jp.title as job_title,
          prof.display_name as applicant_name,
          prof.avatar_url as applicant_avatar,
          u.email as applicant_email
        FROM job_applications ja
        JOIN job_postings jp ON ja.job_id = jp.id
        JOIN users u ON ja.applicant_id = u.id
        JOIN profiles prof ON ja.applicant_id = prof.user_id
        ${whereClause}
        ORDER BY ja.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      
      return result;
    } catch (error) {
      logger.error('Failed to find applications by employer', error, { employerId });
      throw error;
    }
  }

  /**
   * Find applications by applicant
   */
  async findByApplicantId(applicantId, options = {}) {
    try {
      const { status, limit = 20, offset = 0 } = options;

      let conditions = [sql`ja.applicant_id = ${applicantId}`];

      if (status && status !== 'all') {
        conditions.push(sql`ja.status = ${status}`);
      }

      const whereClause = sql`WHERE ${sql.join(conditions, sql` AND `)}`;

      const result = await sql`
        SELECT 
          ja.*,
          jp.title as job_title,
          jp.employment_type,
          jp.location,
          ep.company_name,
          ep.company_logo,
          prof.display_name as employer_name
        FROM job_applications ja
        JOIN job_postings jp ON ja.job_id = jp.id
        JOIN users u ON ja.employer_id = u.id
        JOIN profiles prof ON ja.employer_id = prof.user_id
        LEFT JOIN employer_profiles ep ON ja.employer_id = ep.user_id
        ${whereClause}
        ORDER BY ja.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      
      return result;
    } catch (error) {
      logger.error('Failed to find applications by applicant', error, { applicantId });
      throw error;
    }
  }

  /**
   * Update application
   */
  async update(applicationId, updateData) {
    try {
      const result = await sql`
        UPDATE job_applications
        SET ${sql(updateData)}, updated_at = NOW()
        WHERE id = ${applicationId}
        RETURNING *
      `;
      
      if (result.length === 0) {
        throw new NotFoundError('Application', applicationId);
      }
      
      logger.debug('Application updated in database', { applicationId });
      return result[0];
    } catch (error) {
      logger.error('Failed to update application', error, { applicationId });
      throw error;
    }
  }

  /**
   * Delete application
   */
  async delete(applicationId) {
    try {
      await sql`
        DELETE FROM job_applications
        WHERE id = ${applicationId}
      `;
      
      logger.debug('Application deleted from database', { applicationId });
      return true;
    } catch (error) {
      logger.error('Failed to delete application', error, { applicationId });
      throw error;
    }
  }
}

module.exports = new ApplicationRepository();
