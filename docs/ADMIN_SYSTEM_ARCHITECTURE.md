# Admin System Architecture & Implementation Plan

## 1. CODEBASE ANALYSIS

### System Architecture

**Tech Stack:**

- **Backend**: Node.js + Express + Neon PostgreSQL (serverless)
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Authentication**: JWT with refresh tokens (15-min expiry, stored in localStorage)
- **File Storage**: Cloudinary for images
- **Database**: Serverless Postgres with connection pooling

**Data Flow:**

```
Client → API Routes → Controllers → Services → Repositories → Database
                ↓           ↓           ↓
         Middleware    Business     SQL Queries
         (Auth/RBAC)   Logic        (Neon Postgres)
```

### Database Schema (Current)

**Core Tables:**

- `users` - Authentication (id, email, password_hash, email_verified, tokens, timestamps)
- `profiles` - User profiles (user_id FK, display_name, avatar_url, bio, user_type, phone, location)
- `listings` - Product listings (Used as "products" - id, user_id, category_id, title, price, images, status, views, etc.)
- `categories` - Product categories (id, name, slug, description, icon_url, parent_id)
- `favorites` - User favorites (user_id, listing_id)
- `messages` - In-app messaging (sender_id, receiver_id, listing_id, message, is_read)
- `user_sessions` - Refresh tokens (user_id, refresh_token, expires_at)

**Enhanced Tables (from migrations):**

- `product_variants` - Product options (listing_id FK, variant_name, variant_value, price_adjustment, stock)
- `product_reviews` - Reviews & ratings (listing_id FK, user_id FK, rating 1-5, review_text)
- `seller_analytics` - Event tracking (user_id, listing_id, event_type, event_data, ip, user_agent)
- `orders` - Purchase tracking (order_number, buyer_id, seller_id, listing_id, amounts, status)
- `saved_searches` - Saved search criteria (user_id, search_query, filters, alert_enabled)

### Authentication & Authorization

**Current Implementation:**

- JWT authentication in `middleware/auth.js`
- `authenticateToken()` - Validates JWT, attaches req.user
- `requireRole(allowedRoles)` - Checks user_type from profiles table
- Supported roles: 'buyer', 'seller', 'landlord', 'admin' (CHECK constraint in profiles.user_type)
- Admin routes protected by: `authenticateToken` + `requireRole(['admin'])`

**Security Mechanism:**

- Access tokens (JWT) expire in 15 minutes
- Refresh tokens stored in `user_sessions` table
- Token verification fails if user deleted
- Role check queries `profiles.user_type` per request (no caching = privilege escalation resistant)

**Current Admin Controller:**

- Basic CRUD for users, products, messages, categories
- Dashboard stats (user counts, product stats, message stats)
- NO audit logging
- NO granular permissions
- NO analytics beyond basic counts
- NO security event tracking

### Critical Security Gaps Identified

1. **No Audit Logging**: Admin actions not tracked (who did what, when, to whom)
2. **No Permission Granularity**: All admins have equal power (no read-only vs super-admin)
3. **No Rate Limiting**: Admin endpoints can be abused if token compromised
4. **No IP Whitelisting**: Admin access from any IP
5. **No MFA**: Single factor authentication for admin accounts
6. **No Session Management**: Cannot revoke admin sessions remotely
7. **Mass Assignment Risk**: Direct SQL updates without field validation
8. **No CSRF Protection**: No CSRF tokens on state-changing operations
9. **Missing Analytics**: No user behavior tracking, conversion funnels, or anomaly detection
10. **No Observability**: No structured logging, no performance metrics, no error aggregation

## 2. ADMIN AUTHORITY MODEL DESIGN

### Role-Based Access Control (RBAC)

**Role Hierarchy:**

```
super_admin (root)
  ↓
admin (full control)
  ↓
moderator (read + approve/reject)
  ↓
support (read-only)
  ↓
seller, landlord (self-service)
  ↓
buyer (consumer)
```

**Permission Matrix:**

