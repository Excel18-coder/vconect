/**
 * Audit Logging Service
 * Records all admin actions for compliance, security, and accountability
 *
 * Every admin action that modifies data must be logged with:
 * - Who performed the action (admin_id)
 * - What was done (action)
 * - What was affected (target_type, target_id)
 * - Before and after state
 * - When it happened (created_at)
 * - Why it was done (reason)
 * - Where it came from (ip_address, user_agent)
 */

const { sql } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Admin action types
 */
const ADMIN_ACTIONS = {
  // User management
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_RESTORE: 'user.restore',
  USER_BAN: 'user.ban',
  USER_UNBAN: 'user.unban',
  USER_SUSPEND: 'user.suspend',
  USER_UNSUSPEND: 'user.unsuspend',
  USER_VERIFY_EMAIL: 'user.verify_email',
  USER_PASSWORD_RESET: 'user.password_reset',
  USER_SESSION_REVOKE: 'user.session_revoke',
  USER_IMPERSONATE_START: 'user.impersonate_start',
  USER_IMPERSONATE_END: 'user.impersonate_end',

  // Role and permission management
  ROLE_CHANGE: 'role.change',
  PERMISSION_GRANT: 'permission.grant',
  PERMISSION_REVOKE: 'permission.revoke',

  // Product management
  PRODUCT_UPDATE: 'product.update',
  PRODUCT_DELETE: 'product.delete',
  PRODUCT_RESTORE: 'product.restore',
  PRODUCT_STATUS_CHANGE: 'product.status_change',
  PRODUCT_FEATURE: 'product.feature',
  PRODUCT_UNFEATURE: 'product.unfeature',
  PRODUCT_BULK_DELETE: 'product.bulk_delete',
  PRODUCT_BULK_UPDATE: 'product.bulk_update',

  // Category management
  CATEGORY_CREATE: 'category.create',
  CATEGORY_UPDATE: 'category.update',
  CATEGORY_DELETE: 'category.delete',

  // Message management
  MESSAGE_DELETE: 'message.delete',
  MESSAGE_BULK_DELETE: 'message.bulk_delete',

  // System settings
  SETTING_UPDATE: 'setting.update',
  FEATURE_FLAG_TOGGLE: 'feature_flag.toggle',

  // Security
  SECURITY_EVENT_RESOLVE: 'security.event_resolve',
  IP_WHITELIST_ADD: 'ip.whitelist_add',
  IP_BLACKLIST_ADD: 'ip.blacklist_add',
};

/**
 * Target types for audit logs
 */
const TARGET_TYPES = {
  USER: 'user',
  PROFILE: 'profile',
  PRODUCT: 'product',
  CATEGORY: 'category',
  MESSAGE: 'message',
  SETTING: 'setting',
  FEATURE_FLAG: 'feature_flag',
  PERMISSION: 'permission',
  SECURITY_EVENT: 'security_event',
};

class AuditLoggingService {
  /**
   * Log an admin action
   * @param {Object} auditData
   * @param {string} auditData.adminId - ID of the admin performing the action
   * @param {string} auditData.action - Action being performed (from ADMIN_ACTIONS)
   * @param {string} auditData.targetType - Type of target (from TARGET_TYPES)
   * @param {string} auditData.targetId - ID of the target resource
   * @param {Object} auditData.beforeState - State before the action (optional)
   * @param {Object} auditData.afterState - State after the action (optional)
   * @param {string} auditData.reason - Reason for the action
   * @param {string} auditData.ipAddress - IP address of the admin
   * @param {string} auditData.userAgent - User agent of the admin
   * @param {Object} auditData.metadata - Additional metadata
   */
  async logAction({
    adminId,
    action,
    targetType,
    targetId,
    beforeState = null,
    afterState = null,
    reason = null,
    ipAddress,
    userAgent,
    metadata = {},
  }) {
    try {
      // Redact sensitive fields from state snapshots
      const sanitizedBefore = this.sanitizeState(beforeState);
      const sanitizedAfter = this.sanitizeState(afterState);

      await sql`
        INSERT INTO admin_audit_logs (
          admin_id, action, target_type, target_id,
          before_state, after_state, reason,
          ip_address, user_agent, metadata
        ) VALUES (
          ${adminId},
          ${action},
          ${targetType},
          ${targetId || null},
          ${sanitizedBefore ? JSON.stringify(sanitizedBefore) : null},
          ${sanitizedAfter ? JSON.stringify(sanitizedAfter) : null},
          ${reason},
          ${ipAddress},
          ${userAgent || null},
          ${JSON.stringify(metadata)}
        )
      `;

      logger.info('Admin action logged', {
        adminId,
        action,
        targetType,
        targetId,
        reason: reason?.substring(0, 50), // Truncate for log
      });
    } catch (error) {
      // Critical: audit logging failures should be escalated
      logger.error('CRITICAL: Failed to log admin action', error, {
        adminId,
        action,
        targetType,
        targetId,
      });
      // Don't throw - we don't want to break the admin action
      // but we should alert monitoring systems
    }
  }

