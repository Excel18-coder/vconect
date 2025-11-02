# V-Market Deployment Guide

## 🌐 Live URLs

- **Frontend (Vercel)**: https://vconect.vercel.app
- **Frontend (Render)**: https://vconect.onrender.com
- **Backend API (Render)**: https://vconect.onrender.com/api
- **API Health Check**: https://vconect.onrender.com/health

## 📋 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Frontend (Vercel)          Frontend (Render)          │
│  vconect.vercel.app         vconect.onrender.com       │
│         │                           │                  │
│         └───────────┬───────────────┘                  │
│                     │                                   │
│                     ▼                                   │
│         Backend API (Render)                           │
│         vconect.onrender.com/api                       │
│                     │                                   │
│                     ▼                                   │
│         Database (Neon PostgreSQL)                     │
│         ep-dark-hat-ad5h8dd0.neon.tech                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Backend Deployment (Render)

### Prerequisites
- Render account
- GitHub repository connected
- Neon PostgreSQL database

### Step 1: Deploy Backend to Render

1. **Go to Render Dashboard**: https://dashboard.render.com/

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `Excel18-coder/vconect`
   - Configure:
     - **Name**: `vconect` (or your preferred name)
     - **Region**: Oregon (or closest to your users)
     - **Branch**: `main`
     - **Root Directory**: Leave empty
     - **Build Command**: `cd backend && npm install`
     - **Start Command**: `cd backend && npm start`

3. **Configure Environment Variables** (copy from `.env.render.example`):

```bash
DATABASE_URL=postgresql://neondb_owner:npg_Zcqetwui1T0S@ep-dark-hat-ad5h8dd0-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your-generated-secret-here-CHANGE-THIS
REFRESH_TOKEN_SECRET=your-generated-refresh-secret-here-CHANGE-THIS
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
CLOUDINARY_CLOUD_NAME=dpkcyztid
CLOUDINARY_API_KEY=988194444899629
CLOUDINARY_API_SECRET=TCQ4JAJUQu5gOdoB4udEXhxrTzU
NODE_ENV=production
PORT=10000
CORS_ORIGINS=https://vconect.vercel.app,https://vconect.onrender.com,*
CLIENT_URL=https://vconect.onrender.com
BCRYPT_SALT_ROUNDS=12
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

4. **Health Check Configuration**:
   - Health Check Path: `/health`

5. **Deploy**: Click "Create Web Service"

### Step 2: Verify Backend Deployment

```bash
# Test health endpoint
curl https://vconect.onrender.com/health

# Expected response:
# {"status":"ok","timestamp":"...","database":"connected"}

# Test API endpoint
curl https://vconect.onrender.com/api/products/browse

# Test CORS from Vercel frontend
curl -H "Origin: https://vconect.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://vconect.onrender.com/health
```

## 🎨 Frontend Deployment

### Option 1: Deploy to Vercel (Recommended for Speed)

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard

2. **Import Project**:
   - Click "Add New" → "Project"
   - Import from GitHub: `Excel18-coder/vconect`

3. **Configure Build Settings**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Environment Variables**:
   ```bash
   VITE_API_BASE_URL=https://vconect.onrender.com/api
   ```

5. **Deploy**: Click "Deploy"

6. **Custom Domain** (Optional):
   - Go to Project Settings → Domains
   - Add `vconect.vercel.app` or your custom domain

### Option 2: Deploy to Render (Alternative)

1. **Create New Static Site**:
   - Click "New +" → "Static Site"
   - Connect repository: `Excel18-coder/vconect`

2. **Configure**:
   - **Name**: `vconect-frontend`
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

3. **Environment Variables**:
   ```bash
   VITE_API_BASE_URL=https://vconect.onrender.com/api
   ```

4. **Deploy**: Click "Create Static Site"

## 🔒 CORS Configuration

The backend is configured to accept requests from multiple origins:

### Configured Origins:
- ✅ `https://vconect.vercel.app` (Vercel frontend)
- ✅ `https://vconect.onrender.com` (Render frontend)
- ✅ `http://localhost:*` (Development - all ports)
- ✅ Wildcard `*` as fallback

### Backend CORS Settings:
Located in `backend/src/app.js`:
```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
  'https://vconect.vercel.app',
  'https://vconect.onrender.com',
  // ... more origins
];
```

## 🧪 Testing Deployment

### 1. Test Backend Health
```bash
curl https://vconect.onrender.com/health
```

### 2. Test API Endpoints
```bash
# Browse products
curl https://vconect.onrender.com/api/products/browse

# Get analytics insights
curl https://vconect.onrender.com/api/analytics/insights
```

### 3. Test Frontend (Vercel)
1. Visit: https://vconect.vercel.app
2. Open DevTools → Network tab
3. Check API calls are going to `https://vconect.onrender.com/api`
4. Look for CORS errors (should be none)

### 4. Test Frontend (Render)
1. Visit: https://vconect.onrender.com
2. Open DevTools → Network tab
3. Verify API calls
4. Test user registration/login

### 5. Test CORS from Both Frontends
```bash
# Test from Vercel frontend
curl -H "Origin: https://vconect.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type,Authorization" \
     -X OPTIONS \
     https://vconect.onrender.com/api/auth/register

# Test from Render frontend
curl -H "Origin: https://vconect.onrender.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type,Authorization" \
     -X OPTIONS \
     https://vconect.onrender.com/api/auth/register
```

## 🔧 Troubleshooting

### Issue: CORS Errors

