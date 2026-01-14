# Default Admin Account

## Login Credentials

```
📧 Email:    admin@gmail.com
🔑 Password: 123
```

## How to Login

1. Go to your application
2. Navigate to the login page (`/auth`)
3. Enter the credentials above
4. After login, click on your avatar (top-right)
5. Select "Admin Panel" from the dropdown
6. You'll be redirected to `/admin`

## What You Can Do

As admin, you have complete control over:

✅ **Users** - View, search, verify, change roles, suspend accounts  
✅ **Products** - View, search, feature, delete, bulk operations  
✅ **Messages** - Monitor all communications, delete messages  
✅ **Categories** - Create, edit, delete categories  
✅ **Activity** - Monitor all system actions in real-time  
✅ **Statistics** - View platform analytics and metrics

## Re-creating Admin Account

If you need to recreate the admin account:

```bash
cd backend
npm run create-admin
```

This script will:

- Check if admin@gmail.com already exists
- Create the account if it doesn't exist
- Set the user type to 'admin'
- Hash the password securely

## Security Note

⚠️ **WARNING**: The password "123" is very weak and for development only!

For production, you should:

1. Use a strong password (change after first login)
2. Enable two-factor authentication
3. Use environment variables for admin credentials
4. Implement account lockout after failed attempts

## Changing Admin Password

To change the password later, you can update it in the database:

```sql
-- First, hash your new password using bcrypt (rounds: 10)
-- Then update:
UPDATE users
SET password_hash = 'YOUR_NEW_BCRYPT_HASH'
WHERE email = 'admin@gmail.com';
```

Or use the profile settings in the admin panel once logged in.

## Multiple Admins

To create additional admin accounts:

1. Have them sign up normally
2. Run this SQL:
   ```sql
   UPDATE profiles
   SET user_type = 'admin'
   WHERE user_id = (SELECT id FROM users WHERE email = 'their-email@example.com');
   ```

---

**Status**: ✅ Default admin account is active and ready to use!
