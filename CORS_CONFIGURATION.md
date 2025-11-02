# 🌐 CORS Configuration for www.vconect.co.ke

## ✅ Updated Files

All necessary files have been updated to support your custom domain `www.vconect.co.ke`:

### 1. Backend CORS Configuration
- **File**: `backend/src/app.js`
- **Changes**: Added `https://www.vconect.co.ke` and `https://vconect.co.ke` to allowed origins

### 2. Environment Files
- **Files**: 
  - `backend/.env`
  - `backend/.env.render.example`
- **Changes**: Updated `CORS_ORIGINS` and `CLIENT_URL`

### 3. Render Deployment Config
- **File**: `render.yaml`
- **Changes**: Updated environment variables for production deployment

### 4. Documentation
- **File**: `README.md`
- **Changes**: Updated live URLs

---

## 🔧 Render Environment Variables Setup

### **IMPORTANT**: Update these in your Render Dashboard

Go to: https://dashboard.render.com/ → Your backend service → **Environment** tab

### Update/Add this variable:

```bash
CORS_ORIGINS=https://vconect.vercel.app,https://vconect.onrender.com,https://www.vconect.co.ke,https://vconect.co.ke,*
```

**⚠️ CRITICAL**: Make sure there are **NO SPACES** after commas!

### Also update:

```bash
CLIENT_URL=https://www.vconect.co.ke
```

---

## 🎯 Complete CORS Configuration

Your backend now accepts requests from:

- ✅ `https://www.vconect.co.ke` (Your custom domain with www)
- ✅ `https://vconect.co.ke` (Your custom domain without www)
- ✅ `https://vconect.vercel.app` (Vercel deployment)
- ✅ `https://vconect.onrender.com` (Render deployment)
- ✅ `http://localhost:*` (All localhost ports for development)
- ✅ `*` (Wildcard fallback)

---

## 🚀 Frontend Configuration for Custom Domain

### For Vercel Deployment:

1. **Add Custom Domain in Vercel**:
   - Go to your Vercel project
   - Settings → Domains
   - Add `www.vconect.co.ke`
   - Add `vconect.co.ke` (will redirect to www)

2. **Update DNS Records** (in your domain registrar):
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   
   Type: A (or CNAME)
   Name: @
   Value: 76.76.21.21 (Vercel's IP, or use CNAME to www)
   ```

3. **Environment Variable** (already set):
   ```bash
   VITE_API_BASE_URL=https://vconect.onrender.com/api
   ```

### For Render Frontend Deployment:

1. **Add Custom Domain in Render**:
   - Go to your frontend service on Render
   - Settings → Custom Domain
   - Add `www.vconect.co.ke`

2. **Update DNS Records**:
   ```
   Type: CNAME
   Name: www
   Value: [your-render-service].onrender.com
   ```

3. **Environment Variable**:
   ```bash
   VITE_API_BASE_URL=https://vconect.onrender.com/api
   ```

---

## 🧪 Testing CORS Configuration

### Test from www.vconect.co.ke:

```bash
# Test CORS preflight
curl -H "Origin: https://www.vconect.co.ke" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type,Authorization" \
     -X OPTIONS \
     https://vconect.onrender.com/api/auth/register

# Expected: Should return CORS headers allowing the request
```

### Test from vconect.co.ke (without www):

```bash
curl -H "Origin: https://vconect.co.ke" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://vconect.onrender.com/api/auth/register
```

### Test API Call:

```bash
curl -X POST https://vconect.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Origin: https://www.vconect.co.ke" \
  -d '{
    "email": "test@vconect.co.ke",
    "password": "Test123!@#",
    "username": "testuser",
    "phone": "254712345678",
    "role": "buyer"
  }'
```

### Test from Browser:

1. Open: https://www.vconect.co.ke
2. Open DevTools (F12) → Console
3. Run:
   ```javascript
   fetch('https://vconect.onrender.com/health', {
     method: 'GET',
     credentials: 'include'
   })
   .then(r => r.json())
   .then(data => console.log('✅ CORS working!', data))
   .catch(err => console.error('❌ CORS error:', err));
   ```

---

## 🔍 Troubleshooting

### Issue: Still getting CORS errors from www.vconect.co.ke

**Check**:
1. Did you update the `CORS_ORIGINS` in Render?
2. Did you save and wait for redeploy?
3. Are there any spaces after commas in `CORS_ORIGINS`?

**Solution**:
```bash
# In Render Dashboard, set exactly:
CORS_ORIGINS=https://vconect.vercel.app,https://vconect.onrender.com,https://www.vconect.co.ke,https://vconect.co.ke,*
```

### Issue: Backend logs show "Origin not allowed"

**Check Render Logs**:
```
CORS Error: Origin not allowed: https://www.vconect.co.ke
Allowed origins: [...]
```

This means the environment variable wasn't updated. Go back to Render → Environment and update it.

### Issue: Domain not resolving

**DNS Check**:
```bash
# Check if DNS is configured
dig www.vconect.co.ke

