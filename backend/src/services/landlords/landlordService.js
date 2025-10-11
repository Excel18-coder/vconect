/**
 * Landlord Service
 * Handles all landlord profile business logic
 */

const landlordRepository = require('../../repositories/landlordRepository');
const userRepository = require('../../repositories/userRepository');
const logger = require('../../utils/logger');
const { NotFoundError, ValidationError, AuthorizationError } = require('../../errors');

class LandlordService {
  /**
   * Create or update landlord profile
   */
  async createOrUpdateProfile(userId, profileData) {
    logger.debug('Creating/updating landlord profile', { userId });

    const {
      company_name,
      license_number,
      years_in_business,
      insurance_details,
      emergency_contact,
      bio
    } = profileData;

    // Validate required fields for new profiles
    const existingProfile = await landlordRepository.findByUserId(userId);

    if (!existingProfile && !company_name) {
      throw new ValidationError('company_name is required for new landlord profiles');
    }

    const profilePayload = {
      user_id: userId,
      company_name: company_name?.trim() || null,
      license_number: license_number?.trim() || null,
      years_in_business: years_in_business ? parseInt(years_in_business) : null,
      insurance_details: insurance_details?.trim() || null,
      emergency_contact: emergency_contact?.trim() || null,
      bio: bio?.trim() || null
    };

    let profile;
    if (existingProfile) {
      profile = await landlordRepository.update(userId, profilePayload);
      logger.info('Landlord profile updated', { userId });
    } else {
      profile = await landlordRepository.create(profilePayload);
      logger.info('Landlord profile created', { userId });
    }

    return profile;
  }

  /**
   * Get landlord profile by user ID
   */
  async getProfile(userId) {
    logger.debug('Getting landlord profile', { userId });

    const profile = await landlordRepository.findByUserIdWithDetails(userId);

    if (!profile) {
      throw new NotFoundError('Landlord profile not found');
    }

    return profile;
  }

  /**
   * Get landlord statistics
   */
  async getStatistics(userId) {
    logger.debug('Getting landlord statistics', { userId });

    const stats = await landlordRepository.getStatistics(userId);

    return stats;
  }

  /**
   * Verify landlord (admin only)
   */
  async verifyLandlord(landlordId, adminId, verified = true) {
    logger.debug('Verifying landlord', { landlordId, adminId });

    // Check if admin (would need role check in real scenario)
    const profile = await landlordRepository.findByUserId(landlordId);

    if (!profile) {
      throw new NotFoundError('Landlord profile not found');
    }

    await landlordRepository.setVerificationStatus(landlordId, verified);

    logger.info('Landlord verification updated', { 
      landlordId, 
      adminId, 
      verified 
    });

    return { verified };
  }

  /**
   * Update profile rating (called after review)
   */
  async updateRating(userId, rating, totalReviews) {
    logger.debug('Updating landlord rating', { userId, rating });

    await landlordRepository.updateRating(userId, rating, totalReviews);

    logger.info('Landlord rating updated', { userId, rating, totalReviews });
  }
}

module.exports = new LandlordService();
