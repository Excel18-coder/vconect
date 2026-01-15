/**
 * Admin Analytics Controller
 * Provides comprehensive analytics endpoints for the admin dashboard
 *
 * All endpoints require admin authentication and appropriate permissions
 */

const { asyncHandler } = require('../middleware/error-handler');
const { sendSuccess } = require('../utils/response');
const { sql } = require('../config/database');
const {
  analyticsAggregationService,
  METRICS,
} = require('../services/analytics/analytics-aggregation-service');
const { eventTrackingService } = require('../services/analytics/event-tracking-service');
const { auditLoggingService } = require('../services/analytics/audit-logging-service');
const logger = require('../utils/logger');

/**
 * Get dashboard overview with KPIs
 * GET /api/admin/analytics/dashboard
 */
const getDashboardOverview = asyncHandler(async (req, res) => {
  const kpis = await analyticsAggregationService.getDashboardKPIs();

  // Get real-time stats (not pre-aggregated)
  const realtimeStats = await sql`
    SELECT 
      (SELECT COUNT(*) FROM users WHERE is_suspended = true) as suspended_users,
      (SELECT COUNT(*) FROM users WHERE is_banned = true) as banned_users,
      (SELECT COUNT(*) FROM security_events WHERE resolved = false) as unresolved_security_events,
      (SELECT COUNT(*) FROM admin_audit_logs WHERE created_at >= NOW() - INTERVAL '24 hours') as admin_actions_24h
  `;

  // Get recent admin activity
  const recentActivity = await sql`
    SELECT 
      a.action,
      a.target_type,
      a.created_at,
      u.email as admin_email,
      p.display_name as admin_name
    FROM admin_audit_logs a
    JOIN users u ON a.admin_id = u.id
    LEFT JOIN profiles p ON a.admin_id = p.user_id
    ORDER BY a.created_at DESC
    LIMIT 10
  `;

  return sendSuccess(res, 'Dashboard overview retrieved', {
    kpis,
    realtime: realtimeStats[0],
    recentActivity,
  });
});

/**
 * Get user analytics
 * GET /api/admin/analytics/users
 */
const getUserAnalytics = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;

  // Get user growth trend
  const userGrowth = await analyticsAggregationService.getMetricTrend(METRICS.NEW_USERS, days);

  // Get user type distribution
  const userTypeDistribution = await sql`
    SELECT 
      p.user_type,
      COUNT(*) as count
    FROM profiles p
    JOIN users u ON p.user_id = u.id
    GROUP BY p.user_type
  `;

  // Get DAU trend
  const dauTrend = await analyticsAggregationService.getMetricTrend(METRICS.DAU, days);

  // Get user retention cohorts (users who came back after N days)
  const retention = await sql`
    WITH first_login AS (
      SELECT 
        user_id,
        MIN(DATE(created_at)) as cohort_date
      FROM user_events
      WHERE event_type = 'user.login'
      GROUP BY user_id
    ),
    return_activity AS (
      SELECT 
        fl.cohort_date,
        DATE(ue.created_at) - fl.cohort_date as days_since_first,
        COUNT(DISTINCT ue.user_id) as active_users
      FROM first_login fl
      JOIN user_events ue ON fl.user_id = ue.user_id
      WHERE DATE(ue.created_at) > fl.cohort_date
        AND fl.cohort_date >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY fl.cohort_date, days_since_first
    )
    SELECT 
      cohort_date,
      days_since_first,
      active_users
    FROM return_activity
    WHERE days_since_first <= 30
    ORDER BY cohort_date DESC, days_since_first ASC
    LIMIT 100
  `;

  // Get top active users
  const topActiveUsers = await sql`
    SELECT 
      ue.user_id,
      u.email,
      p.display_name,
      p.user_type,
      COUNT(*) as event_count
    FROM user_events ue
    JOIN users u ON ue.user_id = u.id
    LEFT JOIN profiles p ON ue.user_id = p.user_id
    WHERE ue.created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY ue.user_id, u.email, p.display_name, p.user_type
    ORDER BY event_count DESC
    LIMIT 20
  `;

  return sendSuccess(res, 'User analytics retrieved', {
    userGrowth,
    userTypeDistribution,
    dauTrend,
    retention,
    topActiveUsers,
  });
});

/**
 * Get product analytics
 * GET /api/admin/analytics/products
 */