# Check if domain resolves to correct server
nslookup www.vconect.co.ke
```

DNS changes can take 24-48 hours to propagate globally.

### Issue: SSL/HTTPS errors

**Vercel/Render SSL**:
- Both platforms automatically provision SSL certificates
- Wait 5-10 minutes after adding custom domain
- Certificate should be issued automatically

---

## 📋 Deployment Checklist

### Backend (Render):
- [ ] Environment variable `CORS_ORIGINS` includes `https://www.vconect.co.ke`
- [ ] Environment variable `CORS_ORIGINS` includes `https://vconect.co.ke`
- [ ] Environment variable `CLIENT_URL` set to `https://www.vconect.co.ke`
- [ ] Service redeployed after environment changes
- [ ] Health check passes: `curl https://vconect.onrender.com/health`
- [ ] CORS test passes from custom domain

### Frontend (Vercel or Render):
- [ ] Custom domain `www.vconect.co.ke` added
- [ ] DNS CNAME record configured
- [ ] SSL certificate issued
- [ ] Environment variable `VITE_API_BASE_URL` set correctly
- [ ] Site accessible at https://www.vconect.co.ke
- [ ] API calls work from custom domain
- [ ] No CORS errors in browser console

### DNS Configuration:
- [ ] CNAME record for `www` points to hosting provider
- [ ] A record or CNAME for `@` (root domain) configured
- [ ] DNS propagation verified
- [ ] Both www and non-www versions work

---

## 🎯 Expected Results

### ✅ Success Indicators:

1. **Custom Domain Works**:
   - https://www.vconect.co.ke loads successfully
   - SSL certificate is valid
   - No security warnings

2. **CORS Works**:
   - No CORS errors in browser console
   - API calls succeed from custom domain
   - User can register/login

3. **Backend Accepts Requests**:
   - Render logs show successful API requests
   - No "Origin not allowed" errors
   - Health check returns `{"status":"ok"}`

4. **Both Versions Work**:
   - https://www.vconect.co.ke (with www)
   - https://vconect.co.ke (without www)
   - Both can make API calls

---

## 📞 Support

### Useful Commands:

```bash
# Test backend health
curl https://vconect.onrender.com/health

# Test CORS from custom domain
curl -H "Origin: https://www.vconect.co.ke" \
     https://vconect.onrender.com/health -v

# Check DNS propagation
dig www.vconect.co.ke +short

# Check SSL certificate
curl -vI https://www.vconect.co.ke 2>&1 | grep -i ssl
```

### Check Render Logs:
1. Go to Render Dashboard
2. Click your backend service
3. Click "Logs" tab
4. Look for CORS-related messages

### Check Vercel Logs:
1. Go to Vercel Dashboard
2. Click your project
3. Click "Deployments"
4. Click latest deployment
5. Check function logs

---

## 🔄 Quick Reference

### Environment Variable Format:
```bash
# Correct (no spaces):
CORS_ORIGINS=https://vconect.vercel.app,https://vconect.onrender.com,https://www.vconect.co.ke,https://vconect.co.ke,*

# Wrong (has spaces):
CORS_ORIGINS=https://vconect.vercel.app, https://vconect.onrender.com, https://www.vconect.co.ke
```

### Multiple Domains Strategy:
- Use `www.vconect.co.ke` as primary
- Redirect `vconect.co.ke` → `www.vconect.co.ke`
- Keep other domains for testing/migration

### CORS Policy:
- Credentials: `true` (allows cookies, auth headers)
- Methods: `GET, POST, PUT, PATCH, DELETE, OPTIONS`
- Headers: `Content-Type, Authorization, X-Requested-With`

---

**Last Updated**: November 2, 2025  
**Status**: ✅ Ready for Custom Domain  
**Custom Domain**: www.vconect.co.ke  
**Backend**: vconect.onrender.com
