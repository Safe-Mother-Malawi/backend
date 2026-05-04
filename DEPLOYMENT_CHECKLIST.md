# Deployment Checklist

## ✅ Pre-Deployment (Completed)
- [x] Backend code ready
- [x] Frontend code ready
- [x] Vercel configuration files created
- [x] Environment variables documented
- [x] Frontend deployed to Vercel
- [x] Backend deployed to Vercel

---

## 🔄 Current Step: Database Setup

### Step 1: Create Supabase Database (5 minutes)

1. [ ] Go to https://supabase.com/dashboard
2. [ ] Click **New Project**
3. [ ] Enter details:
   - Name: `safemothermalawi`
   - Password: (create and save it!)
   - Region: **South Africa (Cape Town)**
4. [ ] Click **Create new project**
5. [ ] Wait for project creation (2-3 minutes)

### Step 2: Get Connection Details (2 minutes)

1. [ ] Go to **Settings** → **Database**
2. [ ] Find **Connection string** section
3. [ ] Select **URI** tab
4. [ ] Copy the connection string
5. [ ] Extract these values:
   - [ ] `DB_HOST` (e.g., `aws-0-us-east-1.pooler.supabase.com`)
   - [ ] `DB_PORT` (usually `6543`)
   - [ ] `DB_USERNAME` (e.g., `postgres.abcdefghijklmnop`)
   - [ ] `DB_PASSWORD` (your password)
   - [ ] `DB_NAME` (usually `postgres`)

---

## 🔄 Next Step: Add Environment Variables to Vercel

### Step 3: Add All 22 Variables (10 minutes)

Go to: https://vercel.com/dashboard → **backend-5fxl** → **Settings** → **Environment Variables**

#### Database Variables (5):
- [ ] `DB_HOST` = (from Supabase)
- [ ] `DB_PORT` = `6543`
- [ ] `DB_USERNAME` = (from Supabase)
- [ ] `DB_PASSWORD` = (from Supabase)
- [ ] `DB_NAME` = `postgres`

#### JWT Variables (4):
- [ ] `JWT_ACCESS_SECRET` = `smm_access_secret_change_in_production`
- [ ] `JWT_REFRESH_SECRET` = `smm_refresh_secret_change_in_production`
- [ ] `JWT_ACCESS_EXPIRES_IN` = `15m`
- [ ] `JWT_REFRESH_EXPIRES_IN` = `7d`

#### Email Variables (6):
- [ ] `EMAIL_HOST` = `smtp.gmail.com`
- [ ] `EMAIL_PORT` = `587`
- [ ] `EMAIL_USER` = (your Gmail address)
- [ ] `EMAIL_PASSWORD` = (your Gmail app password)
- [ ] `EMAIL_FROM` = (your Gmail address)
- [ ] `EMAIL_FROM_NAME` = `Safe Mother Malawi`

#### Twilio Variables (3):
- [ ] `TWILIO_ACCOUNT_SID` = (from your Twilio console)
- [ ] `TWILIO_AUTH_TOKEN` = (from your Twilio console)
- [ ] `TWILIO_PHONE_NUMBER` = (from your Twilio console)

#### URL Variables (3):
- [ ] `PUBLIC_URL` = `https://wisdom-thermal-gradation.ngrok-free.dev`
- [ ] `BACKEND_URL` = `https://backend-5fxl.vercel.app`
- [ ] `FRONTEND_URL` = `https://safe-mother-malawi-xt8u.vercel.app`

#### System Variables (1):
- [ ] `NODE_ENV` = `production`

**Important**: For each variable, select **Production**, **Preview**, and **Development**

---

## 🔄 Step 4: Redeploy Backend

1. [ ] Go to **Deployments** tab
2. [ ] Click on latest deployment
3. [ ] Click **Redeploy**
4. [ ] Wait for deployment (2-3 minutes)
5. [ ] Check logs for errors

---

## 🔄 Step 5: Test Deployment

