/**
 * Admin Middleware
 * Enhanced authorization and permission checking for admin routes
 *
 * Implements:
 * - Role-Based Access Control (RBAC)
 * - Permission-Based Access Control (PBAC)
 * - Action-level permission checks
 * - Audit logging for all admin actions
 * - Rate limiting
 * - IP whitelisting (optional)
 */

const { sql } = require('../config/database');
const { sendForbidden, sendUnauthorized } = require('../utils/response');
const { auditLoggingService } = require('../services/analytics/audit-logging-service');
const {
  eventTrackingService,
  SECURITY_EVENT_TYPES,
  SECURITY_SEVERITY,
} = require('../services/analytics/event-tracking-service');
const logger = require('../utils/logger');

/**
 * Admin roles hierarchy
 * Only super_admin role is allowed - single admin with full control
 */
const ADMIN_ROLES = {
  super_admin: 100,
};

/**
 * Permissions map
 * All permissions granted to super_admin only
 */
const PERMISSIONS = {
  // User management
  'users.view': ['super_admin'],
  'users.create': ['super_admin'],
  'users.update': ['super_admin'],
  'users.delete': ['super_admin'],
  'users.ban': ['super_admin'],
  'users.suspend': ['super_admin'],
  'users.impersonate': ['super_admin'],

  // Role management
  'roles.view': ['super_admin'],
  'roles.change': ['super_admin'],

  // Product management
  'products.view': ['super_admin'],
  'products.update': ['super_admin'],
  'products.delete': ['super_admin'],

  // Analytics
  'analytics.view': ['super_admin'],
  'analytics.export': ['super_admin'],

  // Audit logs
  'audit.view': ['super_admin'],

  // System settings
  'settings.view': ['super_admin'],
  'settings.update': ['super_admin'],

  // Admin management
  'admins.manage': ['super_admin'],
};

/**
 * Check if user is an admin
 */
const isAdmin = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user profile with role
    const profiles = await sql`
      SELECT user_type, is_suspended, is_banned
      FROM profiles
      WHERE user_id = ${userId}
    `;

    if (profiles.length === 0) {
      return sendForbidden(res, 'User profile not found');
    }

    const profile = profiles[0];

    // Check if user is suspended or banned
    if (profile.is_suspended) {
      await eventTrackingService.trackSecurityEvent({
        userId,
        eventType: SECURITY_EVENT_TYPES.UNAUTHORIZED_ACCESS_ATTEMPT,
        severity: SECURITY_SEVERITY.MEDIUM,
        description: 'Suspended user attempted to access admin area',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      return sendForbidden(res, 'Account is suspended');
    }

    if (profile.is_banned) {
      await eventTrackingService.trackSecurityEvent({
        userId,
        eventType: SECURITY_EVENT_TYPES.UNAUTHORIZED_ACCESS_ATTEMPT,
        severity: SECURITY_SEVERITY.HIGH,
        description: 'Banned user attempted to access admin area',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      return sendForbidden(res, 'Account is banned');
    }

    // Check if user is super_admin (only allowed admin role)
    if (profile.user_type !== 'super_admin') {
      await eventTrackingService.trackSecurityEvent({
        userId,
        eventType: SECURITY_EVENT_TYPES.UNAUTHORIZED_ACCESS_ATTEMPT,
        severity: SECURITY_SEVERITY.HIGH,
        description: 'Non-admin user attempted to access admin area',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        metadata: { userType: profile.user_type },
      });
      return sendForbidden(res, 'Admin access required');
    }

    // Attach admin role to request
    req.user.role = profile.user_type;
    req.user.roleLevel = ADMIN_ROLES[profile.user_type] || 0;

    next();
  } catch (error) {
    logger.error('isAdmin middleware error', error, { userId: req.user?.id });
    return sendForbidden(res, 'Authorization check failed');
  }
};

/**
 * Check if user has required permission
 */
const hasPermission = permission => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      // Check if role has this permission
      const allowedRoles = PERMISSIONS[permission];
      if (!allowedRoles) {
        logger.warn('Unknown permission checked', { permission });
        return sendForbidden(res, 'Invalid permission');
      }

      if (!allowedRoles.includes(userRole)) {
        // Log permission denied
        await eventTrackingService.trackPermissionDenied(
          userId,
          permission,
          req.method + ' ' + req.path,
          req.ip,
          req.get('user-agent')
        );

        return sendForbidden(res, `Permission denied: ${permission}`);
      }

      // Check for custom user-specific permissions (if granted)
      const customPermissions = await sql`
        SELECT permission
        FROM user_permissions
        WHERE user_id = ${userId}
          AND permission = ${permission}
          AND (expires_at IS NULL OR expires_at > NOW())
      `;

      if (customPermissions.length > 0 || allowedRoles.includes(userRole)) {
        req.user.permissions = req.user.permissions || [];
        req.user.permissions.push(permission);
        next();
      } else {
        await eventTrackingService.trackPermissionDenied(
          userId,
          permission,
          req.method + ' ' + req.path,
          req.ip,
          req.get('user-agent')
        );
        return sendForbidden(res, `Permission denied: ${permission}`);
      }
    } catch (error) {
      logger.error('hasPermission middleware error', error, { permission });
      return sendForbidden(res, 'Permission check failed');
    }
  };
};

