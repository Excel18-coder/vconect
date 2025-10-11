/**
 * Job Service
 * Business logic for job postings management
 */

const jobRepository = require('../../repositories/jobRepository');
const employerRepository = require('../../repositories/employerRepository');
const logger = require('../../utils/logger');
const { ValidationError, NotFoundError, AuthorizationError } = require('../../errors');

class JobService {
  /**
   * Create job posting
   */
  async createJob(employerId, jobData) {
    logger.debug('Creating job posting', { employerId });

    // Validate required fields
    if (!jobData.title || jobData.title.trim().length === 0) {
      throw new ValidationError('Job title is required');
    }
    if (!jobData.description || jobData.description.trim().length === 0) {
      throw new ValidationError('Job description is required');
    }
    if (!jobData.employment_type) {
      throw new ValidationError('Employment type is required');
    }
    if (!jobData.location || jobData.location.trim().length === 0) {
      throw new ValidationError('Location is required');
    }

    // Validate employment type
    const validEmploymentTypes = ['full-time', 'part-time', 'contract', 'internship', 'temporary'];
    if (!validEmploymentTypes.includes(jobData.employment_type)) {
      throw new ValidationError(`Employment type must be one of: ${validEmploymentTypes.join(', ')}`);
    }

    // Validate experience level
    const validLevels = ['entry', 'mid', 'senior', 'lead', 'executive'];
    if (jobData.experience_level && !validLevels.includes(jobData.experience_level)) {
      throw new ValidationError(`Experience level must be one of: ${validLevels.join(', ')}`);
    }

    // Validate remote type
    const validRemoteTypes = ['on-site', 'remote', 'hybrid'];
    if (jobData.remote_type && !validRemoteTypes.includes(jobData.remote_type)) {
      throw new ValidationError(`Remote type must be one of: ${validRemoteTypes.join(', ')}`);
    }

    // Validate salary period
    const validPeriods = ['hourly', 'daily', 'monthly', 'yearly'];
    if (jobData.salary_period && !validPeriods.includes(jobData.salary_period)) {
      throw new ValidationError(`Salary period must be one of: ${validPeriods.join(', ')}`);
    }

    // Verify employer profile exists
    const employer = await employerRepository.findByUserId(employerId);
    if (!employer) {
      throw new NotFoundError('Employer profile not found. Please create your employer profile first.');
    }

    try {
      const job = await jobRepository.create({
        employer_id: employerId,
        title: jobData.title,
        description: jobData.description,
        responsibilities: jobData.responsibilities || [],
        requirements: jobData.requirements || [],
        qualifications: jobData.qualifications || [],
        employment_type: jobData.employment_type,
        experience_level: jobData.experience_level || 'mid',
        category: jobData.category || 'other',
        industry: jobData.industry || employer.industry,
        location: jobData.location,
        remote_type: jobData.remote_type || 'on-site',
        salary_min: jobData.salary_min || null,
        salary_max: jobData.salary_max || null,
        salary_currency: jobData.salary_currency || 'KES',
        salary_period: jobData.salary_period || 'monthly',
        benefits: jobData.benefits || [],
        application_deadline: jobData.application_deadline || null,
        positions_available: jobData.positions_available || 1,
        tags: jobData.tags || [],
        status: 'active'
      });

      // Increment employer job count
      await employerRepository.incrementJobCount(employerId);

      logger.info('Job posting created', { jobId: job.id, employerId });
      return job;
    } catch (error) {
      logger.error('Failed to create job posting', error, { employerId });
      throw error;
    }
  }

  /**
   * Get employer's jobs
   */
  async getEmployerJobs(employerId, filters = {}) {
    logger.debug('Getting employer jobs', { employerId });

    try {
      const jobs = await jobRepository.findByEmployerId(employerId, filters);
      return jobs;
    } catch (error) {
      logger.error('Failed to get employer jobs', error, { employerId });
      throw error;
    }
  }

  /**
   * Browse jobs
   */
  async browseJobs(filters = {}) {
    logger.debug('Browsing jobs', filters);

    try {
      const searchFilters = {
        status: 'active',
        category: filters.category || null,
        employment_type: filters.employment_type || null,
        experience_level: filters.experience_level || null,
        location: filters.location || null,
        remote_type: filters.remote_type || null,
        min_salary: filters.min_salary ? parseFloat(filters.min_salary) : null,
        max_salary: filters.max_salary ? parseFloat(filters.max_salary) : null,
        search: filters.search || null,
        limit: parseInt(filters.limit) || 20,
        offset: filters.page ? (parseInt(filters.page) - 1) * (parseInt(filters.limit) || 20) : 0
      };

      const jobs = await jobRepository.search(searchFilters);
      const total = await jobRepository.countSearch(searchFilters);

      return {
        jobs,
        total,
        page: filters.page ? parseInt(filters.page) : 1,
        limit: searchFilters.limit,
        pages: Math.ceil(total / searchFilters.limit)
      };
    } catch (error) {
      logger.error('Failed to browse jobs', error, filters);
      throw error;
    }
  }

  /**
   * Get job by ID
   */
  async getJob(jobId) {
    logger.debug('Getting job', { jobId });

    try {
      const job = await jobRepository.findByIdWithDetails(jobId);
      
      if (!job) {
        throw new NotFoundError('Job', jobId);
      }

      // Increment view count
      await jobRepository.incrementViews(jobId);

      return job;
    } catch (error) {
      logger.error('Failed to get job', error, { jobId });
      throw error;
    }
  }

  /**
   * Update job
   */
  async updateJob(jobId, userId, updateData) {
    logger.debug('Updating job', { jobId, userId });

    try {
      // Get job and verify ownership
      const job = await jobRepository.findById(jobId);
      if (!job) {
        throw new NotFoundError('Job', jobId);
      }

      if (job.employer_id !== userId) {
        throw new AuthorizationError('You can only update your own jobs');
      }

      // Validate status if being updated
      if (updateData.status) {
        const validStatuses = ['active', 'closed', 'filled'];
        if (!validStatuses.includes(updateData.status)) {
          throw new ValidationError(`Status must be one of: ${validStatuses.join(', ')}`);
        }
      }

      const updated = await jobRepository.update(jobId, updateData);
      logger.info('Job updated', { jobId, userId });

      return updated;
    } catch (error) {
      logger.error('Failed to update job', error, { jobId, userId });
      throw error;
    }
  }

  /**
   * Delete job
   */
  async deleteJob(jobId, userId) {
    logger.debug('Deleting job', { jobId, userId });

    try {
      // Get job and verify ownership
      const job = await jobRepository.findById(jobId);
      if (!job) {
        throw new NotFoundError('Job', jobId);
      }

      if (job.employer_id !== userId) {
        throw new AuthorizationError('You can only delete your own jobs');
      }

      // Soft delete by setting status to closed
      await jobRepository.update(jobId, { status: 'closed' });
      logger.info('Job soft deleted', { jobId, userId });

      return true;
    } catch (error) {
      logger.error('Failed to delete job', error, { jobId, userId });
      throw error;
    }
  }

  /**
   * Get job statistics
   */
  async getJobStats(jobId) {
    logger.debug('Getting job statistics', { jobId });

    try {
      const stats = await jobRepository.getStatistics(jobId);
      return stats;
    } catch (error) {
      logger.error('Failed to get job statistics', error, { jobId });
      throw error;
    }
  }
}

module.exports = new JobService();
