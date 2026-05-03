# IVR Alerts - End-to-End Testing Guide

## Overview

This guide walks through testing the complete alert flow from IVR assessment to clinician dashboard. It includes debugging steps and console output verification.

## Prerequisites

- Backend running: `npm run start`
- Flutter app running: `flutter run`
- Database connected and accessible
- Both backend and frontend on same network (or localhost)

---

## Test Scenario 1: HIGH Risk Alert (Prenatal)

### Step 1: Start Backend with Logging

```bash
cd backend
npm run start
```

**Expected Output:**
```
[Nest] 12345  - 05/01/2026, 10:30:45 AM     LOG [IvrModule] Twilio IVR ready — phone=+1234567890
[Nest] 12345  - 05/01/2026, 10:30:45 AM     LOG [IvrModule] Public URL configured: https://xxxx.ngrok.io
[Nest] 12345  - 05/01/2026, 10:30:46 AM     LOG [IvrAlertsGateway] Clinician connected: socket_id_123
```

### Step 2: Open Flutter App and Login

1. Run Flutter app: `flutter run`
2. Login as **Clinician**
3. Navigate to **Patients** page
4. Look for **IVR Alerts** section at the top
5. Should show: `🟢 Connected` (green indicator)

**Expected UI:**
```
IVR Alerts (0)
🟢 Connected
```

### Step 3: Trigger IVR Assessment

1. Go to **Call** screen (or IVR Simulator screen)
2. Tap **"Test IVR System"** or **"Start IVR Call"**
3. You should see the welcome message

**Expected Response:**
```
Welcome to SafeMother Health IVR. 
Press 1 to continue.
```

### Step 4: Complete HIGH Risk Assessment

Follow this sequence to create a HIGH risk prenatal assessment:

```
Press 1 → Continue
Press 1 → Symptoms
Press 1 → Pregnancy Health (Prenatal)
Press 3 → Unwell (score: 3)
Press 4 → Severe headache + blurred vision (score: 6, total: 9)
Press 4 → Sudden severe swelling (score: 7, total: 16)
Press 3 → No fetal movement (score: 7, total: 23)
Press 1 → No bleeding (score: 0, total: 23)
```

**Expected Final Message:**
```
Your risk assessment is complete. Risk Level: HIGH. 
You need urgent medical attention. Please visit a health facility today.
Press 1 to return to main menu. Press 0 to end call.
```

### Step 5: Verify Backend Logs

Check backend console for these logs (in order):

```
✅ [IvrSimulatorService] Session initialized: session_id_123
✅ [IvrCallLogService] Logged action: CALL_START
✅ [IvrCallLogService] Logged action: MAIN_MENU
✅ [IvrCallLogService] Logged action: SYMPTOM_TYPE
✅ [IvrCallLogService] Logged action: PRENATAL_Q1
✅ [IvrCallLogService] Logged action: PRENATAL_Q2
✅ [IvrCallLogService] Logged action: PRENATAL_Q3
✅ [IvrCallLogService] Logged action: PRENATAL_Q4
✅ [IvrCallLogService] Logged action: PRENATAL_Q5
✅ [IvrSimulatorService] Alert created in database: HIGH risk for session session_id_123
✅ [IvrSimulatorService] Alert broadcast: HIGH risk for session session_id_123
✅ [IvrAlertsGateway] Broadcasting IVR alert: HIGH risk from sim-session_id_123
```

### Step 6: Verify Frontend Logs

Check Flutter console for these logs:

```
✅ Connected to IVR alerts WebSocket
✅ Joined alerts channel: {userId: clinician-user}
📨 Received IVR alert: {sessionId: session_id_123, riskLevel: HIGH, ...}
```

### Step 7: Check Clinician Dashboard

The **IVR Alerts** section should now show:

```
IVR Alerts (1)
🟢 Connected

⚠️ HIGH Risk - prenatal
HIGH Risk Alert: prenatal patient needs attention
Score: 23
[X]
```

**Visual Indicators:**
- Alert count: `(1)`
- Risk emoji: `⚠️` (orange background)
- Risk level: `HIGH`
- Patient type: `prenatal`
- Risk score: `23`

### Step 8: Verify Database

Run this SQL query:

```sql
SELECT id, "patientName", "patientStatus", reason, severity, "createdAt" 
FROM alerts 
WHERE reason LIKE '%IVR%' 
ORDER BY "createdAt" DESC 
LIMIT 1;
```

**Expected Result:**
```
id                  | patientName              | patientStatus | reason                                    | severity | createdAt
uuid-123            | IVR Patient (prenatal)   | prenatal      | HIGH risk detected via IVR assessment... | high     | 2026-05-01 10:35:22
```

### Step 9: Test Alert Dismissal

