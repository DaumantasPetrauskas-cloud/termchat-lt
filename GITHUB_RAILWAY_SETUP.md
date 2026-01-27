# 🚀 GitHub + Railway Deployment Guide

## Complete Setup in 10 Minutes

### Frontend: GitHub Pages
### Backend: Railway

---

## Step 1: Push to GitHub (2 minutes)

### Add All Changes
```bash
git add -A
```

### Commit
```bash
git commit -m "v2.1.1: add Railway deployment config + comprehensive improvements"
```

### Push to GitHub
```bash
git push origin main
```

**Result**: 
- ✅ Code on GitHub
- ✅ Frontend auto-deploys to GitHub Pages
- ✅ URL: https://DaumantasPetrauskas-cloud.github.io/termchat-lt/

---

## Step 2: Deploy Backend to Railway (5 minutes)

### 2a. Sign Up / Login to Railway

1. Go to **https://railway.app**
2. Click **"Sign up with GitHub"**
3. Authorize Railway to access your GitHub repos
4. Verify email if needed

### 2b. Create New Project

1. Click **"New Project"**
2. Click **"Deploy from GitHub repo"**
3. Select your GitHub account
4. Find and select **`termchat-lt`**
5. Railway auto-detects **Dockerfile** ✅

### 2c. Add Environment Variables

1. Click **"Variables"** tab
2. Click **"Add Variable"**
3. Add these one by one:

```
ZHIPU_API_KEY = your-api-key-here
AI_PROVIDER = zhipu
RAILWAY = true
```

**Important**: Set `ZHIPU_API_KEY` to your actual API key

### 2d. Deploy

1. Click **"Deploy"** button
2. Watch the build logs (should take 1-2 minutes)
3. Wait for **green checkmark** ✅
4. Get your **public URL**

### 2e. Get Your Backend URL

1. Go to **Deployments** tab
2. Find your active deployment
3. Copy the **Domain** URL
4. Format: `https://termchat-xxxxx.railway.app`

---

## 📍 Your Live URLs

### Frontend (GitHub Pages)
```
https://DaumantasPetrauskas-cloud.github.io/termchat-lt/
```

### Backend (Railway)
```
https://termchat-xxxxx.railway.app
```

(Replace xxxxx with your Railway domain)

---

## ✅ Verify Everything Works

### Frontend Check
```
1. Visit: https://DaumantasPetrauskas-cloud.github.io/termchat-lt/
2. Should show boot screen with "v2.1.0 [ARCHITECT BUILD]"
3. Buttons [1][2][3][A] should be clickable
```

### Backend Check
```
1. Visit your Railway URL: https://termchat-xxxxx.railway.app
2. Should show health check response
3. Check Railway logs for "Connected to MQTT"
```

### Integration Check
```
1. Open frontend in browser
2. Try Chat mode or API mode
3. Should receive responses
4. Check browser console for errors
```

---

## 🔄 Auto-Deployment

### How It Works

**Every time you push to GitHub:**

```bash
git push origin main
```

**Both will auto-deploy:**

1. **GitHub Pages**
   - Frontend updates automatically
   - ~1 minute delay
   - URL: github.io URL

2. **Railway**
   - Backend rebuilds from Dockerfile
   - ~2-3 minutes delay
   - Auto-restarts service

---

## 📊 Architecture

```
┌─────────────────────────────────────────┐
│          Your Visitors                  │
└────────────────┬────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
   GitHub Pages      Railway Backend
  (Frontend)         (MQTT/AI Service)
  
- Static HTML/CSS    - Python Server
- Instant loading    - Real-time chat
- No server needed   - API integration
```

---

## 🔐 Environment Variables

### GitHub (Frontend)
- No environment variables needed
- API keys loaded from user input or localStorage

### Railway (Backend)
- Set these in Railway dashboard:

| Variable | Purpose | Example |
|----------|---------|---------|
| `ZHIPU_API_KEY` | AI API authentication | `abc123xyz...` |
| `AI_PROVIDER` | Which AI to use | `zhipu` |
| `RAILWAY` | Platform identifier | `true` |

---