**Symptom**: 
```
Access to fetch at 'https://vconect.onrender.com/api/...' from origin 'https://vconect.vercel.app' has been blocked by CORS policy
```

**Solution**:
1. Check backend logs on Render
2. Verify `CORS_ORIGINS` environment variable includes your frontend URL
3. Restart the backend service
4. Clear browser cache

### Issue: 502 Bad Gateway

**Symptom**: Backend returns 502 error

**Solution**:
1. Check Render logs for errors
2. Verify database connection string is correct
3. Check if backend is starting properly:
   ```bash
   curl https://vconect.onrender.com/health
   ```
4. Restart the service if needed

### Issue: API Calls Failing

**Symptom**: Frontend shows "Failed to fetch" errors

**Solution**:
1. Check if backend is running:
   ```bash
   curl https://vconect.onrender.com/health
   ```
2. Verify `VITE_API_BASE_URL` in Vercel environment variables
3. Check browser DevTools → Console for specific errors
4. Verify JWT token is being sent with requests

### Issue: Images Not Loading

**Symptom**: Product images return 404 or don't display

**Solution**:
1. Verify Cloudinary credentials in Render environment variables
2. Check Cloudinary dashboard for uploaded images
3. Test image upload:
   ```bash
   curl -X POST https://vconect.onrender.com/api/upload \
        -H "Authorization: Bearer YOUR_TOKEN" \
        -F "image=@test.jpg"
   ```

## 📊 Monitoring

### Backend Monitoring (Render)
- Dashboard: https://dashboard.render.com/
- Logs: View in real-time from Render dashboard
- Metrics: CPU, Memory, Response times

### Frontend Monitoring (Vercel)
- Analytics: https://vercel.com/dashboard/analytics
- Speed Insights: Performance metrics
- Runtime Logs: Edge function logs

### Database Monitoring (Neon)
- Dashboard: https://console.neon.tech/
- Connection pooling metrics
- Query performance

## 🔄 Continuous Deployment

Both Render and Vercel are configured for automatic deployments:

### Automatic Deployments Triggered By:
- ✅ Push to `main` branch
- ✅ Merge pull requests
- ✅ Manual trigger from dashboard

### Deployment Workflow:
1. Push code to GitHub
2. Render automatically deploys backend
3. Vercel automatically deploys frontend
4. Both services pull latest code
5. Build and deploy in parallel

## 🛡️ Security Best Practices

### ✅ Implemented:
- [x] HTTPS enforced on all endpoints
- [x] JWT authentication with secure secrets
- [x] CORS properly configured
- [x] Rate limiting (100 requests per 15 minutes)
- [x] Helmet.js security headers
- [x] Environment variables for secrets
- [x] SQL injection prevention with parameterized queries
- [x] File upload size limits (5MB)
- [x] Bcrypt password hashing (12 rounds)

### 🔒 Additional Recommendations:
- [ ] Set up error monitoring (Sentry)
- [ ] Enable DDoS protection
- [ ] Configure CDN for static assets
- [ ] Set up database backups
- [ ] Enable 2FA for admin accounts
- [ ] Implement API versioning
- [ ] Add request logging

## 📈 Performance Optimization

### Frontend:
- ✅ Vite build optimization
- ✅ Code splitting
- ✅ Lazy loading routes
- ✅ Image optimization via Cloudinary
- ✅ Vercel Edge Network CDN

### Backend:
- ✅ Compression middleware
- ✅ Database connection pooling (Neon)
- ✅ Response caching where appropriate
- ✅ Efficient SQL queries with indexes

## 📝 Environment Variables Summary

### Backend (Render):
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=<generate-strong-secret>
REFRESH_TOKEN_SECRET=<generate-strong-secret>
CLOUDINARY_CLOUD_NAME=dpkcyztid
CLOUDINARY_API_KEY=988194444899629
CLOUDINARY_API_SECRET=TCQ4JAJUQu5gOdoB4udEXhxrTzU
NODE_ENV=production
PORT=10000
CORS_ORIGINS=https://vconect.vercel.app,https://vconect.onrender.com,*
CLIENT_URL=https://vconect.onrender.com
```

### Frontend (Vercel):
```bash
VITE_API_BASE_URL=https://vconect.onrender.com/api
```

### Frontend (Render):
```bash
VITE_API_BASE_URL=https://vconect.onrender.com/api
```

## 🎯 Post-Deployment Checklist

- [ ] Backend health check passes
- [ ] API endpoints respond correctly
- [ ] User registration works
- [ ] User login works
- [ ] Image upload works
- [ ] Product creation works
- [ ] Search functionality works
- [ ] AI Insights page loads
- [ ] Revenue analytics loads
- [ ] WhatsApp contact works
- [ ] All 9 navigation tabs work
- [ ] Mobile responsiveness verified
- [ ] CORS works from both frontends
- [ ] SSL certificates valid
- [ ] Error pages display correctly

## 🆘 Support

### Resources:
- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Neon Docs**: https://neon.tech/docs
- **Cloudinary Docs**: https://cloudinary.com/documentation

### Quick Links:
- [Backend Source Code](https://github.com/Excel18-coder/vconect/tree/main/backend)
- [Frontend Source Code](https://github.com/Excel18-coder/vconect/tree/main/src)
- [API Documentation](./API_DOCUMENTATION.md)
- [Environment Variables](./ENV_VARIABLES.md)

---

**Last Updated**: November 1, 2025
**Version**: 1.0.0
**Status**: ✅ Production Ready
