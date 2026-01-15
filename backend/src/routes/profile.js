const express = require('express');
const router = express.Router();

const {
  getProfile,
  updateProfile,
  updateAvatar,
  getPublicProfile,
  searchProfiles,
} = require('../controllers/profile-controller');

const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validateProfileUpdate, handleValidationErrors } = require('../utils/validation');

// Public routes
router.get('/search', optionalAuth, searchProfiles);
router.get('/:userId', optionalAuth, getPublicProfile);

// Protected routes
router.get('/', authenticateToken, getProfile);
router.put('/', authenticateToken, validateProfileUpdate, handleValidationErrors, updateProfile);
router.patch('/avatar', authenticateToken, updateAvatar);

module.exports = router;
