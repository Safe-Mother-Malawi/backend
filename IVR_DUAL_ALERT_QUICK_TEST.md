# IVR Dual Alert System - Quick Test (10 Minutes)

## What's New

The IVR system now sends **two types of alerts**:
1. **Immediate Critical Answer Alerts** - When patient answers critically to any question
2. **End-of-Call Risk Alerts** - When final risk is HIGH or CRITICAL

---

## Quick Test Setup

### 1. Start Backend
```bash
cd backend
npm run start
```

### 2. Start Flutter App
```bash
cd safe-mother-malawi/safemothermalawi_frontend
flutter run
```

### 3. Login as Clinician
- Go to **Patients** page
- Look for **IVR Alerts** section
- Should show: `🟢 Connected`

---

## Test 1: Multiple Critical Answers (2 minutes)

### Trigger Assessment
Press: `1 → 1 → 1 → 4 → 4 → 4 → 4 → 4`

### Expected Results

**Backend Logs:**
```
✅ Critical answer alert created: wellbeing (score: 5)
✅ Critical answer alert broadcast: wellbeing (score: 5)
✅ Critical answer alert created: headache (score: 5)
✅ Critical answer alert broadcast: headache (score: 5)
✅ Critical answer alert created: swelling (score: 7)
✅ Critical answer alert broadcast: swelling (score: 7)
✅ Critical answer alert created: fetalMovement (score: 7)
✅ Critical answer alert broadcast: fetalMovement (score: 7)
✅ Alert created in database: CRITICAL risk
✅ Alert broadcast: CRITICAL risk
```

**Frontend Logs:**
```
📨 Received IVR alert: {action: CRITICAL_ANSWER_ALERT, ...}
📨 Received IVR alert: {action: CRITICAL_ANSWER_ALERT, ...}
📨 Received IVR alert: {action: CRITICAL_ANSWER_ALERT, ...}
📨 Received IVR alert: {action: CRITICAL_ANSWER_ALERT, ...}
📨 Received IVR alert: {action: RISK_ALERT, ...}
```

**Dashboard:**
```
IVR Alerts (5)
🟢 Connected

🚨 CRITICAL Risk Alert: prenatal patient needs attention
Score: 23
[X]

⚠️ CRITICAL ANSWER: prenatal patient reported severe fetalMovement. Patient still in call.
Score: 7
[X]

⚠️ CRITICAL ANSWER: prenatal patient reported severe swelling. Patient still in call.
Score: 7
[X]

⚠️ CRITICAL ANSWER: prenatal patient reported severe headache. Patient still in call.
Score: 5
[X]

⚠️ CRITICAL ANSWER: prenatal patient reported severe wellbeing. Patient still in call.
Score: 5
[X]
```

---

## Test 2: One Critical Answer, Moderate Risk (2 minutes)

### Trigger Assessment
Press: `1 → 1 → 2 → 3 → 1 → 1 → 1 → 1`

### Expected Results

**Backend Logs:**
```
✅ Critical answer alert created: breathing (score: 6)
✅ Critical answer alert broadcast: breathing (score: 6)
❌ No end-of-call alert (MODERATE risk, score 6)
```

**Dashboard:**
```
IVR Alerts (6)  ← Count increased by 1
🟢 Connected

⚠️ CRITICAL ANSWER: neonatal patient reported severe breathing. Patient still in call.
Score: 6
[X]

... (previous alerts)
```

---

## Test 3: No Critical Answers, HIGH Final Risk (2 minutes)

### Trigger Assessment
Press: `1 → 1 → 1 → 3 → 3 → 3 → 2 → 2`

### Expected Results

**Backend Logs:**
```
✅ Critical answer alert created: wellbeing (score: 3) - NO, score < 5
✅ Critical answer alert created: headache (score: 3) - NO, score < 5
✅ Critical answer alert created: swelling (score: 5) - YES
✅ Critical answer alert broadcast: swelling (score: 5)
✅ Alert created in database: HIGH risk
✅ Alert broadcast: HIGH risk
```

**Dashboard:**
```
IVR Alerts (8)  ← Count increased by 2
🟢 Connected

⚠️ HIGH Risk Alert: prenatal patient needs attention
Score: 16
[X]

⚠️ CRITICAL ANSWER: prenatal patient reported severe swelling. Patient still in call.
Score: 5
[X]

... (previous alerts)
```

