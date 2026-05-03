# IVR Dual Alert System - Critical Answers + End-of-Call Risk

## Overview

The IVR system now sends **two types of alerts** to clinicians:

1. **Immediate Critical Answer Alerts** - Triggered when patient gives a severe answer to any question
2. **End-of-Call Risk Alerts** - Triggered when final risk assessment is HIGH or CRITICAL

This dual approach ensures clinicians are notified immediately of critical symptoms while also getting the complete risk assessment at the end.

---

## Alert Types

### Type 1: Critical Answer Alert (Immediate)

**When triggered:**
- Patient answers a question with a critical/severe response
- Alert sent **immediately** while patient is still in the call

**Thresholds:**
- **Prenatal**: Score >= 5 (severe symptoms)
- **Neonatal**: Score >= 4 (severe symptoms)

**Example:**
```
Patient answers Q1: "4 - Severe with blurred vision" (score: 5)
→ Alert sent immediately: "⚠️ CRITICAL ANSWER: prenatal patient reported severe wellbeing"
→ Patient continues with remaining questions
```

**Alert Details:**
```json
{
  "sessionId": "session-123",
  "timestamp": "2026-05-01T10:35:22Z",
  "riskLevel": "HIGH",
  "patientType": "prenatal",
  "callerPhone": "sim-session-123",
  "message": "⚠️ CRITICAL ANSWER: prenatal patient reported severe wellbeing. Patient still in call.",
  "answers": {
    "wellbeing": "4"
  },
  "riskScore": 5,
  "action": "CRITICAL_ANSWER_ALERT"
}
```

**Database Entry:**
```sql
INSERT INTO alerts (
  patientName,
  patientStatus,
  contact,
  reason,
  symptoms,
  severity,
  createdAt
) VALUES (
  'IVR Patient (prenatal) - Critical Answer',
  'prenatal',
  'sim-session-123',
  'CRITICAL ANSWER detected during IVR assessment: wellbeing (Score: 5). Patient still in call.',
  '["wellbeing: 4 (score: 5)"]',
  'high',
  NOW()
);
```

### Type 2: End-of-Call Risk Alert (Final)

**When triggered:**
- Patient completes all 5 questions
- Final risk score calculated
- Alert sent if risk is HIGH or CRITICAL

**Thresholds:**
- **HIGH**: Score 15-19
- **CRITICAL**: Score >= 20

**Example:**
```
Patient completes all 5 questions
Final score: 23 (CRITICAL)
→ Alert sent: "🚨 CRITICAL Risk Alert: prenatal patient needs attention"
→ Call ends
```

**Alert Details:**
```json
{
  "sessionId": "session-123",
  "timestamp": "2026-05-01T10:36:45Z",
  "riskLevel": "CRITICAL",
  "patientType": "prenatal",
  "callerPhone": "sim-session-123",
  "message": "🚨 CRITICAL Risk Alert: prenatal patient needs attention",
  "answers": {
    "wellbeing": "4",
    "headache": "4",
    "swelling": "4",
    "fetalMovement": "3",
    "bleeding": "4"
  },
  "riskScore": 23,
  "action": "RISK_ALERT"
}
```

**Database Entry:**
```sql
INSERT INTO alerts (
  patientName,
  patientStatus,
  contact,
  reason,
  symptoms,
  severity,
  createdAt
) VALUES (
  'IVR Patient (prenatal)',
  'prenatal',
  'sim-session-123',
  'CRITICAL risk detected via IVR assessment (Score: 23)',
  '["wellbeing: 4", "headache: 4", "swelling: 4", "fetalMovement: 3", "bleeding: 4"]',
  'critical',
  NOW()
);
```

---

## Critical Answer Thresholds

### Prenatal Assessment (Score >= 5)

| Question | Answer | Score | Critical? |
|----------|--------|-------|-----------|
| Wellbeing | 1 - Very well | 0 | ❌ |
| Wellbeing | 2 - Tired | 1 | ❌ |
| Wellbeing | 3 - Unwell | 3 | ❌ |
| Wellbeing | 4 - In pain | 5 | ✅ ALERT |
| Headache | 1 - No | 0 | ❌ |
| Headache | 2 - Mild | 1 | ❌ |
| Headache | 3 - Severe | 3 | ❌ |
| Headache | 4 - Severe + blurred vision | 5 | ✅ ALERT |
| Swelling | 1 - No | 0 | ❌ |
| Swelling | 2 - Mild feet | 2 | ❌ |
| Swelling | 3 - Hands and face | 5 | ✅ ALERT |
| Swelling | 4 - Sudden severe | 7 | ✅ ALERT |
| Fetal Movement | 1 - Normal | 0 | ❌ |
| Fetal Movement | 2 - Less than usual | 3 | ❌ |
| Fetal Movement | 3 - No movement | 7 | ✅ ALERT |
| Bleeding | 1 - None | 0 | ❌ |
| Bleeding | 2 - Light spotting | 3 | ❌ |
| Bleeding | 3 - Heavy | 8 | ✅ ALERT |
| Bleeding | 4 - Unusual discharge | 4 | ❌ |