1. Click the **[X]** button on the alert
2. Alert should disappear from the list
3. Alert count should change to `(0)`

**Expected UI:**
```
IVR Alerts (0)
🟢 Connected
```

---

## Test Scenario 2: CRITICAL Risk Alert (Neonatal)

### Step 1: Start New Assessment

1. Press **1** to return to main menu
2. Press **1** to start new assessment
3. Press **1** to continue

### Step 2: Complete CRITICAL Risk Assessment

Follow this sequence to create a CRITICAL risk neonatal assessment:

```
Press 1 → Continue
Press 1 → Symptoms
Press 2 → Baby Health (Neonatal)
Press 4 → Severe difficulty breathing (score: 4)
Press 4 → Severe fever (score: 4, total: 8)
Press 4 → Severe diarrhea (score: 4, total: 12)
Press 4 → Severe rash (score: 4, total: 16)
Press 4 → Severe lethargy (score: 4, total: 20)
```

**Expected Final Message:**
```
Your risk assessment is complete. Risk Level: CRITICAL. 
This is a critical situation. Please go to the nearest hospital immediately. 
Call 998 for ambulance.
Press 1 to return to main menu. Press 0 to end call.
```

### Step 3: Verify Backend Logs

```
✅ [IvrSimulatorService] Alert created in database: CRITICAL risk for session session_id_456
✅ [IvrSimulatorService] Alert broadcast: CRITICAL risk for session session_id_456
✅ [IvrAlertsGateway] Broadcasting IVR alert: CRITICAL risk from sim-session_id_456
```

### Step 4: Check Clinician Dashboard

The **IVR Alerts** section should now show:

```
IVR Alerts (2)
🟢 Connected

🚨 CRITICAL Risk - neonatal
CRITICAL Risk Alert: neonatal patient needs attention
Score: 20
[X]

⚠️ HIGH Risk - prenatal
HIGH Risk Alert: prenatal patient needs attention
Score: 23
[X]
```

**Visual Indicators:**
- Alert count: `(2)`
- CRITICAL emoji: `🚨` (red background)
- HIGH emoji: `⚠️` (orange background)
- Alerts sorted by most recent first

### Step 5: Verify Database

```sql
SELECT id, "patientName", "patientStatus", reason, severity, "createdAt" 
FROM alerts 
WHERE reason LIKE '%IVR%' 
ORDER BY "createdAt" DESC 
LIMIT 2;
```

**Expected Result:**
```
id                  | patientName              | patientStatus | reason                                    | severity | createdAt
uuid-456            | IVR Patient (neonatal)   | neonatal      | CRITICAL risk detected via IVR assess... | critical | 2026-05-01 10:37:45
uuid-123            | IVR Patient (prenatal)   | prenatal      | HIGH risk detected via IVR assessment... | high     | 2026-05-01 10:35:22
```

---

## Test Scenario 3: LOW Risk (No Alert)

### Step 1: Complete LOW Risk Assessment

```
Press 1 → Continue
Press 1 → Symptoms
Press 1 → Pregnancy Health (Prenatal)
Press 1 → Feeling well (score: 0)
Press 1 → No headache (score: 0, total: 0)
Press 1 → No swelling (score: 0, total: 0)
Press 1 → Normal fetal movement (score: 0, total: 0)
Press 1 → No bleeding (score: 0, total: 0)
```

**Expected Final Message:**
```
Your risk assessment is complete. Risk Level: LOW. 
Your health status is good. Continue regular check-ups.
Press 1 to return to main menu. Press 0 to end call.
```

### Step 2: Verify No Alert Created

**Backend Logs:**
```
✅ [IvrCallLogService] Logged action: RISK_RESULT
❌ No "Alert created" log (expected - LOW risk doesn't trigger alert)
❌ No "Alert broadcast" log (expected - LOW risk doesn't trigger alert)
```

**Frontend:**
```
❌ No new alert received (expected - LOW risk doesn't trigger alert)
```

**Dashboard:**
```
IVR Alerts (2)  ← Count unchanged
🟢 Connected
```

### Step 3: Verify Database

```sql
SELECT COUNT(*) as total_alerts, 
       SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high_count,
       SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_count
FROM alerts 
WHERE reason LIKE '%IVR%';
```

**Expected Result:**
```
total_alerts | high_count | critical_count
3            | 1          | 1
```

(Only HIGH and CRITICAL alerts are created, not LOW or MODERATE)

---

## Test Scenario 4: WebSocket Reconnection

### Step 1: Disconnect WebSocket

1. Go to Flutter app
2. Close the app or navigate away from Patients page
3. Check backend logs for disconnect

**Expected Backend Log:**
```
❌ [IvrAlertsGateway] Clinician disconnected: socket_id_123
```

