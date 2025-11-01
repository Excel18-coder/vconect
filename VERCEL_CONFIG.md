# V-Market Vercel Frontend Configuration

## Live URLs

- **Frontend (Vercel)**: https://vconect.vercel.app
- **Backend (Render)**: https://v-market-backend.onrender.com
- **API Endpoint**: https://v-market-backend.onrender.com/api

## Frontend Environment Variables (Vercel)

Set these in your Vercel project settings:

```bash
VITE_API_BASE_URL=https://v-market-backend.onrender.com/api
```

## Backend CORS Configuration

The backend is already configured to accept requests from:
- `https://vconect.vercel.app` ✅
- `http://localhost:5173` (development)
- `http://localhost:8080` (development)
- All other origins via wildcard (production)

## Deployment Steps

### Backend (Already Configured)

The backend at `https://v-market-backend.onrender.com` is configured with:
- CORS_ORIGINS includes `https://vconect.vercel.app`
- CLIENT_URL set to `https://vconect.vercel.app`

### Frontend (Vercel)

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import from GitHub: `Excel18-coder/vconect`

2. **Configure Build Settings**
   - Framework Preset: `Vite`
   - Root Directory: `./` (leave empty)
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Add Environment Variables**
   ```bash
   VITE_API_BASE_URL=https://v-market-backend.onrender.com/api
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait ~2-3 minutes
   - Your site will be live at `https://vconect.vercel.app`

## Testing After Deployment

### Check Backend CORS
```bash
curl -H "Origin: https://vconect.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://v-market-backend.onrender.com/health
```

### Check Frontend
1. Visit https://vconect.vercel.app
2. Open browser console (F12)
3. Try to login or browse products
4. Check for CORS errors (should be none)

### Check API Connection
```bash
# From browser console at https://vconect.vercel.app
fetch('https://v-market-backend.onrender.com/api/products/browse')
  .then(r => r.json())
  .then(console.log)
```

## Troubleshooting

### CORS Errors
If you see CORS errors:
1. Check backend environment variable `CORS_ORIGINS`
2. Make sure it includes `https://vconect.vercel.app`
3. Restart backend service on Render

### API Not Responding
1. Check backend is running: `https://v-market-backend.onrender.com/health`
2. Check frontend env var: `VITE_API_BASE_URL`
3. Redeploy frontend if env var changed

### Authentication Issues
1. Ensure cookies work cross-origin
2. Check JWT_SECRET is set on backend
3. Test with Postman first

## Auto-Deployment

Both services auto-deploy on git push:

```bash
git add .
git commit -m "Update feature"
git push origin main

# Vercel auto-deploys: ~2-3 minutes
# Render auto-deploys: ~5-8 minutes
```

## Custom Domain (Optional)

To add custom domain to Vercel:
1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records
4. Update backend CORS_ORIGINS

## Performance Optimization

Vercel automatically provides:
- ✅ Global CDN
- ✅ Automatic HTTPS
- ✅ Instant cache invalidation
- ✅ Edge functions
- ✅ Image optimization

## Monitoring

- **Vercel Analytics**: Automatically enabled
- **Vercel Logs**: Real-time deployment logs
- **Backend Health**: https://v-market-backend.onrender.com/health

---

**Everything is configured and ready!** 🚀

Frontend: https://vconect.vercel.app
Backend: https://v-market-backend.onrender.com
