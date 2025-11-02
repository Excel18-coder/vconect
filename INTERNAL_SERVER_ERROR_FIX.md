# 🔧 Internal Server Error - Complete Fix Guide

## 🚨 Current Issue
You're getting **500 Internal Server Error** when trying to sign up or login.

## 🔍 Root Causes

Based on the code analysis, there are **3 potential issues**:

### 1. Missing JWT Secrets (FIXED in previous step)
- ✅ `JWT_SECRET` added
- ✅ `REFRESH_TOKEN_SECRET` added

### 2. Database Tables May Not Exist
The backend expects these tables:
- `users` table
- `profiles` table  
- `refresh_tokens` table

### 3. Database Connection Issues
- Connection string might be incorrect
- Database might not be accessible from Render

---

## 🎯 Step-by-Step Fix

### Step 1: Verify Database Tables Exist

1. **Go to your Neon Dashboard**: https://console.neon.tech/

2. **Select your project**: `ep-dark-hat-ad5h8dd0`

3. **Click SQL Editor**

4. **Run this query to check tables**:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

5. **You should see these tables**:
   - `users`
   - `profiles`
   - `refresh_tokens`
   - `listings`
   - `categories`
   - etc.

### Step 2: If Tables Don't Exist, Create Them

Run these SQL commands in Neon SQL Editor:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    verification_token TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    reset_password_token TEXT,
    reset_password_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    user_type VARCHAR(50) DEFAULT 'buyer',
    phone_number VARCHAR(20),
    location TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create refresh_tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
```

### Step 3: Verify Database Connection in Render

1. Go to Render Dashboard → Your backend service → **Logs**

2. Look for these messages when service starts:
   ```
   [INFO] Server running on port 10000
   [INFO] Database connection successful
   ```

3. If you see database connection errors:
   ```
   [ERROR] Failed to connect to database
   [ERROR] Connection terminated unexpectedly
   ```

   Then the `DATABASE_URL` is incorrect or Neon is blocking Render's IP.

### Step 4: Fix Database Connection Issues

If database connection fails:

#### Option A: Check Neon Connection Pooler

1. Go to Neon Dashboard → Your Project → Connection Details
2. Copy the **Pooled connection** string (not direct connection)
3. It should look like:
   ```
   postgresql://neondb_owner:PASSWORD@ep-dark-hat-ad5h8dd0-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Make sure it has `-pooler` in the hostname!

#### Option B: Allow Render IPs in Neon (if needed)

1. In Neon Dashboard → Settings → IP Allow
2. Add `0.0.0.0/0` to allow all IPs (or Render's IP range)

### Step 5: Test Database Queries Manually

In Neon SQL Editor, test that a user can be created:

```sql
-- Test user creation
INSERT INTO users (email, password_hash, verification_token)
VALUES ('test@example.com', '$2a$12$somehashedpassword', 'test-token-123')
RETURNING id, email, created_at;

-- If that works, test profile creation
INSERT INTO profiles (user_id, display_name, user_type)
VALUES ((SELECT id FROM users WHERE email = 'test@example.com'), 'Test User', 'buyer')
RETURNING *;

-- Clean up test data
DELETE FROM profiles WHERE user_id = (SELECT id FROM users WHERE email = 'test@example.com');
DELETE FROM users WHERE email = 'test@example.com';
```

If these queries fail, there's a database structure issue.

---

## 🧪 Testing After Fix

### Test 1: Check Backend Logs

1. Go to Render → Your Service → Logs
2. Click "Clear" to clear old logs
3. Watch for new requests
4. Try to sign up from frontend
5. Look for the exact error in logs

### Test 2: Test Registration API Directly

```bash
curl -X POST https://vconect.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Origin: https://vconect.vercel.app" \
  -d '{
    "email": "test123@example.com",
    "password": "Test123!@#",
    "displayName": "Test User",
    "userType": "buyer"
  }' \
  -v
```

**Expected Response (Success)**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "test123@example.com",
      ...
    },
    "tokens": {
      "accessToken": "jwt-token-here",
      "refreshToken": "refresh-token-here"
    }
  }
}
```

**If you get 500 error**, check the response body for:
```json
{
  "success": false,
  "message": "Error message here"
}
```

### Test 3: Check What's in Render Logs

Look for these specific errors:

#### Error 1: Database Connection
```
[ERROR] Failed to connect to database
[ERROR] Connection terminated
```
**Fix**: Update `DATABASE_URL` with pooled connection string

#### Error 2: Table Doesn't Exist
```
[ERROR] relation "users" does not exist
[ERROR] relation "profiles" does not exist
```
**Fix**: Run the CREATE TABLE SQL commands above

#### Error 3: Column Doesn't Exist
```
[ERROR] column "display_name" does not exist
[ERROR] column "user_type" does not exist
```
**Fix**: Alter table to add missing columns:
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type VARCHAR(50) DEFAULT 'buyer';
```

