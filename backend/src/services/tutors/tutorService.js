/**
 * Tutor Service
 * Business logic for tutor profile management
 */

const tutorRepository = require('../../repositories/tutorRepository');
const userRepository = require('../../repositories/userRepository');
const logger = require('../../utils/logger');
const { ValidationError, NotFoundError, AuthorizationError } = require('../../errors');

class TutorService {
  /**
   * Create or update tutor profile
   */
  async createOrUpdateProfile(userId, profileData) {
    logger.debug('Creating/updating tutor profile', { userId });

    // Validate required fields
    if (!profileData.specializations || !Array.isArray(profileData.specializations) || profileData.specializations.length === 0) {
      throw new ValidationError('At least one specialization is required');
    }
    if (!profileData.hourly_rate || profileData.hourly_rate <= 0) {
      throw new ValidationError('Valid hourly rate is required');
    }
    if (profileData.years_of_experience < 0) {
      throw new ValidationError('Years of experience cannot be negative');
    }

    // Validate teaching mode
    const validModes = ['online', 'in-person', 'both'];
    if (profileData.teaching_mode && !validModes.includes(profileData.teaching_mode)) {
      throw new ValidationError(`Teaching mode must be one of: ${validModes.join(', ')}`);
    }

    try {
      // Check if profile exists
      const existing = await tutorRepository.findByUserId(userId);

      let profile;
      if (existing) {
        profile = await tutorRepository.update(userId, profileData);
        logger.info('Tutor profile updated', { userId, tutorId: profile.id });
      } else {
        profile = await tutorRepository.create({ ...profileData, user_id: userId });
        logger.info('Tutor profile created', { userId, tutorId: profile.id });
      }

      return profile;
    } catch (error) {
      logger.error('Failed to save tutor profile', error, { userId });
      throw error;
    }
  }

  /**
   * Get tutor profile
   */
  async getProfile(tutorId) {
    logger.debug('Getting tutor profile', { tutorId });

    try {
      const profile = await tutorRepository.findByUserIdWithDetails(tutorId);
      
      if (!profile) {
        throw new NotFoundError('Tutor profile', tutorId);
      }

      return profile;
    } catch (error) {
      logger.error('Failed to get tutor profile', error, { tutorId });
      throw error;
    }
  }

  /**
   * Get tutor statistics
   */
  async getStatistics(tutorId) {
    logger.debug('Getting tutor statistics', { tutorId });

    try {
      const stats = await tutorRepository.getStatistics(tutorId);
      return stats;
    } catch (error) {
      logger.error('Failed to get tutor statistics', error, { tutorId });
      throw error;
    }
  }

  /**
   * Verify tutor
   */
  async verifyTutor(tutorId, verificationStatus) {
    logger.debug('Verifying tutor', { tutorId, verificationStatus });

    try {
      const tutor = await tutorRepository.findByUserId(tutorId);
      if (!tutor) {
        throw new NotFoundError('Tutor profile', tutorId);
      }

      await tutorRepository.setVerificationStatus(tutorId, verificationStatus);
      logger.info('Tutor verification status updated', { tutorId, verificationStatus });

      return true;
    } catch (error) {
      logger.error('Failed to verify tutor', error, { tutorId });
      throw error;
    }
  }

  /**
   * Update tutor rating
   */
  async updateRating(tutorId, rating, reviewCount) {
    logger.debug('Updating tutor rating', { tutorId, rating });

    try {
      await tutorRepository.updateRating(tutorId, rating, reviewCount);
      logger.info('Tutor rating updated', { tutorId, rating });

      return true;
    } catch (error) {
      logger.error('Failed to update tutor rating', error, { tutorId });
      throw error;
    }
  }
}

module.exports = new TutorService();
