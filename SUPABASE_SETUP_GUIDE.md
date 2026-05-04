# Supabase Database Setup Guide

## Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **New Project**
3. Fill in the details:
   - **Name**: `safemothermalawi`
   - **Database Password**: Create a strong password (SAVE THIS!)
   - **Region**: Choose **South Africa (Cape Town)** (closest to Malawi)
   - **Pricing Plan**: Free
4. Click **Create new project**
5. Wait 2-3 minutes for the project to be created

---

## Step 2: Get Database Connection Details

1. Once the project is ready, go to **Settings** (gear icon in sidebar)
2. Click **Database** in the left menu
3. Scroll down to **Connection string**
4. Select **URI** tab
5. You'll see something like:
   ```
   postgresql://postgres.xxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

---

## Step 3: Extract Connection Details

From the connection string, extract these values:

### Example Connection String:
```
postgresql://postgres.abcdefghijklmnop:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### Extract to:
```
DB_HOST=aws-0-us-east-1.pooler.supabase.com
DB_PORT=6543
DB_USERNAME=postgres.abcdefghijklmnop
DB_PASSWORD=[YOUR-PASSWORD]
DB_NAME=postgres
```

**Important Notes:**
- The username includes the project reference (e.g., `postgres.abcdefghijklmnop`)
- Port is usually `6543` for pooler connection (recommended for serverless)
- Database name is `postgres` (default)
- Replace `[YOUR-PASSWORD]` with the password you created

---

## Step 4: Alternative - Direct Connection (Not Recommended for Vercel)

If you need direct connection (not pooler):

1. In Supabase Dashboard → Settings → Database
2. Look for **Connection string** → **Session mode**
3. Port will be `5432`
4. Username will be just `postgres`

**Use Pooler (port 6543) for Vercel deployment!**

---

## Step 5: Add to Vercel Environment Variables

Go to Vercel Dashboard → backend-5fxl → Settings → Environment Variables

Add these 5 variables with your Supabase values:

```
DB_HOST=aws-0-us-east-1.pooler.supabase.com
DB_PORT=6543
DB_USERNAME=postgres.abcdefghijklmnop
DB_PASSWORD=your_actual_password_here
DB_NAME=postgres
```

---

## Step 6: Enable Required Extensions (Optional)

If your app needs specific PostgreSQL extensions:

1. In Supabase Dashboard, go to **Database** → **Extensions**
2. Search and enable:
   - `uuid-ossp` (for UUID generation)
   - `pgcrypto` (for encryption)
   - Any others your app needs

---

## Step 7: Test Connection

After adding variables to Vercel:

1. Redeploy your backend
2. Check deployment logs for database connection
3. Test endpoint: `https://backend-5fxl.vercel.app/api/v1/health`

---

## Step 8: Run Migrations (If Needed)

Your NestJS app with TypeORM should automatically create tables on first run.

If you need to manually run migrations:

1. In Supabase Dashboard → **SQL Editor**
2. Run your migration SQL scripts
3. Or let TypeORM handle it with `synchronize: true` (development only)

---

## Troubleshooting

### Connection Timeout
- Make sure you're using the **pooler** connection (port 6543)
- Check that Supabase project is active (not paused)

### Authentication Failed
- Verify password is correct
- Check username includes project reference
- Make sure no extra spaces in environment variables

### SSL Required Error
Add to your TypeORM config in `app.module.ts`:
```typescript
ssl: {
  rejectUnauthorized: false
}
```

---

## Security Best Practices

1. **Never commit passwords** to git
2. **Use strong passwords** for database
3. **Enable Row Level Security (RLS)** in Supabase for sensitive tables
4. **Rotate passwords** periodically
5. **Use environment variables** for all credentials

---

## Supabase Free Tier Limits

- **Database**: 500 MB
- **Bandwidth**: 5 GB
- **API Requests**: Unlimited
- **Auth Users**: Unlimited
- **Storage**: 1 GB

Perfect for development and small production apps!

---

## Quick Reference

### Supabase Dashboard URLs:
- **Main Dashboard**: https://supabase.com/dashboard
- **Your Project**: https://supabase.com/dashboard/project/[PROJECT-ID]
- **Database Settings**: https://supabase.com/dashboard/project/[PROJECT-ID]/settings/database
- **SQL Editor**: https://supabase.com/dashboard/project/[PROJECT-ID]/editor

### Connection String Format:
```
postgresql://[USERNAME]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]
```

### For Vercel (Pooler - Recommended):
```
Host: aws-0-[region].pooler.supabase.com
Port: 6543
Username: postgres.[project-ref]
Database: postgres
```

### For Direct Connection:
```
Host: db.[project-ref].supabase.co
Port: 5432
Username: postgres
Database: postgres
```

---

## Next Steps After Setup

1. ✅ Create Supabase project
2. ✅ Get connection details
3. ✅ Add to Vercel environment variables
4. ✅ Redeploy backend
5. ✅ Test database connection
6. ✅ Verify tables are created
7. ✅ Test API endpoints
8. ✅ Seed initial data (health facilities, etc.)

---

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com
- **TypeORM Docs**: https://typeorm.io
