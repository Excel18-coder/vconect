/**
 * Enhanced Admin Routes with RBAC
 * All routes require authentication and appropriate permissions
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  isAdmin,
  hasPermission,
  requireSuperAdmin,
  rateLimitAdmin,
  auditLog,
  captureBeforeState,
} = require('../middleware/admin-middleware');

// Import controllers
const adminUserController = require('../controllers/admin-user-controller');
const adminAnalyticsController = require('../controllers/admin-analytics-controller');
const adminController = require('../controllers/admin-controller');
const { auditLoggingService } = require('../services/analytics/audit-logging-service');
const { ADMIN_ACTIONS, TARGET_TYPES } = require('../services/analytics/audit-logging-service');

// ============================================================================
// MIDDLEWARE STACK
// All admin routes require: authentication -> admin check -> rate limiting
// ============================================================================
router.use(authenticateToken);
router.use(isAdmin);
router.use(rateLimitAdmin(100, 1)); // 100 requests per minute

// ============================================================================
// ANALYTICS ROUTES
// ============================================================================

// Dashboard overview
router.get(
  '/analytics/dashboard',
  hasPermission('analytics.view'),
  adminAnalyticsController.getDashboardOverview
);

// User analytics
router.get(
  '/analytics/users',
  hasPermission('analytics.view'),
  adminAnalyticsController.getUserAnalytics
);

// Product analytics
router.get(
  '/analytics/products',
  hasPermission('analytics.view'),
  adminAnalyticsController.getProductAnalytics
);

// Engagement analytics
router.get(
  '/analytics/engagement',
  hasPermission('analytics.view'),
  adminAnalyticsController.getEngagementAnalytics
);

// Security analytics
router.get(
  '/analytics/security',
  hasPermission('analytics.view'),
  adminAnalyticsController.getSecurityAnalytics
);

// Audit log analytics
router.get(
  '/analytics/audit',
  hasPermission('audit.view'),
  adminAnalyticsController.getAuditAnalytics
);

// System health
router.get(
  '/analytics/system',
  hasPermission('analytics.view'),
  adminAnalyticsController.getSystemHealth
);

// Export analytics
router.get(
  '/analytics/export',
  hasPermission('analytics.export'),
  adminAnalyticsController.exportAnalytics
);

// ============================================================================
// USER MANAGEMENT ROUTES
// ============================================================================

// List all users
router.get('/users', hasPermission('users.view'), adminUserController.getUsers);

// Get user details
router.get('/users/:id', hasPermission('users.view'), adminUserController.getUserDetails);

// Suspend user
router.patch(
  '/users/:id/suspend',
  hasPermission('users.suspend'),
  captureBeforeState(async req => {
    const { sql } = require('../config/database');
    const result = await sql`
      SELECT is_suspended, suspend_reason 
      FROM profiles 
      WHERE user_id = ${req.params.id}
    `;
    return result[0];
  }),
  auditLog(ADMIN_ACTIONS.USER_SUSPEND, TARGET_TYPES.USER),
  adminUserController.suspendUser
);

// Unsuspend user
router.patch(
  '/users/:id/unsuspend',
  hasPermission('users.suspend'),
  auditLog(ADMIN_ACTIONS.USER_UNSUSPEND, TARGET_TYPES.USER),
  adminUserController.unsuspendUser
);

// Ban user
router.patch(
  '/users/:id/ban',
  hasPermission('users.ban'),
  captureBeforeState(async req => {
    const { sql } = require('../config/database');
    const result = await sql`
      SELECT is_banned, ban_reason 
      FROM profiles 
      WHERE user_id = ${req.params.id}
    `;
    return result[0];
  }),
  auditLog(ADMIN_ACTIONS.USER_BAN, TARGET_TYPES.USER),
  adminUserController.banUser
);

// Unban user
router.patch(
  '/users/:id/unban',
  hasPermission('users.ban'),
  auditLog(ADMIN_ACTIONS.USER_UNBAN, TARGET_TYPES.USER),
  adminUserController.unbanUser
);

// Change user role
router.patch(
  '/users/:id/role',
  hasPermission('roles.change'),
  captureBeforeState(async req => {
    const { sql } = require('../config/database');
    const result = await sql`
      SELECT user_type 
      FROM profiles 
      WHERE user_id = ${req.params.id}
    `;
    return result[0];
  }),
  auditLog(ADMIN_ACTIONS.ROLE_CHANGE, TARGET_TYPES.USER),
  adminUserController.changeUserRole
);

// Delete user
router.delete(
  '/users/:id',
  hasPermission('users.delete'),
  captureBeforeState(async req => {
    const { sql } = require('../config/database');
    const result = await sql`
      SELECT u.*, p.* 
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.id = ${req.params.id}
    `;
    return result[0];
  }),
  auditLog(ADMIN_ACTIONS.USER_DELETE, TARGET_TYPES.USER),
  adminUserController.deleteUser
);

// Force password reset
router.post(
  '/users/:id/reset-password',
  hasPermission('users.update'),
  auditLog(ADMIN_ACTIONS.USER_PASSWORD_RESET, TARGET_TYPES.USER),
  adminUserController.forcePasswordReset
);

// Revoke user sessions
router.post(
  '/users/:id/revoke-sessions',
  hasPermission('users.update'),
  auditLog(ADMIN_ACTIONS.USER_SESSION_REVOKE, TARGET_TYPES.USER),
  adminUserController.revokeUserSessions
);

// Get user's products
router.get('/users/:id/products', hasPermission('users.view'), adminController.getUserProducts);

// ============================================================================
// PRODUCT MANAGEMENT ROUTES
// ============================================================================

// List all products
router.get('/products', hasPermission('products.view'), adminController.getProducts);

// Update product status
router.patch(
  '/products/:id/status',
  hasPermission('products.update'),
  auditLog(ADMIN_ACTIONS.PRODUCT_STATUS_CHANGE, TARGET_TYPES.PRODUCT),
  adminController.updateProductStatus
);

// Toggle featured product
router.patch(
  '/products/:id/featured',
  hasPermission('products.update'),
  auditLog(ADMIN_ACTIONS.PRODUCT_FEATURE, TARGET_TYPES.PRODUCT),
  adminController.toggleFeaturedProduct
);

// Delete product
router.delete(
  '/products/:id',
  hasPermission('products.delete'),
  captureBeforeState(async req => {
    const { sql } = require('../config/database');
    const result = await sql`
      SELECT * FROM listings WHERE id = ${req.params.id}
    `;
    return result[0];
  }),
  auditLog(ADMIN_ACTIONS.PRODUCT_DELETE, TARGET_TYPES.PRODUCT),
  adminController.deleteProduct
);

// Bulk delete products
router.post(
  '/products/bulk-delete',
  hasPermission('products.delete'),
  auditLog(ADMIN_ACTIONS.PRODUCT_BULK_DELETE, TARGET_TYPES.PRODUCT),
  adminController.bulkDeleteProducts
);

// Bulk update product status
router.post(
  '/products/bulk-status',
  hasPermission('products.update'),
  auditLog(ADMIN_ACTIONS.PRODUCT_BULK_UPDATE, TARGET_TYPES.PRODUCT),
  adminController.bulkUpdateProductStatus
);

// ============================================================================
// MESSAGE MANAGEMENT ROUTES
// ============================================================================

// List all messages
router.get(
  '/messages',
  hasPermission('products.view'), // Reusing product permission for now
  adminController.getMessages
);

// Delete message
router.delete(
  '/messages/:id',
  hasPermission('products.delete'),
  auditLog(ADMIN_ACTIONS.MESSAGE_DELETE, TARGET_TYPES.MESSAGE),
  adminController.deleteMessage
);

// ============================================================================
// CATEGORY MANAGEMENT ROUTES
// ============================================================================

// List categories
router.get('/categories', hasPermission('products.view'), adminController.getCategories);

// Create category
router.post(
  '/categories',
  hasPermission('products.update'),
  auditLog(ADMIN_ACTIONS.CATEGORY_CREATE, TARGET_TYPES.CATEGORY),
  adminController.createCategory
);

// Update category
router.patch(
  '/categories/:id',
  hasPermission('products.update'),
  auditLog(ADMIN_ACTIONS.CATEGORY_UPDATE, TARGET_TYPES.CATEGORY),
  adminController.updateCategory
);

// Delete category
router.delete(
  '/categories/:id',
  hasPermission('products.delete'),
  auditLog(ADMIN_ACTIONS.CATEGORY_DELETE, TARGET_TYPES.CATEGORY),
  adminController.deleteCategory
);

// ============================================================================
// AUDIT LOG ROUTES
// ============================================================================

// Get audit logs
router.get('/audit-logs', hasPermission('audit.view'), async (req, res) => {
  const { auditLoggingService } = require('../services/analytics/audit-logging-service');
  const result = await auditLoggingService.getAuditLogs(req.query, {
    page: req.query.page,
    limit: req.query.limit,
  });
  res.json({ success: true, data: result });
});

// Get admin activity timeline
router.get('/audit-logs/admin/:adminId', hasPermission('audit.view'), async (req, res) => {
  const { auditLoggingService } = require('../services/analytics/audit-logging-service');
  const timeline = await auditLoggingService.getAdminActivityTimeline(
    req.params.adminId,
    parseInt(req.query.limit) || 100
  );
  res.json({ success: true, data: { timeline } });
});

// ============================================================================
// SECURITY EVENT ROUTES
// ============================================================================

// Get security events
router.get('/security-events', hasPermission('analytics.view'), async (req, res) => {
  const { eventTrackingService } = require('../services/analytics/event-tracking-service');
  const events = await eventTrackingService.getRecentSecurityEvents(req.query);
  res.json({ success: true, data: { events } });
});

// Resolve security event
router.patch('/security-events/:id/resolve', hasPermission('analytics.view'), async (req, res) => {
  const { eventTrackingService } = require('../services/analytics/event-tracking-service');
  await eventTrackingService.resolveSecurityEvent(req.params.id, req.user.id, req.body.notes);
  res.json({ success: true, message: 'Security event resolved' });
});

// ============================================================================
// PLATFORM STATS (Legacy compatibility)
// ============================================================================

// Dashboard stats
router.get('/dashboard/stats', hasPermission('analytics.view'), adminController.getDashboardStats);

// Activity logs
router.get('/activity', hasPermission('analytics.view'), adminController.getActivityLogs);

// Platform statistics
router.get('/stats/platform', hasPermission('analytics.view'), adminController.getPlatformStats);

// Verify user email
router.patch('/users/:id/verify', hasPermission('users.update'), adminController.verifyUser);

// ============================================================================
// SUPER ADMIN ONLY ROUTES
// ============================================================================

// Manage admin permissions (super admin only)
router.post('/permissions/grant', requireSuperAdmin, async (req, res) => {
  const { sql } = require('../config/database');
  const { userId, permission, resourceType, resourceId, expiresAt } = req.body;

  await sql`
      INSERT INTO user_permissions (
        user_id, permission, resource_type, resource_id, granted_by, expires_at
      ) VALUES (
        ${userId}, ${permission}, ${resourceType || null}, 
        ${resourceId || null}, ${req.user.id}, ${expiresAt || null}
      )
      ON CONFLICT (user_id, permission, resource_type, resource_id)
      DO UPDATE SET granted_by = ${req.user.id}, granted_at = NOW()
    `;

  res.json({ success: true, message: 'Permission granted' });
});

// Revoke permission (super admin only)
router.post('/permissions/revoke', requireSuperAdmin, async (req, res) => {
  const { sql } = require('../config/database');
  const { userId, permission } = req.body;

  await sql`
      DELETE FROM user_permissions
      WHERE user_id = ${userId} AND permission = ${permission}
    `;

  res.json({ success: true, message: 'Permission revoked' });
});

// Run daily aggregation manually (super admin only)
router.post('/analytics/aggregate', requireSuperAdmin, async (req, res) => {
  const {
    analyticsAggregationService,
  } = require('../services/analytics/analytics-aggregation-service');
  const { date } = req.body;

  await analyticsAggregationService.aggregateDaily(date ? new Date(date) : null);

  res.json({ success: true, message: 'Analytics aggregation completed' });
});

module.exports = router;