  /**
   * Sanitize state objects to remove sensitive data
   */
  sanitizeState(state) {
    if (!state) return null;

    const sanitized = { ...state };

    // Remove password fields
    const sensitiveFields = [
      'password',
      'password_hash',
      'passwordHash',
      'token',
      'access_token',
      'refresh_token',
      'api_key',
      'secret',
    ];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Log user ban action
   */
  async logUserBan(adminId, userId, beforeState, afterState, reason, ipAddress, userAgent) {
    return this.logAction({
      adminId,
      action: ADMIN_ACTIONS.USER_BAN,
      targetType: TARGET_TYPES.USER,
      targetId: userId,
      beforeState,
      afterState,
      reason,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log user suspension action
   */
  async logUserSuspend(
    adminId,
    userId,
    beforeState,
    afterState,
    reason,
    ipAddress,
    userAgent,
    expiresAt
  ) {
    return this.logAction({
      adminId,
      action: ADMIN_ACTIONS.USER_SUSPEND,
      targetType: TARGET_TYPES.USER,
      targetId: userId,
      beforeState,
      afterState,
      reason,
      ipAddress,
      userAgent,
      metadata: { expires_at: expiresAt },
    });
  }

  /**
   * Log role change action
   */
  async logRoleChange(adminId, userId, oldRole, newRole, reason, ipAddress, userAgent) {
    return this.logAction({
      adminId,
      action: ADMIN_ACTIONS.ROLE_CHANGE,
      targetType: TARGET_TYPES.USER,
      targetId: userId,
      beforeState: { user_type: oldRole },
      afterState: { user_type: newRole },
      reason,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log user deletion
   */
  async logUserDelete(adminId, userId, userState, reason, ipAddress, userAgent) {
    return this.logAction({
      adminId,
      action: ADMIN_ACTIONS.USER_DELETE,
      targetType: TARGET_TYPES.USER,
      targetId: userId,
      beforeState: userState,
      afterState: null,
      reason,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log product deletion
   */
  async logProductDelete(adminId, productId, productState, reason, ipAddress, userAgent) {
    return this.logAction({
      adminId,
      action: ADMIN_ACTIONS.PRODUCT_DELETE,
      targetType: TARGET_TYPES.PRODUCT,
      targetId: productId,
      beforeState: productState,
      afterState: null,
      reason,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log bulk product deletion
   */
  async logBulkProductDelete(adminId, productIds, reason, ipAddress, userAgent) {
    return this.logAction({
      adminId,
      action: ADMIN_ACTIONS.PRODUCT_BULK_DELETE,
      targetType: TARGET_TYPES.PRODUCT,
      targetId: null,
      beforeState: null,
      afterState: null,
      reason,
      ipAddress,
      userAgent,
      metadata: { product_ids: productIds, count: productIds.length },
    });
  }

  /**
   * Log user impersonation start
   */
  async logImpersonationStart(adminId, targetUserId, reason, ipAddress, userAgent) {
    return this.logAction({
      adminId,
      action: ADMIN_ACTIONS.USER_IMPERSONATE_START,
      targetType: TARGET_TYPES.USER,
      targetId: targetUserId,
      beforeState: null,
      afterState: null,
      reason,
      ipAddress,
      userAgent,
      metadata: { impersonation_start: new Date().toISOString() },
    });
  }

  /**
   * Log user impersonation end
   */
  async logImpersonationEnd(adminId, targetUserId, duration, ipAddress, userAgent) {
    return this.logAction({
      adminId,
      action: ADMIN_ACTIONS.USER_IMPERSONATE_END,
      targetType: TARGET_TYPES.USER,
      targetId: targetUserId,
      beforeState: null,
      afterState: null,
      reason: 'Impersonation session ended',
      ipAddress,
      userAgent,
      metadata: { duration_seconds: duration },
    });
  }

  /**
   * Get audit logs with filters
   */
  async getAuditLogs(filters = {}, pagination = {}) {
    try {
      const { adminId, action, targetType, targetId, startDate, endDate, search } = filters;

      const { page = 1, limit = 50 } = pagination;
      const offset = (page - 1) * limit;

      let query = sql`
        SELECT 
          a.*,
          u.email as admin_email,
          p.display_name as admin_name
        FROM admin_audit_logs a
        JOIN users u ON a.admin_id = u.id
        LEFT JOIN profiles p ON a.admin_id = p.user_id
        WHERE 1=1
      `;

      const conditions = [];
      if (adminId) conditions.push(sql`a.admin_id = ${adminId}`);
      if (action) conditions.push(sql`a.action = ${action}`);
      if (targetType) conditions.push(sql`a.target_type = ${targetType}`);
      if (targetId) conditions.push(sql`a.target_id = ${targetId}`);
      if (startDate) conditions.push(sql`a.created_at >= ${startDate}`);
      if (endDate) conditions.push(sql`a.created_at <= ${endDate}`);
      if (search) {
        conditions.push(sql`(
          a.action ILIKE ${`%${search}%`} OR
          a.reason ILIKE ${`%${search}%`} OR
          u.email ILIKE ${`%${search}%`}
        )`);
      }

      if (conditions.length > 0) {
        query = sql`${query} AND ${sql.join(conditions, sql` AND `)}`;
      }

      query = sql`${query} ORDER BY a.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

      const logs = await query;

      // Get total count
      let countQuery = sql`SELECT COUNT(*) as total FROM admin_audit_logs WHERE 1=1`;
      if (conditions.length > 0) {
        countQuery = sql`${countQuery} AND ${sql.join(conditions, sql` AND `)}`;
      }
      const totalResult = await countQuery;
      const total = parseInt(totalResult[0]?.total || 0);

      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Failed to get audit logs', error);
      throw error;
    }
  }

  /**
   * Get audit log statistics
   */
  async getAuditStats(days = 30) {
    try {
      // Actions by admin
      const actionsByAdmin = await sql`
        SELECT 
          a.admin_id,
          u.email as admin_email,
          p.display_name as admin_name,
          COUNT(*) as action_count
        FROM admin_audit_logs a
        JOIN users u ON a.admin_id = u.id
        LEFT JOIN profiles p ON a.admin_id = p.user_id
        WHERE a.created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY a.admin_id, u.email, p.display_name
        ORDER BY action_count DESC
        LIMIT 10
      `;

      // Actions by type
      const actionsByType = await sql`
        SELECT 
          action,
          COUNT(*) as count
        FROM admin_audit_logs
        WHERE created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY action
        ORDER BY count DESC
      `;

      // Daily action count
      const dailyActions = await sql`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM admin_audit_logs
        WHERE created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;

      return {
        actionsByAdmin,
        actionsByType,
        dailyActions,
      };
    } catch (error) {
      logger.error('Failed to get audit stats', error);
      throw error;
    }
  }

  /**
   * Get admin activity timeline
   */
  async getAdminActivityTimeline(adminId, limit = 100) {
    try {
      const logs = await sql`
        SELECT 
          action,
          target_type,
          target_id,
          reason,
          created_at
        FROM admin_audit_logs
        WHERE admin_id = ${adminId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;

      return logs;
    } catch (error) {
      logger.error('Failed to get admin activity timeline', error, { adminId });
      throw error;
    }
  }
}

// Export singleton instance
const auditLoggingService = new AuditLoggingService();

module.exports = {
  auditLoggingService,
  ADMIN_ACTIONS,
  TARGET_TYPES,
};
