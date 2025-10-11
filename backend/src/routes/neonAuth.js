const express = require('express');
const { getCurrentSession, verifyNeonSession } = require('../middleware/neonAuth');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess, sendError } = require('../utils/response');

const router = express.Router();

// Get current session (Neon Auth)
router.get('/session', getCurrentSession);

// Verify session endpoint
router.get('/verify', verifyNeonSession, asyncHandler(async (req, res) => {
  sendSuccess(res, 'Session verified', {
    user: req.user,
    session: req.session
  });
}));

// Sign out endpoint (compatible with Neon Auth)
router.post('/signout', asyncHandler(async (req, res) => {
  const sessionToken = req.headers.authorization?.replace('Bearer ', '') || 
                      req.cookies?.['next-auth.session-token'] ||
                      req.cookies?.['__Secure-next-auth.session-token'];

  if (sessionToken) {
    try {
      const { NeonAdapter } = require('../adapters/neonAdapter');
      const adapter = NeonAdapter(process.env.DATABASE_URL);
      await adapter.deleteSession(sessionToken);
    } catch (error) {
      console.error('Error deleting Neon session:', error);
    }
  }

  // Clear cookies
  res.clearCookie('next-auth.session-token');
  res.clearCookie('__Secure-next-auth.session-token');
  
  sendSuccess(res, 'Signed out successfully');
}));

module.exports = router;
