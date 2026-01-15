/**
 * Event Tracking Service
 * Handles tracking of user events, security events, and admin actions
 *
 * All events are stored in the database for analytics and audit purposes
 */

const { sql } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Event categories
 */
const EVENT_CATEGORIES = {
  AUTH: 'auth',
  PROFILE: 'profile',
  PRODUCT: 'product',
  MESSAGE: 'message',
  FAVORITE: 'favorite',
  SEARCH: 'search',
  ADMIN: 'admin',
  SYSTEM: 'system',
};

/**
 * Event types by category
 */
const EVENT_TYPES = {
  // Auth events
  USER_REGISTER: 'user.register',
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  PASSWORD_RESET_REQUEST: 'password.reset.request',
  PASSWORD_RESET_COMPLETE: 'password.reset.complete',
  PASSWORD_CHANGE: 'password.change',
  EMAIL_VERIFY: 'email.verify',
  TOKEN_REFRESH: 'token.refresh',

  // Profile events
  PROFILE_VIEW: 'profile.view',
  PROFILE_UPDATE: 'profile.update',
  AVATAR_UPLOAD: 'avatar.upload',

  // Product events
  PRODUCT_CREATE: 'product.create',
  PRODUCT_VIEW: 'product.view',
  PRODUCT_UPDATE: 'product.update',
  PRODUCT_DELETE: 'product.delete',
  PRODUCT_STATUS_CHANGE: 'product.status.change',

  // Message events
  MESSAGE_SEND: 'message.send',
  MESSAGE_READ: 'message.read',
  CONVERSATION_VIEW: 'conversation.view',

  // Favorite events
  FAVORITE_ADD: 'favorite.add',
  FAVORITE_REMOVE: 'favorite.remove',

  // Search events
  SEARCH_QUERY: 'search.query',
  SEARCH_SAVE: 'search.save',

  // Admin events (tracked in audit logs)
  ADMIN_USER_BAN: 'admin.user.ban',
  ADMIN_USER_SUSPEND: 'admin.user.suspend',
  ADMIN_USER_DELETE: 'admin.user.delete',
  ADMIN_ROLE_CHANGE: 'admin.role.change',
  ADMIN_PRODUCT_DELETE: 'admin.product.delete',
};

/**
 * Security event types
 */
const SECURITY_EVENT_TYPES = {
  FAILED_LOGIN: 'failed_login',
  PERMISSION_DENIED: 'permission_denied',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  INVALID_TOKEN: 'invalid_token',
  BRUTE_FORCE_ATTEMPT: 'brute_force_attempt',
  UNUSUAL_LOCATION: 'unusual_location',
  UNAUTHORIZED_ACCESS_ATTEMPT: 'unauthorized_access',
};

/**
 * Security event severity levels
 */
const SECURITY_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

class EventTrackingService {
  /**
   * Track a user event
   * @param {Object} eventData
   * @param {string} eventData.userId - User ID (optional for anonymous events)
   * @param {string} eventData.eventType - Event type from EVENT_TYPES
   * @param {string} eventData.eventCategory - Event category from EVENT_CATEGORIES
   * @param {Object} eventData.eventData - Additional event data
   * @param {string} eventData.ipAddress - IP address of the user
   * @param {string} eventData.userAgent - User agent string
   * @param {string} eventData.sessionId - Session ID
   */
  async trackEvent({
    userId,
    eventType,
    eventCategory,
    eventData = {},
    ipAddress,
    userAgent,
    sessionId,
  }) {
    try {
      await sql`
        INSERT INTO user_events (
          user_id, event_type, event_category, event_data,
          ip_address, user_agent, session_id
        ) VALUES (
          ${userId || null},
          ${eventType},
          ${eventCategory},
          ${JSON.stringify(eventData)},
          ${ipAddress || null},
          ${userAgent || null},
          ${sessionId || null}
        )
      `;

      logger.debug('Event tracked', { eventType, userId, sessionId });
    } catch (error) {
      // Don't let event tracking failures break the main flow
      logger.error('Failed to track event', error, { eventType, userId });
    }
  }

