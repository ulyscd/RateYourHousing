# Git Repository Setup Guide

## What to Commit ✅

### **MUST Commit** (Essential for collaboration):

1. **Source Code** (All React/Node.js code):
   - `client/src/` - All React components and pages
   - `server/server.js` - Backend server code
   - `server/setup-db.js` - Database setup script
   - `server/import-listings.js` - Import script

2. **Configuration Files**:
   - `package.json` (root, client/, server/) - Dependencies
   - `package-lock.json` (root, client/, server/) - Lock files
   - `vite.config.js` - Vite configuration
   - `tailwind.config.js` - Tailwind CSS config
   - `postcss.config.js` - PostCSS config
   - `client/index.html` - HTML entry point

3. **Data Files**:
   - `server/listings.json` - Your listings data (important!)

4. **Deployment Configs**:
   - `server/vercel.json` - Vercel deployment
   - `server/railway.json` - Railway deployment
   - `server/Procfile` - Heroku deployment
   - `render.yaml` - Render deployment

5. **Documentation**:
   - `README.md`
   - `DEPLOYMENT.md`
   - `QUICKSTART.md`
   - `QUICK_DEPLOY.md`
   - `MLH_TRACK_SUGGESTIONS.md`
   - `.gitignore`

## What NOT to Commit ❌

### Already in `.gitignore`:

1. **Dependencies**:
   - `node_modules/` - Will be installed via `npm install`

2. **Build Outputs**:
   - `dist/`, `build/` - Generated files

3. **Environment Variables**:
   - `.env`, `.env.local`, `.env.production` - Contains secrets

4. **Database**:
   - `server/database.sqlite` - Contains data, should be regenerated
   - `server/uploads/` - User-uploaded images

5. **System Files**:
   - `.DS_Store` - macOS system files
   - `*.log` - Log files

## Quick Setup Steps

### 1. Initialize Git Repository

```bash
cd /Users/ulys/Documents/Code/RateMyHousing
git init
```

### 2. Add All Files (respects .gitignore)

```bash
git add .
```

### 3. Verify What Will Be Committed

```bash
git status
```

You should see:
- ✅ All source code files
- ✅ Configuration files
- ✅ Documentation
- ✅ `listings.json`
- ❌ No `node_modules/`
- ❌ No `database.sqlite`
- ❌ No `.env` files

### 4. Create Initial Commit

```bash
git commit -m "Initial commit: RateMyHousing webapp

- React frontend with Tailwind CSS
- Express backend with SQLite
- Interactive map with apartment listings
- Review system with ratings and images
- MLH track integration suggestions
- Deployment configurations"
```

### 5. Create GitHub Repository

1. Go to GitHub and create a new repository
2. Don't initialize with README (you already have one)
3. Copy the repository URL

### 6. Connect and Push

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## For Your Partner

### Cloning and Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME

# Install all dependencies
npm run install:all

# Initialize database (will create database.sqlite)
node server/setup-db.js

# Import listings data
node server/import-listings.js

# Start development servers
npm run dev
```

## Important Notes

1. **`listings.json` IS committed** - This contains your apartment data, so it should be in git
2. **`database.sqlite` is NOT committed** - Each developer creates their own local database
3. **`.env` files are NOT committed** - Partners create their own `.env` files if needed
4. **`node_modules/` is NOT committed** - Everyone runs `npm install` after cloning

## Collaboration Workflow

### Making Changes:
```bash
# Create a new branch
git checkout -b feature/your-feature-name

# Make your changes
# ...

# Commit changes
git add .
git commit -m "Description of changes"

# Push to GitHub
git push origin feature/your-feature-name

# Create Pull Request on GitHub to merge into main
```

### Getting Latest Changes:
```bash
git pull origin main
npm run install:all  # If new dependencies were added
```

## Files Summary

| File/Folder | Commit? | Reason |
|------------|---------|--------|
| `client/src/` | ✅ Yes | Source code |
| `server/server.js` | ✅ Yes | Source code |
| `server/listings.json` | ✅ Yes | Initial data |
| `package.json` files | ✅ Yes | Dependencies list |
| `node_modules/` | ❌ No | Too large, regenerated |
| `server/database.sqlite` | ❌ No | Local data, regenerated |
| `.env` files | ❌ No | Secrets, local config |
| `server/uploads/` | ❌ No | User uploads, regenerated |
| Documentation (`.md`) | ✅ Yes | Project info |

## Before First Push Checklist

- [ ] Created `.gitignore` (already done ✅)
- [ ] Verified `database.sqlite` is not tracked
- [ ] Verified `node_modules/` is not tracked
- [ ] Verified `listings.json` IS tracked
- [ ] All source code files are included
- [ ] Documentation files are included
- [ ] Initial commit created
- [ ] GitHub repository created
- [ ] Pushed to GitHub

Your repository is ready for collaboration! 🚀

