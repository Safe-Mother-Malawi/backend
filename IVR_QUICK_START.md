# IVR System - Quick Start Guide

## What's Implemented

✅ **Complete IVR System** with:
- Backend-connected IVR simulator (NestJS)
- Real-time clinician alerts (WebSocket)
- Flutter UI integration
- Database persistence
- Risk scoring algorithm

---

## Quick Setup (5 minutes)

### 1. Backend
```bash
cd backend
npm run start:dev
```
✅ Backend runs on `http://localhost:3000`

### 2. Frontend
```bash
cd safe-mother-malawi/safemothermalawi_frontend
flutter pub get
flutter run
```
✅ Flutter app connects to backend automatically

### 3. Test It
1. Login as clinician
2. Go to **Prenatal** or **Neonatal** screen
3. Click **"IVR Simulator"** button
4. Use dial pad to answer health questions
5. Complete assessment
6. Check **Clinician Dashboard** → **IVR Alerts** section
7. See alert appear in real-time! 🎉

---

## How It Works

### IVR Simulator Flow
```
User presses digit (1-9)
    ↓
Backend processes question
    ↓
Returns next question or risk result
    ↓
If HIGH/CRITICAL risk → Alert created
    ↓
Alert broadcast to clinician dashboard
    ↓
Clinician sees alert in real-time
```

### Risk Scoring
- **Prenatal**: 5 questions about pregnancy health
- **Neonatal**: 5 questions about baby health
- **Scoring**: 0-31 (prenatal) or 0-30 (neonatal)
- **Alert Trigger**: Score ≥ 15 (HIGH) or ≥ 20 (CRITICAL)

---

## Key Files

### Backend
- `backend/src/ivr/ivr-simulator.service.ts` - IVR logic
- `backend/src/ivr/ivr-alerts.gateway.ts` - WebSocket alerts
- `backend/src/ivr/ivr.controller.ts` - API endpoints

### Frontend
- `lib/services/ivr_websocket_service.dart` - WebSocket client
- `lib/mobile/ivr/screens/ivr_simulator_screen.dart` - Dial pad UI
- `lib/screens/clinician/pages/patients_page.dart` - Alert display

---

## API Endpoints

### Initialize Session
```
POST /api/v1/ivr/simulator/init
```

### Process Digit
```
POST /api/v1/ivr/simulator/digit
Body: { "sessionId": "uuid", "digit": "1" }
```

### Get Summary
```
GET /api/v1/ivr/simulator/summary/:sessionId
```

### End Session
```
POST /api/v1/ivr/simulator/end
Body: { "sessionId": "uuid" }
```

---

## WebSocket Connection

**Namespace**: `/ivr-alerts`

**Events**:
- `join-alerts` - Clinician joins channel
- `ivr-alert` - Alert received
- `connection` - Connected
- `disconnection` - Disconnected

---

## Testing Scenarios

### Scenario 1: Low Risk
- Answer all questions with option "1"
- Result: LOW risk (no alert)

### Scenario 2: High Risk
- Answer questions with options "3" or "4"
- Result: HIGH risk (alert created)
- Alert appears on clinician dashboard

### Scenario 3: Critical Risk
- Answer questions with highest risk options
- Result: CRITICAL risk (alert created)
- Alert appears with 🚨 emoji

---

## Troubleshooting

### Backend won't start
```bash
# Check if port 3000 is in use
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows
```

### WebSocket not connecting
- Ensure backend is running
- Check browser console for errors
- Verify `http://localhost:3000` is accessible

### Alerts not appearing
- Check backend logs for alert creation
- Verify clinician is logged in
- Check database for alert records

### Flutter app crashes
```bash
flutter clean
flutter pub get
flutter run
```

---

## Database Queries

### View all alerts
```sql
SELECT * FROM alert ORDER BY created_at DESC;
```

### View HIGH/CRITICAL alerts
```sql
SELECT * FROM alert 
WHERE severity IN ('high', 'critical') 
ORDER BY created_at DESC;
```

### View IVR call logs
```sql
SELECT * FROM ivr_call_log 
ORDER BY created_at DESC;
```

---

## Next Steps

1. ✅ System is ready to use
2. Test with different risk scenarios
3. Verify alerts appear on clinician dashboard
4. Check database for alert records
5. Optional: Add sound notifications
6. Optional: Add push notifications
7. Optional: Integrate with real Twilio

---

## Support

**Backend Logs**:
```bash
npm run start:dev
```

**Flutter Logs**:
```bash
flutter run -v
```

**Database**:
- Check `alert` table for created alerts
- Check `ivr_call_log` table for session history

---

**Status**: ✅ Ready to Use  
**Last Updated**: May 1, 2026
