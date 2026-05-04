# Database Setup - Simple Guide

## Overview

This application uses **PostgreSQL** with a single environment variable: `DATABASE_URL`

---

## Local Development

Your `.env` file should have:

```env
DATABASE_URL=postgresql://postgres:1234@localhost:5432/safemothermalawi
```

Format: `postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE`

---

## Production (Render)

### Step 1: Create Render PostgreSQL Database

1. Go to: https://dashboard.render.com
2. Click **"New +"** → **"PostgreSQL"**
3. Fill in:
   - **Name**: `safemothermalawi-db`
   - **Database**: `safemothermalawi`
   - **User**: `safemothermalawi_user`
   - **Region**: Same as your web service
   - **Plan**: Free
4. Click **"Create Database"**
5. Wait 2-3 minutes

### Step 2: Get Internal Database URL

1. Click on the database
2. Scroll to **"Connections"** section
3. Copy **"Internal Database URL"**
4. Example: `postgresql://safemothermalawi_user:password@dpg-xxxxx-a/safemothermalawi`

### Step 3: Add to Web Service

1. Go to: https://dashboard.render.com/web/safemothermalawi-backend/env
2. Click **"Add Environment Variable"**
3. Add:
   ```
   Key: DATABASE_URL
   Value: [paste Internal Database URL]
   ```
4. Click **"Save Changes"**

### Step 4: Deploy

1. Go to service main page
2. Click **"Manual Deploy"** → **"Deploy latest commit"**
3. Watch logs for success

---

## Success Indicators

### Logs should show:
```
[Nest] LOG [NestFactory] Starting Nest application...
[Nest] LOG [InstanceLoader] TypeOrmModule dependencies initialized
[Nest] LOG [NestApplication] Nest application successfully started

==> Listening on port 10000
```

### Test endpoints:
```
GET https://safemothermalawi-backend.onrender.com/api/v1/health
→ {"status":"ok"}

GET https://safemothermalawi-backend.onrender.com/api/v1/health-facilities
→ [array of facilities]
```

---

## Troubleshooting

### Error: "DATABASE_URL environment variable is required"
- Make sure `DATABASE_URL` is set in Render environment variables
- Trigger a redeploy after adding it

### Connection fails
- Verify you copied the **Internal** Database URL (not External)
- Check that the database is in the same region as your web service
- Make sure the database is active (not paused)

### Tables not created
- First deployment automatically creates tables (synchronize: true in development)
- Check logs for table creation messages

---

## Database URL Format

```
postgresql://[USERNAME]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]
```

**Local Example:**
```
postgresql://postgres:1234@localhost:5432/safemothermalawi
```

**Render Example:**
```
postgresql://safemothermalawi_user:abc123xyz@dpg-xxxxxxxxxxxxx-a/safemothermalawi
```

---

## That's It!

No complex configuration, no multiple variables, just one `DATABASE_URL`. Simple and clean. 🚀