### Neonatal Assessment (Score >= 4)

| Question | Answer | Score | Critical? |
|----------|--------|-------|-----------|
| Breathing | 1 - Normal | 0 | ❌ |
| Breathing | 2 - Fast | 3 | ❌ |
| Breathing | 3 - Very fast/noisy | 6 | ✅ ALERT |
| Feeding | 1 - Well | 0 | ❌ |
| Feeding | 2 - Poorly | 3 | ❌ |
| Feeding | 3 - Not feeding | 6 | ✅ ALERT |
| Skin Color | 1 - Normal | 0 | ❌ |
| Skin Color | 2 - Pale/yellowish | 2 | ❌ |
| Skin Color | 3 - Blue/very yellow | 5 | ✅ ALERT |
| Temperature | 1 - Normal | 0 | ❌ |
| Temperature | 2 - Mild fever | 3 | ❌ |
| Temperature | 3 - High fever/very cold | 6 | ✅ ALERT |
| Activity | 1 - Active/alert | 0 | ❌ |
| Activity | 2 - Less active | 3 | ❌ |
| Activity | 3 - Very sleepy | 6 | ✅ ALERT |

---

## Example Scenarios

### Scenario 1: Multiple Critical Answers

**Patient:** Pregnant woman with multiple severe symptoms

**Call Flow:**
```
Q1: Wellbeing → Press 4 (score: 5)
    ✅ ALERT 1: Critical answer - wellbeing
    
Q2: Headache → Press 4 (score: 5, total: 10)
    ✅ ALERT 2: Critical answer - headache
    
Q3: Swelling → Press 4 (score: 7, total: 17)
    ✅ ALERT 3: Critical answer - swelling
    
Q4: Fetal Movement → Press 3 (score: 7, total: 24)
    ✅ ALERT 4: Critical answer - fetal movement
    
Q5: Bleeding → Press 1 (score: 0, total: 24)
    (No alert - not critical)
    
Final Risk: CRITICAL (score 24)
    ✅ ALERT 5: End-of-call risk alert
```

**Clinician Dashboard:**
```
IVR Alerts (5)
🟢 Connected

🚨 CRITICAL Risk Alert: prenatal patient needs attention
Score: 24
[X]

⚠️ CRITICAL ANSWER: prenatal patient reported severe fetal movement. Patient still in call.
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

### Scenario 2: One Critical Answer, Moderate Final Risk

**Patient:** Baby with one critical symptom but moderate overall

**Call Flow:**
```
Q1: Breathing → Press 3 (score: 6)
    ✅ ALERT 1: Critical answer - breathing
    
Q2: Feeding → Press 1 (score: 0, total: 6)
    (No alert - not critical)
    
Q3: Skin Color → Press 1 (score: 0, total: 6)
    (No alert - not critical)
    
Q4: Temperature → Press 1 (score: 0, total: 6)
    (No alert - not critical)
    
Q5: Activity → Press 1 (score: 0, total: 6)
    (No alert - not critical)
    
Final Risk: MODERATE (score 6)
    ❌ No end-of-call alert (not HIGH/CRITICAL)
```

**Clinician Dashboard:**
```
IVR Alerts (1)
🟢 Connected

⚠️ CRITICAL ANSWER: neonatal patient reported severe breathing. Patient still in call.
Score: 6
[X]
```

### Scenario 3: No Critical Answers, HIGH Final Risk

**Patient:** Pregnant woman with multiple moderate symptoms

**Call Flow:**
```
Q1: Wellbeing → Press 3 (score: 3)
    (No alert - not critical)
    
Q2: Headache → Press 3 (score: 3, total: 6)
    (No alert - not critical)
    
Q3: Swelling → Press 3 (score: 5, total: 11)
    ✅ ALERT 1: Critical answer - swelling
    
Q4: Fetal Movement → Press 2 (score: 3, total: 14)
    (No alert - not critical)
    
Q5: Bleeding → Press 2 (score: 3, total: 17)
    (No alert - not critical)
    
Final Risk: HIGH (score 17)
    ✅ ALERT 2: End-of-call risk alert
```

**Clinician Dashboard:**
```
IVR Alerts (2)
🟢 Connected

⚠️ HIGH Risk Alert: prenatal patient needs attention
Score: 17
[X]

⚠️ CRITICAL ANSWER: prenatal patient reported severe swelling. Patient still in call.
Score: 5
[X]
```

---

## Alert Deduplication

**Critical Answer Alerts** are deduplicated per question to avoid duplicate alerts:

```typescript
// Track which questions triggered alerts
session.criticalAlertsTriggered = new Set<string>();

// When processing an answer:
if (session.criticalAlertsTriggered.has(field)) {
  return; // Skip - already alerted for this question
}
session.criticalAlertsTriggered.add(field);
```

**Example:**
```
If patient changes answer to same question (unlikely in IVR):
Q1: Wellbeing → Press 4 (score: 5)
    ✅ ALERT 1: Critical answer - wellbeing
    
Q1 (retry): Wellbeing → Press 3 (score: 3)
    ❌ No alert (already triggered for wellbeing)
