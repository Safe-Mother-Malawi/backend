# IVR Alerts - Quick Test (5 Minutes)

## Quick Start

### 1. Start Backend
```bash
cd backend
npm run start
```

Wait for:
```
[Nest] ... LOG [IvrModule] Twilio IVR ready
[Nest] ... LOG [IvrModule] Public URL configured
```

### 2. Start Flutter App
```bash
cd safe-mother-malawi/safemothermalawi_frontend
flutter run
```

### 3. Login as Clinician
- Email: `clinician@example.com`
- Password: `Password123!`

### 4. Go to Patients Page
- Click **Patients** in sidebar
- Look for **IVR Alerts** section at top
- Should show: `🟢 Connected`

### 5. Trigger HIGH Risk Alert (30 seconds)

Go to **Call** screen and press these buttons:
```
1 → 1 → 1 → 3 → 4 → 4 → 3 → 1
```

**Expected:**
- Backend logs: `Alert created in database: HIGH risk`
- Frontend logs: `📨 Received IVR alert`
- Dashboard: Alert appears with ⚠️ emoji

### 6. Verify Alert in Dashboard

You should see:
```
IVR Alerts (1)
🟢 Connected

⚠️ HIGH Risk - prenatal
HIGH Risk Alert: prenatal patient needs attention
Score: 23
[X]
```

### 7. Test CRITICAL Alert (30 seconds)

Press:
```
1 → 1 → 2 → 4 → 4 → 4 → 4 → 4
```

**Expected:**
- Dashboard: New alert with 🚨 emoji
- Alert count: `(2)`

### 8. Verify Database

```sql
SELECT COUNT(*) FROM alerts WHERE reason LIKE '%IVR%';
```

Should return: `2` (or more)

---

## Debugging

### Backend Logs to Look For

✅ **Good:**
```
Alert created in database: HIGH risk
Alert broadcast: HIGH risk
```

❌ **Bad:**
```
Failed to create alert
Error connecting to database
```

### Frontend Logs to Look For

✅ **Good:**
```
✅ Connected to IVR alerts WebSocket
📨 Received IVR alert
```

❌ **Bad:**
```
❌ Disconnected from IVR alerts WebSocket
❌ WebSocket error
```

### Dashboard Checks

✅ **Good:**
- IVR Alerts section visible
- Connection status: 🟢 Connected
- Alerts appear in real-time
- Emoji shows correct risk level

❌ **Bad:**
- IVR Alerts section missing
- Connection status: 🔴 Disconnected
- Alerts don't appear
- Wrong emoji or risk level

---

## Common Issues

### Issue: "🔴 Disconnected"
**Solution:** Restart Flutter app or check backend is running

### Issue: No alerts appear
**Solution:** Check backend logs for "Alert created" message

### Issue: Alert appears but not in database
**Solution:** Check database connection in backend logs

---

## Success Criteria

✅ All of these should be true:
- [ ] Backend compiles without errors
- [ ] Flutter app runs without errors
- [ ] IVR Alerts section shows "🟢 Connected"
- [ ] HIGH risk alert appears with ⚠️ emoji
- [ ] CRITICAL risk alert appears with 🚨 emoji
- [ ] Alerts appear in database
- [ ] Alert count updates correctly
- [ ] Clear All button works

---

## Next Steps

Once quick test passes:
1. Read full testing guide: `IVR_ALERTS_END_TO_END_TESTING.md`
2. Run all test scenarios
3. Test with multiple clinicians
4. Test WebSocket reconnection
5. Load test with concurrent alerts

