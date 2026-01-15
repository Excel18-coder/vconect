/**
 * Profile Service
 * Handles all user profile business logic
 */

const profileRepository = require('../../repositories/profile-repository');
const logger = require('../../utils/logger');
const { NotFoundError, ValidationError } = require('../../errors');

class ProfileService {
  /**
   * Get user profile
   */
  async getProfile(userId) {
    logger.debug('Getting user profile', { userId });

    const profile = await profileRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError('Profile not found');
    }

    return {
      id: profile.id,
      userId: profile.user_id,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      bio: profile.bio,
      userType: profile.user_type,
      phoneNumber: profile.phone_number,
      location: profile.location,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updateData) {
    logger.debug('Updating user profile', { userId, updateData });

    // Validate update data
    const allowedFields = ['display_name', 'bio', 'user_type', 'phone_number', 'location'];

    const updates = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        // Allow empty strings for optional fields to clear them
        // But require display_name and user_type to have values
        if (key === 'display_name' || key === 'user_type') {
          if (value !== undefined && value !== null && value !== '') {
            updates[key] = value;
          }
        } else {
          // For optional fields, allow empty strings or null to clear them
          if (value !== undefined) {
            updates[key] = value === '' ? null : value;
          }
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    // Validate required fields if they're being updated
    if (
      'display_name' in updates &&
      (!updates.display_name || updates.display_name.trim().length < 2)
    ) {
      throw new ValidationError('Display name must be at least 2 characters long');
    }

    // Check if profile exists
    const existingProfile = await profileRepository.findByUserId(userId);
    if (!existingProfile) {
      throw new NotFoundError('Profile not found');
    }

    // Update profile
    const updatedProfile = await profileRepository.update(userId, updates);

    logger.info('Profile updated successfully', { userId, updatedFields: Object.keys(updates) });

    return {
      id: updatedProfile.id,
      userId: updatedProfile.user_id,
      displayName: updatedProfile.display_name,
      avatarUrl: updatedProfile.avatar_url,
      bio: updatedProfile.bio,
      userType: updatedProfile.user_type,
      phoneNumber: updatedProfile.phone_number,
      location: updatedProfile.location,
      createdAt: updatedProfile.created_at,
      updatedAt: updatedProfile.updated_at,
    };
  }

  /**
   * Update profile avatar
   */
  async updateAvatar(userId, avatarUrl) {
    logger.debug('Updating profile avatar', { userId });

    if (!avatarUrl) {
      throw new ValidationError('Avatar URL is required');
    }

    const updatedProfile = await profileRepository.update(userId, {
      avatar_url: avatarUrl,
    });

    if (!updatedProfile) {
      throw new NotFoundError('Profile not found');
    }

    logger.info('Avatar updated successfully', { userId });

    return {
      id: updatedProfile.id,
      userId: updatedProfile.user_id,
      displayName: updatedProfile.display_name,
      avatarUrl: updatedProfile.avatar_url,
      bio: updatedProfile.bio,
      userType: updatedProfile.user_type,
      phoneNumber: updatedProfile.phone_number,
      location: updatedProfile.location,
      createdAt: updatedProfile.created_at,
      updatedAt: updatedProfile.updated_at,
    };
  }

  /**
   * Get public profile (for other users to view)
   */
  async getPublicProfile(userId) {
    logger.debug('Getting public profile', { userId });

    const profile = await profileRepository.findPublicProfile(userId);
    if (!profile) {
      throw new NotFoundError('Profile not found');
    }

    // Get user's active listing count
    const listingCount = await profileRepository.getActiveListingsCount(userId);

    return {
      id: profile.id,
      userId: profile.user_id,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      bio: profile.bio,
      userType: profile.user_type,
      location: profile.location,
      createdAt: profile.created_at,
      email: profile.email,
      stats: {
        activeListings: listingCount,
      },
    };
  }

  /**
   * Search profiles
   */
  async searchProfiles(searchParams) {
    logger.debug('Searching profiles', searchParams);

    const { query, userType, location, page = 1, limit = 20 } = searchParams;

    const offset = (page - 1) * limit;

    // Build search criteria
    const searchCriteria = {
      query,
      userType,
      location,
      limit: parseInt(limit),
      offset: parseInt(offset),
    };

    // Get profiles
    const profiles = await profileRepository.search(searchCriteria);

    // Get total count for pagination
    const totalCount = await profileRepository.countSearch(searchCriteria);
    const totalPages = Math.ceil(totalCount / limit);

    logger.debug('Profiles search completed', {
      count: profiles.length,
      totalCount,
    });

    return {
      profiles: profiles.map(profile => ({
        id: profile.id,
        userId: profile.user_id,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
        bio: profile.bio,
        userType: profile.user_type,
        location: profile.location,
        createdAt: profile.created_at,
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }
}

module.exports = new ProfileService();