---

## Test 4: No Critical Answers, LOW Risk (1 minute)

### Trigger Assessment
Press: `1 → 1 → 1 → 1 → 1 → 1 → 1 → 1`

### Expected Results

**Backend Logs:**
```
❌ No critical answer alerts (all scores < 5)
❌ No end-of-call alert (LOW risk, score 0)
```

**Dashboard:**
```
IVR Alerts (8)  ← Count unchanged
🟢 Connected

... (previous alerts)
```

---

## Test 5: Database Verification (2 minutes)

### Query All IVR Alerts

```sql
SELECT 
  id,
  "patientName",
  reason,
  severity,
  "createdAt"
FROM alerts 
WHERE reason LIKE '%IVR%' 
ORDER BY "createdAt" DESC 
LIMIT 20;
```

### Expected Results

Should show:
- Multiple "CRITICAL ANSWER detected" alerts (HIGH severity)
- Multiple "risk detected via IVR assessment" alerts (HIGH/CRITICAL severity)
- All with recent timestamps

### Count by Type

```sql
SELECT 
  SUM(CASE WHEN reason LIKE '%CRITICAL ANSWER%' THEN 1 ELSE 0 END) as critical_answer_alerts,
  SUM(CASE WHEN reason LIKE '%risk detected via IVR assessment%' THEN 1 ELSE 0 END) as risk_alerts
FROM alerts 
WHERE reason LIKE '%IVR%';
```

**Expected:**
```
critical_answer_alerts | risk_alerts
8                      | 3
```

---

## Debugging

### Backend Logs to Look For

✅ **Good:**
```
Critical answer alert created: {field} (score: {score})
Critical answer alert broadcast: {field} (score: {score})
Alert created in database: {RISK_LEVEL} risk
Alert broadcast: {RISK_LEVEL} risk
```

❌ **Bad:**
```
Failed to create critical answer alert
Error connecting to database
```

### Frontend Logs to Look For

✅ **Good:**
```
📨 Received IVR alert: {action: CRITICAL_ANSWER_ALERT, ...}
📨 Received IVR alert: {action: RISK_ALERT, ...}
```

❌ **Bad:**
```
❌ Disconnected from IVR alerts WebSocket
❌ WebSocket error
```

### Dashboard Checks

✅ **Good:**
- Multiple alerts appear in real-time
- Alerts sorted by most recent first
- Correct emoji (⚠️ for HIGH, 🚨 for CRITICAL)
- Alert count updates correctly
- Clear All button works

❌ **Bad:**
- Only one alert appears
- Alerts don't appear in order
- Wrong emoji
- Alert count doesn't update

---

## Success Criteria

✅ All of these should be true:

- [ ] Backend compiles without errors
- [ ] Flutter app runs without errors
- [ ] IVR Alerts section shows "🟢 Connected"
- [ ] Critical answer alerts appear immediately
- [ ] End-of-call risk alerts appear at completion
- [ ] Multiple alerts display correctly
- [ ] Alerts appear in database
- [ ] Alert count updates correctly
- [ ] Clear All button works
- [ ] Backend logs show both alert types
- [ ] Frontend logs show both alert types

---

## Alert Thresholds

### Prenatal (Score >= 5 triggers alert)
- Wellbeing: 4 = 5 points ✅
- Headache: 4 = 5 points ✅
- Swelling: 3 = 5 points ✅, 4 = 7 points ✅
- Fetal Movement: 3 = 7 points ✅
- Bleeding: 3 = 8 points ✅

### Neonatal (Score >= 4 triggers alert)
- Breathing: 3 = 6 points ✅
- Feeding: 3 = 6 points ✅
- Skin Color: 3 = 5 points ✅
- Temperature: 3 = 6 points ✅
- Activity: 3 = 6 points ✅

---

## Next Steps

Once quick test passes:
1. Read full documentation: `IVR_DUAL_ALERT_SYSTEM.md`
2. Run all test scenarios
3. Test with multiple clinicians
4. Test WebSocket reconnection
5. Load test with concurrent alerts

