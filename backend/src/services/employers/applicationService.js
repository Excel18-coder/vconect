/**
 * Application Service
 * Business logic for job applications management
 */

const applicationRepository = require('../../repositories/applicationRepository');
const jobRepository = require('../../repositories/jobRepository');
const notificationService = require('../buyers/notificationService');
const logger = require('../../utils/logger');
const { ValidationError, NotFoundError, AuthorizationError, ConflictError } = require('../../errors');

class ApplicationService {
  /**
   * Apply for a job
   */
  async applyForJob(applicantId, applicationData) {
    logger.debug('Applying for job', { applicantId });

    // Validate required fields
    if (!applicationData.job_id) {
      throw new ValidationError('Job ID is required');
    }
    if (!applicationData.resume_url || applicationData.resume_url.trim().length === 0) {
      throw new ValidationError('Resume is required');
    }

    try {
      // Get job details
      const job = await jobRepository.findById(applicationData.job_id);
      if (!job) {
        throw new NotFoundError('Job', applicationData.job_id);
      }

      if (job.status !== 'active') {
        throw new ValidationError('This job is no longer accepting applications');
      }

      // Check if applicant is the employer
      if (job.employer_id === applicantId) {
        throw new ValidationError('You cannot apply to your own job posting');
      }

      // Check if application deadline has passed
      if (job.application_deadline) {
        const deadline = new Date(job.application_deadline);
        const today = new Date();
        if (deadline < today) {
          throw new ValidationError('The application deadline has passed');
        }
      }

      // Check if already applied
      const existing = await applicationRepository.findByJobAndApplicant(
        applicationData.job_id,
        applicantId
      );

      if (existing) {
        throw new ConflictError('You have already applied for this job');
      }

      // Create application
      const application = await applicationRepository.create({
        job_id: applicationData.job_id,
        employer_id: job.employer_id,
        applicant_id: applicantId,
        cover_letter: applicationData.cover_letter || null,
        resume_url: applicationData.resume_url,
        portfolio_url: applicationData.portfolio_url || null,
        expected_salary: applicationData.expected_salary || null,
        available_from: applicationData.available_from || null,
        status: 'pending'
      });

      // Increment job application count
      await jobRepository.incrementApplicationCount(applicationData.job_id);

      // Send notification to employer
      await notificationService.createNotification(
        job.employer_id,
        'application',
        'New Job Application',
        `You have a new application for your job posting "${job.title}"`,
        { applicationId: application.id, jobId: job.id }
      );

      logger.info('Job application submitted', { applicationId: application.id, applicantId, jobId: job.id });
      return application;
    } catch (error) {
      logger.error('Failed to apply for job', error, { applicantId });
      throw error;
    }
  }

  /**
   * Get employer's applications
   */
  async getEmployerApplications(employerId, filters = {}) {
    logger.debug('Getting employer applications', { employerId });

    try {
      const applications = await applicationRepository.findByEmployerId(employerId, filters);
      return applications;
    } catch (error) {
      logger.error('Failed to get employer applications', error, { employerId });
      throw error;
    }
  }

  /**
   * Get applicant's applications
   */
  async getApplicantApplications(applicantId, filters = {}) {
    logger.debug('Getting applicant applications', { applicantId });

    try {
      const applications = await applicationRepository.findByApplicantId(applicantId, filters);
      return applications;
    } catch (error) {
      logger.error('Failed to get applicant applications', error, { applicantId });
      throw error;
    }
  }

  /**
   * Get application by ID
   */
  async getApplication(applicationId, userId) {
    logger.debug('Getting application', { applicationId, userId });

    try {
      const application = await applicationRepository.findByIdWithDetails(applicationId);
      
      if (!application) {
        throw new NotFoundError('Application', applicationId);
      }

      // Verify authorization (employer or applicant)
      if (application.employer_id !== userId && application.applicant_id !== userId) {
        throw new AuthorizationError('You can only view your own applications');
      }

      return application;
    } catch (error) {
      logger.error('Failed to get application', error, { applicationId, userId });
      throw error;
    }
  }

  /**
   * Update application status (employer only)
   */
  async updateApplicationStatus(applicationId, employerId, statusData) {
    logger.debug('Updating application status', { applicationId, employerId });

    try {
      // Get application and verify ownership
      const application = await applicationRepository.findById(applicationId);
      if (!application) {
        throw new NotFoundError('Application', applicationId);
      }

      if (application.employer_id !== employerId) {
        throw new AuthorizationError('Only the employer can update application status');
      }

      // Validate status
      const validStatuses = ['pending', 'reviewed', 'shortlisted', 'interviewing', 'offered', 'rejected', 'withdrawn'];
      if (!statusData.status || !validStatuses.includes(statusData.status)) {
        throw new ValidationError(`Status must be one of: ${validStatuses.join(', ')}`);
      }

      // Update application
      const updateData = {
        status: statusData.status,
        employer_notes: statusData.employer_notes || application.employer_notes,
        interview_date: statusData.interview_date || application.interview_date,
        interview_location: statusData.interview_location || application.interview_location,
        interview_mode: statusData.interview_mode || application.interview_mode
      };

      const updated = await applicationRepository.update(applicationId, updateData);

      // Send notification to applicant
      let notificationMessage = '';
      switch (statusData.status) {
        case 'reviewed':
          notificationMessage = 'Your job application has been reviewed';
          break;
        case 'shortlisted':
          notificationMessage = 'Congratulations! You have been shortlisted';
          break;
        case 'interviewing':
          notificationMessage = 'You have been invited for an interview';
          break;
        case 'offered':
          notificationMessage = 'Congratulations! You have received a job offer';
          break;
        case 'rejected':
          notificationMessage = 'Your application status has been updated';
          break;
        default:
          notificationMessage = `Your application status has been updated to ${statusData.status}`;
      }

      await notificationService.createNotification(
        application.applicant_id,
        'application',
        'Application Status Update',
        notificationMessage,
        { applicationId: application.id }
      );

      logger.info('Application status updated', { applicationId, employerId, status: statusData.status });
      return updated;
    } catch (error) {
      logger.error('Failed to update application status', error, { applicationId, employerId });
      throw error;
    }
  }

  /**
   * Withdraw application (applicant only)
   */
  async withdrawApplication(applicationId, applicantId) {
    logger.debug('Withdrawing application', { applicationId, applicantId });

    try {
      const application = await applicationRepository.findById(applicationId);
      if (!application) {
        throw new NotFoundError('Application', applicationId);
      }

      // Verify authorization
      if (application.applicant_id !== applicantId) {
        throw new AuthorizationError('You can only withdraw your own applications');
      }

      // Check if application can be withdrawn
      if (application.status === 'offered' || application.status === 'withdrawn') {
        throw new ValidationError(`Cannot withdraw a ${application.status} application`);
      }

      // Update status
      const updated = await applicationRepository.update(applicationId, { status: 'withdrawn' });

      // Send notification to employer
      await notificationService.createNotification(
        application.employer_id,
        'application',
        'Application Withdrawn',
        `An applicant has withdrawn their application`,
        { applicationId: application.id }
      );

      logger.info('Application withdrawn', { applicationId, applicantId });
      return updated;
    } catch (error) {
      logger.error('Failed to withdraw application', error, { applicationId, applicantId });
      throw error;
    }
  }
}

module.exports = new ApplicationService();