### Step 2: Trigger Alert While Disconnected

1. Complete a HIGH risk assessment
2. Check backend logs - alert should be created and broadcast

**Expected Backend Logs:**
```
✅ [IvrSimulatorService] Alert created in database: HIGH risk
✅ [IvrSimulatorService] Alert broadcast: HIGH risk
✅ [IvrAlertsGateway] Broadcasting IVR alert: HIGH risk
```

### Step 3: Reconnect WebSocket

1. Return to Patients page in Flutter app
2. Check backend logs for reconnection

**Expected Backend Log:**
```
✅ [IvrAlertsGateway] Clinician connected: socket_id_456
✅ [IvrAlertsGateway] Clinician clinician-user joined alerts
```

### Step 4: Verify Alert Appears

The alert created while disconnected should **NOT** appear (WebSocket only sends real-time alerts).

However, the alert **IS** saved in the database and can be queried via API.

---

## Test Scenario 5: Multiple Concurrent Alerts

### Step 1: Rapid Assessment Sequence

Complete 3 HIGH risk assessments in quick succession:

```
Assessment 1: Prenatal HIGH (score 15)
Assessment 2: Neonatal HIGH (score 15)
Assessment 3: Prenatal HIGH (score 18)
```

### Step 2: Verify All Alerts Appear

Dashboard should show:

```
IVR Alerts (5)
🟢 Connected

⚠️ HIGH Risk - prenatal
HIGH Risk Alert: prenatal patient needs attention
Score: 18
[X]

⚠️ HIGH Risk - neonatal
HIGH Risk Alert: neonatal patient needs attention
Score: 15
[X]

⚠️ HIGH Risk - prenatal
HIGH Risk Alert: prenatal patient needs attention
Score: 15
[X]

... (previous alerts)
```

### Step 3: Verify Backend Logs

```
✅ [IvrSimulatorService] Alert created in database: HIGH risk for session session_1
✅ [IvrSimulatorService] Alert broadcast: HIGH risk for session session_1
✅ [IvrSimulatorService] Alert created in database: HIGH risk for session session_2
✅ [IvrSimulatorService] Alert broadcast: HIGH risk for session session_2
✅ [IvrSimulatorService] Alert created in database: HIGH risk for session session_3
✅ [IvrSimulatorService] Alert broadcast: HIGH risk for session session_3
```

### Step 4: Verify Database

```sql
SELECT COUNT(*) as total_alerts 
FROM alerts 
WHERE reason LIKE '%IVR%' AND "createdAt" > NOW() - INTERVAL '5 minutes';
```

**Expected Result:**
```
total_alerts
6  (or more, depending on previous tests)
```

---

## Test Scenario 6: Clear All Alerts

### Step 1: Click "Clear All" Button

1. Dashboard shows multiple alerts
2. Click **"Clear All"** button
3. All alerts should disappear

**Expected UI:**
```
IVR Alerts (0)
🟢 Connected
```

### Step 2: Verify Database

Alerts should **still exist** in database (only UI cleared):

```sql
SELECT COUNT(*) as total_alerts 
FROM alerts 
WHERE reason LIKE '%IVR%';
```

**Expected Result:**
```
total_alerts
6  (unchanged - database not affected)
```

---

## Debugging Checklist

### ✅ Backend Checks

- [ ] Backend running: `npm run start`
- [ ] No TypeScript errors
- [ ] IvrModule loaded successfully
- [ ] IvrAlertsGateway registered
- [ ] AlertsService injected
- [ ] Database connection active

**Verify:**
```bash
# Check backend is running
curl http://localhost:3000/api/v1/ivr/health

# Expected response:
# {"status":"ok","module":"ivr"}
```

### ✅ Frontend Checks

- [ ] Flutter app running
- [ ] Logged in as Clinician
- [ ] On Patients page
- [ ] IVR Alerts section visible
- [ ] Connection status shows 🟢 Connected

**Verify in Flutter Console:**
```
✅ Connected to IVR alerts WebSocket
✅ Joined alerts channel
```

### ✅ WebSocket Checks

**Browser DevTools (if testing web):**
1. Open DevTools → Network tab
2. Filter by "WS"
3. Should see connection to `ws://localhost:3000/ivr-alerts`
4. Status: 101 Switching Protocols

**Flutter Console:**
```
✅ Connected to IVR alerts WebSocket
✅ Joined alerts channel: {userId: clinician-user}
```

### ✅ Database Checks

```sql
-- Check alerts table exists
SELECT * FROM alerts LIMIT 1;

-- Check IVR alerts
SELECT COUNT(*) FROM alerts WHERE reason LIKE '%IVR%';

-- Check alert details
SELECT id, "patientName", severity, reason, "createdAt" 
FROM alerts 
WHERE reason LIKE '%IVR%' 
ORDER BY "createdAt" DESC 
LIMIT 5;
```

