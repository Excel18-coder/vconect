/**
 * Enhanced Admin User Management Controller
 * Provides comprehensive user management with audit logging
 */

const { asyncHandler } = require('../middleware/error-handler');
const { sendSuccess, sendCreated } = require('../utils/response');
const { sql } = require('../config/database');
const {
  auditLoggingService,
  ADMIN_ACTIONS,
  TARGET_TYPES,
} = require('../services/analytics/audit-logging-service');
const { eventTrackingService } = require('../services/analytics/event-tracking-service');
const logger = require('../utils/logger');
const bcrypt = require('bcrypt');

/**
 * Get all users with advanced filtering
 * GET /api/admin/users
 * Permission: users.view
 */
const getUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    userType = null,
    status = null, // active, suspended, banned
    sortBy = 'created_at',
    order = 'DESC',
    startDate = null,
    endDate = null,
  } = req.query;

  const offset = (page - 1) * limit;

  let query = sql`
    SELECT 
      u.id, u.email, u.email_verified, u.created_at,
      p.display_name, p.user_type, p.location, p.phone_number, p.avatar_url, p.bio,
      p.is_suspended, p.suspended_at, p.suspend_reason, p.suspend_expires_at,
      p.is_banned, p.banned_at, p.ban_reason,
      COUNT(DISTINCT l.id) as product_count,
      COUNT(DISTINCT m.id) as message_count,
      MAX(ue.created_at) as last_activity
    FROM users u
    LEFT JOIN profiles p ON u.id = p.user_id
    LEFT JOIN listings l ON u.id = l.user_id
    LEFT JOIN messages m ON u.id = m.sender_id
    LEFT JOIN user_events ue ON u.id = ue.user_id
  `;

  const conditions = [];

  if (search) {
    conditions.push(sql`(u.email ILIKE ${`%${search}%`} OR p.display_name ILIKE ${`%${search}%`})`);
  }

  if (userType) {
    conditions.push(sql`p.user_type = ${userType}`);
  }

  if (status === 'suspended') {
    conditions.push(sql`p.is_suspended = true`);
  } else if (status === 'banned') {
    conditions.push(sql`p.is_banned = true`);
  } else if (status === 'active') {
    conditions.push(sql`(p.is_suspended = false AND p.is_banned = false)`);
  }

  if (startDate) {
    conditions.push(sql`u.created_at >= ${startDate}`);
  }

  if (endDate) {
    conditions.push(sql`u.created_at <= ${endDate}`);
  }

  if (conditions.length > 0) {
    query = sql`${query} WHERE ${sql.join(conditions, sql` AND `)}`;
  }

  query = sql`${query}
    GROUP BY u.id, u.email, u.email_verified, u.created_at,
             p.display_name, p.user_type, p.location, p.phone_number, p.avatar_url, p.bio,
             p.is_suspended, p.suspended_at, p.suspend_reason, p.suspend_expires_at,
             p.is_banned, p.banned_at, p.ban_reason
    ORDER BY ${sql(sortBy)} ${sql.raw(order)}
    LIMIT ${limit} OFFSET ${offset}
  `;

  const users = await query;

  // Get total count
  let countQuery = sql`
    SELECT COUNT(DISTINCT u.id) as total 
    FROM users u 
    LEFT JOIN profiles p ON u.id = p.user_id
  `;

  if (conditions.length > 0) {
    countQuery = sql`${countQuery} WHERE ${sql.join(conditions, sql` AND `)}`;
  }

  const totalResult = await countQuery;
  const total = parseInt(totalResult[0].total);

  return sendSuccess(res, 'Users retrieved successfully', {
    users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/**
 * Get user details with full activity
 * GET /api/admin/users/:id
 * Permission: users.view
 */
const getUserDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get user with profile
  const users = await sql`
    SELECT 
      u.*,
      p.display_name, p.user_type, p.location, p.phone_number, p.avatar_url, p.bio,
      p.is_suspended, p.suspended_at, p.suspended_by, p.suspend_reason, p.suspend_expires_at,
      p.is_banned, p.banned_at, p.banned_by, p.ban_reason
    FROM users u
    LEFT JOIN profiles p ON u.id = p.user_id
    WHERE u.id = ${id}
  `;

  if (users.length === 0) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const user = users[0];

  // Get activity statistics
  const activityStats = await sql`
    SELECT 
      event_category,
      COUNT(*) as count
    FROM user_events
    WHERE user_id = ${id}
    GROUP BY event_category
  `;

  // Get recent activity
  const recentActivity = await eventTrackingService.getUserActivityTimeline(id, 50);

  // Get products
  const products = await sql`
    SELECT id, title, price, status, views_count, created_at
    FROM listings
    WHERE user_id = ${id}
    ORDER BY created_at DESC
    LIMIT 10
  `;

  // Get messages sent
  const messageSent = await sql`
    SELECT COUNT(*) as count
    FROM messages
    WHERE sender_id = ${id}
  `;

  // Get security events
  const securityEvents = await sql`
    SELECT event_type, severity, description, created_at
    FROM security_events
    WHERE user_id = ${id}
    ORDER BY created_at DESC
    LIMIT 10
  `;

  return sendSuccess(res, 'User details retrieved', {
    user,
    stats: {
      activityByCategory: activityStats,
      totalProducts: products.length,
      totalMessagesSent: messageSent[0].count,
    },
    recentActivity,
    products,
    securityEvents,
  });
});

