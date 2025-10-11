const { profileService } = require('../services');
const { uploadService } = require('../services');
const { 
  sendSuccess, 
  sendCreated, 
  sendNotFound 
} = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Get user profile
 */
const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const profile = await profileService.getProfile(userId);
  return sendSuccess(res, 'Profile retrieved successfully', { profile });
});

/**
 * Update user profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const updateData = req.body;

  const profile = await profileService.updateProfile(userId, updateData);
  return sendSuccess(res, 'Profile updated successfully', { profile });
});

/**
 * Update avatar
 */
const updateAvatar = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  if (!req.file) {
    return sendError(res, 'No file uploaded', null, 400);
  }

  // Upload image
  const uploadedImage = await uploadService.uploadImage(req.file, 'avatars');

  // Update profile with new avatar URL
  const profile = await profileService.updateAvatar(userId, uploadedImage.url);
  
  return sendSuccess(res, 'Avatar updated successfully', { 
    profile,
    avatarUrl: uploadedImage.url
  });
});

/**
 * Get public profile
 */
const getPublicProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const profile = await profileService.getPublicProfile(id);
  return sendSuccess(res, 'Public profile retrieved successfully', { profile });
});

/**
 * Search profiles
 */
const searchProfiles = asyncHandler(async (req, res) => {
  const { query, userType, page = 1, limit = 20 } = req.query;

  const result = await profileService.searchProfiles({
    query,
    userType,
    page: parseInt(page),
    limit: parseInt(limit)
  });

  return sendSuccess(res, 'Profiles retrieved successfully', result);
});

module.exports = {
  getProfile,
  updateProfile,
  updateAvatar,
  getPublicProfile,
  searchProfiles
};
