# Default Users - Auto-Created on First Deployment

## 🎉 Automatic User Seeding

The backend now automatically creates default users on first deployment!

---

## 👤 Default Users

### 1. Admin User
```
Email: admin@safemothermalawi.mw
Password: Admin@123
Role: Admin
Status: Active
```

**Permissions:**
- Full system access
- Manage all users
- View all data
- Generate reports
- System configuration

---

### 2. DHO User
```
Email: dho@safemothermalawi.mw
Password: Dho@123
Role: DHO (District Health Officer)
District: Lilongwe
Status: Active
```

**Permissions:**
- View district data
- Manage clinicians in district
- Generate district reports
- Monitor alerts

---

## 🔄 How It Works

### Automatic Seeding:
1. Backend starts up
2. Checks if any users exist
3. If database is empty → Creates default users
4. If users exist → Skips seeding

### Code Location:
- Seed Service: `src/users/seed/users.seed.ts`
- Called from: `src/app.module.ts` (onModuleInit)

---

## 🧪 Testing

### Test Admin Login:
```bash
curl -X POST https://safemothermalawi-backend.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "admin@safemothermalawi.mw",
    "password": "Admin@123"
  }'
```

### Test DHO Login:
```bash
curl -X POST https://safemothermalawi-backend.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "dho@safemothermalawi.mw",
    "password": "Dho@123"
  }'
```

---

## 🔐 Security Notes

### ⚠️ IMPORTANT - Change Passwords in Production!

These are **default passwords** for initial setup. You should:

1. **Login with default credentials**
2. **Change password immediately**
3. **Use strong, unique passwords**

### How to Change Password:
1. Login to the system
2. Go to Settings/Profile
3. Click "Change Password"
4. Enter new strong password

---

## 📝 Adding More Default Users

To add more default users, edit `src/users/seed/users.seed.ts`:

```typescript
const defaultUsers = [
  {
    email: 'admin@safemothermalawi.mw',
    password: 'Admin@123',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'admin',
    status: 'active',
  },
  {
    email: 'dho@safemothermalawi.mw',
    password: 'Dho@123',
    firstName: 'District',
    lastName: 'Health Officer',
    role: 'dho',
    district: 'Lilongwe',
    status: 'active',
  },
  // Add more users here...
];
```

---

## 🚀 Deployment

### When Seeding Happens:
- ✅ First deployment (empty database)
- ✅ After database reset
- ❌ Subsequent deployments (users already exist)

### Logs to Watch:
```
[UsersSeedService] Seeding default users...
[UsersSeedService] ✅ Created user: admin@safemothermalawi.mw (admin)
[UsersSeedService] ✅ Created user: dho@safemothermalawi.mw (dho)
[UsersSeedService] ✅ User seeding completed
```

---

## 🎯 Next Steps

1. **Wait for deployment** to complete (~3 minutes)
2. **Check logs** for seeding confirmation
3. **Login with admin credentials**
4. **Change default passwords**
5. **Create additional users** as needed

---

## 📊 User Roles

| Role | Description | Default User |
|------|-------------|--------------|
| **Admin** | Full system access | ✅ admin@safemothermalawi.mw |
| **DHO** | District health officer | ✅ dho@safemothermalawi.mw |
| **Clinician** | Health facility staff | ❌ Create manually |
| **Patient** | Prenatal/neonatal patient | ❌ Register via mobile |

---

## 🔧 Troubleshooting

### Users Not Created?

**Check logs:**
```
https://dashboard.render.com/web/safemothermalawi-backend/logs
```

**Look for:**
- "Seeding default users..." message
- Any error messages
- "Users already exist, skipping seed" (if database not empty)

### Can't Login?

1. **Verify backend is running:**
   ```
   https://safemothermalawi-backend.onrender.com/api/v1/health
   ```

2. **Check credentials are correct:**
   - Email: `admin@safemothermalawi.mw`
   - Password: `Admin@123`

3. **Try password reset** if needed

### Need to Re-seed?

If you need to recreate default users:

1. **Delete existing users** (via admin panel or database)
2. **Restart backend** (Render will auto-restart)
3. **Seed will run again** (database is empty)

---

## Summary

✅ **Admin user auto-created**: admin@safemothermalawi.mw / Admin@123  
✅ **DHO user auto-created**: dho@safemothermalawi.mw / Dho@123  
✅ **Seeding happens automatically** on first deployment  
✅ **No manual user creation needed** for initial setup  
⚠️ **Change passwords** after first login!

