🚀 DEPLOYMENT INSTRUCTIONS - v2.1.1

## Quick Deploy (GitHub Pages Frontend)

### Option A: Direct Git Push (Recommended)
```bash
# Stage all changes
git add -A

# Commit with message
git commit -m "fix: responsive layouts, security improvements, deployment updates"

# Push to GitHub main branch
git push origin main
```

**Automatic Deployment**: GitHub Pages will deploy to:
```
https://DaumantasPetrauskas-cloud.github.io/termchat-lt/
```

⏱️ **Deploy time**: 30-60 seconds

### Option B: Manual GitHub Pages Setup (First Time)
1. Go to GitHub repo Settings
2. Navigate to Pages section
3. Set Source: Deploy from branch `main`
4. Set Branch: `main` / `/ (root)`
5. Click Save
6. Done! Site deploys automatically on pushes

---

## Backend Deployment Options

### Option A: Railway (Recommended - Free Tier Available)

**Fastest Setup** (5 minutes)

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select `DaumantasPetrauskas-cloud/termchat-lt`
5. Railway auto-detects Dockerfile
6. Add environment variables:
   - `ZHIPU_API_KEY` = your-key
   - `AI_PROVIDER` = zhipu
7. Click Deploy
8. Get public URL: `https://termchat-xxx.railway.app`

**Auto-redeploys** on GitHub push  
**Full guide**: See `RAILWAY_DEPLOYMENT.md`

---

### Option B: Render (Alternative)

1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect GitHub account
4. Select `termchat-lt` repository
5. Configure:
   - **Name**: `termchat-mqtt-bot`
   - **Build Command**: `./build.sh`
   - **Start Command**: `python mqtt_service.py`
6. Set environment variables:
   - `ZHIPU_API_KEY` = your-key
   - `AI_PROVIDER` = zhipu
   - `RENDER` = true
7. Deploy

**Service URL**: `https://termchat-mqtt-bot.onrender.com`

---

### Option C: Heroku (Legacy - Paid Plan Required)

Not recommended (paid plans only)

---

## Frontend Deployment Options

### GitHub Pages (Current - FREE)
✅ **Already Configured**
- URL: `https://DaumantasPetrauskas-cloud.github.io/termchat-lt/`
- Auto-deploys on `git push origin main`
- No cost

### Netlify (Alternative - FREE)
1. Go to [netlify.com](https://netlify.com)
2. Drag & drop project folder
3. Deploy instantly

### Vercel (Alternative - FREE)
1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repo
3. Deploy with one click

---

## Testing Deployment

### Frontend Tests
```bash
# Test locally before pushing
python -m http.server 8000
# Visit http://localhost:8000
```

### Check Live Deployment
1. **Frontend**: https://DaumantasPetrauskas-cloud.github.io/termchat-lt/
2. **Boot Screen**: Should show "v2.1.0 [ARCHITECT BUILD]"
3. **Responsive**: Test on mobile (375px) - should work
4. **Buttons**: Boot options [1] [2] [3] [A] should be clickable

### Backend Test
```bash
# Test MQTT locally
python mqtt_service.py
# Should show: "Connected to MQTT broker"
```

---

## Status Checklist

✅ **Frontend Ready**
- [x] Responsive layouts fixed (mobile, tablet, desktop)
- [x] Safe area support for notched phones
- [x] Boot screen working
- [x] Chat interface responsive
- [x] GitHub Pages configured

✅ **Backend Ready**
- [x] MQTT service configured
- [x] Python dependencies updated
- [x] Build script working
- [x] Environment variables documented

✅ **Security**
- [x] API keys protected in .env
- [x] No secrets in code
- [x] HTTPS/WSS enforced
- [x] Input validation implemented

---

## Troubleshooting

### Frontend not updating?
```bash
# Hard refresh browser (Ctrl+Shift+R on Windows, Cmd+Shift+R on Mac)
# Or clear browser cache and reload
```

### MQTT connection failing?
- Check if `broker.emqx.io:8084` is accessible
- Verify WSS (WebSocket Secure) support
- Check browser console for errors

### Backend not responding?
- Wait 2-3 minutes for Render deployment
- Check Render dashboard logs
- Verify API key in environment variables

---

## Rollback if Needed

### GitHub Pages
```bash
git revert HEAD
git push origin main
# Rolls back to previous version
```

### Render Service
- Go to Render dashboard
- Click "Suspend Service" if needed
- Redeploy previous build

---

## Documentation Files

- `QUICK_DEPLOY.md` - One-line deployment
- `LAYOUT_FIX_SUMMARY.md` - Layout improvements
- `CODE_CHANGES.md` - Exact code modifications  
- `DEPLOYMENT_STATUS.md` - Full testing checklist

---

**Status**: ✅ **READY FOR PRODUCTION**

All files are tested and ready. Execute `git push origin main` to deploy!