### ✅ API Checks

```bash
# Get active alerts (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/alerts/active

# Get all alerts
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/alerts
```

---

## Common Issues and Solutions

### Issue 1: "🔴 Disconnected" in Dashboard

**Symptoms:**
- IVR Alerts section shows "🔴 Disconnected"
- No alerts appear even after HIGH risk assessment

**Solutions:**
1. Check backend is running: `npm run start`
2. Check WebSocket URL in `ivr_websocket_service.dart`:
   ```dart
   final String _apiBaseUrl = 'http://localhost:3000';
   ```
3. Verify CORS settings in `ivr-alerts.gateway.ts`:
   ```typescript
   cors: {
     origin: '*',
     methods: ['GET', 'POST'],
   }
   ```
4. Check firewall/proxy blocking WebSocket connections
5. Restart Flutter app: `flutter run`

### Issue 2: Alerts Not Appearing in Dashboard

**Symptoms:**
- Backend logs show alert created and broadcast
- Frontend logs show alert received
- But alert doesn't appear in UI

**Solutions:**
1. Check `Consumer<IvrWebSocketService>` is properly wrapped
2. Verify `notifyListeners()` is called in `IvrWebSocketService`
3. Check alert parsing in `IvrAlert.fromJson()`
4. Verify `_alerts.insert(0, alert)` adds to list
5. Check UI is rebuilding: Look for "Consumer" widget

### Issue 3: Alerts Created but Not Broadcast

**Symptoms:**
- Database shows alert created
- Backend logs show "Alert created"
- But no "Alert broadcast" log
- Frontend doesn't receive alert

**Solutions:**
1. Check `IvrAlertsGateway` is injected in `IvrSimulatorService`
2. Verify `broadcastAlert()` is called in `handleRiskResult()`
3. Check WebSocket server is initialized
4. Verify clinician is connected: Check `connectedClinicians` map
5. Check alert severity is HIGH or CRITICAL

### Issue 4: Multiple Alerts Not Showing

**Symptoms:**
- Only latest alert appears
- Previous alerts disappear

**Solutions:**
1. Check `_alerts.insert(0, alert)` adds to top of list
2. Verify `ListView.separated` renders all items
3. Check `itemCount: ivrService.alerts.length`
4. Verify `notifyListeners()` called after each alert
5. Check for accidental `_alerts.clear()` calls

### Issue 5: Database Connection Error

**Symptoms:**
- Backend logs show database error
- Alerts not saved to database
- But WebSocket alerts still appear

**Solutions:**
1. Check database is running
2. Verify connection string in `.env`
3. Check database credentials
4. Verify `alerts` table exists
5. Check table permissions

---

## Performance Testing

### Test 1: Alert Latency

**Measure time from assessment completion to alert appearance:**

1. Note backend timestamp when alert created
2. Note frontend timestamp when alert received
3. Calculate latency

**Expected:** < 100ms

### Test 2: Concurrent Alerts

**Send 10 alerts rapidly:**

```bash
# Run 10 assessments in quick succession
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/v1/ivr/simulator/init \
    -H "Content-Type: application/json" \
    -d "{\"sessionId\": \"test-$i\"}"
done
```

**Expected:** All alerts appear without lag

### Test 3: Memory Usage

**Monitor memory while receiving alerts:**

1. Open Flutter DevTools
2. Go to Memory tab
3. Complete 50 assessments
4. Check memory doesn't grow unbounded

**Expected:** Stable memory usage

---

## Verification Checklist

After completing all tests, verify:

- [ ] HIGH risk alerts appear with ⚠️ emoji
- [ ] CRITICAL risk alerts appear with 🚨 emoji
- [ ] LOW/MODERATE risk don't create alerts
- [ ] Alerts appear in real-time (< 100ms)
- [ ] Alerts saved to database
- [ ] Multiple alerts display correctly
- [ ] Clear All button works
- [ ] Individual alert dismissal works
- [ ] WebSocket reconnection works
- [ ] Backend logs show all actions
- [ ] Frontend logs show connection and alerts
- [ ] Database queries return correct data
- [ ] API endpoints return alerts

---

## Next Steps

Once all tests pass:

1. **Deploy to staging** - Test with multiple clinicians
2. **Load testing** - Test with 100+ concurrent alerts
3. **Mobile testing** - Test on actual devices
4. **Integration testing** - Test with real Twilio calls
5. **User acceptance testing** - Have clinicians test

---

## Support

For issues:
1. Check backend logs: `npm run start`
2. Check Flutter console: `flutter run`
3. Check browser DevTools (if web)
4. Query database for alert records
5. Review this guide for solutions