/**
 * Check if user has required role level
 */
const hasRoleLevel = minimumLevel => {
  return (req, res, next) => {
    if (req.user.roleLevel < minimumLevel) {
      eventTrackingService.trackPermissionDenied(
        req.user.id,
        'role_level_' + minimumLevel,
        req.method + ' ' + req.path,
        req.ip,
        req.get('user-agent')
      );
      return sendForbidden(res, 'Insufficient role level');
    }
    next();
  };
};

/**
 * Require super admin
 */
const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    eventTrackingService.trackPermissionDenied(
      req.user.id,
      'super_admin_required',
      req.method + ' ' + req.path,
      req.ip,
      req.get('user-agent')
    );
    return sendForbidden(res, 'Super admin access required');
  }
  next();
};

/**
 * Rate limiting for admin actions
 * Prevents abuse even with valid admin credentials
 */
const rateLimitAdmin = (maxRequests = 100, windowMinutes = 1) => {
  const requestCounts = new Map(); // userId -> { count, resetTime }

  return async (req, res, next) => {
    const userId = req.user.id;
    const now = Date.now();

    // Get or initialize user request count
    let userRecord = requestCounts.get(userId);

    if (!userRecord || now > userRecord.resetTime) {
      // Reset window
      userRecord = {
        count: 0,
        resetTime: now + windowMinutes * 60 * 1000,
      };
      requestCounts.set(userId, userRecord);
    }

    userRecord.count++;

    if (userRecord.count > maxRequests) {
      await eventTrackingService.trackRateLimitExceeded(
        userId,
        req.path,
        req.ip,
        req.get('user-agent')
      );

      logger.warn('Admin rate limit exceeded', {
        userId,
        count: userRecord.count,
        maxRequests,
        path: req.path,
      });

      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please slow down.',
        retryAfter: Math.ceil((userRecord.resetTime - now) / 1000),
      });
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - userRecord.count);
    res.setHeader('X-RateLimit-Reset', new Date(userRecord.resetTime).toISOString());

    next();
  };
};

/**
 * IP whitelist middleware (optional)
 * Restricts admin access to specific IP addresses
 */
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (allowedIPs.length === 0) {
      // Whitelist disabled
      return next();
    }

    const clientIP = req.ip || req.connection.remoteAddress;

    if (!allowedIPs.includes(clientIP)) {
      eventTrackingService.trackSecurityEvent({
        userId: req.user?.id,
        eventType: SECURITY_EVENT_TYPES.UNAUTHORIZED_ACCESS_ATTEMPT,
        severity: SECURITY_SEVERITY.HIGH,
        description: `Admin access attempted from non-whitelisted IP: ${clientIP}`,
        ipAddress: clientIP,
        userAgent: req.get('user-agent'),
      });

      logger.warn('Admin access from non-whitelisted IP', {
        clientIP,
        userId: req.user?.id,
        allowedIPs,
      });

      return sendForbidden(res, 'Access denied from this IP address');
    }

    next();
  };
};

/**
 * Audit log middleware
 * Automatically logs all admin actions
 */
const auditLog = (action, targetType) => {
  return (req, res, next) => {
    // Capture original send functions
    const originalJson = res.json;
    const originalSend = res.send;

    // Override res.json to log after successful response
    res.json = function (data) {
      // Only log on success (status < 400)
      if (res.statusCode < 400) {
        // Extract target ID from request params or body
        const targetId = req.params.id || req.body?.id || req.body?.userId || req.body?.productId;

        // Log the action asynchronously (don't block response)
        auditLoggingService
          .logAction({
            adminId: req.user.id,
            action,
            targetType,
            targetId,
            beforeState: req.auditBeforeState || null,
            afterState: req.auditAfterState || data?.data || null,
            reason: req.body?.reason || req.query?.reason || null,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: {
              method: req.method,
              path: req.path,
              query: req.query,
            },
          })
          .catch(error => {
            logger.error('Failed to log audit trail', error);
          });
      }

      // Call original json function
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Middleware to capture before state for audit logging
 * Use this before modifying data
 */
const captureBeforeState = getStateFn => {
  return async (req, res, next) => {
    try {
      req.auditBeforeState = await getStateFn(req);
      next();
    } catch (error) {
      logger.error('Failed to capture before state', error);
      // Don't block the request if state capture fails
      next();
    }
  };
};

module.exports = {
  isAdmin,
  hasPermission,
  hasRoleLevel,
  requireSuperAdmin,
  rateLimitAdmin,
  ipWhitelist,
  auditLog,
  captureBeforeState,
  ADMIN_ROLES,
  PERMISSIONS,
};
