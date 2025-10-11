/**
 * Profile DTOs (Data Transfer Objects)
 * Transform profile models to API responses
 */

/**
 * Profile DTO - Transform profile for API response
 * @param {Object} profile - Profile object from database
 * @returns {Object} Transformed profile object
 */
const toProfileDto = (profile) => {
  if (!profile) return null;

  return {
    userId: profile.user_id || profile.userId,
    displayName: profile.display_name || profile.displayName,
    avatarUrl: profile.avatar_url || profile.avatarUrl,
    phoneNumber: profile.phone_number || profile.phoneNumber,
    location: profile.location,
    bio: profile.bio,
    userType: profile.user_type || profile.userType,
    createdAt: profile.created_at || profile.createdAt,
    updatedAt: profile.updated_at || profile.updatedAt
  };
};

/**
 * Profile with user DTO - Transform profile with user info
 * @param {Object} profile - Profile object from database
 * @param {Object} user - User object from database
 * @returns {Object} Combined profile and user object
 */
const toProfileWithUser = (profile, user = null) => {
  const profileDto = toProfileDto(profile);
  
  if (user) {
    return {
      ...profileDto,
      email: user.email,
      createdAt: user.created_at || user.createdAt
    };
  }

  return profileDto;
};

module.exports = {
  toProfileDto,
  toProfileWithUser
};
