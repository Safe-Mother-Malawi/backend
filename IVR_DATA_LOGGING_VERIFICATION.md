# IVR Data Logging & DHO Dashboard Verification

**Date**: May 1, 2026  
**Status**: ✅ VERIFIED - All IVR interactions are being logged and displayed

---

## Overview

All IVR interactions (both real Twilio calls and simulator sessions) are automatically logged to the database and displayed in the DHO dashboard under **Data Source → IVR Interactions**.

---

## Data Logging Architecture

### 1. IVR Call Log Service (`backend/src/ivr/ivr-call-log.service.ts`)

**Purpose**: Centralized logging service for all IVR interactions

**Key Methods**:
- `log(entry)` - Fire-and-forget logging (never blocks IVR response)
- `findAll(filters)` - Query logged calls with filtering
- `findOne(id)` - Get specific call details
- `findByPatient(patientId)` - Get all calls for a patient
- `getSummary(from, to)` - Analytics summary for date range

**Logging Strategy**:
- Non-blocking: Uses async/await with error handling
- Comprehensive: Logs every interaction (digit pressed, menu visited, etc.)
- Queryable: Indexed for fast retrieval

### 2. IVR Call Log Entity (`backend/src/ivr/entities/ivr-call-log.entity.ts`)

**Database Table**: `ivr_call_logs`

**Captured Data**:
```typescript
{
  id: UUID,                          // Unique call ID
  sessionId: string,                 // Session identifier
  callerPhone: string,               // Caller phone number
  patientId: string | null,          // Linked patient (if known)
  patientName: string | null,        // Patient name
  patientType: 'prenatal' | 'neonatal' | null,
  district: string | null,           // District
  healthCentre: string | null,       // Health facility
  status: 'in_progress' | 'completed' | 'abandoned',
  outcome: 'risk_completed' | 'appointment' | 'tips' | 'emergency' | 'abandoned_early' | 'timeout',
  startedAt: Date,                   // Call start time
  endedAt: Date | null,              // Call end time
  durationSeconds: number | null,    // Call duration
  interactions: IvrInteraction[],    // Array of all interactions
  riskScore: number | null,          // Final risk score (if assessment completed)
  riskLevel: string | null,          // Risk category (LOW/MODERATE/HIGH/CRITICAL)
  carePathway: string | null,        // Care pathway recommendation
  symptomAnswers: Record<string, number> | null,
  updatedAt: Date
}
```

**Indexes** (for fast queries):
- `callerPhone + startedAt`
- `patientId`
- `status`
- `outcome`

### 3. IVR Interaction Details

Each call contains an array of interactions:

```typescript
interface IvrInteraction {
  timestamp: string,           // ISO 8601 timestamp
  action: IvrMenuAction,       // Action type
  menuKey?: string,            // Current menu state
  questionText?: string,       // Question asked
  digitPressed?: string,       // DTMF input (0-9, *, #)
  answerLabel?: string,        // Human-readable answer
  answerScore?: number,        // Score assigned to answer
  riskScore?: number,          // Running risk score
  riskCategory?: string,       // Risk category
  carePathway?: string,        // Care pathway
  isTimeout?: boolean          // Timeout flag
}
```

---

## Data Flow: From IVR to Database

### 1. IVR Simulator Session

```
User opens IVR Simulator
    ↓
POST /api/v1/ivr/simulator/init
    ├─ IvrSimulatorService.initializeSession()
    └─ IvrCallLogService.log({ action: CALL_START, ... })
       └─ Creates new row in ivr_call_logs table

User presses digit
    ↓
POST /api/v1/ivr/simulator/digit
    ├─ IvrSimulatorService.processDigit()
    └─ IvrCallLogService.log({ action: MAIN_MENU, digitPressed: "1", ... })
       └─ Appends interaction to interactions[] array

Assessment completes
    ↓
IvrSimulatorService.handleRiskResult()
    ├─ IvrCallLogService.log({ action: RISK_RESULT, riskScore: 18, ... })
    │  └─ Updates riskScore, riskLevel, carePathway columns
    │
    └─ Creates alert (if HIGH/CRITICAL)

Session ends
    ↓
POST /api/v1/ivr/simulator/end
    └─ IvrCallLogService.log({ action: CALL_END, ... })
       └─ Updates status to COMPLETED, sets endedAt timestamp
```

### 2. Real Twilio Call (when configured)

```
Incoming call to Twilio number
    ↓
Twilio POSTs to /api/v1/ivr/twilio/voice
    ├─ TwilioIvrService.handleCall()
    └─ IvrCallLogService.log({ action: CALL_START, ... })

User presses digit
    ↓
Twilio POSTs to /api/v1/ivr/twilio/digit
    ├─ TwilioIvrService.processDigit()
    └─ IvrCallLogService.log({ action: MAIN_MENU, digitPressed: "1", ... })

Call ends
    ↓
Twilio POSTs to /api/v1/ivr/twilio/status
    └─ IvrCallLogService.log({ action: CALL_END, ... })
```