/**
 * Suspend user
 * PATCH /api/admin/users/:id/suspend
 * Permission: users.suspend
 */
const suspendUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason, expiresAt } = req.body;
  const adminId = req.user.id;

  if (!reason) {
    return res.status(400).json({ success: false, message: 'Suspension reason is required' });
  }

  // Get current user state
  const beforeState = await sql`
    SELECT is_suspended, suspended_at, suspend_reason
    FROM profiles
    WHERE user_id = ${id}
  `;

  // Suspend user
  await sql`
    UPDATE profiles
    SET is_suspended = true,
        suspended_at = NOW(),
        suspended_by = ${adminId},
        suspend_reason = ${reason},
        suspend_expires_at = ${expiresAt || null}
    WHERE user_id = ${id}
  `;

  const afterState = { is_suspended: true, suspend_reason: reason, suspend_expires_at: expiresAt };

  // Log audit trail
  await auditLoggingService.logUserSuspend(
    adminId,
    id,
    beforeState[0],
    afterState,
    reason,
    req.ip,
    req.get('user-agent'),
    expiresAt
  );

  // Revoke active sessions
  await sql`
    UPDATE user_sessions
    SET expires_at = NOW()
    WHERE user_id = ${id}
      AND expires_at > NOW()
  `;

  return sendSuccess(res, 'User suspended successfully', { userId: id });
});

/**
 * Unsuspend user
 * PATCH /api/admin/users/:id/unsuspend
 * Permission: users.suspend
 */
const unsuspendUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const adminId = req.user.id;

  const beforeState = await sql`
    SELECT is_suspended, suspend_reason
    FROM profiles
    WHERE user_id = ${id}
  `;

  await sql`
    UPDATE profiles
    SET is_suspended = false,
        suspended_at = NULL,
        suspended_by = NULL,
        suspend_reason = NULL,
        suspend_expires_at = NULL
    WHERE user_id = ${id}
  `;

  await auditLoggingService.logAction({
    adminId,
    action: ADMIN_ACTIONS.USER_UNSUSPEND,
    targetType: TARGET_TYPES.USER,
    targetId: id,
    beforeState: beforeState[0],
    afterState: { is_suspended: false },
    reason: reason || 'Suspension lifted',
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  return sendSuccess(res, 'User unsuspended successfully', { userId: id });
});

/**
 * Ban user (permanent)
 * PATCH /api/admin/users/:id/ban
 * Permission: users.ban
 */
const banUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const adminId = req.user.id;

  if (!reason) {
    return res.status(400).json({ success: false, message: 'Ban reason is required' });
  }

  const beforeState = await sql`
    SELECT is_banned, ban_reason
    FROM profiles
    WHERE user_id = ${id}
  `;

  await sql`
    UPDATE profiles
    SET is_banned = true,
        banned_at = NOW(),
        banned_by = ${adminId},
        ban_reason = ${reason}
    WHERE user_id = ${id}
  `;

  const afterState = { is_banned: true, ban_reason: reason };

  await auditLoggingService.logUserBan(
    adminId,
    id,
    beforeState[0],
    afterState,
    reason,
    req.ip,
    req.get('user-agent')
  );

  // Revoke all sessions
  await sql`
    UPDATE user_sessions
    SET expires_at = NOW()
    WHERE user_id = ${id}
  `;

  return sendSuccess(res, 'User banned successfully', { userId: id });
});

/**
 * Unban user
 * PATCH /api/admin/users/:id/unban
 * Permission: users.ban
 */
const unbanUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const adminId = req.user.id;

  const beforeState = await sql`
    SELECT is_banned, ban_reason
    FROM profiles
    WHERE user_id = ${id}
  `;

  await sql`
    UPDATE profiles
    SET is_banned = false,
        banned_at = NULL,
        banned_by = NULL,
        ban_reason = NULL
    WHERE user_id = ${id}
  `;

  await auditLoggingService.logAction({
    adminId,
    action: ADMIN_ACTIONS.USER_UNBAN,
    targetType: TARGET_TYPES.USER,
    targetId: id,
    beforeState: beforeState[0],
    afterState: { is_banned: false },
    reason: reason || 'Ban lifted',
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  return sendSuccess(res, 'User unbanned successfully', { userId: id });
});

/**
 * Change user role
 * PATCH /api/admin/users/:id/role
 * Permission: roles.change
 */
const changeUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role, reason } = req.body;
  const adminId = req.user.id;

  // Only buyer, seller, landlord roles allowed for regular users
  // super_admin cannot be assigned (only one exists: admin@gmail.com)
  const validRoles = ['buyer', 'seller', 'landlord'];
  if (!validRoles.includes(role)) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid role. Only buyer, seller, or landlord allowed.' });
  }

  const oldRole = await sql`
    SELECT user_type FROM profiles WHERE user_id = ${id}
  `;

  await sql`
    UPDATE profiles
    SET user_type = ${role}
    WHERE user_id = ${id}
  `;

  await auditLoggingService.logRoleChange(
    adminId,
    id,
    oldRole[0]?.user_type,
    role,
    reason || 'Role change',
    req.ip,
    req.get('user-agent')
  );

  return sendSuccess(res, 'User role updated successfully', { userId: id, newRole: role });
});

/**
 * Delete user
 * DELETE /api/admin/users/:id
 * Permission: users.delete
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const adminId = req.user.id;

  // Get user data before deletion
  const userData = await sql`
    SELECT u.*, p.*
    FROM users u
    LEFT JOIN profiles p ON u.id = p.user_id
    WHERE u.id = ${id}
  `;

  if (userData.length === 0) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Prevent deleting the super admin account
  if (userData[0].user_type === 'super_admin') {
    return res
      .status(403)
      .json({ success: false, message: 'Cannot delete the super admin account' });
  }

  // Log before deletion
  await auditLoggingService.logUserDelete(
    adminId,
    id,
    userData[0],
    reason || 'User deleted by admin',
    req.ip,
    req.get('user-agent')
  );

  // Delete user (cascade will handle related records)
  await sql`DELETE FROM users WHERE id = ${id}`;

  return sendSuccess(res, 'User deleted successfully', { userId: id });
});

/**
 * Force password reset
 * POST /api/admin/users/:id/reset-password
 * Permission: users.update
 */
const forcePasswordReset = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newPassword, reason } = req.body;
  const adminId = req.user.id;

  if (!newPassword || newPassword.length < 8) {
    return res
      .status(400)
      .json({ success: false, message: 'Password must be at least 8 characters' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await sql`
    UPDATE users
    SET password_hash = ${hashedPassword}
    WHERE id = ${id}
  `;

  // Revoke all sessions
  await sql`
    UPDATE user_sessions
    SET expires_at = NOW()
    WHERE user_id = ${id}
  `;

  await auditLoggingService.logAction({
    adminId,
    action: ADMIN_ACTIONS.USER_PASSWORD_RESET,
    targetType: TARGET_TYPES.USER,
    targetId: id,
    beforeState: null,
    afterState: null,
    reason: reason || 'Password reset by admin',
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  return sendSuccess(res, 'Password reset successfully', { userId: id });
});

/**
 * Revoke user sessions
 * POST /api/admin/users/:id/revoke-sessions
 * Permission: users.update
 */
const revokeUserSessions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const adminId = req.user.id;

  await sql`
    UPDATE user_sessions
    SET expires_at = NOW()
    WHERE user_id = ${id}
      AND expires_at > NOW()
  `;

  await auditLoggingService.logAction({
    adminId,
    action: ADMIN_ACTIONS.USER_SESSION_REVOKE,
    targetType: TARGET_TYPES.USER,
    targetId: id,
    beforeState: null,
    afterState: null,
    reason: reason || 'Sessions revoked by admin',
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  return sendSuccess(res, 'All user sessions revoked', { userId: id });
});

module.exports = {
  getUsers,
  getUserDetails,
  suspendUser,
  unsuspendUser,
  banUser,
  unbanUser,
  changeUserRole,
  deleteUser,
  forcePasswordReset,
  revokeUserSessions,
};
