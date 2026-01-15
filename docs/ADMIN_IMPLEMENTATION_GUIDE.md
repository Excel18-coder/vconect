# Admin Dashboard Implementation Guide

## Overview

This implementation provides a **production-grade admin dashboard** with comprehensive analytics, user management, audit logging, and security monitoring.

## Features Implemented

### 1. Database Schema ✅

- **user_events** - Tracks all user activities for analytics
- **admin_audit_logs** - Records every admin action with before/after state
- **security_events** - Monitors security threats and suspicious activity
- **analytics_daily** - Pre-aggregated daily metrics for fast queries
- **user_permissions** - Granular permission control system
- **admin_sessions** - Admin session management and revocation
- **feature_flags** - System-wide feature toggles
- **system_settings** - Admin-configurable settings
- **Enhanced profiles** - Added suspension/ban tracking fields

### 2. Services ✅

#### Event Tracking Service

- Tracks user events (login, product views, searches, etc.)
- Records security events (failed logins, permission denied, rate limits)
- Provides activity timelines and statistics
- Auto-detects brute force attempts

#### Audit Logging Service

- Logs all admin actions with full context
- Captures before/after state for audits
- Redacts sensitive data (passwords, tokens)
- Provides audit log queries and analytics

#### Analytics Aggregation Service

- Daily aggregation of metrics (DAU, new users, products, engagement)
- Pre-computed KPIs for dashboard performance
- Trend analysis and cohort tracking
- Exportable analytics data

### 3. Authorization & Security ✅

#### Admin Middleware

- **RBAC** - Role-based access control (super_admin, admin, moderator, support)
- **PBAC** - Permission-based access control for granular actions
- **Rate Limiting** - 100 requests/minute per admin to prevent abuse
- **IP Whitelisting** - Optional restriction by IP address
- **Session Management** - Revocable admin sessions
- **Audit Logging** - Automatic logging of all admin actions

#### Permission System

```
users.view, users.create, users.update, users.delete
users.ban, users.suspend, users.impersonate
roles.view, roles.change
products.view, products.update, products.delete
analytics.view, analytics.export
audit.view
settings.view, settings.update
admins.manage (super_admin only)
```

### 4. API Endpoints ✅

#### Analytics Endpoints

- `GET /api/admin/analytics/dashboard` - Dashboard overview with KPIs
- `GET /api/admin/analytics/users` - User analytics and retention
- `GET /api/admin/analytics/products` - Product performance metrics
- `GET /api/admin/analytics/engagement` - Engagement and search analytics
- `GET /api/admin/analytics/security` - Security event monitoring
- `GET /api/admin/analytics/audit` - Audit log analytics
- `GET /api/admin/analytics/system` - System health metrics
- `GET /api/admin/analytics/export` - Export analytics data (CSV/JSON)

#### User Management Endpoints

- `GET /api/admin/users` - List users with filtering
- `GET /api/admin/users/:id` - Get user details with activity
- `PATCH /api/admin/users/:id/suspend` - Suspend user
- `PATCH /api/admin/users/:id/unsuspend` - Unsuspend user
- `PATCH /api/admin/users/:id/ban` - Ban user permanently
- `PATCH /api/admin/users/:id/unban` - Unban user
- `PATCH /api/admin/users/:id/role` - Change user role
- `DELETE /api/admin/users/:id` - Delete user
- `POST /api/admin/users/:id/reset-password` - Force password reset
- `POST /api/admin/users/:id/revoke-sessions` - Revoke all user sessions

#### Product Management (from existing admin controller)

- `GET /api/admin/products` - List products with filters
- `PATCH /api/admin/products/:id/status` - Update product status
- `PATCH /api/admin/products/:id/featured` - Toggle featured status
- `DELETE /api/admin/products/:id` - Delete product
- `POST /api/admin/products/bulk-delete` - Bulk delete
- `POST /api/admin/products/bulk-status` - Bulk status update

#### Security & Audit

