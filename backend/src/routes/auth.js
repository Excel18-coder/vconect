const express = require('express');
const router = express.Router();

const {
  register,
  login,
  refreshAccessToken,
  logout,
  logoutAll,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  getMe,
  changePassword,
} = require('../controllers/auth-controller');

const { authenticateToken } = require('../middleware/auth');
const { authLimiter, passwordResetLimiter } = require('../middleware/rate-limiter');
const {
  validateRegister,
  validateLogin,
  validatePasswordResetRequest,
  validatePasswordReset,
  handleValidationErrors,
} = require('../utils/validation');

// Public routes
router.post('/register', authLimiter, validateRegister, handleValidationErrors, register);
router.post('/login', authLimiter, validateLogin, handleValidationErrors, login);
router.post('/refresh-token', refreshAccessToken);
router.get('/verify-email/:token', verifyEmail);
router.post(
  '/request-password-reset',
  passwordResetLimiter,
  validatePasswordResetRequest,
  handleValidationErrors,
  requestPasswordReset
);
router.post(
  '/reset-password',
  passwordResetLimiter,
  validatePasswordReset,
  handleValidationErrors,
  resetPassword
);

// Protected routes
router.get('/me', authenticateToken, getMe);
router.post('/logout', authenticateToken, logout);
router.post('/logout-all', authenticateToken, logoutAll);
router.post('/change-password', authenticateToken, changePassword);

module.exports = router;
