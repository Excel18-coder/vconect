/**
 * Doctor Service
 * Business logic for doctor profile management
 */

const doctorRepository = require('../../repositories/doctorRepository');
const userRepository = require('../../repositories/userRepository');
const logger = require('../../utils/logger');
const { ValidationError, NotFoundError, AuthorizationError } = require('../../errors');

class DoctorService {
  /**
   * Create or update doctor profile
   */
  async createOrUpdateProfile(userId, profileData) {
    logger.debug('Creating/updating doctor profile', { userId });

    // Validate required fields
    if (!profileData.medical_license_number || profileData.medical_license_number.trim().length === 0) {
      throw new ValidationError('Medical license number is required');
    }
    if (!profileData.specialization || profileData.specialization.trim().length === 0) {
      throw new ValidationError('Specialization is required');
    }
    if (!profileData.consultation_fee || profileData.consultation_fee < 0) {
      throw new ValidationError('Valid consultation fee is required');
    }
    if (profileData.years_of_experience < 0) {
      throw new ValidationError('Years of experience cannot be negative');
    }

    // Validate consultation mode
    const validModes = ['online', 'in-person', 'both'];
    if (profileData.consultation_mode) {
      const modes = Array.isArray(profileData.consultation_mode) 
        ? profileData.consultation_mode 
        : [profileData.consultation_mode];
      
      for (const mode of modes) {
        if (!validModes.includes(mode)) {
          throw new ValidationError(`Consultation mode must be one of: ${validModes.join(', ')}`);
        }
      }
    }

    try {
      // Check if profile exists
      const existing = await doctorRepository.findByUserId(userId);

      let profile;
      if (existing) {
        profile = await doctorRepository.update(userId, profileData);
        logger.info('Doctor profile updated', { userId, doctorId: profile.id });
      } else {
        profile = await doctorRepository.create({ ...profileData, user_id: userId });
        logger.info('Doctor profile created', { userId, doctorId: profile.id });
      }

      return profile;
    } catch (error) {
      logger.error('Failed to save doctor profile', error, { userId });
      throw error;
    }
  }

  /**
   * Get doctor profile
   */
  async getProfile(doctorId) {
    logger.debug('Getting doctor profile', { doctorId });

    try {
      const profile = await doctorRepository.findByUserIdWithDetails(doctorId);
      
      if (!profile) {
        throw new NotFoundError('Doctor profile', doctorId);
      }

      return profile;
    } catch (error) {
      logger.error('Failed to get doctor profile', error, { doctorId });
      throw error;
    }
  }

  /**
   * Browse doctors
   */
  async browseDoctors(filters = {}) {
    logger.debug('Browsing doctors', filters);

    try {
      const searchFilters = {
        specialization: filters.specialization || null,
        consultation_mode: filters.consultation_mode || null,
        insurance: filters.insurance || null,
        min_fee: filters.min_fee ? parseFloat(filters.min_fee) : null,
        max_fee: filters.max_fee ? parseFloat(filters.max_fee) : null,
        emergency_available: filters.emergency_available === 'true',
        limit: parseInt(filters.limit) || 20,
        offset: filters.page ? (parseInt(filters.page) - 1) * (parseInt(filters.limit) || 20) : 0
      };

      const doctors = await doctorRepository.search(searchFilters);
      const total = await doctorRepository.countSearch(searchFilters);

      return {
        doctors,
        total,
        page: filters.page ? parseInt(filters.page) : 1,
        limit: searchFilters.limit,
        pages: Math.ceil(total / searchFilters.limit)
      };
    } catch (error) {
      logger.error('Failed to browse doctors', error, filters);
      throw error;
    }
  }

  /**
   * Get doctor statistics
   */
  async getStatistics(doctorId) {
    logger.debug('Getting doctor statistics', { doctorId });

    try {
      const stats = await doctorRepository.getStatistics(doctorId);
      return stats;
    } catch (error) {
      logger.error('Failed to get doctor statistics', error, { doctorId });
      throw error;
    }
  }

  /**
   * Verify doctor
   */
  async verifyDoctor(doctorId, verificationStatus) {
    logger.debug('Verifying doctor', { doctorId, verificationStatus });

    try {
      const doctor = await doctorRepository.findByUserId(doctorId);
      if (!doctor) {
        throw new NotFoundError('Doctor profile', doctorId);
      }

      await doctorRepository.setVerificationStatus(doctorId, verificationStatus);
      logger.info('Doctor verification status updated', { doctorId, verificationStatus });

      return true;
    } catch (error) {
      logger.error('Failed to verify doctor', error, { doctorId });
      throw error;
    }
  }

  /**
   * Update doctor rating
   */
  async updateRating(doctorId, rating, reviewCount) {
    logger.debug('Updating doctor rating', { doctorId, rating });

    try {
      await doctorRepository.updateRating(doctorId, rating, reviewCount);
      logger.info('Doctor rating updated', { doctorId, rating });

      return true;
    } catch (error) {
      logger.error('Failed to update doctor rating', error, { doctorId });
      throw error;
    }
  }

  /**
   * Increment consultation counts
   */
  async incrementCounts(doctorId) {
    logger.debug('Incrementing doctor consultation counts', { doctorId });

    try {
      await doctorRepository.incrementConsultationCount(doctorId);
      await doctorRepository.incrementPatientCount(doctorId);
      logger.info('Doctor counts incremented', { doctorId });

      return true;
    } catch (error) {
      logger.error('Failed to increment doctor counts', error, { doctorId });
      throw error;
    }
  }
}

module.exports = new DoctorService();
