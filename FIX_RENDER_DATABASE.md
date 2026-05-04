# Fix Render Database Connection Error

## Current Error
```
error: Tenant or user not found
```

This is a Supabase PostgreSQL authentication error. The database credentials are incorrect.

---

## Solution: Reset Supabase Password & Update Render

### Step 1: Reset Supabase Database Password

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project: **safemothermalawi**
3. Click **Settings** (gear icon) in the left sidebar
4. Click **Database** in the settings menu
5. Scroll down to **Database Password** section
6. Click **Reset Database Password**
7. **COPY THE NEW PASSWORD** - you won't see it again!

---

### Step 2: Get Correct Connection Details

In the same Database settings page, scroll to **Connection string** section.

#### For Render (Use Direct Connection):
- Select **Session mode** tab (NOT Transaction mode)
- You'll see something like:
  ```
  postgresql://postgres:[YOUR-PASSWORD]@db.mlqspibxytehlycjstma.supabase.co:5432/postgres
  ```

#### Extract These Values:
```
DB_HOST=db.mlqspibxytehlycjstma.supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=[THE PASSWORD YOU JUST COPIED]
DB_NAME=postgres
```

**Important Notes:**
- ✅ Use **port 5432** (direct connection) for Render
- ✅ Username is just **postgres** (no project reference)
- ✅ Host is **db.mlqspibxytehlycjstma.supabase.co**
- ❌ Don't use pooler (port 6543) - that's for serverless only

---

### Step 3: Update Render Environment Variables

1. Go to **Render Dashboard**: https://dashboard.render.com
2. Click on your service: **safemothermalawi-backend**
3. Click **Environment** in the left sidebar
4. Update these 5 variables:

```
DB_HOST=db.mlqspibxytehlycjstma.supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=[YOUR NEW PASSWORD FROM STEP 1]
DB_NAME=postgres
```

**How to Update:**
- Click the **Edit** button (pencil icon) next to each variable
- Paste the new value
- Click **Save Changes**

---

### Step 4: Trigger Redeploy

After updating all 5 database variables:

1. Render will automatically redeploy (wait 2-3 minutes)
2. OR manually trigger: Click **Manual Deploy** → **Deploy latest commit**

---

### Step 5: Check Deployment Logs

1. In Render dashboard, click **Logs** tab
2. Watch for successful database connection:
   ```
   [Nest] INFO [TypeOrmModule] Successfully connected to the database
   ```
3. If you see this, deployment is successful! ✅

---

### Step 6: Test Your Backend

Once deployed, test these endpoints:

1. **Health Check**:
   ```
   https://safemothermalawi-backend.onrender.com/api/v1/health
   ```
   Should return: `{"status":"ok"}`

2. **Health Facilities**:
   ```
   https://safemothermalawi-backend.onrender.com/api/v1/health-facilities
   ```
   Should return list of facilities

3. **Auth Register** (POST):
   ```
   https://safemothermalawi-backend.onrender.com/api/v1/auth/register
   ```

---

## Why This Happened

The error "Tenant or user not found" means:
- ❌ Wrong database password
- ❌ Wrong username format
- ❌ Wrong host/port combination
- ❌ Database credentials expired

Common mistakes:
- Using pooler connection (port 6543) instead of direct (port 5432)
- Including project reference in username (should be just `postgres`)
- Old/expired password

---

## Correct Configuration Summary

### For Render (Direct Connection):
```env
DB_HOST=db.mlqspibxytehlycjstma.supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_actual_password
DB_NAME=postgres
```

### For Vercel/Serverless (Pooler Connection):
```env
DB_HOST=aws-0-ap-southeast-1.pooler.supabase.com
DB_PORT=6543
DB_USERNAME=postgres.mlqspibxytehlycjstma
DB_PASSWORD=your_actual_password
DB_NAME=postgres
```

**Key Difference**: Render uses direct connection, Vercel uses pooler!

---

## Troubleshooting

### Still Getting "Tenant or user not found"?

1. **Double-check password**: Copy it again from Supabase
2. **Check for spaces**: Make sure no extra spaces in Render variables
3. **Verify host**: Should be `db.mlqspibxytehlycjstma.supabase.co`
4. **Verify port**: Should be `5432` (not 6543)
5. **Verify username**: Should be `postgres` (not `postgres.mlqspibxytehlycjstma`)

### Connection Timeout?

1. Check if Supabase project is active (not paused)
2. Verify region is correct
3. Check Render service logs for more details

### Tables Not Created?

1. First deployment with `synchronize: false` won't create tables
2. Check `app.module.ts` - should have `synchronize: true` for first deploy
3. Or manually run migrations in Supabase SQL Editor

---

## Next Steps After Fix

1. ✅ Backend deployed successfully
2. ✅ Database connected
3. ✅ Tables created automatically
4. ✅ Health facilities seeded
5. ✅ Test all endpoints
6. ✅ Update mobile app to use production URL
7. ✅ Test full registration flow

---

## Quick Reference

### Supabase Dashboard:
- **Project**: https://supabase.com/dashboard/project/mlqspibxytehlycjstma
- **Database Settings**: https://supabase.com/dashboard/project/mlqspibxytehlycjstma/settings/database

### Render Dashboard:
- **Service**: https://dashboard.render.com/web/safemothermalawi-backend
- **Environment**: https://dashboard.render.com/web/safemothermalawi-backend/env
- **Logs**: https://dashboard.render.com/web/safemothermalawi-backend/logs

### Your Backend URL:
```
https://safemothermalawi-backend.onrender.com
```

---

## Support

If you still have issues after following these steps:
1. Check Render logs for specific error messages
2. Verify Supabase project is active
3. Try resetting password again
4. Contact Render support: https://render.com/support

