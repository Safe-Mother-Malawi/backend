# Keep Backend Awake - Solutions

## 🚨 Problem: Backend Goes to Sleep

Render free tier puts services to sleep after **15 minutes of inactivity**. This causes:
- ❌ "Could not connect to server" errors
- ❌ First request takes 30-60 seconds
- ❌ Poor user experience

---

## ✅ SOLUTION 1: GitHub Actions (Recommended - Free & Automatic)

### Setup:

1. **The workflow is already created** in `.github/workflows/keep-alive.yml`

2. **Push to GitHub:**
   ```bash
   git add .github/workflows/keep-alive.yml
   git commit -m "Add keep-alive workflow"
   git push
   ```

3. **Enable GitHub Actions:**
   - Go to: https://github.com/Safe-Mother-Malawi/backend/actions
   - Click "I understand my workflows, go ahead and enable them"

4. **Done!** GitHub will ping your backend every 10 minutes automatically.

### How It Works:
- Runs every 10 minutes (cron schedule)
- Pings health endpoint
- Keeps backend awake 24/7
- Completely free!

---

## ✅ SOLUTION 2: Run Keep-Alive Script Locally

### Setup:

1. **Run the script:**
   ```bash
   cd backend
   node keep-alive.js
   ```

2. **Keep terminal open** - Backend stays awake as long as script runs

3. **Stop with:** Ctrl+C

### Pros:
- ✅ Simple
- ✅ Works immediately

### Cons:
- ❌ Requires your computer to be on
- ❌ Terminal must stay open

---

## ✅ SOLUTION 3: UptimeRobot (Free External Service)

### Setup:

1. **Go to:** https://uptimerobot.com (free account)

2. **Create New Monitor:**
   - Monitor Type: HTTP(s)
   - Friendly Name: Safe Mother Malawi Backend
   - URL: `https://safemothermalawi-backend.onrender.com/api/v1/health`
   - Monitoring Interval: 5 minutes (free tier)

3. **Save** - Done!

### Pros:
- ✅ Completely free
- ✅ No code needed
- ✅ Works 24/7
- ✅ Email alerts if backend goes down

---

## ✅ SOLUTION 4: Cron-job.org (Free External Service)

### Setup:

1. **Go to:** https://cron-job.org (free account)

2. **Create Cronjob:**
   - Title: Keep Backend Awake
   - URL: `https://safemothermalawi-backend.onrender.com/api/v1/health`
   - Schedule: Every 10 minutes

3. **Save** - Done!

---

## ✅ SOLUTION 5: Upgrade to Render Paid Plan

### Cost: $7/month

### Benefits:
- ✅ Never sleeps
- ✅ Faster performance
- ✅ More resources
- ✅ Better for production

### Setup:
1. Go to Render dashboard
2. Upgrade service to "Starter" plan
3. Done!

---

## 🎯 Recommended Approach:

### For Development/Testing:
**Use GitHub Actions** (Solution 1) - Free and automatic

### For Production:
**Upgrade to Paid Plan** (Solution 5) - Better performance and reliability

---

## 🧪 Test If It's Working:

### Check Backend Status:
```bash
curl https://safemothermalawi-backend.onrender.com/api/v1/health
```

**Should respond immediately with:** `{"status":"ok"}`

### Monitor GitHub Actions:
- Go to: https://github.com/Safe-Mother-Malawi/backend/actions
- Check if workflow runs every 10 minutes
- Verify it succeeds (green checkmark)

---

## 📊 Comparison:

| Solution | Cost | Setup Time | Reliability | Recommended |
|----------|------|------------|-------------|-------------|
| **GitHub Actions** | Free | 2 min | ⭐⭐⭐⭐⭐ | ✅ Yes |
| **Local Script** | Free | 1 min | ⭐⭐ | Testing only |
| **UptimeRobot** | Free | 5 min | ⭐⭐⭐⭐ | Alternative |
| **Cron-job.org** | Free | 5 min | ⭐⭐⭐⭐ | Alternative |
| **Paid Plan** | $7/mo | 1 min | ⭐⭐⭐⭐⭐ | Production |

---

## 🚀 Quick Start (GitHub Actions):

```bash
# 1. Push the workflow
cd backend
git add .github/workflows/keep-alive.yml
git commit -m "Add keep-alive workflow"
git push

# 2. Enable GitHub Actions
# Go to: https://github.com/Safe-Mother-Malawi/backend/actions
# Click "Enable workflows"

# 3. Done! Backend will stay awake 24/7
```

---

## 🔍 Troubleshooting:

### Backend Still Sleeping?

**Check GitHub Actions:**
- Go to: https://github.com/Safe-Mother-Malawi/backend/actions
- Verify workflow is running
- Check for errors

**Manual Wake-Up:**
```bash
curl https://safemothermalawi-backend.onrender.com/api/v1/health
```

**Check Render Logs:**
- Go to: https://dashboard.render.com/web/safemothermalawi-backend/logs
- Look for incoming requests every 10 minutes

---

## ✨ Summary:

**Problem:** Backend sleeps after 15 minutes  
**Solution:** Ping it every 10 minutes  
**Best Method:** GitHub Actions (free & automatic)  
**Setup Time:** 2 minutes  
**Cost:** $0  

**Your backend will stay awake 24/7!** 🎉

