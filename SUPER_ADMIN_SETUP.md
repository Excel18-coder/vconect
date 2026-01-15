# Super Admin Setup

## Single Admin Account Configuration

This system uses a **single super admin account** with full administrative control.

### Admin Credentials

- **Email**: `admin@gmail.com`
- **Password**: `123456`
- **Role**: `super_admin`

### Setup Instructions

1. **Create the Super Admin Account**

```bash
cd backend
node scripts/admin/create-default-admin.js
```

This will:

- Create user with email `admin@gmail.com`
- Set password to `123456`
- Assign `super_admin` role
- Enable email verification automatically

2. **Verify Account Creation**

Login at your application's login page using:

- Email: `admin@gmail.com`
- Password: `123456`

3. **Access Admin Dashboard**

Once logged in, navigate to `/admin` to access the full admin dashboard.

## Permissions

The super admin account has **ALL** permissions:

### User Management

- View all users
- Create new users
- Update user information
- Delete users
- Suspend/unsuspend users
- Ban/unban users
- Change user roles (buyer, seller, landlord only)
- Force password reset
- Revoke user sessions
- Impersonate users

### Product Management

- View all products
- Update product status
- Delete products
- Toggle featured status
- Bulk operations

### Analytics

- View comprehensive analytics
- Export analytics data
- Access dashboard metrics
- View user/product statistics
- Monitor engagement metrics

### Security & Audit

- View all audit logs
- Monitor security events
- Track admin actions
- View system health

### System Settings

- View system settings
- Update configuration
- Manage feature flags

## Security Notes

### Important Reminders

1. **Change Default Password**: While `123456` is set for convenience, change it after first login in production
2. **Single Account**: Only ONE super admin account exists - do not create additional admin accounts
3. **Full Control**: This account has unrestricted access to all system functions
4. **Audit Trail**: All actions are logged in `admin_audit_logs` table

### Updating Password

To update the super admin password:

```bash
cd backend
node scripts/admin/update-admin-password.js
```

Or update directly in database:

```sql
UPDATE users
SET password_hash = <bcrypt_hash>
WHERE email = 'admin@gmail.com';
```

### Session Management

- Admin sessions are tracked in `admin_sessions` table
- Sessions can be revoked remotely if needed
- All login attempts are logged for security monitoring

## User Roles

The system supports these user types:

1. **super_admin** - Full administrative control (ONE account only: admin@gmail.com)
2. **buyer** - Regular users who browse and purchase
3. **seller** - Users who list products for sale
4. **landlord** - Users who list rental properties

**Note**: The previous `admin`, `moderator`, and `support` roles have been removed. Only `super_admin` has administrative privileges.

## Admin Dashboard Features

### Overview Dashboard

- Real-time statistics (active users, products, messages)
- Key performance indicators with trends
- User distribution by type
- Product distribution by category
- Recent admin activity feed

### User Management

- Search and filter users
- View user details and activity
- Suspend/ban users with reason tracking
- Change user roles
- Force password resets
- Delete users

### Product Management

- View all product listings
- Update product status (active, pending, sold)
- Feature/unfeature products
- Delete products
- Bulk operations

### Analytics

- Daily active users (DAU)
- New registrations
- Product views and listings
- Engagement metrics
- Conversion tracking
- Export capabilities

### Security Monitoring

- Failed login attempts
- Permission denied events
- Suspicious activity alerts
- Brute force detection

### Audit Logs

- Complete history of admin actions
- Before/after state tracking
- IP and user agent logging
- Reason tracking for sensitive actions

## Troubleshooting

### Cannot Login

1. Verify account exists:

```sql
SELECT u.email, p.user_type
FROM users u
JOIN profiles p ON u.id = p.user_id
WHERE u.email = 'admin@gmail.com';
```

2. Check if account is suspended/banned:

```sql
SELECT is_suspended, is_banned
FROM profiles p
JOIN users u ON u.id = p.user_id
WHERE u.email = 'admin@gmail.com';
```

3. Reset password if needed:

```bash
node scripts/admin/update-admin-password.js
```

### Access Denied to Admin Routes

- Verify you're logged in with `admin@gmail.com`
- Check that user_type is `super_admin`
- Review auth token is valid and not expired

### Dashboard Not Loading

- Check that admin routes are properly mounted in `app.js`
- Verify database migration was run successfully
- Check browser console for errors
- Verify API endpoints are responding

## API Endpoints

All admin endpoints require authentication and super_admin role.

Base path: `/api/admin`

### Analytics

- `GET /analytics/dashboard` - Dashboard overview
- `GET /analytics/users` - User analytics
- `GET /analytics/products` - Product analytics
- `GET /analytics/engagement` - Engagement metrics
- `GET /analytics/security` - Security events
- `GET /analytics/audit` - Audit statistics
- `GET /analytics/export` - Export data

### Users

- `GET /users` - List users (with filters)
- `GET /users/:id` - User details
- `PATCH /users/:id/suspend` - Suspend user
- `PATCH /users/:id/unsuspend` - Unsuspend user
- `PATCH /users/:id/ban` - Ban user
- `PATCH /users/:id/unban` - Unban user
- `PATCH /users/:id/role` - Change role
- `DELETE /users/:id` - Delete user
- `POST /users/:id/reset-password` - Force reset
- `POST /users/:id/revoke-sessions` - Revoke sessions

### Products

- `GET /products` - List products
- `PATCH /products/:id/status` - Update status
- `PATCH /products/:id/featured` - Toggle featured
- `DELETE /products/:id` - Delete product
- `POST /products/bulk-delete` - Bulk delete
- `POST /products/bulk-status` - Bulk update

### Audit & Security

- `GET /audit-logs` - View audit logs
- `GET /security-events` - View security events

## Support

For questions or issues with the admin system, refer to:

- [ADMIN_IMPLEMENTATION_GUIDE.md](docs/ADMIN_IMPLEMENTATION_GUIDE.md)
- [ADMIN_SYSTEM_ARCHITECTURE.md](docs/ADMIN_SYSTEM_ARCHITECTURE.md)