## 📋 Deployment Checklist

### GitHub
- [ ] All code committed (`git add -A`)
- [ ] Commit message clear (`git commit -m "..."`)
- [ ] Pushed to main (`git push origin main`)
- [ ] GitHub Pages enabled in Settings
- [ ] Frontend loads at github.io URL

### Railway
- [ ] Signed up at railway.app
- [ ] New project created
- [ ] GitHub repo connected
- [ ] Environment variables added
- [ ] Deploy button clicked
- [ ] Build completed (green checkmark)
- [ ] Public URL copied
- [ ] Backend responds at URL

### Integration
- [ ] Frontend accessible
- [ ] Backend responds
- [ ] MQTT connections work
- [ ] Messages can be sent
- [ ] No console errors

---

## 🚨 Troubleshooting

### GitHub Push Fails
```bash
# Check remote
git remote -v

# Should show:
# origin  https://github.com/YOUR_USERNAME/termchat-lt.git

# Try again
git push origin main
```

### Frontend Not Updating
```
1. Wait 2-3 minutes
2. Hard refresh: Ctrl+Shift+R
3. Check GitHub Pages settings
4. Verify Settings → Pages → Source is "main"
```

### Railway Build Fails
```
1. Check build logs in Railway dashboard
2. Verify Dockerfile syntax
3. Check Python version (3.11+)
4. Ensure requirements.txt exists
```

### MQTT Not Connecting
```
1. Verify API key is set in Railway
2. Check network in Railway logs
3. Test with local mode (button [3])
4. Check MQTT broker (broker.emqx.io)
```

### Backend Not Responding
```
1. Check Railway Deployments tab
2. Verify health checks passing
3. Look at deployment logs
4. Check if restarting
```

---

## 📈 Monitoring & Maintenance

### GitHub Pages
- No maintenance needed
- Automatic HTTPS
- 100GB/month bandwidth free

### Railway
- Monitor in dashboard
- Check logs for errors
- Restart if needed
- Upgrade if more resources needed

---

## 💰 Costs

### GitHub Pages
- ✅ **FREE** (unlimited)

### Railway Free Tier
- ✅ **FREE** for:
  - 5GB bandwidth
  - 160 compute hours
  - PostgreSQL (optional)
  
### Railway Pro ($5+/month)
- Better performance
- Higher bandwidth
- Priority support

---

## 🔄 Updating Your App

### Make Changes Locally
```bash
# Edit files
vim script.js
vim style.css
```

### Test Locally
```bash
python -m http.server 8000
# Visit http://localhost:8000
```

### Deploy to Both Platforms
```bash
git add -A
git commit -m "fix: description of change"
git push origin main
```

### Wait for Deployment
- GitHub Pages: ~1 minute
- Railway: ~2-3 minutes

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| `DEPLOY.md` | Main deployment guide |
| `RAILWAY_DEPLOYMENT.md` | Railway-specific guide |
| `QUICK_DEPLOY.md` | One-line deploy |
| `README.md` | Project overview |

---

## ✨ Success!

You now have:

✅ **Frontend**: Hosted on GitHub Pages  
✅ **Backend**: Running on Railway  
✅ **Auto-deploy**: On every GitHub push  
✅ **Live URLs**: Both accessible 24/7  
✅ **Scalable**: Railway can handle growth  

---

## 🎯 Next Steps

### Immediate
1. Push to GitHub
2. Set up Railway
3. Add environment variables
4. Deploy backend

### Short Term
1. Share your URLs
2. Get user feedback
3. Monitor logs
4. Fix any issues

### Long Term
1. Add more features
2. Scale infrastructure
3. Add databases
4. Optimize performance

---

## 📞 Support

### GitHub Help
- Docs: https://docs.github.com
- Pages: https://pages.github.com
- Issues: Create in your repo

### Railway Help
- Docs: https://docs.railway.app
- Support: support@railway.app
- Community: https://community.railway.app

---

**Time to Deploy**: 10 minutes  
**Difficulty**: Easy  
**Cost**: Free (GitHub + Railway free tier)  
**Result**: Professional deployment ✅
