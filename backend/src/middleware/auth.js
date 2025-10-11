const { verifyToken, extractTokenFromHeader } = require('../utils/auth');
const { sendUnauthorized, sendForbidden } = require('../utils/response');
const { sql } = require('../config/database');

/**
 * Middleware to authenticate JWT tokens
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return sendUnauthorized(res, 'Access token is required');
    }

    // Verify the token
    const decoded = verifyToken(token);
    
    // Check if user still exists
    const users = await sql`
      SELECT id, email, email_verified FROM users 
      WHERE id = ${decoded.userId}
    `;

    if (users.length === 0) {
      return sendUnauthorized(res, 'Invalid token - user not found');
    }

    const user = users[0];

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      emailVerified: user.email_verified
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return sendUnauthorized(res, 'Invalid token');
    } else if (error.name === 'TokenExpiredError') {
      return sendUnauthorized(res, 'Token expired');
    } else {
      console.error('Authentication error:', error);
      return sendUnauthorized(res, 'Authentication failed');
    }
  }
};

/**
 * Middleware to check if user's email is verified
 */
const requireEmailVerification = (req, res, next) => {
  if (!req.user.emailVerified) {
    return sendForbidden(res, 'Email verification required');
  }
  next();
};

/**
 * Middleware to check user roles/permissions
 */
const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const profiles = await sql`
        SELECT user_type FROM profiles 
        WHERE user_id = ${req.user.id}
      `;

      if (profiles.length === 0) {
        return sendForbidden(res, 'User profile not found');
      }

      const userType = profiles[0].user_type;
      
      if (!allowedRoles.includes(userType)) {
        return sendForbidden(res, 'Insufficient permissions');
      }

      req.user.userType = userType;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      return sendForbidden(res, 'Permission check failed');
    }
  };
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = verifyToken(token);
      
      const users = await sql`
        SELECT id, email, email_verified FROM users 
        WHERE id = ${decoded.userId}
      `;

      if (users.length > 0) {
        const user = users[0];
        req.user = {
          id: user.id,
          email: user.email,
          emailVerified: user.email_verified
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

module.exports = {
  authenticateToken,
  requireEmailVerification,
  requireRole,
  optionalAuth
};
