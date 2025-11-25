# 🚀 Deployment Checklist

Use this checklist to ensure a successful deployment to Render.

## Pre-Deployment Checklist

### Local Testing
- [ ] All features working locally
- [ ] Backend server starts without errors: `cd backend && npm start`
- [ ] Frontend builds successfully: `npm run build`
- [ ] All environment variables set in `.env` files
- [ ] No console errors in browser
- [ ] Database connection working
- [ ] Image uploads working (Cloudinary)
- [ ] Authentication working (login/register)

### Code Quality
- [ ] All TypeScript/JavaScript files have no errors
- [ ] Git repository is clean: `git status`
- [ ] Latest changes committed: `git commit -m "message"`
- [ ] Pushed to GitHub: `git push origin main`

### Configuration Files
- [ ] `render.yaml` exists in root directory
- [ ] `backend/.env.render.example` has correct values
- [ ] `.env.production` has correct API URL
- [ ] `.gitignore` includes `.env` files

## Render Setup Checklist

### Account & Repository
- [ ] Render account created at [render.com](https://render.com)
- [ ] GitHub account connected to Render
- [ ] Repository access granted to Render

### Backend Service Setup
- [ ] Create Web Service on Render
- [ ] Connect GitHub repository: `Excel18-coder/-Vmarket`
- [ ] Set build command: `cd backend && npm install`
- [ ] Set start command: `cd backend && npm start`
- [ ] Set region: Oregon (US West)
- [ ] Add environment variables (see below)
- [ ] Enable health check: `/health`

### Backend Environment Variables
Copy from `backend/.env.render.example`:

#### Critical (Must Set)
- [ ] `DATABASE_URL` - Neon PostgreSQL connection string
- [ ] `JWT_SECRET` - Click "Generate" in Render
- [ ] `JWT_REFRESH_SECRET` - Click "Generate" in Render
- [ ] `CLOUDINARY_CLOUD_NAME` - From your .env
- [ ] `CLOUDINARY_API_KEY` - From your .env
- [ ] `CLOUDINARY_API_SECRET` - From your .env
- [ ] `NODE_ENV=production`
- [ ] `PORT=10000`
- [ ] `CORS_ORIGINS=*` (change after testing)

#### Optional
- [ ] `JWT_EXPIRES_IN=7d`
- [ ] `JWT_REFRESH_EXPIRES_IN=30d`
- [ ] `BCRYPT_SALT_ROUNDS=12`
- [ ] `MAX_FILE_SIZE=5242880`
- [ ] `ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp`
- [ ] `RATE_LIMIT_WINDOW_MS=900000`
- [ ] `RATE_LIMIT_MAX_REQUESTS=100`

### Frontend Service Setup
- [ ] Create Static Site on Render
- [ ] Connect same GitHub repository
- [ ] Set build command: `npm install && npm run build`
- [ ] Set publish directory: `dist`
- [ ] Add rewrite rule: `/*` → `/index.html`

### Frontend Environment Variables
- [ ] `VITE_API_BASE_URL` - Your backend URL (e.g., `https://v-market-backend.onrender.com/api`)

## Deployment

### Trigger Deployment
```bash
# Option 1: Use deployment script
./deploy.sh

# Option 2: Manual git push
git add .
git commit -m "Deploy to production"
git push origin main
```

### Monitor Deployment
- [ ] Watch backend logs in Render dashboard
- [ ] Watch frontend logs in Render dashboard
- [ ] Wait 10-15 minutes for deployment to complete
- [ ] Check for any error messages

## Post-Deployment Testing

### Backend Health Check
```bash
# Test backend is running
curl https://v-market-backend.onrender.com/health

# Expected response:
# {"status":"OK","timestamp":"...","services":{"database":"connected","cloudinary":"connected"}}
```

- [ ] Backend health check returns 200 OK
- [ ] Database connection is "connected"
- [ ] Cloudinary connection is "connected"

### Frontend Testing
Visit: `https://v-market.onrender.com`

#### Pages to Test
- [ ] Homepage loads
- [ ] Navigation tabs work
- [ ] All 9 category tabs functional
- [ ] AI Insights page loads with data
- [ ] Revenue page loads (requires login)

#### Authentication Flow
- [ ] Register new account
- [ ] Receive verification email (if configured)
- [ ] Login works
- [ ] JWT token stored in localStorage
- [ ] Protected routes work (Account, Revenue)
- [ ] Logout works

#### Product Management
- [ ] Create new product
- [ ] Upload images (Cloudinary)
- [ ] View product details
- [ ] Edit product
- [ ] Delete product
- [ ] Browse products by category
- [ ] Search products

#### User Interactions
- [ ] Contact seller (WhatsApp button)
- [ ] Add product to favorites
- [ ] Update profile
- [ ] Change password

## Troubleshooting

### Backend Issues
- [ ] Check environment variables are set
- [ ] Verify DATABASE_URL format
- [ ] Check Cloudinary credentials
- [ ] Review server logs for errors

### Frontend Issues  
- [ ] Verify VITE_API_BASE_URL is correct
- [ ] Check CORS settings in backend
- [ ] Open browser console for errors
- [ ] Check network tab for API calls

### Database Issues
- [ ] Verify Neon database is active
- [ ] Check connection string has `?sslmode=require`
- [ ] Test connection from backend logs

### Image Upload Issues
- [ ] Verify Cloudinary credentials
- [ ] Check file size limits
- [ ] Check allowed file types

## Security Hardening (After Testing)

### Backend
- [ ] Change `CORS_ORIGINS` from `*` to specific frontend URL
- [ ] Rotate JWT secrets if leaked
- [ ] Enable rate limiting
- [ ] Review and update allowed file types
- [ ] Set up monitoring/alerts

### Frontend
- [ ] Update to production API URL
- [ ] Remove console.log statements
- [ ] Enable error tracking (Sentry)
- [ ] Set up analytics

### Database
- [ ] Review and limit database user permissions
- [ ] Set up automated backups
- [ ] Monitor query performance

## Monitoring & Maintenance

### Set Up Monitoring
- [ ] Add UptimeRobot for health check monitoring
- [ ] Configure Sentry for error tracking
- [ ] Set up Google Analytics
- [ ] Create status page

### Regular Maintenance
- [ ] Monitor error logs weekly
- [ ] Review performance metrics
- [ ] Update dependencies monthly
- [ ] Backup database regularly
- [ ] Test disaster recovery plan

## Success Criteria

Your deployment is successful when:

✅ Backend health check returns 200 OK  
✅ Frontend loads without errors  
✅ Users can register and login  
✅ Products can be created with images  
✅ All navigation tabs work  
✅ WhatsApp contact works  
✅ AI Insights shows real data  
✅ Revenue page shows real data  
✅ No CORS errors in console  
✅ SSL certificates are active (https://)  

## Useful Commands

```bash
# Check backend health
curl https://v-market-backend.onrender.com/health

# Check frontend
curl https://v-market.onrender.com

# View backend logs
# Go to Render Dashboard → v-market-backend → Logs

# View frontend build logs
# Go to Render Dashboard → v-market-frontend → Deploys → Latest Deploy

# Trigger manual redeploy
# Go to Render Dashboard → Service → Manual Deploy → Deploy latest commit

# Rollback to previous version
# Go to Render Dashboard → Service → Deploys → Previous Deploy → Rollback
```

## Need Help?

- 📖 [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) - Detailed deployment guide
- 📋 [ENV_VARIABLES.md](ENV_VARIABLES.md) - Environment variables reference
- 🐛 [GitHub Issues](https://github.com/Excel18-coder/-Vmarket/issues) - Report bugs
- 💬 Render Community - Get deployment help

---

**✅ Checklist Complete?** Your V-Market application is ready for production! 🎉

