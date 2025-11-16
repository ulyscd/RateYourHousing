# Deployment Guide

## Overview

Your app has two parts:
1. **Frontend** (React) - Can be hosted on GitHub Pages, Vercel, or Netlify
2. **Backend** (Express + SQLite) - Must be hosted on a platform that supports Node.js servers

**Important**: For reviews to be permanent and shared between all users, you need to host the backend on a shared server. GitHub Pages alone cannot do this.

## Deployment Options

### Recommended Approach (Free & Easy)

**Frontend**: GitHub Pages or Vercel  
**Backend**: Railway, Render, or Fly.io

---

## Option 1: Railway (Recommended - Easiest)

Railway offers free hosting for both frontend and backend, or you can host backend only.

### Backend Deployment on Railway

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy Backend**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login
   railway login
   
   # In the server directory
   cd server
   railway init
   railway up
   ```

3. **Set Environment Variables** (if needed)
   - `PORT` - Railway will auto-assign
   - `NODE_ENV=production`

4. **Get Your Backend URL**
   - Railway will provide a URL like: `https://your-app.up.railway.app`

### Frontend Deployment

1. **Update API URL** - Use the Railway backend URL
2. Deploy to GitHub Pages, Vercel, or Netlify (see sections below)

---

## Option 2: Render (Free Tier Available)

### Backend Deployment on Render

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create New Web Service**
   - Connect your GitHub repository
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Environment: `Node`

3. **Set Environment Variables**
   - `PORT` - Render will auto-assign
   - `NODE_ENV=production`

4. **Get Your Backend URL**
   - Render will provide: `https://your-app.onrender.com`

---

## Option 3: Vercel (Backend + Frontend)

Vercel can host both, but requires some setup changes for the backend.

### Backend on Vercel

1. Create `vercel.json` in server directory (see below)
2. Deploy via Vercel CLI or GitHub integration

### Frontend on Vercel

1. Push to GitHub
2. Import project on vercel.com
3. Set environment variables
4. Deploy

---

## Frontend Deployment

### GitHub Pages

1. **Build the frontend**
   ```bash
   cd client
   npm run build
   ```

2. **Update API URL in build**
   - Edit `client/vite.config.js` base URL or use environment variable

3. **Deploy to GitHub Pages**
   ```bash
   # Install gh-pages
   npm install --save-dev gh-pages
   
   # Add to client/package.json:
   "homepage": "https://yourusername.github.io/rate-my-housing",
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   
   # Deploy
   npm run deploy
   ```

4. **Enable GitHub Pages**
   - Go to repo Settings → Pages
   - Select `gh-pages` branch
   - Set folder to `/root` or `/docs`

### Vercel (Easier Alternative)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Set Root Directory to `client`
5. Add environment variable: `VITE_API_URL=https://your-backend-url.com`
6. Deploy!

### Netlify

1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. New site from Git → Select repository
4. Build settings:
   - Base directory: `client`
   - Build command: `npm run build`
   - Publish directory: `client/dist`
5. Add environment variable: `VITE_API_URL=https://your-backend-url.com`
6. Deploy!

---

## Environment Variables Setup

### Frontend (client)

Create `client/.env.production`:
```
VITE_API_URL=https://your-backend-url.com/api
```

The frontend will automatically use this in production builds.

### Backend (server)

Create `server/.env`:
```
PORT=5001
NODE_ENV=production
```

---

## Database Considerations

**SQLite on Cloud Hosting:**
- Works on Railway, Render, Fly.io
- Database file persists on the server
- ✅ All users see the same reviews
- ✅ Reviews are permanent

**Limitations:**
- SQLite files are stored on the server filesystem
- If you delete/redeploy, you might lose data (unless you backup)
- For production, consider migrating to PostgreSQL (Railway/Render offer free PostgreSQL)

---

## Post-Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed with correct API URL
- [ ] Test submitting a review
- [ ] Test viewing reviews
- [ ] Test image uploads
- [ ] Verify CORS is configured correctly (should allow your frontend domain)
- [ ] Test on mobile devices

---

## CORS Configuration

Your backend already has `cors()` enabled, which should work. If you get CORS errors:

Update `server/server.js`:
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-frontend-url.com'],
  credentials: true
}))
```

---

## Troubleshooting

### Reviews not saving
- Check backend is running
- Check API URL in frontend is correct
- Check browser console for errors
- Verify CORS settings

### Images not loading
- Verify `/uploads` folder exists on server
- Check file permissions
- Verify image URLs are correct

### Database reset on redeploy
- Use persistent volumes (Railway/Render support this)
- Consider migrating to PostgreSQL
- Regular backups recommended

---

## Next Steps for Production

1. **Database**: Migrate to PostgreSQL for better reliability
2. **Environment Variables**: Use platform-specific env var management
3. **Monitoring**: Add error logging (Sentry, etc.)
4. **Domain**: Add custom domain for both frontend and backend
5. **HTTPS**: Ensure both are served over HTTPS (most platforms do this automatically)