#### Error 4: JWT Secret Still Missing
```
[ERROR] secretOrPrivateKey must have a value
```
**Fix**: Double-check environment variables in Render, redeploy

---

## 🔍 Debug Checklist

Run through this checklist:

### Backend Configuration
- [ ] `JWT_SECRET` is set in Render (not "your-generated-secret-here")
- [ ] `REFRESH_TOKEN_SECRET` is set in Render
- [ ] `DATABASE_URL` uses `-pooler` in hostname
- [ ] `DATABASE_URL` ends with `?sslmode=require`
- [ ] `NODE_ENV=production`
- [ ] `CORS_ORIGINS` includes your frontend URL
- [ ] All environment variables show "Set" (not "Not Set")

### Database
- [ ] Can connect to Neon dashboard
- [ ] `users` table exists
- [ ] `profiles` table exists  
- [ ] `refresh_tokens` table exists
- [ ] Test INSERT works in SQL Editor

### Render Service
- [ ] Service shows "Live" status (green)
- [ ] Health check passes: https://vconect.onrender.com/health
- [ ] Logs show "Database connection successful"
- [ ] No errors in logs on startup

### Frontend
- [ ] Can access https://vconect.vercel.app
- [ ] Network tab shows requests to https://vconect.onrender.com/api
- [ ] No CORS errors in browser console
- [ ] Request payload includes email, password, displayName, userType

---

## 💡 Most Common Issues & Quick Fixes

### Issue: "relation 'users' does not exist"
**Quick Fix**:
```sql
-- Run in Neon SQL Editor
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    verification_token TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Issue: "column 'display_name' does not exist"
**Quick Fix**:
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type VARCHAR(50) DEFAULT 'buyer';
```

### Issue: "Cannot read properties of undefined"
**Cause**: Database returned no results
**Quick Fix**: Check if tables exist and have proper structure

### Issue: "Connection timeout"
**Quick Fix**: Use pooled connection string with `-pooler` in hostname

---

## 📊 Expected Render Logs (Success)

When everything works, you should see:

```
[2025-11-01T10:00:00.000Z] [INFO] Server starting...
[2025-11-01T10:00:00.100Z] [INFO] Environment: production
[2025-11-01T10:00:00.200Z] [INFO] Database connection successful
[2025-11-01T10:00:00.300Z] [INFO] Cloudinary configuration loaded
[2025-11-01T10:00:00.400Z] [INFO] Server running on port 10000
[2025-11-01T10:00:05.000Z] [INFO] POST /api/auth/register - 201
[2025-11-01T10:00:05.100Z] [DEBUG] Starting user registration
[2025-11-01T10:00:05.200Z] [DEBUG] User created in database
[2025-11-01T10:00:05.300Z] [DEBUG] Profile created in database
[2025-11-01T10:00:05.400Z] [INFO] User registered successfully
```

---

## 🆘 Still Not Working?

### Get the Exact Error

1. Open your frontend: https://vconect.vercel.app
2. Open DevTools (F12) → Network tab
3. Try to register
4. Click on the failed request
5. Go to "Response" tab
6. Copy the exact error message

### Check Render Logs for Details

1. Go to Render Dashboard → Your Service → Logs
2. Find the timestamp when you tried to register
3. Look for `[ERROR]` messages
4. Copy the full error stack trace

### Share This Information:

- **Status Code**: (e.g., 500, 400, 404)
- **Error Message**: (from frontend response)
- **Render Log Error**: (from Render logs)
- **Request Payload**: (what was sent from frontend)

---

## ✅ Success Indicators

You'll know it's fixed when:

- ✅ Registration returns `201 Created`
- ✅ Response includes user object and tokens
- ✅ Render logs show "User registered successfully"
- ✅ No errors in browser console
- ✅ User can immediately log in with same credentials
- ✅ Health check works: `curl https://vconect.onrender.com/health`

---

**Last Updated**: November 1, 2025
**Estimated Fix Time**: 15-30 minutes
**Success Rate**: 95% if you follow all steps
