# Backend-Connected IVR Simulator API

## Overview

The IVR Simulator API enables the Flutter mobile app to interact with a real backend IVR system. Instead of hardcoded responses, the simulator now connects to your NestJS backend to process health assessments, calculate risk levels, and log interactions.

## Architecture

```
Flutter IVR Simulator (Mobile)
         ↓ HTTP POST
NestJS IVR Simulator Service
         ↓
IVR Session Management
         ↓
Risk Scoring Engine
         ↓
Database Logging
```

## API Endpoints

### 1. Initialize Session
**POST** `/api/v1/ivr/simulator/init`

Initialize a new IVR simulator session.

**Request:**
```json
{
  "sessionId": "1234567890"
}
```

**Response:**
```json
{
  "sessionId": "1234567890",
  "message": "Welcome to SafeMother Health IVR. Press 1 to continue.",
  "nextMenu": "welcome"
}
```

**Status Codes:**
- `200` - Session initialized successfully
- `400` - Missing sessionId

---

### 2. Process Digit Input
**POST** `/api/v1/ivr/simulator/digit`

Process a digit (0-9, *, #) from the user and return the next IVR response.

**Request:**
```json
{
  "sessionId": "1234567890",
  "digit": "1"
}
```

**Response:**
```json
{
  "message": "Symptom Checker. Press 1 for Pregnancy Health. Press 2 for Baby Health.",
  "nextMenu": "symptom_type",
  "action": "SYMPTOM_TYPE",
  "riskLevel": null,
  "shouldHangup": false
}
```

**Response Fields:**
- `message` - Text to display to user
- `nextMenu` - Next menu state (for tracking flow)
- `action` - Action type (MAIN_MENU, SYMPTOM_TYPE, PRENATAL_Q1, etc.)
- `riskLevel` - Risk assessment result (LOW, MODERATE, HIGH, CRITICAL) - only present at end
- `shouldHangup` - Whether to end the call

**Status Codes:**
- `200` - Digit processed successfully
- `400` - Missing sessionId or digit

---

### 3. Get Session Summary
**GET** `/api/v1/ivr/simulator/summary/:sessionId`

Retrieve the summary of a completed IVR session.

**Response:**
```json
{
  "sessionId": "1234567890",
  "patientType": "prenatal",
  "riskScore": 12,
  "riskLevel": "MODERATE",
  "answers": {
    "wellbeing": "2",
    "headache": "1",
    "swelling": "3",
    "fetalMovement": "2",
    "bleeding": "1"
  },
  "responseCount": 8
}
```

**Status Codes:**
- `200` - Summary retrieved
- `400` - Missing sessionId

---

### 4. End Session
**POST** `/api/v1/ivr/simulator/end`

End an IVR session and cleanup resources.

**Request:**
```json
{
  "sessionId": "1234567890"
}
```

**Response:**
```json
{
  "message": "Session ended",
  "sessionId": "1234567890"
}
```

**Status Codes:**
- `200` - Session ended successfully
- `400` - Missing sessionId

---

## IVR Flow States

### Main Menu States
- `welcome` - Initial welcome screen
- `main_menu` - Main menu (Symptoms, Appointments, Clinician, Emergency)
- `symptom_type` - Choose between prenatal or neonatal assessment

### Prenatal Assessment
- `prenatal_q1` - General wellbeing question
- `prenatal_q2` - Headache question
- `prenatal_q3` - Swelling question
- `prenatal_q4` - Fetal movement question
- `prenatal_q5` - Bleeding/discharge question

### Neonatal Assessment
- `neonatal_q1` - Breathing question
- `neonatal_q2` - Feeding question
- `neonatal_q3` - Skin color question
- `neonatal_q4` - Temperature question
- `neonatal_q5` - Activity level question

### Result States
- `risk_result` - Risk assessment result
- `appointment_check` - Appointment information
- `health_tips` - Health tips
- `emergency_contacts` - Emergency contact information

---

## Risk Scoring Algorithm

### Prenatal Risk Scoring

| Question | Answer | Score |
|----------|--------|-------|
| Wellbeing | Very well | 0 |
| | Tired | 1 |
| | Unwell | 3 |
| | In pain | 5 |
| Headache | No | 0 |
| | Mild | 1 |
| | Severe | 4 |
| | Severe + blurred vision | 6 |
| Swelling | No | 0 |
| | Mild feet | 2 |
| | Hands/face | 5 |
| | Sudden severe | 7 |
| Fetal Movement | Normal | 0 |
| | Less than usual | 3 |
| | No movement | 7 |
| Bleeding | None | 0 |
| | Light spotting | 3 |
| | Heavy | 8 |
| | Unusual discharge | 4 |

**Risk Levels:**
- `LOW` - Score 0-7
- `MODERATE` - Score 8-14
- `HIGH` - Score 15-19
- `CRITICAL` - Score 20+

### Neonatal Risk Scoring

| Question | Answer | Score |
|----------|--------|-------|
| Breathing | Normal | 0 |
| | Fast | 3 |
| | Very fast/noisy | 6 |
| Feeding | Well | 0 |
| | Poorly | 3 |
| | Not at all | 6 |
| Skin Color | Normal | 0 |
| | Pale/yellowish | 2 |
| | Blue/very yellow | 5 |
| Temperature | Normal | 0 |
| | Mild fever | 3 |
| | High fever/very cold | 6 |
| Activity | Active/alert | 0 |
| | Less active | 3 |
| | Very sleepy | 6 |

**Risk Levels:** Same as prenatal (0-7 LOW, 8-14 MODERATE, 15-19 HIGH, 20+ CRITICAL)

---

## Example Flow: Prenatal Assessment

```
1. User presses "1" (Symptoms)
   → Response: "Symptom Checker. Press 1 for Pregnancy Health. Press 2 for Baby Health."
   → nextMenu: "symptom_type"

2. User presses "1" (Pregnancy)
   → Response: "Question 1 of 5. How are you feeling today? Press 1 for very well..."
   → nextMenu: "prenatal_q1"

3. User presses "2" (Tired)
   → Score: +1
   → Response: "Question 2 of 5. Do you have a headache?..."
   → nextMenu: "prenatal_q2"

4. User presses "3" (Severe headache)
   → Score: +4 (Total: 5)
   → Response: "Question 3 of 5. Do you have swelling?..."
   → nextMenu: "prenatal_q3"

5. User presses "4" (Sudden severe swelling)
   → Score: +7 (Total: 12)
   → Response: "Question 4 of 5. Is your baby moving?..."
   → nextMenu: "prenatal_q4"

6. User presses "2" (Less than usual)
   → Score: +3 (Total: 15)
   → Response: "Question 5 of 5. Do you have bleeding?..."
   → nextMenu: "prenatal_q5"

7. User presses "1" (None)
   → Score: +0 (Total: 15)
   → Response: "Your risk assessment is complete. Risk Level: HIGH. You need urgent medical attention..."
   → nextMenu: "main_menu"
   → riskLevel: "HIGH"
   → shouldHangup: false
```

---

## Session Management

### Session Storage
Sessions are stored in-memory in the `IvrSimulatorService`. Each session contains:
- `sessionId` - Unique identifier
- `currentMenu` - Current state in the IVR flow
- `responses` - Array of all responses shown
- `riskScore` - Accumulated risk score
- `patientType` - "prenatal" or "neonatal"
- `answers` - User's answers to assessment questions

### Session Lifecycle
1. **Initialize** - `POST /simulator/init` creates new session
2. **Process** - `POST /simulator/digit` updates session state
3. **Query** - `GET /simulator/summary/:sessionId` retrieves session data
4. **End** - `POST /simulator/end` cleans up session

### Session Timeout
Sessions are stored in-memory and persist for the duration of the application. In production, consider:
- Adding TTL (time-to-live) for sessions
- Persisting sessions to database
- Implementing session cleanup

---

## Integration with Flutter

### Basic Usage

```dart
// Initialize session
final response = await http.post(
  Uri.parse('http://localhost:3000/api/v1/ivr/simulator/init'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({'sessionId': sessionId}),
);

// Process digit
final response = await http.post(
  Uri.parse('http://localhost:3000/api/v1/ivr/simulator/digit'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({
    'sessionId': sessionId,
    'digit': '1',
  }),
);

final data = jsonDecode(response.body);
setState(() {
  screenText = data['message'];
  riskLevel = data['riskLevel'];
  shouldHangup = data['shouldHangup'];
});
```

### Configuration

Update the API base URL in `ivr_simulator_screen.dart`:

```dart
final String _apiBaseUrl = 'http://localhost:3000/api/v1/ivr';
```

For production, use your deployed backend URL:
```dart
final String _apiBaseUrl = 'https://api.safemothermalawi.com/api/v1/ivr';
```

---

## Logging and Analytics

All IVR interactions are logged to the database via `IvrCallLogService`:
- Session ID
- Caller phone (simulator: `sim-{sessionId}`)
- Action type (MAIN_MENU, SYMPTOM_TYPE, etc.)
- Digit pressed
- Timestamp

Access logs via:
- `GET /api/v1/ivr/analytics/call-logs` - View all call logs
- `GET /api/v1/ivr/analytics/call-logs/:sessionId` - View specific session

---

## Error Handling

### Common Errors

**400 Bad Request**
```json
{
  "statusCode": 400,
  "message": "sessionId and digit are required"
}
```

**Connection Timeout**
- Default timeout: 5 seconds
- Implement retry logic in Flutter app
- Show user-friendly error message

**Invalid Menu State**
- Returns error message and resets to main menu
- Logged for debugging

---

## Testing

### Manual Testing with cURL

```bash
# Initialize session
curl -X POST http://localhost:3000/api/v1/ivr/simulator/init \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-123"}'

# Process digit
curl -X POST http://localhost:3000/api/v1/ivr/simulator/digit \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-123","digit":"1"}'

# Get summary
curl http://localhost:3000/api/v1/ivr/simulator/summary/test-123

# End session
curl -X POST http://localhost:3000/api/v1/ivr/simulator/end \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-123"}'
```

### Postman Collection

Import this collection into Postman:

```json
{
  "info": {
    "name": "IVR Simulator API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Init Session",
      "request": {
        "method": "POST",
        "url": "http://localhost:3000/api/v1/ivr/simulator/init",
        "body": {
          "mode": "raw",
          "raw": "{\"sessionId\":\"{{$timestamp}}\"}"
        }
      }
    },
    {
      "name": "Process Digit",
      "request": {
        "method": "POST",
        "url": "http://localhost:3000/api/v1/ivr/simulator/digit",
        "body": {
          "mode": "raw",
          "raw": "{\"sessionId\":\"{{sessionId}}\",\"digit\":\"1\"}"
        }
      }
    }
  ]
}
```

---

## Performance Considerations

- **Session Storage**: In-memory storage is fast but limited by RAM
- **Concurrent Sessions**: Can handle thousands of concurrent sessions
- **Response Time**: Typical response time < 100ms
- **Database Logging**: Async logging doesn't block API responses

---

## Future Enhancements

1. **Persistent Sessions** - Store sessions in Redis or database
2. **Session Recovery** - Resume interrupted sessions
3. **Multi-language Support** - Localize prompts to Chichewa
4. **Voice Integration** - Add text-to-speech responses
5. **Clinician Routing** - Route high-risk patients to available clinicians
6. **SMS Fallback** - Send assessment results via SMS
7. **Analytics Dashboard** - Real-time IVR metrics and insights

---

## Support

For issues or questions:
1. Check the logs: `npm run start` shows all IVR activity
2. Test endpoints with cURL or Postman
3. Verify backend is running: `GET /api/v1/ivr/health`
4. Check Flutter app connection settings
