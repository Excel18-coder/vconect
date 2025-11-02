# ⚡ QUICK FIX - Copy & Paste These Into Render

## 🎯 THE PROBLEM
Your Render environment has the **WRONG variable name**:
- ❌ You have: `REFRESH_TOKEN_SECRET`
- ✅ You need: `JWT_REFRESH_SECRET`

---

## 🚀 3-MINUTE FIX

### Step 1: Go to Render
👉 https://dashboard.render.com/ → Your backend service → **Environment** tab

### Step 2: DELETE This Variable (if it exists)
```
❌ REFRESH_TOKEN_SECRET  <-- DELETE THIS!
```

### Step 3: ADD These Two Variables

**Copy and paste EXACTLY as shown:**

#### Variable 1:
```
Key: JWT_SECRET
Value: 7a60b29f1a82d3b4441f52c7c50127bb4e701985f3b463fa0e9c01a590cf4769190eba8c9ce8084a1c9a886f9951a8f41454a46df78541480b443c545a880290
```

#### Variable 2:
```
Key: JWT_REFRESH_SECRET
Value: fd7fe3ca711cd541987337508df2ee77e7ffcac97ea11078b6f6d4acd1cdf977ecfa7b410e37656f1e29cfe96da1c3e28aa5d431477d5fa4582d24a3fd83acb1
```

### Step 4: Click "Save Changes"

### Step 5: Wait 3 Minutes
Watch the Logs tab - you'll see:
```
✅ All required environment variables are present and valid
🚀 V-Market API Server running on port 10000
```

---

## ✅ ALL REQUIRED VARIABLES (Full List)

Make sure you have ALL of these in Render Environment tab:

```bash
DATABASE_URL=postgresql://neondb_owner:npg_Zcqetwui1T0S@ep-dark-hat-ad5h8dd0-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

JWT_SECRET=7a60b29f1a82d3b4441f52c7c50127bb4e701985f3b463fa0e9c01a590cf4769190eba8c9ce8084a1c9a886f9951a8f41454a46df78541480b443c545a880290

JWT_EXPIRES_IN=7d

JWT_REFRESH_SECRET=fd7fe3ca711cd541987337508df2ee77e7ffcac97ea11078b6f6d4acd1cdf977ecfa7b410e37656f1e29cfe96da1c3e28aa5d431477d5fa4582d24a3fd83acb1

JWT_REFRESH_EXPIRES_IN=30d

CLOUDINARY_CLOUD_NAME=dxwavfvqu

CLOUDINARY_API_KEY=423728775953721

CLOUDINARY_API_SECRET=G9gvzNmzCfJ0m1dKdWJgKkb8XOA

NODE_ENV=production

PORT=10000

CORS_ORIGINS=https://vconect.vercel.app,https://vconect.onrender.com,*

CLIENT_URL=https://vconect.vercel.app

BCRYPT_SALT_ROUNDS=12

MAX_FILE_SIZE=5242880

ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

RATE_LIMIT_WINDOW_MS=900000

RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🧪 TEST IT WORKS

```bash
# Test 1: Health Check
curl https://vconect.onrender.com/health
# Should return: {"status":"OK",...}

# Test 2: Registration
curl -X POST https://vconect.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!@#","displayName":"Test","userType":"buyer"}'
# Should return: 201 Created with user data
```

---

## 💡 WHAT WE FIXED IN THE CODE

The code now:
1. ✅ Checks for `JWT_REFRESH_SECRET` (not `REFRESH_TOKEN_SECRET`)
2. ✅ Validates ALL secrets before server starts
3. ✅ Shows clear error if anything is missing
4. ✅ Won't let undefined secrets crash the app

Once you set the variables in Render correctly, **this error can never happen again**.

---

**Time to fix: 3 minutes**
**Difficulty: Copy & Paste**
**Result: Error gone forever** ✅
