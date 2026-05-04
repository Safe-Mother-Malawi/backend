# 🚨 FINAL FIX GUIDE - Render Database Connection

## Current Situation
- ✅ SSL is working (we see `TLSSocket` in logs)
- ❌ Authentication failing: "Tenant or user not found"
- ✅ Code is correct (SSL support added)
- ❌ Database credentials in Render are WRONG

---

## OPTION 1: Test Credentials Locally First (RECOMMENDED)

This ensures credentials work BEFORE updating Render.

### Step 1: Install pg package (if not already)
```bash
cd backend
npm install pg
```

### Step 2: Get Fresh Supabase Password

1. Go to: https://supabase.com/dashboard/project/mlqspibxytehlycjstma/settings/database
2. Scroll to **Database Password** section
3. Click **Reset Database Password**
4. **COPY THE PASSWORD** (you won't see it again!)

### Step 3: Edit test-db-connection.js

Open `backend/test-db-connection.js` and update line 19:
```javascript
password: 'YOUR_PASSWORD_HERE', // ← PUT YOUR ACTUAL PASSWORD HERE
```

Replace `YOUR_PASSWORD_HERE` with the password you just copied.

### Step 4: Run the Test Script

```bash
node test-db-connection.js
```

### Step 5: Check Results

**If SUCCESSFUL:**
```
✅ Successfully connected to database!
✅ Query successful!
🎉 CONNECTION TEST SUCCESSFUL!
```

→ **Copy the exact values shown and use them in Render**

**If FAILED:**
```
❌ CONNECTION FAILED!
🔴 ERROR: "Tenant or user not found"
```

→ **Follow the instructions shown in the error message**

---

## OPTION 2: Update Render Directly (FASTER)

If you're confident in your credentials:

### Step 1: Get Connection String from Supabase

1. Go to: https://supabase.com/dashboard/project/mlqspibxytehlycjstma/settings/database
2. Scroll to **Connection string** section
3. Click **URI** tab
4. Click the **eye icon** to show password
5. You'll see:
   ```
   postgresql://postgres:[PASSWORD]@db.mlqspibxytehlycjstma.supabase.co:5432/postgres
   ```
6. **COPY THE ENTIRE STRING**

### Step 2: Extract Values

From the connection string, extract:

| Variable | Value |
|----------|-------|
| DB_HOST | `db.mlqspibxytehlycjstma.supabase.co` |
| DB_PORT | `5432` |
| DB_USERNAME | `postgres` |
| DB_PASSWORD | `[the password from the string]` |
| DB_NAME | `postgres` |

### Step 3: Update Render

1. Go to: https://dashboard.render.com/web/safemothermalawi-backend/env
2. Click **Edit** on each variable
3. Paste the EXACT value
4. Click **Save**
5. Repeat for all 5 variables

### Step 4: Manual Redeploy

1. Go to: https://dashboard.render.com/web/safemothermalawi-backend
2. Click **Manual Deploy** → **Deploy latest commit**
3. Watch logs: https://dashboard.render.com/web/safemothermalawi-backend/logs

---

## OPTION 3: Try Pooler Connection (IF DIRECT FAILS)

Some Supabase projects work better with pooler connection.

### Step 1: Get Pooler Connection String

1. Go to: https://supabase.com/dashboard/project/mlqspibxytehlycjstma/settings/database
2. Scroll to **Connection string** section
3. Click **Transaction mode** tab (NOT URI)
4. Click eye icon to show password
5. You'll see:
   ```
   postgresql://postgres.mlqspibxytehlycjstma:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```

### Step 2: Extract Pooler Values

| Variable | Value |
|----------|-------|
| DB_HOST | `aws-0-ap-southeast-1.pooler.supabase.com` |
| DB_PORT | `6543` |
| DB_USERNAME | `postgres.mlqspibxytehlycjstma` |
| DB_PASSWORD | `[the password from the string]` |
| DB_NAME | `postgres` |

**Note the differences:**
- Port is `6543` (not 5432)
- Username includes project reference: `postgres.mlqspibxytehlycjstma`
- Host is pooler URL

### Step 3: Update Render with Pooler Values

Update all 5 variables in Render with the pooler values above.

---

## Troubleshooting Checklist

### ✅ Verify These in Render

Go to: https://dashboard.render.com/web/safemothermalawi-backend/env

Click on each variable to expand and verify:

**DB_HOST**
- ✅ Should be: `db.mlqspibxytehlycjstma.supabase.co`
- ❌ NOT: `localhost`, `aws-0-...pooler...`, or anything else

**DB_PORT**
- ✅ Should be: `5432`
- ❌ NOT: `6543`, `3000`, `3001`, or anything else

**DB_USERNAME**
- ✅ Should be: `postgres`
- ❌ NOT: `postgres.mlqspibxytehlycjstma` (that's for pooler only)

**DB_PASSWORD**
- ✅ Should be: Your actual Supabase password
- ❌ Check for: Extra spaces, wrong characters, incomplete password

**DB_NAME**
- ✅ Should be: `postgres`
- ❌ NOT: `safemothermalawi` or anything else

### ✅ Verify Supabase Project Status

1. Go to: https://supabase.com/dashboard/project/mlqspibxytehlycjstma
2. Check project status (top of page)
3. Should show: **Active** (green)
4. If **Paused**: Click **Restore** button

### ✅ Check for IP Restrictions

1. Go to: https://supabase.com/dashboard/project/mlqspibxytehlycjstma/settings/database
2. Scroll to **Network Restrictions** or **Connection pooling**
3. Make sure "Restrict to specific IPs" is **DISABLED**
4. Or add Render's IP ranges if you want restrictions

---

## What Success Looks Like

### In Render Logs:
```
[Nest] 80  - 05/04/2026, 3:15:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 80  - 05/04/2026, 3:15:00 AM     LOG [InstanceLoader] TypeOrmModule dependencies initialized
[Nest] 80  - 05/04/2026, 3:15:01 AM     LOG [InstanceLoader] TypeOrmCoreModule dependencies initialized
[Nest] 80  - 05/04/2026, 3:15:01 AM     LOG [NestApplication] Nest application successfully started

==> Listening on port 10000
```

### Test Endpoints:
```
https://safemothermalawi-backend.onrender.com/api/v1/health
→ {"status":"ok"}

https://safemothermalawi-backend.onrender.com/api/v1/health-facilities
→ [array of facilities]
```

---

## Still Not Working?

### Last Resort Options:

#### 1. Create New Supabase Project
If the current project has issues:
1. Create new Supabase project
2. Get fresh credentials
3. Update Render
4. Should work immediately

#### 2. Use Render's PostgreSQL
Instead of Supabase:
1. In Render dashboard, click **New +** → **PostgreSQL**
2. Create free database
3. Copy connection details
4. Update environment variables
5. Redeploy

#### 3. Check Supabase Status
- Status page: https://status.supabase.com
- Check if there are any ongoing issues

---

## Summary of All Options

| Option | Time | Reliability | Recommended For |
|--------|------|-------------|-----------------|
| **Option 1: Test Locally** | 10 min | ⭐⭐⭐⭐⭐ | Everyone (safest) |
| **Option 2: Direct Update** | 5 min | ⭐⭐⭐⭐ | If confident |
| **Option 3: Try Pooler** | 5 min | ⭐⭐⭐ | If direct fails |

---

## My Recommendation

**Do Option 1 (Test Locally First):**

1. Reset Supabase password
2. Edit `test-db-connection.js` with new password
3. Run `node test-db-connection.js`
4. If successful, copy the exact values to Render
5. Redeploy

This guarantees the credentials work before updating Render.

---

## Need Help?

If you've tried everything and it still doesn't work:

1. **Take screenshots of:**
   - Supabase connection string (with password visible)
   - Render environment variables (all 5 DB vars)
   - Render deployment logs (the error)
   - Output of `test-db-connection.js`

2. **Check:**
   - Is Supabase project active?
   - Are there any typos in Render variables?
   - Did you save changes in Render?
   - Did you trigger a redeploy?

3. **Try:**
   - Creating a new Supabase project
   - Using Render's own PostgreSQL
   - Deploying to a different platform (Railway, Fly.io)

---

## Quick Links

- **Supabase Dashboard**: https://supabase.com/dashboard/project/mlqspibxytehlycjstma
- **Supabase Database Settings**: https://supabase.com/dashboard/project/mlqspibxytehlycjstma/settings/database
- **Render Service**: https://dashboard.render.com/web/safemothermalawi-backend
- **Render Environment**: https://dashboard.render.com/web/safemothermalawi-backend/env
- **Render Logs**: https://dashboard.render.com/web/safemothermalawi-backend/logs

---

Let's get this working! Start with **Option 1** (test locally) - it's the most reliable way.