- `GET /api/admin/audit-logs` - Get audit logs with filters
- `GET /api/admin/audit-logs/admin/:adminId` - Admin activity timeline
- `GET /api/admin/security-events` - Get security events
- `PATCH /api/admin/security-events/:id/resolve` - Resolve security event

#### Super Admin Only

- `POST /api/admin/permissions/grant` - Grant custom permission
- `POST /api/admin/permissions/revoke` - Revoke permission
- `POST /api/admin/analytics/aggregate` - Manually trigger aggregation

### 5. Frontend Components ✅

#### AdminDashboardOverview.tsx

- Real-time metrics (active users, registrations, security alerts)
- KPI cards with trend indicators
- User/product distribution charts
- Recent admin activity feed

#### AdminUserManagement.tsx

- User listing with search and filters
- User actions (suspend, ban, role change, delete)
- Status badges and activity indicators
- Action confirmation dialogs with reason tracking

## Setup Instructions

### 1. Run Database Migration

```bash
cd backend
node migrations/create-admin-analytics.js
```

This creates all necessary tables, indexes, views, and triggers.

### 2. Create Super Admin User

Update an existing user to super_admin:

```sql
UPDATE profiles
SET user_type = 'super_admin'
WHERE user_id = 'YOUR_USER_ID';
```

Or use the existing admin creation script with modification.

### 3. Environment Variables

Add to `.env`:

```
# Admin Settings
ADMIN_RATE_LIMIT_REQUESTS=100
ADMIN_RATE_LIMIT_WINDOW_MINUTES=1
ADMIN_IP_WHITELIST= # Comma-separated IPs (optional)

# Analytics
ANALYTICS_AGGREGATION_ENABLED=true
ANALYTICS_RETENTION_DAYS=365
```

### 4. Set Up Daily Aggregation (Cron)

Add to your cron jobs or use a task scheduler:

```javascript
// Example: Daily at midnight UTC
const {
  analyticsAggregationService,
} = require('./services/analytics/analytics-aggregation-service');

// Run daily aggregation
await analyticsAggregationService.aggregateDaily();
```

Or use a cron package:

```javascript
const cron = require('node-cron');
const {
  analyticsAggregationService,
} = require('./src/services/analytics/analytics-aggregation-service');

// Run every day at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily analytics aggregation...');
  await analyticsAggregationService.aggregateDaily();
});
```

### 5. Frontend Integration

Update your admin page component:

```tsx
import AdminDashboardOverview from '@/components/admin/AdminDashboardOverview';
import AdminUserManagement from '@/components/admin/AdminUserManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AdminDashboardOverview />
        </TabsContent>

        <TabsContent value="users">
          <AdminUserManagement />
        </TabsContent>

        {/* Add other tab contents */}
      </Tabs>
    </div>
  );
}
```

## Security Best Practices

### 1. Authentication Flow

- All admin routes require `authenticateToken` middleware
- Admin check verifies user has admin role
- Rate limiting prevents API abuse
- Each action requires specific permission

### 2. Audit Trail

- Every admin action is logged with:
  - Who (admin_id)
  - What (action type)
  - When (timestamp)
  - Why (reason - required for destructive actions)
  - Before/After state
  - IP address and user agent

### 3. Session Management

- Admin sessions can be revoked remotely
- Session tracking in admin_sessions table
- Automatic session cleanup on ban/suspend

### 4. Permission Enforcement

```javascript
// Example: Only super_admin can promote to admin
if (newRole === 'super_admin' && req.user.role !== 'super_admin') {
  return sendForbidden(res, 'Only super admins can create super admins');
}
```

### 5. IP Whitelisting (Optional)

```javascript
// In admin routes
router.use(ipWhitelist(['192.168.1.100', '10.0.0.50']));
```

## Monitoring & Alerts

### Security Events to Monitor

1. **Critical**:

   - Brute force attempts (5+ failed logins in 5 minutes)
   - Admin account creation/deletion
   - Permission escalation attempts
   - Banned user access attempts