| Action               | super_admin | admin | moderator | support |
| -------------------- | ----------- | ----- | --------- | ------- |
| View all users       | ✓           | ✓     | ✓         | ✓       |
| Create/Delete users  | ✓           | ✓     | ✗         | ✗       |
| Change user roles    | ✓           | ✓     | ✗         | ✗       |
| Ban/Suspend users    | ✓           | ✓     | ✓         | ✗       |
| View products        | ✓           | ✓     | ✓         | ✓       |
| Delete products      | ✓           | ✓     | ✓         | ✗       |
| View messages        | ✓           | ✓     | ✓         | ✓       |
| Delete messages      | ✓           | ✓     | ✓         | ✗       |
| View analytics       | ✓           | ✓     | ✓         | ✓       |
| Export data          | ✓           | ✓     | ✗         | ✗       |
| View audit logs      | ✓           | ✓     | ✗         | ✗       |
| Manage admins        | ✓           | ✗     | ✗         | ✗       |
| System settings      | ✓           | ✗     | ✗         | ✗       |
| Impersonate users    | ✓           | ✗     | ✗         | ✗       |
| Force password reset | ✓           | ✓     | ✗         | ✗       |

### Super Admin Capabilities

1. **User Management:**

   - Create/edit/delete any user account
   - Promote/demote user roles (including admin roles)
   - Ban/suspend with reason + expiration
   - Restore deleted accounts (soft delete)
   - Force password reset + email notification
   - Revoke all sessions for a user
   - View user activity timeline

2. **System Administration:**

   - Manage admin accounts
   - Configure feature flags
   - Set system-wide limits (upload size, rate limits)
   - Manage categories and taxonomies
   - Database maintenance operations (backup triggers, index optimization)

3. **Security Operations:**

   - View all audit logs (filterable by actor, action, target, timeframe)
   - User impersonation (strictly logged with justification)
   - IP whitelist/blacklist management
   - Review failed login attempts
   - Security event monitoring

4. **Data Operations:**
   - Bulk data import/export
   - Data correction (with before/after logging)
   - Merge duplicate accounts
   - Data retention policy enforcement

## 3. ANALYTICS & OBSERVABILITY DESIGN

### Event Tracking Schema

**New Tables:**

```sql
-- User activity events
CREATE TABLE user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL, -- login, logout, register, password_reset, etc.
  event_category VARCHAR(50) NOT NULL, -- auth, profile, product, message, etc.
  event_data JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_user_events_user_id ON user_events(user_id, created_at DESC);
CREATE INDEX idx_user_events_type ON user_events(event_type, created_at DESC);
CREATE INDEX idx_user_events_created ON user_events(created_at DESC);

-- Admin audit logs
CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL, -- user.ban, product.delete, role.change, etc.
  target_type VARCHAR(50) NOT NULL, -- user, product, category, etc.
  target_id UUID,
  before_state JSONB, -- snapshot before change
  after_state JSONB, -- snapshot after change
  reason TEXT, -- justification for action
  ip_address INET NOT NULL,
  user_agent TEXT,
  metadata JSONB, -- additional context
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_admin_audit_admin_id ON admin_audit_logs(admin_id, created_at DESC);
CREATE INDEX idx_admin_audit_target ON admin_audit_logs(target_type, target_id, created_at DESC);
CREATE INDEX idx_admin_audit_action ON admin_audit_logs(action, created_at DESC);
CREATE INDEX idx_admin_audit_created ON admin_audit_logs(created_at DESC);

-- Security events
CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL, -- failed_login, permission_denied, suspicious_activity
  severity VARCHAR(20) NOT NULL, -- low, medium, high, critical
  description TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_security_events_user_id ON security_events(user_id, created_at DESC);
CREATE INDEX idx_security_events_severity ON security_events(severity, created_at DESC);
CREATE INDEX idx_security_events_type ON security_events(event_type, created_at DESC);

-- Analytics aggregations (materialized for performance)
CREATE TABLE analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC,
  dimensions JSONB, -- category, user_type, etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, metric_name, dimensions)
);
CREATE INDEX idx_analytics_daily_date ON analytics_daily(date DESC);
CREATE INDEX idx_analytics_daily_metric ON analytics_daily(metric_name, date DESC);
```

### Analytics Metrics

**User Analytics:**

- Total users, active users (DAU/WAU/MAU)
- New registrations (daily, weekly, monthly trends)
- User retention cohorts
- Login frequency distribution
- User growth rate
- Churn rate (inactive >30 days)
- Re-activation rate
- User type distribution (buyers, sellers, landlords)

**Product Analytics:**

- Total products by status (active, sold, inactive)
- New product listings (daily, weekly, monthly)
- Products by category
- Average price by category
- Product view-to-contact ratio
- Conversion rate (views → messages → sales)
- Top performing products
- Top performing sellers
- Inventory turnover

**Engagement Analytics:**

- Messages sent (total, daily trend)
- Average messages per conversation
- Response time distribution
- Active conversations
- Favorite additions (daily trend)
- Search queries (top searches, zero-result searches)

