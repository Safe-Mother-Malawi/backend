# Supabase Connection Verification - Step by Step

## The Problem
SSL is working (we see `TLSSocket` in logs), but authentication fails: "Tenant or user not found"

This means:
- ✅ SSL connection established
- ❌ Username or password is WRONG

---

## SOLUTION: Get Fresh Credentials from Supabase

### Step 1: Go to Supabase Connection Info

1. Open this exact URL:
   ```
   https://supabase.com/dashboard/project/mlqspibxytehlycjstma/settings/database
   ```

2. Scroll down to **Connection Info** section (NOT Connection String yet)

3. You should see:
   ```
   Host: db.mlqspibxytehlycjstma.supabase.co
   Database name: postgres
   Port: 5432
   User: postgres
   Password: [hidden]
   ```

---

### Step 2: Reset Password and Get Connection String

1. In the same page, scroll to **Database Password** section
2. Click **Reset Database Password**
3. A popup will show your NEW password - **COPY IT NOW!**
4. Save it somewhere safe

---

### Step 3: Get the EXACT Connection String

1. Scroll back up to **Connection string** section
2. Click the **URI** tab
3. You'll see something like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.mlqspibxytehlycjstma.supabase.co:5432/postgres
   ```

4. Click **Show password** (eye icon) to reveal the actual password
5. Copy the ENTIRE connection string

---

### Step 4: Extract Values EXACTLY

From this connection string:
```
postgresql://postgres:[YOUR-PASSWORD]@db.mlqspibxytehlycjstma.supabase.co:5432/postgres
```

Extract:
```
Username: postgres
Password: [YOUR-PASSWORD]
Host: db.mlqspibxytehlycjstma.supabase.co
Port: 5432
Database: postgres
```

**CRITICAL CHECKS:**
- ✅ Username should be EXACTLY: `postgres` (no dots, no project reference)
- ✅ Host should be EXACTLY: `db.mlqspibxytehlycjstma.supabase.co`
- ✅ Port should be EXACTLY: `5432`
- ✅ Database should be EXACTLY: `postgres`
- ✅ Password should be the one you just copied (no spaces before/after)

---

### Step 5: Update Render Variables ONE BY ONE

1. Go to: https://dashboard.render.com/web/safemothermalawi-backend/env

2. For EACH variable, click **Edit** (pencil icon):

   **DB_HOST**
   ```
   db.mlqspibxytehlycjstma.supabase.co
   ```
   Click **Save**

   **DB_PORT**
   ```
   5432
   ```
   Click **Save**

   **DB_USERNAME**
   ```
   postgres
   ```
   Click **Save**

   **DB_PASSWORD**
   ```
   [PASTE THE PASSWORD YOU COPIED - NO SPACES]
   ```
   Click **Save**

   **DB_NAME**
   ```
   postgres
   ```
   Click **Save**

---

### Step 6: Verify in Render

After saving all 5 variables:

1. Click on each variable to expand it
2. Verify the values match EXACTLY what you entered
3. Check for:
   - ❌ Extra spaces before/after
   - ❌ Wrong characters
   - ❌ Incomplete values

---

### Step 7: Manual Redeploy

1. Go to: https://dashboard.render.com/web/safemothermalawi-backend
2. Click **Manual Deploy** button (top right)
3. Select **Deploy latest commit**
4. Click **Deploy**

---

### Step 8: Watch Logs Carefully

1. Go to: https://dashboard.render.com/web/safemothermalawi-backend/logs
2. Watch for these specific messages:

   **GOOD SIGNS:**
   ```
   [Nest] INFO [InstanceLoader] TypeOrmModule dependencies initialized
   [Nest] INFO [TypeOrmModule] Successfully connected to the database
   ```

   **BAD SIGNS:**
   ```
   error: Tenant or user not found
   error: password authentication failed
   error: connection timeout
   ```

---

## Alternative: Test Connection Locally First

If you want to verify credentials work BEFORE updating Render:

1. Open your local `backend/.env` file
2. Temporarily update these values:
   ```env
   DB_HOST=db.mlqspibxytehlycjstma.supabase.co
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=[YOUR NEW PASSWORD]
   DB_NAME=postgres
   ```

3. Run locally:
   ```bash
   cd backend
   npm run start:dev
   ```

4. If it connects successfully locally, the credentials are correct
5. Then update Render with the same values

---

## Common Mistakes to Avoid

### ❌ WRONG Username Formats:
- `postgres.mlqspibxytehlycjstma` (this is for pooler only)
- `postgres@db.mlqspibxytehlycjstma.supabase.co`
- `mlqspibxytehlycjstma`

### ✅ CORRECT Username:
- `postgres`

### ❌ WRONG Hosts:
- `aws-0-ap-southeast-1.pooler.supabase.com` (this is pooler)
- `mlqspibxytehlycjstma.supabase.co`
- `db.supabase.co`

### ✅ CORRECT Host:
- `db.mlqspibxytehlycjstma.supabase.co`

### ❌ WRONG Ports:
- `6543` (this is pooler port)
- `3000`
- `5433`

### ✅ CORRECT Port:
- `5432`

---

## If Still Failing After This

### Check 1: Supabase Project Status
1. Go to: https://supabase.com/dashboard/project/mlqspibxytehlycjstma
2. Check if project shows "Active" (green dot)
3. If "Paused", click "Restore" button

### Check 2: Supabase IP Restrictions
1. Go to: https://supabase.com/dashboard/project/mlqspibxytehlycjstma/settings/database
2. Scroll to **Connection pooling** section
3. Make sure "Restrict connections to specific IP addresses" is DISABLED
4. Or add Render's IP ranges if enabled

### Check 3: Try Pooler Connection Instead
If direct connection keeps failing, try pooler:

1. In Supabase, get the **Transaction mode** connection string
2. Extract:
   ```
   DB_HOST=aws-0-ap-southeast-1.pooler.supabase.com
   DB_PORT=6543
   DB_USERNAME=postgres.mlqspibxytehlycjstma
   DB_PASSWORD=[YOUR PASSWORD]
   DB_NAME=postgres
   ```
3. Update Render with these values

---

## Screenshot Checklist

Take screenshots of:
1. ✅ Supabase connection string (with password visible)
2. ✅ Render environment variables (all 5 database vars)
3. ✅ Render deployment logs (showing the error)

This will help debug if issue persists.

---

## Expected Success Output

When it works, you'll see in Render logs:

```
==> Starting service with 'npm run start:prod'