  /**
   * Track user login
   */
  async trackLogin(userId, ipAddress, userAgent, sessionId) {
    return this.trackEvent({
      userId,
      eventType: EVENT_TYPES.USER_LOGIN,
      eventCategory: EVENT_CATEGORIES.AUTH,
      eventData: { method: 'email' },
      ipAddress,
      userAgent,
      sessionId,
    });
  }

  /**
   * Track user registration
   */
  async trackRegistration(userId, userType, ipAddress, userAgent) {
    return this.trackEvent({
      userId,
      eventType: EVENT_TYPES.USER_REGISTER,
      eventCategory: EVENT_CATEGORIES.AUTH,
      eventData: { userType },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Track product view
   */
  async trackProductView(userId, productId, ipAddress, userAgent) {
    return this.trackEvent({
      userId,
      eventType: EVENT_TYPES.PRODUCT_VIEW,
      eventCategory: EVENT_CATEGORIES.PRODUCT,
      eventData: { productId },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Track search query
   */
  async trackSearch(userId, query, filters, resultsCount, ipAddress, userAgent) {
    return this.trackEvent({
      userId,
      eventType: EVENT_TYPES.SEARCH_QUERY,
      eventCategory: EVENT_CATEGORIES.SEARCH,
      eventData: { query, filters, resultsCount },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Track a security event
   * @param {Object} securityEvent
   * @param {string} securityEvent.userId - User ID (if known)
   * @param {string} securityEvent.eventType - Security event type
   * @param {string} securityEvent.severity - Severity level
   * @param {string} securityEvent.description - Event description
   * @param {string} securityEvent.ipAddress - IP address
   * @param {string} securityEvent.userAgent - User agent
   * @param {Object} securityEvent.metadata - Additional metadata
   */
  async trackSecurityEvent({
    userId,
    eventType,
    severity,
    description,
    ipAddress,
    userAgent,
    metadata = {},
  }) {
    try {
      await sql`
        INSERT INTO security_events (
          user_id, event_type, severity, description,
          ip_address, user_agent, metadata
        ) VALUES (
          ${userId || null},
          ${eventType},
          ${severity},
          ${description},
          ${ipAddress || null},
          ${userAgent || null},
          ${JSON.stringify(metadata)}
        )
      `;

      logger.warn('Security event tracked', { eventType, severity, userId, ipAddress });

      // Alert on critical events
      if (severity === SECURITY_SEVERITY.CRITICAL) {
        logger.error('CRITICAL SECURITY EVENT', { eventType, description, userId, ipAddress });
        // TODO: Integrate with alerting system (email, Slack, PagerDuty, etc.)
      }
    } catch (error) {
      logger.error('Failed to track security event', error, { eventType });
    }
  }

  /**
   * Track failed login attempt
   */
  async trackFailedLogin(email, ipAddress, userAgent, reason) {
    // Check for brute force (more than 5 failed attempts in 5 minutes)
    const recentFailures = await sql`
      SELECT COUNT(*) as count
      FROM security_events
      WHERE event_type = ${SECURITY_EVENT_TYPES.FAILED_LOGIN}
        AND ip_address = ${ipAddress}
        AND created_at >= NOW() - INTERVAL '5 minutes'
    `;

    const failureCount = parseInt(recentFailures[0]?.count || 0);
    const severity = failureCount >= 5 ? SECURITY_SEVERITY.HIGH : SECURITY_SEVERITY.LOW;

    return this.trackSecurityEvent({
      eventType: SECURITY_EVENT_TYPES.FAILED_LOGIN,
      severity,
      description: `Failed login attempt for email: ${email}. Reason: ${reason}`,
      ipAddress,
      userAgent,
      metadata: { email, reason, failureCount: failureCount + 1 },
    });
  }

  /**
   * Track permission denied event
   */
  async trackPermissionDenied(userId, resource, action, ipAddress, userAgent) {
    return this.trackSecurityEvent({
      userId,
      eventType: SECURITY_EVENT_TYPES.PERMISSION_DENIED,
      severity: SECURITY_SEVERITY.MEDIUM,
      description: `User ${userId} denied access to ${action} on ${resource}`,
      ipAddress,
      userAgent,
      metadata: { resource, action },
    });
  }

  /**
   * Track rate limit exceeded
   */
  async trackRateLimitExceeded(userId, endpoint, ipAddress, userAgent) {
    return this.trackSecurityEvent({
      userId,
      eventType: SECURITY_EVENT_TYPES.RATE_LIMIT_EXCEEDED,
      severity: SECURITY_SEVERITY.MEDIUM,
      description: `Rate limit exceeded for endpoint: ${endpoint}`,
      ipAddress,
      userAgent,
      metadata: { endpoint },
    });
  }

  /**
   * Get user activity timeline
   */
  async getUserActivityTimeline(userId, limit = 100) {
    try {
      const events = await sql`
        SELECT 
          event_type,
          event_category,
          event_data,
          ip_address,
          created_at
        FROM user_events
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;

      return events;
    } catch (error) {
      logger.error('Failed to get user activity timeline', error, { userId });
      throw error;
    }
  }

  /**
   * Get recent security events
   */
  async getRecentSecurityEvents(filters = {}, limit = 100) {
    try {
      const { severity, resolved, userId, eventType, hours = 24 } = filters;

      let query = sql`
        SELECT 
          id, user_id, event_type, severity, description,
          ip_address, metadata, resolved, created_at
        FROM security_events
        WHERE created_at >= NOW() - INTERVAL '${hours} hours'
      `;

      const conditions = [];
      if (severity) conditions.push(sql`severity = ${severity}`);
      if (resolved !== undefined) conditions.push(sql`resolved = ${resolved}`);
      if (userId) conditions.push(sql`user_id = ${userId}`);
      if (eventType) conditions.push(sql`event_type = ${eventType}`);

      if (conditions.length > 0) {
        query = sql`${query} AND ${sql.join(conditions, sql` AND `)}`;
      }

      query = sql`${query} ORDER BY created_at DESC LIMIT ${limit}`;

      const events = await query;
      return events;
    } catch (error) {
      logger.error('Failed to get security events', error);
      throw error;
    }
  }

  /**
   * Resolve a security event
   */
  async resolveSecurityEvent(eventId, resolvedBy, notes) {
    try {
      await sql`
        UPDATE security_events
        SET resolved = true,
            resolved_by = ${resolvedBy},
            resolved_at = NOW(),
            metadata = jsonb_set(metadata, '{resolution_notes}', ${JSON.stringify(notes)}::jsonb)
        WHERE id = ${eventId}
      `;

      logger.info('Security event resolved', { eventId, resolvedBy });
    } catch (error) {
      logger.error('Failed to resolve security event', error, { eventId });
      throw error;
    }
  }

  /**
   * Get event statistics
   */
  async getEventStats(days = 30) {
    try {
      const stats = await sql`
        SELECT 
          event_category,
          event_type,
          COUNT(*) as count,
          COUNT(DISTINCT user_id) as unique_users
        FROM user_events
        WHERE created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY event_category, event_type
        ORDER BY count DESC
      `;

      return stats;
    } catch (error) {
      logger.error('Failed to get event stats', error);
      throw error;
    }
  }
}

// Export singleton instance
const eventTrackingService = new EventTrackingService();

module.exports = {
  eventTrackingService,
  EVENT_TYPES,
  EVENT_CATEGORIES,
  SECURITY_EVENT_TYPES,
  SECURITY_SEVERITY,
};
