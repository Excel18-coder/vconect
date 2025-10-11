const { authService } = require('../services');
const { 
  sendSuccess, 
  sendError, 
  sendCreated, 
  sendUnauthorized,
  sendNotFound 
} = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Register a new user
 */
const register = asyncHandler(async (req, res) => {
  const { email, password, displayName, userType = 'buyer' } = req.body;

  const result = await authService.register({
    email,
    password,
    displayName,
    userType
  });

  return sendCreated(res, 'User registered successfully', result);
});

/**
 * Login user
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.login(email, password);
  return sendSuccess(res, 'Login successful', result);
});

/**
 * Refresh access token
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return sendUnauthorized(res, 'Refresh token is required');
  }

  const result = await authService.refreshAccessToken(refreshToken);
  return sendSuccess(res, 'Token refreshed successfully', result);
});

/**
 * Logout user
 */
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await authService.logout(refreshToken);
  }

  return sendSuccess(res, 'Logout successful');
});

/**
 * Logout from all devices
 */
const logoutAll = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  await authService.logoutAll(userId);
  return sendSuccess(res, 'Logged out from all devices successfully');
});

/**
 * Verify email
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const result = await authService.verifyEmail(token);
  return sendSuccess(res, 'Email verified successfully', result);
});

/**
 * Request password reset
 */
const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const result = await authService.requestPasswordReset(email);
  return sendSuccess(res, 'If the email exists, a password reset link has been sent', result);
});

/**
 * Reset password
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  await authService.resetPassword(token, password);
  return sendSuccess(res, 'Password reset successfully');
});

/**
 * Get current user info
 */
const getMe = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await authService.getMe(userId);
  return sendSuccess(res, 'User data retrieved successfully', result);
});

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  logoutAll,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  getMe
};