### Backend Tests:
- [ ] Health check: https://backend-5fxl.vercel.app/api/v1/health
  - Should return: `{"status":"ok",...}`
- [ ] Root endpoint: https://backend-5fxl.vercel.app/api/v1
  - Should return: `"Hello World!"`
- [ ] Districts: https://backend-5fxl.vercel.app/api/v1/health-facilities/districts
  - Should return: Array of districts

### Frontend Tests:
- [ ] Open: https://safe-mother-malawi-xt8u.vercel.app
- [ ] Check if page loads
- [ ] Try to login/signup
- [ ] Check browser console for errors

---

## 🔄 Step 6: Verify Database

1. [ ] Go to Supabase Dashboard → **Table Editor**
2. [ ] Check if tables were created:
   - [ ] `users`
   - [ ] `health_facilities`
   - [ ] `patients`
   - [ ] `appointments`
   - [ ] `alerts`
   - [ ] Other tables...
3. [ ] If tables missing, check backend deployment logs

---

## 🔄 Step 7: Seed Initial Data

1. [ ] Check if health facilities are seeded
2. [ ] Check if WHO questions are seeded
3. [ ] If not, may need to run seed manually

---

## 🔄 Step 8: Update Frontend for Production

1. [ ] Open: `safe-mother-malawi/safemothermalawi_frontend/lib/config/api_config.dart`
2. [ ] Change: `static const bool isProduction = false;`
3. [ ] To: `static const bool isProduction = true;`
4. [ ] Commit and push
5. [ ] Vercel will auto-deploy

---

## 🔄 Step 9: Final Testing

### Test Complete User Flow:
- [ ] User registration (prenatal)
- [ ] User registration (neonatal)
- [ ] User login
- [ ] Password reset (email)
- [ ] Health facilities loading
- [ ] Patient dashboard
- [ ] Appointments
- [ ] Alerts/notifications

### Test Admin Features:
- [ ] Admin login
- [ ] View analytics
- [ ] View reports
- [ ] Manage users

---

## 📊 Deployment Status

### Current URLs:
- **Frontend**: https://safe-mother-malawi-xt8u.vercel.app
- **Backend**: https://backend-5fxl.vercel.app
- **Backend API**: https://backend-5fxl.vercel.app/api/v1

### Services Status:
- [ ] Frontend: Deployed ✅
- [ ] Backend: Deployed ⏳ (needs env vars)
- [ ] Database: Not set up ⏳
- [ ] Email: Configured ✅
- [ ] Twilio: Configured ✅

---

## 🚨 Troubleshooting

### If Backend Fails:
1. Check Vercel deployment logs
2. Verify all environment variables are set
3. Check database connection
4. Look for TypeORM errors

### If Frontend Can't Connect:
1. Check browser console
2. Verify API URL is correct
3. Check CORS settings in backend
4. Test backend endpoints directly

### If Database Connection Fails:
1. Verify Supabase credentials
2. Check if using pooler connection (port 6543)
3. Verify SSL settings
4. Check Supabase project is active

---

## 📝 Notes

- Supabase free tier: 500 MB database, 5 GB bandwidth
- Vercel free tier: 100 GB bandwidth, unlimited deployments
- Remember to monitor usage
- Set up monitoring/alerts for production

---

## ✅ Completion Criteria

Deployment is complete when:
- [ ] All environment variables added
- [ ] Backend deploys successfully
- [ ] Database connected and tables created
- [ ] Frontend can communicate with backend
- [ ] User can register and login
- [ ] Health facilities load correctly
- [ ] Email sending works
- [ ] Mobile app can connect (optional)

---

## 🎉 Post-Deployment

After successful deployment:
1. [ ] Document production URLs
2. [ ] Set up monitoring (Vercel Analytics)
3. [ ] Configure custom domain (optional)
4. [ ] Set up backup strategy
5. [ ] Plan for scaling
6. [ ] Monitor error logs
7. [ ] Set up CI/CD pipeline (optional)

---

**Current Priority**: Complete Step 1 (Create Supabase Database)