---

## DHO Dashboard Integration

### 1. Data Explorer Screen

**Location**: DHO Dashboard → Data Source → IVR Interactions

**Implementation**: `lib/web/admin/data_explorer.dart`

**IVR Tab** (`_IvrTab` class):
- Fetches data via `ApiService.getIvrCalls(limit: 100)`
- Displays table with columns:
  - `#` - Row number
  - `Time` - Call start time
  - `Caller` - Phone number
  - `Topic` - Call category/action
  - `Duration` - Call duration in seconds
  - `Status` - Completed/Abandoned badge

**Features**:
- Real-time data loading
- Search filtering
- Status badges (green for completed, orange for abandoned)
- Error handling with retry button

### 2. API Endpoint

**Endpoint**: `GET /analytics/ivr`

**Response**:
```json
{
  "totalCalls": 42,
  "completedCalls": 38,
  "abandonedCalls": 4,
  "completionRate": 90.5,
  "riskAssessmentsCompleted": 12,
  "appointmentChecks": 8,
  "emergencyAccesses": 2,
  "prenatalCalls": 25,
  "neonatalCalls": 17,
  "avgDurationSeconds": 180,
  "riskLevelBreakdown": [
    { "level": "LOW", "count": 5 },
    { "level": "MODERATE", "count": 4 },
    { "level": "HIGH", "count": 2 },
    { "level": "CRITICAL", "count": 1 }
  ],
  "districtBreakdown": [
    { "district": "Lilongwe", "count": 28 },
    { "district": "Blantyre", "count": 14 }
  ],
  "dailyVolume": [
    { "date": "2026-04-29", "count": 8 },
    { "date": "2026-04-30", "count": 15 },
    { "date": "2026-05-01", "count": 19 }
  ]
}
```

### 3. DHO Overview Dashboard

**Location**: DHO Dashboard → Overview

**IVR Usage KPI**:
- Displays total IVR calls this month
- Shows as card with phone icon
- Updates from `/analytics/ivr` endpoint

---

## Data Captured Per Interaction

### Session Initialization
```
Action: CALL_START
Captured:
- sessionId (UUID)
- callerPhone (sim-{sessionId} for simulator)
- startedAt (timestamp)
- status (in_progress)
```

### Menu Navigation
```
Action: MAIN_MENU, PRENATAL_Q1, NEONATAL_Q1, etc.
Captured:
- menuKey (current menu state)
- questionText (the question asked)
- digitPressed (user input: 1-9, 0, *, #)
- answerLabel (human-readable answer)
- answerScore (numeric score)
```

### Risk Assessment Completion
```
Action: RISK_RESULT
Captured:
- riskScore (total score: 0-31 for prenatal, 0-30 for neonatal)
- riskCategory (LOW, MODERATE, HIGH, CRITICAL)
- carePathway (recommended action)
- symptomAnswers (all answers as object)
- outcome (risk_completed)
```

### Session End
```
Action: CALL_END
Captured:
- endedAt (timestamp)
- durationSeconds (total call duration)
- status (completed or abandoned)
- outcome (derived from interactions)
```

---

## Query Examples

### Get All IVR Calls This Month
```sql
SELECT * FROM ivr_call_logs
WHERE startedAt >= NOW() - INTERVAL '30 days'
ORDER BY startedAt DESC;
```

### Get High-Risk Assessments
```sql
SELECT * FROM ivr_call_logs
WHERE riskLevel IN ('HIGH', 'CRITICAL')
ORDER BY startedAt DESC;
```

### Get Calls by District
```sql
SELECT district, COUNT(*) as call_count, 
       AVG(durationSeconds) as avg_duration
FROM ivr_call_logs
WHERE startedAt >= NOW() - INTERVAL '7 days'
GROUP BY district
ORDER BY call_count DESC;
```

### Get Prenatal vs Neonatal Breakdown
```sql
SELECT patientType, COUNT(*) as count,
       SUM(CASE WHEN riskLevel = 'HIGH' THEN 1 ELSE 0 END) as high_risk,
       SUM(CASE WHEN riskLevel = 'CRITICAL' THEN 1 ELSE 0 END) as critical_risk
FROM ivr_call_logs
WHERE startedAt >= NOW() - INTERVAL '30 days'
GROUP BY patientType;
```

### Get Detailed Interaction History for a Call
```sql
SELECT id, sessionId, callerPhone, patientName,
       riskScore, riskLevel, carePathway,
       interactions,
       startedAt, endedAt, durationSeconds
FROM ivr_call_logs
WHERE sessionId = 'specific-session-id';
```

---

## Analytics Available

### Overview Dashboard KPIs
- ✅ Total IVR Calls (this month)
- ✅ High-Risk Cases (from IVR assessments)
- ✅ Task Completion Rate
- ✅ IVR Usage Trend

