# 🔥 URGENT: Fix JWT_SECRET Error in Render

## ❌ Current Error
```
[ERROR] Unhandled error: {"error":"secretOrPrivateKey must have a value"}
```

This means **JWT_SECRET is NOT set** in your Render environment variables.

---

## ✅ EXACT Steps to Fix (Follow Carefully)

### Step 1: Open Render Dashboard
👉 **Go to**: https://dashboard.render.com/

### Step 2: Find Your Service
Look for your backend service. It might be named:
- `vconect`
- `v-market-backend`
- Or similar

Click on it to open.

### Step 3: Go to Environment Tab
On the left sidebar, click **"Environment"**

### Step 4: Check Current Variables
Scroll through and look for:
- `JWT_SECRET` 
- `REFRESH_TOKEN_SECRET`

**Are they there?**
- If **NO** → Continue to Step 5
- If **YES** → Check if they show "Set" or have actual values → If blank or "Not Set", delete them and re-add

### Step 5: Add JWT_SECRET

Click the **"Add Environment Variable"** button

**Enter EXACTLY this:**

```
Key: JWT_SECRET
Value: 7a60b29f1a82d3b4441f52c7c50127bb4e701985f3b463fa0e9c01a590cf4769190eba8c9ce8084a1c9a886f9951a8f41454a46df78541480b443c545a880290
```

⚠️ **IMPORTANT**: 
- Key name is **EXACTLY**: `JWT_SECRET` (case-sensitive)
- Copy the entire value (128 characters long)
- NO extra spaces before or after

### Step 6: Add REFRESH_TOKEN_SECRET

Click **"Add Environment Variable"** again

**Enter EXACTLY this:**

```
Key: REFRESH_TOKEN_SECRET
Value: fd7fe3ca711cd541987337508df2ee77e7ffcac97ea11078b6f6d4acd1cdf977ecfa7b410e37656f1e29cfe96da1c3e28aa5d431477d5fa4582d24a3fd83acb1
```

### Step 7: Verify ALL Environment Variables

Make sure you have ALL of these set:

```
✅ DATABASE_URL
✅ JWT_SECRET                    <-- MUST BE THERE!
✅ REFRESH_TOKEN_SECRET          <-- MUST BE THERE!
✅ JWT_EXPIRES_IN = 7d
✅ JWT_REFRESH_EXPIRES_IN = 30d
✅ CLOUDINARY_CLOUD_NAME = dxwavfvqu
✅ CLOUDINARY_API_KEY = 423728775953721
✅ CLOUDINARY_API_SECRET = G9gvzNmzCfJ0m1dKdWJgKkb8XOA
✅ NODE_ENV = production
✅ PORT = 10000
✅ CORS_ORIGINS = https://vconect.vercel.app,https://vconect.onrender.com,*
✅ CLIENT_URL = https://vconect.vercel.app
✅ BCRYPT_SALT_ROUNDS = 12
✅ MAX_FILE_SIZE = 5242880
✅ ALLOWED_FILE_TYPES = image/jpeg,image/png,image/webp
✅ RATE_LIMIT_WINDOW_MS = 900000
✅ RATE_LIMIT_MAX_REQUESTS = 100
```

### Step 8: Save Changes

**CRITICAL**: Scroll to the bottom and click **"Save Changes"** button!

If you don't click Save, the variables won't be added!

### Step 9: Wait for Redeploy

After clicking Save:
1. Render will show "Deploy in progress..."
2. Wait 2-5 minutes
3. Watch the **"Events"** tab - should show "Deploy live"

### Step 10: Check Logs

1. Go to **"Logs"** tab
2. Look for these messages:
   ```
   [INFO] Server starting...
   [INFO] Database connection successful
   [INFO] Server running on port 10000
   ```
3. **NO MORE** "secretOrPrivateKey" errors!

---

## 🎥 Visual Verification

In the Environment tab, you should see something like this:

```
DATABASE_URL              ● Set      (postgresql://...)
JWT_SECRET                ● Set      (7a60b29f1a82d3b...)
REFRESH_TOKEN_SECRET      ● Set      (fd7fe3ca711cd5...)
JWT_EXPIRES_IN            ● Set      (7d)
...
```

