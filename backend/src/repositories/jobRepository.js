/**
 * Job Repository
 * Handles all database operations for job postings
 */

const { sql } = require('../config/database');
const logger = require('../utils/logger');
const { NotFoundError } = require('../errors');

class JobRepository {
  /**
   * Create job posting
   */
  async create(jobData) {
    try {
      const result = await sql`
        INSERT INTO job_postings (
          employer_id, title, description, responsibilities, requirements,
          qualifications, employment_type, experience_level, category, industry,
          location, remote_type, salary_min, salary_max, salary_currency,
          salary_period, benefits, application_deadline, positions_available, tags, status
        )
        VALUES (
          ${jobData.employer_id}, ${jobData.title}, ${jobData.description}, 
          ${jobData.responsibilities}, ${jobData.requirements}, ${jobData.qualifications},
          ${jobData.employment_type}, ${jobData.experience_level}, ${jobData.category}, 
          ${jobData.industry}, ${jobData.location}, ${jobData.remote_type},
          ${jobData.salary_min}, ${jobData.salary_max}, ${jobData.salary_currency},
          ${jobData.salary_period}, ${jobData.benefits}, ${jobData.application_deadline}, 
          ${jobData.positions_available}, ${jobData.tags}, ${jobData.status}
        )
        RETURNING *
      `;
      
      logger.debug('Job posting created in database', { jobId: result[0]?.id });
      return result[0];
    } catch (error) {
      logger.error('Failed to create job posting', error, jobData);
      throw error;
    }
  }

  /**
   * Find job by ID
   */
  async findById(jobId) {
    try {
      const result = await sql`
        SELECT * FROM job_postings
        WHERE id = ${jobId}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find job posting', error, { jobId });
      throw error;
    }
  }

  /**
   * Find job by ID with employer details
   */
  async findByIdWithDetails(jobId) {
    try {
      const result = await sql`
        SELECT 
          jp.*,
          ep.company_name,
          ep.company_logo,
          ep.company_description,
          ep.website,
          ep.company_size,
          ep.industry as company_industry,
          prof.display_name as employer_name,
          prof.avatar_url as employer_avatar,
          u.email as employer_email
        FROM job_postings jp
        JOIN users u ON jp.employer_id = u.id
        JOIN profiles prof ON jp.employer_id = prof.user_id
        LEFT JOIN employer_profiles ep ON jp.employer_id = ep.user_id
        WHERE jp.id = ${jobId}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find job with details', error, { jobId });
      throw error;
    }
  }