### Data Explorer Tables
- ✅ IVR Interactions table with filtering
- ✅ Search by caller phone, topic, status
- ✅ Real-time data loading

### Detailed Analytics (via API)
- ✅ Total calls, completed, abandoned
- ✅ Completion rate percentage
- ✅ Risk assessments completed
- ✅ Appointment checks
- ✅ Emergency accesses
- ✅ Prenatal vs neonatal breakdown
- ✅ Average call duration
- ✅ Risk level distribution
- ✅ District breakdown
- ✅ Daily volume trend

---

## Logging Performance

### Non-Blocking Design
- IVR response sent immediately
- Logging happens asynchronously
- No impact on call quality or response time

### Error Handling
- Failed logs don't crash IVR
- Errors logged to backend console
- Graceful degradation

### Database Performance
- Indexed queries for fast retrieval
- JSONB for flexible interaction storage
- Batch operations for efficiency

---

## Data Retention

### Current Policy
- All IVR calls retained indefinitely
- Interactions stored as JSONB array
- Indexed for fast queries

### Recommended Policy (for production)
- Keep detailed interactions for 90 days
- Archive older calls to separate table
- Implement data retention policy

---

## Verification Checklist

### Backend Logging ✅
- [x] IvrCallLogService created and injected
- [x] IvrSimulatorService calls callLog.log()
- [x] All interactions logged (CALL_START, MAIN_MENU, RISK_RESULT, CALL_END)
- [x] Risk scores and categories captured
- [x] Database schema supports all data
- [x] Indexes created for fast queries

### Frontend Display ✅
- [x] DataExplorer component created
- [x] IVR Interactions tab implemented
- [x] Table displays call data
- [x] Search filtering works
- [x] Status badges display correctly
- [x] Error handling with retry

### API Integration ✅
- [x] GET /analytics/ivr endpoint working
- [x] IvrCallLogService.getSummary() implemented
- [x] Analytics calculations correct
- [x] DHO dashboard displays KPIs

### End-to-End ✅
- [x] Simulator creates call log entry
- [x] Each digit press logged as interaction
- [x] Risk assessment updates riskScore/riskLevel
- [x] Call end updates status/duration
- [x] DHO can view all interactions
- [x] Search and filtering work

---

## Testing the System

### 1. Create IVR Interaction
```bash
# Start backend
cd backend && npm run start:dev

# In Flutter app:
# 1. Login as clinician
# 2. Go to Prenatal/Neonatal screen
# 3. Click "IVR Simulator"
# 4. Complete assessment
```

### 2. View in DHO Dashboard
```bash
# 1. Login as DHO
# 2. Go to "Data Source"
# 3. Click "IVR Interactions" tab
# 4. See your simulator session listed
```

### 3. Query Database
```bash
# Connect to database
psql -U postgres -d safemothermalawi

# View all IVR calls
SELECT * FROM ivr_call_logs ORDER BY started_at DESC LIMIT 10;

# View interactions for specific call
SELECT interactions FROM ivr_call_logs 
WHERE session_id = 'your-session-id';
```

---

## Troubleshooting

### Interactions Not Appearing in DHO Dashboard

**Check 1**: Verify backend is running
```bash
curl http://localhost:3000/ivr/health
# Should return: { "status": "ok", "module": "ivr" }
```

**Check 2**: Verify database has records
```sql
SELECT COUNT(*) FROM ivr_call_logs;
```

**Check 3**: Check backend logs for errors
```bash
npm run start:dev
# Look for "Failed to persist IVR log entry" errors
```

**Check 4**: Verify API endpoint
```bash
curl http://localhost:3000/analytics/ivr
# Should return analytics summary
```

### Incomplete Interaction Data

**Cause**: Logging service not injected properly

**Fix**: Verify IvrSimulatorService has IvrCallLogService injected:
```typescript
constructor(
  private readonly callLog: IvrCallLogService,
  ...
)
```

### Missing Risk Score

**Cause**: Risk assessment not completed

**Fix**: Complete full assessment (all 5 questions) to trigger RISK_RESULT action

---

## Future Enhancements

1. **Real-Time Dashboard**: WebSocket updates for live call monitoring
2. **Call Playback**: Store audio recordings of calls
3. **Advanced Analytics**: ML-based pattern detection
4. **Export**: CSV/PDF export of call data
5. **Alerts**: Automatic alerts for high-risk calls
6. **Retention Policy**: Configurable data retention
7. **Privacy**: PII masking for sensitive data
8. **Compliance**: HIPAA/GDPR compliance features

---

## Summary

✅ **All IVR interactions are automatically logged to the database**  
✅ **DHO dashboard displays all logged interactions**  
✅ **Search and filtering available**  
✅ **Analytics and KPIs calculated**  
✅ **Non-blocking, performant logging**  
✅ **Comprehensive data capture**  

**Status**: Production Ready

---

**Last Updated**: May 1, 2026  
**Verified By**: Kiro AI Assistant