If any show **"Not Set"** or are **missing**, that's the problem!

---

## 🧪 Test After Fix

### Test 1: Check Health
```bash
curl https://vconect.onrender.com/health
```

Should return:
```json
{"status":"ok","timestamp":"...","database":"connected"}
```

### Test 2: Try Registration
```bash
curl -X POST https://vconect.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test999@example.com",
    "password": "Test123!@#",
    "displayName": "Test User",
    "userType": "buyer"
  }'
```

Should return `201` status with user data (not 500 error).

### Test 3: Check Render Logs
Should see:
```
[INFO] POST /api/auth/register - 201
[DEBUG] User registered successfully
```

NO MORE:
```
[ERROR] secretOrPrivateKey must have a value
```

---

## ⚠️ Common Mistakes That Prevent This From Working

1. ❌ **Typo in variable name**: `JWT_SECERT` instead of `JWT_SECRET`
2. ❌ **Didn't click "Save Changes"** at the bottom
3. ❌ **Added variable to wrong service** (check you're in the backend service)
4. ❌ **Extra spaces** in the secret value
5. ❌ **Didn't wait** for redeploy to complete
6. ❌ **Variable has wrong case**: `jwt_secret` instead of `JWT_SECRET`

---

## 🔍 How to Verify Variables Are Actually Set

### Method 1: Check in Render UI
1. Go to Environment tab
2. Each variable should have a green dot ● next to "Set"
3. If you see "Not Set" or the variable is missing, it's not there!

### Method 2: Check in Logs
Add a temporary log line to verify (then remove):
1. In your local code, edit `backend/src/index.js`
2. Add this line near the top:
   ```javascript
   console.log('JWT_SECRET is set:', !!process.env.JWT_SECRET);
   console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length);
   ```
3. Push to GitHub
4. Render will redeploy
5. Check logs - should show:
   ```
   JWT_SECRET is set: true
   JWT_SECRET length: 128
   ```

If it shows `false` or `undefined`, the variable is NOT set in Render!

---

## 🆘 Still Getting the Error?

### Screenshot What You See

Take a screenshot of:
1. Render → Environment tab (showing all variables)
2. Render → Logs tab (showing the error)

### Double-Check These:

1. **Are you looking at the correct service?**
   - Check the service name at the top
   - Is it the backend service (not frontend)?

2. **Did you click Save Changes?**
   - Look for "Saved" confirmation message
   - Check Events tab for "Deploy triggered by config change"

3. **Did the deploy finish?**
   - Events tab should show "Deploy live"
   - Status should be green "Live"

4. **Are you testing the right URL?**
   - Make sure you're hitting: `https://vconect.onrender.com/api/...`
   - Not localhost or old URL

---

## 💡 Alternative: Use Render's Auto-Generate

If manually adding doesn't work:

1. In Environment tab, look for **"Generate Value"** option
2. For `JWT_SECRET`, click "Generate Value"
3. Render will create a secure random string
4. Do the same for `REFRESH_TOKEN_SECRET`
5. Save Changes

---

## ✅ Success Checklist

- [ ] Opened Render dashboard
- [ ] Found backend service
- [ ] Clicked Environment tab
- [ ] Added `JWT_SECRET` with the provided value
- [ ] Added `REFRESH_TOKEN_SECRET` with the provided value
- [ ] Clicked "Save Changes" button
- [ ] Waited for redeploy to complete (2-5 min)
- [ ] Checked logs - no "secretOrPrivateKey" error
- [ ] Tested health endpoint - returns 200 OK
- [ ] Tested registration - returns 201 Created
- [ ] Can successfully sign up new user
- [ ] Can successfully log in

---

## 🎯 Expected Result

### Before Fix:
```
[ERROR] Unhandled error: {"error":"secretOrPrivateKey must have a value"}
Status: 500 Internal Server Error
```

### After Fix:
```
[INFO] POST /api/auth/register - 201
[DEBUG] User registered successfully
Status: 201 Created
Response: {user: {...}, tokens: {...}}
```

---

**This WILL fix your issue if you follow every step exactly!**

The error is 100% caused by missing JWT_SECRET in Render environment variables.
