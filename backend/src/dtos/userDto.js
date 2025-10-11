/**
 * User DTOs (Data Transfer Objects)
 * Transform database models to API responses
 */

/**
 * Public user DTO - Used for public profile views
 * @param {Object} user - User object from database
 * @returns {Object} Sanitized user object
 */
const toPublicUser = (user) => {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name || user.displayName,
    avatarUrl: user.avatar_url || user.avatarUrl,
    location: user.location,
    bio: user.bio,
    userType: user.user_type || user.userType,
    createdAt: user.created_at || user.createdAt
  };
};

/**
 * Private user DTO - Used for authenticated user's own profile
 * @param {Object} user - User object from database
 * @returns {Object} User object with sensitive fields
 */
const toPrivateUser = (user) => {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name || user.displayName,
    avatarUrl: user.avatar_url || user.avatarUrl,
    phoneNumber: user.phone_number || user.phoneNumber,
    location: user.location,
    bio: user.bio,
    userType: user.user_type || user.userType,
    createdAt: user.created_at || user.createdAt,
    updatedAt: user.updated_at || user.updatedAt
  };
};

/**
 * Auth response DTO - Used for login/register responses
 * @param {Object} user - User object from database
 * @param {String} token - JWT access token
 * @param {String} refreshToken - JWT refresh token
 * @returns {Object} Auth response object
 */
const toAuthResponse = (user, token, refreshToken = null) => {
  const response = {
    user: toPrivateUser(user),
    token
  };

  if (refreshToken) {
    response.refreshToken = refreshToken;
  }

  return response;
};

/**
 * User list DTO - Used for lists of users (admin, search, etc.)
 * @param {Array} users - Array of user objects
 * @returns {Array} Array of sanitized user objects
 */
const toUserList = (users) => {
  if (!Array.isArray(users)) return [];
  return users.map(toPublicUser);
};

module.exports = {
  toPublicUser,
  toPrivateUser,
  toAuthResponse,
  toUserList
};
