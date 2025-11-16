# Quick Deployment Guide

## 🚀 Fastest Way to Deploy (15 minutes)

### Step 1: Deploy Backend to Railway (5 min)

1. Go to [railway.app](https://railway.app) and sign up with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect it's Node.js
5. Set Root Directory to: `server`
6. Railway will automatically deploy!
7. **Copy your backend URL** (looks like: `https://your-app.up.railway.app`)

### Step 2: Update Frontend API URL

1. In your local project, create `client/.env.production`:
   ```
   VITE_API_URL=https://your-railway-url.up.railway.app/api
   ```
   (Replace with your actual Railway URL)

### Step 3: Deploy Frontend to Vercel (5 min)

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click "Add New Project"
3. Import your GitHub repository
4. Settings:
   - Framework Preset: Vite
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add Environment Variable:
   - Name: `VITE_API_URL`
   - Value: `https://your-railway-url.up.railway.app/api`
6. Click "Deploy"

**Done!** Your site is live! 🎉

---

## ✅ Will Reviews Be Permanent?

**YES!** When you deploy:
- ✅ Backend runs on Railway server (always on)
- ✅ Database is stored on Railway's filesystem
- ✅ All users see the same reviews
- ✅ Reviews persist permanently
- ✅ Works exactly like your local version, but public!

---

## Alternative: All-in-One on Railway

Railway can host both frontend and backend:

1. Create two services in one Railway project:
   - Service 1: Backend (root: `server`)
   - Service 2: Frontend (root: `client`)
2. Set frontend environment variable: `VITE_API_URL=<backend-service-url>/api`
3. Railway will give you URLs for both!

---

## Need Help?

See `DEPLOYMENT.md` for detailed instructions and troubleshooting.

