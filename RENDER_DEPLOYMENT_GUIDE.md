# Deploy to Render - Complete Guide

## Step 1: Sign Up for Render

1. Go to https://render.com
2. Click **Get Started**
3. Sign up with your **GitHub** account
4. Authorize Render to access your repositories

---

## Step 2: Create New Web Service

1. Click **New +** button (top right)
2. Select **Web Service**
3. Click **Connect a repository**
4. Find and select: **Safe-Mother-Malawi/backend**
5. Click **Connect**

---

## Step 3: Configure Web Service

Fill in these settings:

### Basic Settings:
- **Name**: `safemothermalawi-backend`
- **Region**: Choose closest to you (e.g., Oregon, Frankfurt, Singapore)
- **Branch**: `main`
- **Root Directory**: Leave empty (or `.`)
- **Environment**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start:prod`

### Plan:
- Select **Free** (0$/month)

---

## Step 4: Add Environment Variables

Click **Advanced** → **Add Environment Variable**

Add all 22 variables:

### Database (Supabase):
```
DB_HOST=aws-0-ap-southeast-1.pooler.supabase.com
DB_PORT=6543
DB_USERNAME=postgres.mlqspibxytehlycjstma
DB_PASSWORD=YOUR_SUPABASE_PASSWORD
DB_NAME=postgres
```

### JWT:
```
JWT_ACCESS_SECRET=smm_access_secret_change_in_production
JWT_REFRESH_SECRET=smm_refresh_secret_change_in_production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### Email (Gmail):
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=YOUR_GMAIL_ADDRESS
EMAIL_PASSWORD=YOUR_GMAIL_APP_PASSWORD
EMAIL_FROM=YOUR_GMAIL_ADDRESS
EMAIL_FROM_NAME=Safe Mother Malawi
```

**Get Gmail App Password**: https://myaccount.google.com/apppasswords

### Twilio:
```
TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER=YOUR_TWILIO_PHONE_NUMBER
```

**Get these from**: https://console.twilio.com

### URLs (update after deployment):
```
PUBLIC_URL=https://wisdom-thermal-gradation.ngrok-free.dev
BACKEND_URL=https://safemothermalawi-backend.onrender.com
FRONTEND_URL=https://safe-mother-malawi-xt8u.vercel.app
```

### System:
```
NODE_ENV=production
```

---

## Step 5: Deploy

1. Click **Create Web Service**
2. Wait 5-10 minutes for first deployment
3. Watch the logs for any errors

---

## Step 6: Get Your Backend URL

Once deployed, your backend will be at:

**https://safemothermalawi-backend.onrender.com**

Test it:
- Health: `https://safemothermalawi-backend.onrender.com/api/v1/health`
- Root: `https://safemothermalawi-backend.onrender.com/api/v1`

---

## Step 7: Update Frontend

Update your frontend to use the new backend URL:

1. Open `safe-mother-malawi/safemothermalawi_frontend/lib/config/api_config.dart`
2. Change `prodBaseUrl` to:
   ```dart
   static const String prodBaseUrl = 'https://safemothermalawi-backend.onrender.com/api/v1';
   ```
3. Commit and push

---

## Render Free Tier Limits

- **750 hours/month** of runtime
- **Automatic sleep** after 15 minutes of inactivity
- **Cold starts** (takes 30-60 seconds to wake up)
- **100 GB bandwidth/month**

Perfect for development and small production apps!

---

## Troubleshooting

### Build Fails:
- Check build logs in Render dashboard
- Verify `package.json` has correct scripts
- Make sure all dependencies are in `package.json`

### App Crashes:
- Check runtime logs
- Verify environment variables are set
- Check database connection

### Database Connection Fails:
- Verify Supabase credentials
- Check if using pooler connection (port 6543)
- Ensure Supabase project is active

---

## Advantages of Render over Vercel

✅ **No serverless complexity** - runs like a normal Node.js app
✅ **Better for NestJS** - designed for long-running processes
✅ **Free PostgreSQL** - can add Render's own database
✅ **Persistent storage** - unlike serverless
✅ **WebSocket support** - works out of the box
✅ **Simpler configuration** - no special setup needed

---

## Next Steps

1. ✅ Deploy backend to Render
2. ✅ Test all endpoints
3. ✅ Update frontend with new backend URL
4. ✅ Test full application flow
5. ✅ Monitor logs for any issues

---

## Support

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **Status Page**: https://status.render.com
