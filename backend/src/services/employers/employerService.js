/**
 * Employer Service
 * Business logic for employer profile management
 */

const employerRepository = require('../../repositories/employerRepository');
const userRepository = require('../../repositories/userRepository');
const logger = require('../../utils/logger');
const { ValidationError, NotFoundError, AuthorizationError } = require('../../errors');

class EmployerService {
  /**
   * Create or update employer profile
   */
  async createOrUpdateProfile(userId, profileData) {
    logger.debug('Creating/updating employer profile', { userId });

    // Validate required fields
    if (!profileData.company_name || profileData.company_name.trim().length === 0) {
      throw new ValidationError('Company name is required');
    }
    if (!profileData.industry || profileData.industry.trim().length === 0) {
      throw new ValidationError('Industry is required');
    }

    // Validate company size
    const validSizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];
    if (profileData.company_size && !validSizes.includes(profileData.company_size)) {
      throw new ValidationError(`Company size must be one of: ${validSizes.join(', ')}`);
    }

    // Validate founded year
    if (profileData.founded_year) {
      const currentYear = new Date().getFullYear();
      if (profileData.founded_year < 1800 || profileData.founded_year > currentYear) {
        throw new ValidationError('Invalid founded year');
      }
    }

    try {
      // Check if profile exists
      const existing = await employerRepository.findByUserId(userId);

      let profile;
      if (existing) {
        profile = await employerRepository.update(userId, profileData);
        logger.info('Employer profile updated', { userId, employerId: profile.id });
      } else {
        profile = await employerRepository.create({ ...profileData, user_id: userId });
        logger.info('Employer profile created', { userId, employerId: profile.id });
      }

      return profile;
    } catch (error) {
      logger.error('Failed to save employer profile', error, { userId });
      throw error;
    }
  }

  /**
   * Get employer profile
   */
  async getProfile(employerId) {
    logger.debug('Getting employer profile', { employerId });

    try {
      const profile = await employerRepository.findByUserIdWithDetails(employerId);
      
      if (!profile) {
        throw new NotFoundError('Employer profile', employerId);
      }

      return profile;
    } catch (error) {
      logger.error('Failed to get employer profile', error, { employerId });
      throw error;
    }
  }

  /**
   * Get employer statistics
   */
  async getStatistics(employerId) {
    logger.debug('Getting employer statistics', { employerId });

    try {
      const stats = await employerRepository.getStatistics(employerId);
      return stats;
    } catch (error) {
      logger.error('Failed to get employer statistics', error, { employerId });
      throw error;
    }
  }

  /**
   * Verify employer
   */
  async verifyEmployer(employerId, verificationStatus) {
    logger.debug('Verifying employer', { employerId, verificationStatus });

    try {
      const employer = await employerRepository.findByUserId(employerId);
      if (!employer) {
        throw new NotFoundError('Employer profile', employerId);
      }

      await employerRepository.setVerificationStatus(employerId, verificationStatus);
      logger.info('Employer verification status updated', { employerId, verificationStatus });

      return true;
    } catch (error) {
      logger.error('Failed to verify employer', error, { employerId });
      throw error;
    }
  }

  /**
   * Increment job count
   */
  async incrementJobCount(employerId) {
    logger.debug('Incrementing employer job count', { employerId });

    try {
      await employerRepository.incrementJobCount(employerId);
      logger.info('Employer job count incremented', { employerId });

      return true;
    } catch (error) {
      logger.error('Failed to increment job count', error, { employerId });
      throw error;
    }
  }
}

module.exports = new EmployerService();