const getProductAnalytics = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;

  // Get product listing trend
  const productGrowth = await analyticsAggregationService.getMetricTrend(
    METRICS.NEW_PRODUCTS,
    days
  );

  // Get products by category
  const productsByCategory = await sql`
    SELECT 
      category,
      COUNT(*) as count,
      AVG(price) as avg_price
    FROM listings
    WHERE created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY category
    ORDER BY count DESC
  `;

  // Get product status distribution
  const statusDistribution = await sql`
    SELECT 
      status,
      COUNT(*) as count
    FROM listings
    GROUP BY status
  `;

  // Get most viewed products
  const mostViewedProducts = await sql`
    SELECT 
      l.id,
      l.title,
      l.price,
      l.category,
      l.status,
      COUNT(ue.id) as view_count
    FROM listings l
    LEFT JOIN user_events ue ON 
      ue.event_type = 'product.view' AND
      ue.event_data->>'productId' = l.id::text AND
      ue.created_at >= NOW() - INTERVAL '${days} days'
    WHERE l.created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY l.id
    ORDER BY view_count DESC
    LIMIT 20
  `;

  // Get conversion funnel
  const conversionFunnel = await sql`
    SELECT 
      COUNT(DISTINCT CASE WHEN event_type = 'product.view' THEN user_id END) as viewers,
      COUNT(DISTINCT CASE WHEN event_type = 'favorite.add' THEN user_id END) as favoriters,
      COUNT(DISTINCT CASE WHEN event_type = 'message.send' THEN user_id END) as inquirers
    FROM user_events
    WHERE created_at >= NOW() - INTERVAL '${days} days'
  `;

  return sendSuccess(res, 'Product analytics retrieved', {
    productGrowth,
    productsByCategory,
    statusDistribution,
    mostViewedProducts,
    conversionFunnel: conversionFunnel[0],
  });
});

/**
 * Get engagement analytics
 * GET /api/admin/analytics/engagement
 */
const getEngagementAnalytics = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;

  // Get message volume trend
  const messageTrend = await analyticsAggregationService.getMetricTrend(
    METRICS.MESSAGES_SENT,
    days
  );

  // Get search trend
  const searchTrend = await analyticsAggregationService.getMetricTrend(
    METRICS.SEARCH_QUERIES,
    days
  );

  // Get top search queries
  const topSearches = await sql`
    SELECT 
      event_data->>'query' as query,
      COUNT(*) as search_count,
      AVG((event_data->>'resultsCount')::int) as avg_results
    FROM user_events
    WHERE event_type = 'search.query'
      AND created_at >= NOW() - INTERVAL '${days} days'
      AND event_data->>'query' IS NOT NULL
      AND event_data->>'query' != ''
    GROUP BY event_data->>'query'
    ORDER BY search_count DESC
    LIMIT 20
  `;

  // Get zero-result searches (opportunities to improve inventory)
  const zeroResultSearches = await sql`
    SELECT 
      event_data->>'query' as query,
      COUNT(*) as search_count
    FROM user_events
    WHERE event_type = 'search.query'
      AND created_at >= NOW() - INTERVAL '${days} days'
      AND (event_data->>'resultsCount')::int = 0
    GROUP BY event_data->>'query'
    ORDER BY search_count DESC
    LIMIT 20
  `;

  // Get user engagement by hour of day
  const engagementByHour = await sql`
    SELECT 
      EXTRACT(HOUR FROM created_at) as hour,
      COUNT(*) as event_count
    FROM user_events
    WHERE created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY hour
    ORDER BY hour
  `;

  return sendSuccess(res, 'Engagement analytics retrieved', {
    messageTrend,
    searchTrend,
    topSearches,
    zeroResultSearches,
    engagementByHour,
  });
});

/**
 * Get security analytics
 * GET /api/admin/analytics/security
 */
