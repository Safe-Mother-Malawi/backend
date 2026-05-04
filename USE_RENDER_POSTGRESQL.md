# Use Render PostgreSQL Database (RECOMMENDED)

## Why Switch to Render PostgreSQL?

After multiple attempts with Supabase, the password authentication keeps failing. **Render PostgreSQL** is:
- ✅ **Easier** - No password issues
- ✅ **Faster** - Same infrastructure as your backend
- ✅ **Free** - Free tier available
- ✅ **Reliable** - Better integration with Render services
- ✅ **Automatic** - Internal connection URL works immediately

---

## Step-by-Step Setup (10 minutes)

### Step 1: Create Render PostgreSQL Database

1. Go to: **https://dashboard.render.com**
2. Click **"New +"** button (top right corner)
3. Select **"PostgreSQL"**

### Step 2: Configure Database

Fill in these details:

| Field | Value |
|-------|-------|
| **Name** | `safemothermalawi-db` |
| **Database** | `safemothermalawi` |
| **User** | `safemothermalawi_user` |
| **Region** | **Same as your web service** (check web service first) |
| **PostgreSQL Version** | 16 (or latest) |
| **Datadog API Key** | Leave empty |
| **Plan** | **Free** |

4. Click **"Create Database"**
5. Wait 2-3 minutes for database creation

---

### Step 3: Get Internal Database URL

1. Once created, you'll be on the database dashboard
2. Scroll down to **"Connections"** section
3. Find **"Internal Database URL"**
4. Click the **copy icon** (📋) next to it
5. The URL will look like:
   ```
   postgresql://safemothermalawi_user:LONG_RANDOM_PASSWORD@dpg-xxxxxxxxxxxxx-a/safemothermalawi
   ```

**Important**: Use the **Internal Database URL**, NOT the External one!

---

### Step 4: Update Web Service Environment Variables

1. Go to your web service: **https://dashboard.render.com/web/safemothermalawi-backend**
2. Click **"Environment"** in the left sidebar
3. You have two options:

#### Option A: Add DATABASE_URL (Recommended)

Click **"Add Environment Variable"**:
```
Key: DATABASE_URL
Value: [paste the Internal Database URL you copied]
```

Click **"Save Changes"**

#### Option B: Update Individual Variables

Update these 5 existing variables:

Extract from your Internal Database URL:
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

Update:
```
DB_HOST=[HOST from URL]
DB_PORT=5432
DB_USERNAME=[USER from URL]
DB_PASSWORD=[PASSWORD from URL]
DB_NAME=[DATABASE from URL]
```

**Option A is simpler!**

---

### Step 5: Trigger Redeploy

1. Go to: **https://dashboard.render.com/web/safemothermalawi-backend**
2. Click **"Manual Deploy"** button (top right)
3. Select **"Deploy latest commit"**
4. Click **"Deploy"**

---

### Step 6: Watch Deployment Logs

1. Click **"Logs"** tab
2. Watch for successful database connection:

**Success looks like:**
```
[Nest] 62  - 05/04/2026, 3:40:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 62  - 05/04/2026, 3:40:00 AM     LOG [InstanceLoader] TypeOrmModule dependencies initialized
[Nest] 62  - 05/04/2026, 3:40:01 AM     LOG [InstanceLoader] TypeOrmCoreModule dependencies initialized
[Nest] 62  - 05/04/2026, 3:40:01 AM     LOG [RoutesResolver] AppController {/api/v1}:
[Nest] 62  - 05/04/2026, 3:40:01 AM     LOG [NestApplication] Nest application successfully started

==> Listening on port 10000
```

**No database errors!** ✅

---

### Step 7: Test Your Backend

Once deployed successfully, test these endpoints:

1. **Health Check**:
   ```
   https://safemothermalawi-backend.onrender.com/api/v1/health
   ```
   Expected: `{"status":"ok"}`

2. **Health Facilities**:
   ```
   https://safemothermalawi-backend.onrender.com/api/v1/health-facilities
   ```
   Expected: Array of health facilities

---

## What Changed in the Code?

I updated `app.module.ts` to support `DATABASE_URL`:

```typescript
// Now supports both:
// 1. DATABASE_URL (Render PostgreSQL) - preferred
// 2. Individual DB_* variables (local development)

if (DATABASE_URL exists) {
  use DATABASE_URL
} else {
  use DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME
}
```

This means:
- ✅ **Production (Render)**: Uses `DATABASE_URL`
- ✅ **Local Development**: Uses individual `DB_*` variables from `.env`

---

## Advantages of Render PostgreSQL

| Feature | Render PostgreSQL | Supabase |
|---------|-------------------|----------|
| **Setup Time** | 5 minutes | 15+ minutes |
| **Connection** | Internal URL (fast) | External (slower) |
| **Password Issues** | None | Multiple attempts failed |
| **Integration** | Native Render | External service |
| **Free Tier** | 1 GB storage | 500 MB storage |
| **Backups** | Automatic | Manual setup |
| **Region** | Same as backend | May be different |

---

## Render PostgreSQL Free Tier

- **Storage**: 1 GB
- **Bandwidth**: Unlimited (internal)
- **Connections**: 97 concurrent
- **Backups**: 7 days retention
- **Expires**: Never (as long as you use it)

Perfect for your application!

---

## Troubleshooting

### Database Creation Fails?
- Check if you have too many free databases (limit: 1)
- Try a different region
- Contact Render support

### Still Getting Connection Errors?
- Verify you copied the **Internal Database URL** (not External)
- Check that `DATABASE_URL` environment variable is set
- Make sure you triggered a redeploy after adding the variable
- Check logs for specific error messages

### Tables Not Created?
- First deployment will auto-create tables (synchronize: true)
- Check logs for table creation messages
- If needed, manually run migrations

---

## Next Steps After Success

1. ✅ Backend deployed and connected to database
2. ✅ Tables created automatically
3. ✅ Health facilities seeded
4. Update mobile app API URL to production
5. Test full registration flow
6. Test password reset flow
7. Monitor logs for any issues

---

## Quick Reference

### Render Dashboard Links:
- **Database**: https://dashboard.render.com (find your PostgreSQL database)
- **Web Service**: https://dashboard.render.com/web/safemothermalawi-backend
- **Environment Variables**: https://dashboard.render.com/web/safemothermalawi-backend/env
- **Logs**: https://dashboard.render.com/web/safemothermalawi-backend/logs

### Your Backend URL:
```
https://safemothermalawi-backend.onrender.com
```

### Test Endpoints:
```
GET https://safemothermalawi-backend.onrender.com/api/v1/health
GET https://safemothermalawi-backend.onrender.com/api/v1/health-facilities
POST https://safemothermalawi-backend.onrender.com/api/v1/auth/register
```

---

## Summary

**What to do:**
1. Create Render PostgreSQL database (5 min)
2. Copy Internal Database URL
3. Add `DATABASE_URL` environment variable to web service
4. Redeploy
5. Test endpoints
6. Success! 🎉

**Total time**: ~10 minutes

This will work immediately - no more password issues!