  /**
   * Find jobs by employer ID
   */
  async findByEmployerId(employerId, options = {}) {
    try {
      const { status, limit = 20, offset = 0 } = options;

      let query = sql`
        SELECT * FROM job_postings
        WHERE employer_id = ${employerId}
      `;

      if (status && status !== 'all') {
        query = sql`${query} AND status = ${status}`;
      }

      query = sql`
        ${query}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const result = await query;
      return result;
    } catch (error) {
      logger.error('Failed to find jobs by employer', error, { employerId });
      throw error;
    }
  }

  /**
   * Search jobs
   */
  async search(filters) {
    try {
      let conditions = [sql`jp.status = 'active'`];
      
      if (filters.category) {
        conditions.push(sql`jp.category = ${filters.category}`);
      }
      if (filters.employment_type) {
        conditions.push(sql`jp.employment_type = ${filters.employment_type}`);
      }
      if (filters.experience_level) {
        conditions.push(sql`jp.experience_level = ${filters.experience_level}`);
      }
      if (filters.location) {
        conditions.push(sql`jp.location ILIKE ${'%' + filters.location + '%'}`);
      }
      if (filters.remote_type) {
        conditions.push(sql`jp.remote_type = ${filters.remote_type}`);
      }
      if (filters.min_salary !== undefined && filters.min_salary !== null) {
        conditions.push(sql`jp.salary_min >= ${filters.min_salary}`);
      }
      if (filters.max_salary !== undefined && filters.max_salary !== null) {
        conditions.push(sql`jp.salary_max <= ${filters.max_salary}`);
      }
      if (filters.search) {
        conditions.push(sql`(jp.title ILIKE ${'%' + filters.search + '%'} OR jp.description ILIKE ${'%' + filters.search + '%'})`);
      }

      const whereClause = conditions.length > 0 
        ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
        : sql``;

      const result = await sql`
        SELECT 
          jp.*,
          ep.company_name,
          ep.company_logo,
          ep.industry as company_industry,
          prof.display_name as employer_name,
          u.email as employer_email
        FROM job_postings jp
        JOIN users u ON jp.employer_id = u.id
        JOIN profiles prof ON jp.employer_id = prof.user_id
        LEFT JOIN employer_profiles ep ON jp.employer_id = ep.user_id
        ${whereClause}
        ORDER BY jp.created_at DESC
        LIMIT ${filters.limit} OFFSET ${filters.offset}
      `;
      
      return result;
    } catch (error) {
      logger.error('Failed to search jobs', error, filters);
      throw error;
    }
  }

  /**
   * Count search results
   */
  async countSearch(filters) {
    try {
      let conditions = [sql`status = 'active'`];
      
      if (filters.category) {
        conditions.push(sql`category = ${filters.category}`);
      }
      if (filters.employment_type) {
        conditions.push(sql`employment_type = ${filters.employment_type}`);
      }
      if (filters.experience_level) {
        conditions.push(sql`experience_level = ${filters.experience_level}`);
      }
      if (filters.location) {
        conditions.push(sql`location ILIKE ${'%' + filters.location + '%'}`);
      }
      if (filters.remote_type) {
        conditions.push(sql`remote_type = ${filters.remote_type}`);
      }
      if (filters.min_salary !== undefined && filters.min_salary !== null) {
        conditions.push(sql`salary_min >= ${filters.min_salary}`);
      }
      if (filters.max_salary !== undefined && filters.max_salary !== null) {
        conditions.push(sql`salary_max <= ${filters.max_salary}`);
      }
      if (filters.search) {
        conditions.push(sql`(title ILIKE ${'%' + filters.search + '%'} OR description ILIKE ${'%' + filters.search + '%'})`);
      }

      const whereClause = conditions.length > 0 
        ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
        : sql``;

      const result = await sql`
        SELECT COUNT(*)::INTEGER as count
        FROM job_postings
        ${whereClause}
      `;
      
      return result[0]?.count || 0;
    } catch (error) {
      logger.error('Failed to count search results', error, filters);
      throw error;
    }
  }

  /**
   * Update job posting
   */
  async update(jobId, updateData) {
    try {
      const result = await sql`
        UPDATE job_postings
        SET ${sql(updateData)}, updated_at = NOW()
        WHERE id = ${jobId}
        RETURNING *
      `;
      
      if (result.length === 0) {
        throw new NotFoundError('Job posting', jobId);
      }
      
      logger.debug('Job posting updated in database', { jobId });
      return result[0];
    } catch (error) {
      logger.error('Failed to update job posting', error, { jobId });
      throw error;
    }
  }

  /**
   * Increment view count
   */
  async incrementViews(jobId) {
    try {
      await sql`
        UPDATE job_postings
        SET views_count = views_count + 1
        WHERE id = ${jobId}
      `;
      
      logger.debug('Job views incremented', { jobId });
      return true;
    } catch (error) {
      logger.error('Failed to increment job views', error, { jobId });
      throw error;
    }
  }

  /**
   * Increment application count
   */
  async incrementApplicationCount(jobId) {
    try {
      await sql`
        UPDATE job_postings
        SET applications_count = applications_count + 1
        WHERE id = ${jobId}
      `;
      
      logger.debug('Job application count incremented', { jobId });
      return true;
    } catch (error) {
      logger.error('Failed to increment application count', error, { jobId });
      throw error;
    }
  }

  /**
   * Get job statistics
   */
  async getStatistics(jobId) {
    try {
      const result = await sql`
        SELECT 
          jp.views_count,
          jp.applications_count,
          COUNT(DISTINCT CASE WHEN ja.status = 'pending' THEN ja.id END)::INTEGER as pending_applications,
          COUNT(DISTINCT CASE WHEN ja.status = 'shortlisted' THEN ja.id END)::INTEGER as shortlisted_applications,
          COUNT(DISTINCT CASE WHEN ja.status = 'rejected' THEN ja.id END)::INTEGER as rejected_applications
        FROM job_postings jp
        LEFT JOIN job_applications ja ON jp.id = ja.job_id
        WHERE jp.id = ${jobId}
        GROUP BY jp.id, jp.views_count, jp.applications_count
      `;
      
      return result[0] || {
        views_count: 0,
        applications_count: 0,
        pending_applications: 0,
        shortlisted_applications: 0,
        rejected_applications: 0
      };
    } catch (error) {
      logger.error('Failed to get job statistics', error, { jobId });
      throw error;
    }
  }

  /**
   * Delete job posting
   */
  async delete(jobId) {
    try {
      await sql`
        DELETE FROM job_postings
        WHERE id = ${jobId}
      `;
      
      logger.debug('Job posting deleted from database', { jobId });
      return true;
    } catch (error) {
      logger.error('Failed to delete job posting', error, { jobId });
      throw error;
    }
  }
}

module.exports = new JobRepository();