const getSecurityAnalytics = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;

  // Get security events by severity
  const eventsBySeverity = await sql`
    SELECT 
      severity,
      COUNT(*) as count
    FROM security_events
    WHERE created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY severity
    ORDER BY 
      CASE severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END
  `;

  // Get security events by type
  const eventsByType = await sql`
    SELECT 
      event_type,
      COUNT(*) as count
    FROM security_events
    WHERE created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY event_type
    ORDER BY count DESC
  `;

  // Get recent unresolved security events
  const unresolvedEvents = await eventTrackingService.getRecentSecurityEvents(
    {
      resolved: false,
      hours: days * 24,
    },
    50
  );

  // Get failed login attempts by IP
  const failedLoginsByIP = await sql`
    SELECT 
      ip_address,
      COUNT(*) as attempt_count,
      MAX(created_at) as last_attempt
    FROM security_events
    WHERE event_type = 'failed_login'
      AND created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY ip_address
    ORDER BY attempt_count DESC
    LIMIT 20
  `;

  // Get suspicious IPs (multiple failed attempts)
  const suspiciousIPs = await sql`
    SELECT DISTINCT ip_address
    FROM security_events
    WHERE created_at >= NOW() - INTERVAL '24 hours'
    GROUP BY ip_address
    HAVING COUNT(CASE WHEN event_type = 'failed_login' THEN 1 END) >= 5
  `;

  return sendSuccess(res, 'Security analytics retrieved', {
    eventsBySeverity,
    eventsByType,
    unresolvedEvents,
    failedLoginsByIP,
    suspiciousIPs,
  });
});

/**
 * Get audit log analytics
 * GET /api/admin/analytics/audit
 */
const getAuditAnalytics = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;

  const stats = await auditLoggingService.getAuditStats(days);

  // Get most common admin actions
  const commonActions = await sql`
    SELECT 
      action,
      COUNT(*) as count
    FROM admin_audit_logs
    WHERE created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY action
    ORDER BY count DESC
    LIMIT 15
  `;

  // Get admin action timeline (daily)
  const actionTimeline = await sql`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as action_count
    FROM admin_audit_logs
    WHERE created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `;

  return sendSuccess(res, 'Audit analytics retrieved', {
    ...stats,
    commonActions,
    actionTimeline,
  });
});

/**
 * Get system performance metrics
 * GET /api/admin/analytics/performance
 */
const getPerformanceMetrics = asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;

  // Get event volume by category
  const eventsByCategory = await sql`
    SELECT 
      event_category,
      COUNT(*) as count
    FROM user_events
    WHERE created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY event_category
    ORDER BY count DESC
  `;

  // Get hourly event volume
  const eventVolumeByHour = await sql`
    SELECT 
      DATE_TRUNC('hour', created_at) as hour,
      COUNT(*) as event_count
    FROM user_events
    WHERE created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY hour
    ORDER BY hour DESC
    LIMIT 168
  `;

  // Database metrics
  const dbMetrics = await sql`
    SELECT 
      schemaname,
      tablename,
      n_tup_ins as inserts,
      n_tup_upd as updates,
      n_tup_del as deletes
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY n_tup_ins + n_tup_upd + n_tup_del DESC
    LIMIT 10
  `;

  // Table sizes
  const tableSizes = await sql`
    SELECT 
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    LIMIT 10
  `;

  return sendSuccess(res, 'Performance metrics retrieved', {
    eventsByCategory,
    eventVolumeByHour,
    dbMetrics,
    tableSizes,
  });
});

/**
 * Export analytics data
 * GET /api/admin/analytics/export
 */
const exportAnalyticsData = asyncHandler(async (req, res) => {
  const { metric, startDate, endDate, format = 'json' } = req.query;

  if (!metric || !startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'metric, startDate, and endDate are required',
    });
  }

  // Get data for date range
  const data = await sql`
    SELECT date, metric_value, dimensions
    FROM analytics_daily
    WHERE metric_name = ${metric}
      AND date >= ${startDate}
      AND date <= ${endDate}
    ORDER BY date ASC
  `;

  if (format === 'csv') {
    // Convert to CSV
    const csv = [
      ['Date', 'Value', 'Dimensions'],
      ...data.map(row => [row.date, row.metric_value, JSON.stringify(row.dimensions)]),
    ]
      .map(row => row.join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${metric}_${startDate}_${endDate}.csv"`
    );
    return res.send(csv);
  }

  return sendSuccess(res, 'Analytics data exported', { data });
});

module.exports = {
  getDashboardOverview,
  getUserAnalytics,
  getProductAnalytics,
  getEngagementAnalytics,
  getSecurityAnalytics,
  getAuditAnalytics,
  getPerformanceMetrics,
  exportAnalyticsData,
};
