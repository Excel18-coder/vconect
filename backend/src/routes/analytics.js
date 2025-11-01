const express = require('express');
const router = express.Router();
const {
  getMarketInsights,
  getPricePredictions
} = require('../controllers/analyticsController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Public analytics (with optional user context)
router.get('/insights', optionalAuth, getMarketInsights);
router.get('/predictions', optionalAuth, getPricePredictions);

module.exports = router;