> backend@0.0.1 start:prod
> node dist/main

[Nest] 80  - 05/04/2026, 3:10:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 80  - 05/04/2026, 3:10:00 AM     LOG [InstanceLoader] ConfigModule dependencies initialized
[Nest] 80  - 05/04/2026, 3:10:00 AM     LOG [InstanceLoader] TypeOrmModule dependencies initialized
[Nest] 80  - 05/04/2026, 3:10:01 AM     LOG [InstanceLoader] TypeOrmCoreModule dependencies initialized
[Nest] 80  - 05/04/2026, 3:10:01 AM     LOG [RoutesResolver] AppController {/api/v1}:
[Nest] 80  - 05/04/2026, 3:10:01 AM     LOG [RouterExplorer] Mapped {/api/v1/health, GET} route
[Nest] 80  - 05/04/2026, 3:10:01 AM     LOG [NestApplication] Nest application successfully started
[Nest] 80  - 05/04/2026, 3:10:01 AM     LOG Application is running on: http://0.0.0.0:10000

==> Listening on port 10000
```

---

## Quick Action Summary

1. **Reset Supabase password** → Copy it
2. **Get connection string** from Supabase → Verify format
3. **Update 5 Render variables** → Double-check each one
4. **Manual redeploy** → Watch logs
5. **Success!** → Test endpoints

**Time needed**: 5-10 minutes if done carefully

Let me know what you see in the logs after following these exact steps!