2. **High**:

   - Multiple permission denied events
   - Unusual IP access patterns
   - Bulk data exports

3. **Medium**:
   - Rate limit exceeded
   - Failed password resets
   - Unusual activity patterns

### Recommended Integrations

1. **Slack/Discord Webhooks** - For critical security alerts
2. **Email Notifications** - For admin action summaries
3. **PagerDuty** - For critical system failures
4. **Datadog/NewRelic** - For performance monitoring

## Analytics Dashboard

### Key Metrics Tracked

1. **User Metrics**:

   - DAU/WAU/MAU (Daily/Weekly/Monthly Active Users)
   - New user registrations
   - User retention cohorts
   - Engagement levels

2. **Product Metrics**:

   - New product listings
   - Product views
   - Products sold
   - Category performance
   - Conversion rates

3. **Engagement Metrics**:

   - Messages sent
   - Search queries
   - Favorites added
   - Zero-result searches (opportunities)

4. **System Health**:
   - Database table sizes
   - Event processing rates
   - API response times

## Extending the System

### Adding New Permissions

1. Update `PERMISSIONS` in `admin-middleware.js`:

```javascript
'custom.permission': ['super_admin', 'admin'],
```

2. Use in routes:

```javascript
router.post('/custom-action', hasPermission('custom.permission'), customController.action);
```

### Adding New Analytics Metrics

1. Update `METRICS` in `analytics-aggregation-service.js`
2. Add aggregation logic in appropriate method
3. Update dashboard to display new metric

### Creating Custom Admin Actions

1. Create controller method
2. Add audit logging
3. Add route with permission check
4. Test thoroughly

## Testing

### Test Admin Functionality

```bash
# Create test users
# Promote to different roles
# Test each permission level
# Verify audit logs
# Check analytics aggregation
```

### Security Testing

- Test rate limiting
- Test permission boundaries
- Attempt privilege escalation
- Verify audit trail completeness
- Test session revocation

## Performance Considerations

1. **Analytics Queries**:

   - Use pre-aggregated `analytics_daily` table
   - Avoid real-time aggregation for historical data
   - Add indexes for common filter combinations

2. **Audit Logs**:

   - Archive old logs (>90 days) to separate table
   - Use pagination for audit log queries
   - Consider partitioning by date

3. **Event Tracking**:
   - Async event writes (don't block main flow)
   - Batch insert for high-volume events
   - Clean up old events periodically

## Troubleshooting

### Common Issues

1. **Analytics Not Updating**:

   - Check if aggregation cron is running
   - Verify event tracking is working
   - Run manual aggregation: `POST /api/admin/analytics/aggregate`

2. **Permission Denied Errors**:

   - Verify user role: `SELECT user_type FROM profiles WHERE user_id = ?`
   - Check permission configuration
   - Review audit logs for details

3. **Slow Dashboard**:
   - Verify indexes are created
   - Check analytics_daily has recent data
   - Run `ANALYZE` on large tables

## Maintenance

### Daily

- Monitor security alerts
- Review critical admin actions

### Weekly

- Review audit logs
- Check system health metrics
- Analyze user growth trends

### Monthly

- Archive old audit logs
- Review and adjust permissions
- Performance optimization

## Future Enhancements

1. **MFA for Admins** - Two-factor authentication
2. **IP Geolocation** - Track admin access locations
3. **Advanced Anomaly Detection** - ML-based threat detection
4. **Real-time Dashboard** - WebSocket updates
5. **Custom Reports** - User-defined analytics queries
6. **Data Export Scheduler** - Automated report generation
7. **Alerting Rules Engine** - Configurable alert conditions

## Support

For issues or questions:

1. Check audit logs for errors
2. Review security events
3. Check system health metrics
4. Review this documentation

---

**Implementation Status**: ✅ Complete
**Security**: Production-grade with RBAC
**Analytics**: Comprehensive tracking
**Audit**: Full action logging
**Performance**: Optimized with pre-aggregation
