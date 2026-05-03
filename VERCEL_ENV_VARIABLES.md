# Vercel Environment Variables Setup

## How to Add Environment Variables in Vercel:

1. Go to https://vercel.com/dashboard
2. Click on your backend project (backend-5fxl)
3. Go to **Settings** → **Environment Variables**
4. Add each variable below
5. Select **Production**, **Preview**, and **Development** for each
6. Click **Save**

---

## Required Environment Variables:

### Database Configuration
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=1234
DB_NAME=safemothermalawi
```

**⚠️ IMPORTANT**: You need to replace `localhost` with a real database host.

**Recommended Database Providers:**
- **Supabase** (Free): https://supabase.com → Create project → Get connection string
- **Neon** (Free): https://neon.tech → Create project → Get connection string
- **Railway** (Free): https://railway.app → New PostgreSQL → Get connection string

---

### JWT Secrets
```
JWT_ACCESS_SECRET=smm_access_secret_change_in_production
JWT_REFRESH_SECRET=smm_refresh_secret_change_in_production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

---

### Email Configuration (Gmail)
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=YOUR_GMAIL_ADDRESS
EMAIL_PASSWORD=YOUR_GMAIL_APP_PASSWORD
EMAIL_FROM=YOUR_GMAIL_ADDRESS
EMAIL_FROM_NAME=Safe Mother Malawi
```

**Note**: Generate Gmail App Password at https://myaccount.google.com/apppasswords

---

### Twilio Configuration
```
TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER=YOUR_TWILIO_PHONE_NUMBER
```

**Note**: Get these from your Twilio console at https://console.twilio.com

---

### Application URLs
```
PUBLIC_URL=https://wisdom-thermal-gradation.ngrok-free.dev
BACKEND_URL=https://backend-5fxl.vercel.app
FRONTEND_URL=https://your-frontend-url.vercel.app
```

**Note**: Update `BACKEND_URL` and `FRONTEND_URL` with your actual Vercel URLs after deployment.

---

### System Configuration
```
NODE_ENV=production
```

**Note**: `PORT` is automatically set by Vercel, don't add it manually.

---

## Quick Setup with Supabase (Recommended):

1. Go to https://supabase.com/dashboard
2. Click **New Project**
3. Fill in:
   - Name: `safemothermalawi`
   - Database Password: (create a strong password)
   - Region: Choose closest to your users
4. Wait for project to be created (2-3 minutes)
5. Go to **Settings** → **Database**
6. Copy the connection string (URI format)
7. Parse it to get:
   - `DB_HOST`: The host part (e.g., `db.xxxxx.supabase.co`)
   - `DB_PORT`: `5432`
   - `DB_USERNAME`: `postgres`
   - `DB_PASSWORD`: Your password
   - `DB_NAME`: `postgres`

---

## After Adding Variables:

1. Vercel will automatically redeploy
2. Check deployment logs for any errors
3. Test your API endpoints
4. Update frontend API URL to point to your Vercel backend URL

---

## Testing Your Deployment:

Once deployed, test these endpoints:

- Health check: `https://backend-5fxl.vercel.app/api/v1/health`
- Root: `https://backend-5fxl.vercel.app/api/v1`
- Login: `https://backend-5fxl.vercel.app/api/v1/auth/login`