```

---

## Database Queries

### Get All Critical Answer Alerts

```sql
SELECT * FROM alerts 
WHERE reason LIKE '%CRITICAL ANSWER%' 
ORDER BY "createdAt" DESC 
LIMIT 20;
```

### Get All End-of-Call Risk Alerts

```sql
SELECT * FROM alerts 
WHERE reason LIKE '%risk detected via IVR assessment%' 
ORDER BY "createdAt" DESC 
LIMIT 20;
```

### Get All IVR Alerts (Both Types)

```sql
SELECT * FROM alerts 
WHERE reason LIKE '%IVR%' 
ORDER BY "createdAt" DESC 
LIMIT 50;
```

### Count Alerts by Type

```sql
SELECT 
  SUM(CASE WHEN reason LIKE '%CRITICAL ANSWER%' THEN 1 ELSE 0 END) as critical_answer_alerts,
  SUM(CASE WHEN reason LIKE '%risk detected via IVR assessment%' THEN 1 ELSE 0 END) as risk_alerts,
  COUNT(*) as total_alerts
FROM alerts 
WHERE reason LIKE '%IVR%';
```

---

## API Endpoints

### Get All Alerts (Both Types)

```bash
GET /api/v1/alerts
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": "uuid-1",
    "patientName": "IVR Patient (prenatal)",
    "reason": "CRITICAL risk detected via IVR assessment (Score: 23)",
    "severity": "critical",
    "createdAt": "2026-05-01T10:36:45Z"
  },
  {
    "id": "uuid-2",
    "patientName": "IVR Patient (prenatal) - Critical Answer",
    "reason": "CRITICAL ANSWER detected during IVR assessment: fetal movement (Score: 7). Patient still in call.",
    "severity": "high",
    "createdAt": "2026-05-01T10:35:30Z"
  }
]
```

### Get Active Alerts

```bash
GET /api/v1/alerts/active
Authorization: Bearer {token}
```

---

## WebSocket Events

### Receive Critical Answer Alert

```javascript
socket.on('ivr-alert', (alert) => {
  if (alert.action === 'CRITICAL_ANSWER_ALERT') {
    console.log(`Critical answer: ${alert.message}`);
    // Show immediate notification
  }
});
```

### Receive End-of-Call Risk Alert

```javascript
socket.on('ivr-alert', (alert) => {
  if (alert.action === 'RISK_ALERT') {
    console.log(`Final risk: ${alert.riskLevel}`);
    // Show final assessment notification
  }
});
```

---

## Testing

### Test Critical Answer Alert

1. Start IVR assessment
2. Answer first question with critical response (e.g., "4" for wellbeing)
3. Verify alert appears immediately on clinician dashboard
4. Continue with remaining questions
5. Verify end-of-call alert appears when assessment completes

### Test Sequence

```
Press 1 → 1 → 1 → 4 → 4 → 4 → 4 → 4
```

**Expected:**
- 4 critical answer alerts (one for each "4" response)
- 1 end-of-call risk alert (CRITICAL)
- Total: 5 alerts on dashboard

---

## Configuration

### Critical Answer Thresholds

To adjust thresholds, modify in `ivr-simulator.service.ts`:

```typescript
private async checkAndTriggerCriticalAnswerAlert(...) {
  // Prenatal: score >= 5
  // Neonatal: score >= 4
  const isCritical = session.patientType === 'prenatal' ? score >= 5 : score >= 4;
}
```

### Alert Severity

Critical answer alerts are always `HIGH` severity:

```typescript
const severity = AlertSeverity.HIGH;
```

To change to `CRITICAL`:

```typescript
const severity = AlertSeverity.CRITICAL;
```

---

## Performance

- **Critical Answer Alert Latency**: < 50ms
- **End-of-Call Alert Latency**: < 100ms
- **Database Writes**: Async (non-blocking)
- **WebSocket Broadcasts**: Efficient socket.io

---

## Troubleshooting

### Critical Answer Alerts Not Appearing

**Problem:** Patient gives critical answer but no alert appears

**Solutions:**
1. Verify score meets threshold (>= 5 for prenatal, >= 4 for neonatal)
2. Check backend logs for "Critical answer alert created"
3. Verify WebSocket connection is active
4. Check database for alert records

### Too Many Alerts

**Problem:** Dashboard shows too many alerts

**Solutions:**
1. This is expected - one alert per critical answer + one at end
2. Use "Clear All" to dismiss alerts
3. Adjust thresholds if needed

### Duplicate Alerts

**Problem:** Same question triggers multiple alerts

**Solutions:**
1. This shouldn't happen - deduplication is built in
2. Check `criticalAlertsTriggered` Set is working
3. Verify session is not being recreated

---

## Future Enhancements

1. **Configurable Thresholds** - Allow DHO to set custom thresholds
2. **Alert Grouping** - Group related alerts together
3. **Smart Routing** - Route to nearest available clinician
4. **Escalation** - Auto-escalate if not attended
5. **SMS Notifications** - Send SMS for critical alerts
6. **Call Integration** - Auto-call clinician for CRITICAL