**System Analytics:**

- API request volume (by endpoint)
- Response time percentiles (p50, p95, p99)
- Error rates (4xx, 5xx by endpoint)
- Database query performance
- Cache hit rates
- Slow query identification

**Security Analytics:**

- Failed login attempts (by user, by IP)
- Permission-denied events
- Admin action frequency
- Suspicious patterns (rapid API calls, brute force attempts)
- Geographic access patterns

### Aggregation Strategy

**Real-time Metrics:**

- Current active users (session-based)
- Recent activity feed (last 10 minutes)
- Live order tracking

**Hourly Aggregation (via cron):**

- Request counts by endpoint
- Error rates
- User activity summaries

**Daily Aggregation (midnight UTC):**

- DAU, new users, new products
- Revenue/sales totals
- User retention cohorts
- Top content/sellers

**Weekly/Monthly (Sunday midnight):**

- Cohort retention analysis
- Trend analysis
- Month-over-month growth

## 4. IMPLEMENTATION PLAN

### Phase 1: Database & Event Infrastructure

1. Create analytics tables (user_events, admin_audit_logs, security_events, analytics_daily)
2. Add permissions column to profiles table
3. Create event tracking service
4. Create audit logging middleware

### Phase 2: Enhanced Auth & RBAC

1. Implement granular permissions system
2. Create permission checking middleware
3. Add session management (revocation)
4. Implement rate limiting for admin endpoints

### Phase 3: Admin API

1. Enhanced user management endpoints
2. Analytics query endpoints
3. Audit log endpoints
4. System settings endpoints
5. Bulk operations endpoints

### Phase 4: Analytics Service

1. Event ingestion service
2. Aggregation worker (cron jobs)
3. Analytics query service
4. Real-time metrics service

### Phase 5: Admin Dashboard UI

1. Dashboard overview (KPIs, trends)
2. User management interface
3. Product management interface
4. Analytics visualization
5. Audit log viewer
6. Security events monitor

### Phase 6: Security Hardening

1. Input validation on all endpoints
2. CSRF protection
3. Rate limiting
4. IP whitelisting capability
5. Security testing

## 5. SECURITY REQUIREMENTS

### Defense in Depth

1. **Authentication Layer:**

   - JWT with short expiry (15 min)
   - Refresh token rotation
   - Session revocation capability
   - Failed login tracking & temporary lockout

2. **Authorization Layer:**

   - Role-based access control (RBAC)
   - Permission-based access control (PBAC)
   - Action-level permission checks
   - Separation of read vs write permissions

3. **Input Validation:**

   - Schema validation for all inputs
   - SQL injection prevention (parameterized queries)
   - XSS prevention (input sanitization)
   - File upload validation (type, size, content scanning)

4. **Audit & Monitoring:**

   - All admin actions logged with before/after state
   - Security events logged (failed auth, permission denied)
   - Real-time alerting for suspicious patterns
   - Log retention policy (90 days minimum)

5. **Data Protection:**
   - Sensitive data redaction in logs
   - Encryption at rest (database level)
   - Encryption in transit (HTTPS only)
   - PII handling compliance

### Threat Model

**Threats:**

- Compromised admin credentials
- Privilege escalation
- Mass data exfiltration
- Unauthorized data modification
- Denial of service

**Mitigations:**

- MFA for admin accounts (Phase 2)
- IP whitelisting for admin access
- Rate limiting (100 req/min per admin)
- Read-only mode toggle
- Automated suspicious activity detection

## 6. KEY ASSUMPTIONS

1. **Neon PostgreSQL** has sufficient connection pooling for analytics queries
2. **No message queue** currently - will use cron jobs for aggregation (consider adding in future)
3. **No Redis** - will use database-based caching (consider adding for real-time metrics)
4. **Cloudinary** has adequate limits for image storage
5. **Frontend** uses localStorage for token storage (consider moving to httpOnly cookies)
6. **Existing admin users** have user_type='admin' in profiles table
7. **No payment processing** yet - orders table prepared but no payment gateway integrated
8. **Time-series data** stored in postgres (consider TimescaleDB extension if needed)

## 7. NEXT STEPS

1. ✅ Complete codebase analysis
2. ⏳ Create database migrations for analytics tables
3. ⏳ Implement event tracking service
4. ⏳ Implement audit logging middleware
5. ⏳ Build enhanced admin API
6. ⏳ Build analytics aggregation service
7. ⏳ Build admin dashboard UI
8. ⏳ Security testing & hardening
9. ⏳ Documentation & deployment
