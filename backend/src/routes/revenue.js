const express = require('express');
const router = express.Router();
const {
  getRevenueOverview,
  getTransactions,
  getRevenueAnalytics,
  requestPayout
} = require('../controllers/revenueController');
const { authenticateToken } = require('../middleware/auth');

// All revenue routes require authentication
router.use(authenticateToken);

router.get('/overview', getRevenueOverview);
router.get('/transactions', getTransactions);
router.get('/analytics', getRevenueAnalytics);
router.post('/payout', requestPayout);

module.exports = router;
