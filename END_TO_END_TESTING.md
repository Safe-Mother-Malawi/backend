# Firebase Push Notifications - End-to-End Testing Guide

## Complete Testing Flow

This guide walks through the complete end-to-end testing of Firebase push notifications across Android, Web, and Backend.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Firebase Console                         │
│              (Project: fir-mobile-app-34535)                │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌─────────┐    ┌──────────┐    ┌──────────────┐
   │ Backend │    │ Android  │    │ Web Browser  │
   │ NestJS  │    │ Flutter  │    │ React/Vue    │
   └────┬────┘    └──────┬───┘    └──────┬───────┘
        │                │                │
        │  1. Register FCM Token          │
        │◄────────────────────────────────┤
        │                                 │
        │  2. Send Push Notification      │
        │─────────────────────────────────→
        │                                 │
        │  3. Firebase Delivers           │
        │                                 │
        │  4. Device Receives             │
        │                                 │
        └─────────────────────────────────┘
```

---

## Phase 1: Backend Setup

### Step 1.1: Verify Firebase Service Account

```bash
cd safemothermalawi/backend

# Check if FIREBASE_SERVICE_ACCOUNT is set
echo $FIREBASE_SERVICE_ACCOUNT

# If empty, download from Firebase Console and set
export FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
```

### Step 1.2: Start Backend

```bash
npm run start:dev
```

**Expected Output:**
```
[Nest] 12345 - 05/22/2024, 10:00:00 AM     LOG [FirebaseService] Firebase Admin SDK initialized successfully
[Nest] 12345 - 05/22/2024, 10:00:00 AM     LOG [FirebaseService] Project ID: fir-mobile-app-34535
```

### Step 1.3: Verify Backend is Running

```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{"status":"ok"}
```

---

## Phase 2: Android/Mobile Setup

### Step 2.1: Run Mobile App

```bash
cd safemothermalawi/safe-mother-malawi

# Get dependencies
flutter pub get

# Run on device/emulator
flutter run
```

**Expected Output in Logs:**
```
✓ FCM Service initialized
✓ Notification Service initialized
✓ Notification permission granted
✓ FCM Token obtained: eXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
✓ FCM token registered successfully
```

### Step 2.2: Open FCM Test Screen

Navigate to the FCM Testing screen in your app to see:
- Current FCM Token
- Stored FCM Token
- Status indicators
- Received notifications

### Step 2.3: Copy FCM Token

From the test screen, copy the FCM token. You'll need this for testing.

---

## Phase 3: Token Registration Testing

### Step 3.1: Verify Token Registration

Check backend logs for:
```
✓ Device token registered successfully
```

Or query the database:
```sql
SELECT * FROM device_tokens WHERE userId = 'your_user_id';
```

### Step 3.2: Manual Token Registration (Optional)

If token wasn't auto-registered, manually register:

```bash
# Get auth token
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  | jq -r '.access_token')

# Register device token
curl -X POST http://localhost:3000/push-notifications/register \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_FCM_TOKEN_HERE",
    "platform": "mobile",
    "deviceName": "Test Device"
  }'
```

**Expected Response:**
```json
{
  "id": "uuid",
  "userId": "user_id",
  "token": "YOUR_FCM_TOKEN_HERE",
  "platform": "mobile",
  "deviceName": "Test Device",
  "isActive": true,
  "createdAt": "2024-05-22T10:00:00Z"
}
```

---

## Phase 4: Send Test Notification

### Step 4.1: Get Auth Token

```bash
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  | jq -r '.access_token')

echo "Auth Token: $TOKEN"
```

### Step 4.2: Send Test Notification

```bash
curl -X POST http://localhost:3000/push-notifications/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceToken": "YOUR_FCM_TOKEN_HERE"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Test notification sent",
  "token": "YOUR_FCM_TOKEN_HERE"
}
```

**Backend Logs:**
```
[Nest] 12345 - 05/22/2024, 10:00:00 AM     LOG [PushNotificationsService] Push notification sent: 1 successful, 0 failed
```

---

## Phase 5: Verify Notification Receipt

### Step 5.1: Check Mobile Device

**Expected Behavior:**
1. Notification appears in system tray
2. Title: "Test Notification"
3. Body: "This is a test push notification from Safe Mother Malawi"
4. Can be tapped to open app

### Step 5.2: Check App Logs

```bash
flutter logs
```

**Expected Output:**
```
I/flutter (12345): ═══════════════════════════════════════════
I/flutter (12345): 📬 FOREGROUND MESSAGE RECEIVED
I/flutter (12345): ═══════════════════════════════════════════
I/flutter (12345): Title: Test Notification
I/flutter (12345): Body: This is a test push notification from Safe Mother Malawi
I/flutter (12345): Data: {}
I/flutter (12345): ═══════════════════════════════════════════
I/flutter (12345): 📲 Showing local notification: Test Notification
I/flutter (12345): ✓ Local notification displayed
```

### Step 5.3: Check FCM Test Screen

The notification should appear in the "Received Notifications" section with:
- Title
- Body
- Type (foreground/background)
- Timestamp

---

## Phase 6: Background Notification Testing

### Step 6.1: Close App

Close the app completely (not just minimize).

### Step 6.2: Send Notification

```bash
curl -X POST http://localhost:3000/push-notifications/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"deviceToken": "YOUR_FCM_TOKEN_HERE"}'
```

### Step 6.3: Check Device

**Expected Behavior:**
1. Notification appears in system tray
2. Tap notification to open app
3. App opens and shows notification

**App Logs:**
```
I/flutter (12345): ═══════════════════════════════════════════
I/flutter (12345): 📭 BACKGROUND MESSAGE OPENED
I/flutter (12345): ═══════════════════════════════════════════
```

---

## Phase 7: Web Testing (Optional)

### Step 7.1: Setup Web App

```bash
# Install Firebase SDK
npm install firebase

# Create service worker (see WEB_FIREBASE_SETUP.md)
# Create firebase-messaging-sw.js in public/
```

### Step 7.2: Request Permission

```javascript
const permission = await Notification.requestPermission();
if (permission === 'granted') {
  const token = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' });
  console.log('FCM Token:', token);
}
```

### Step 7.3: Register Token

```bash
curl -X POST http://localhost:3000/push-notifications/register \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "WEB_FCM_TOKEN_HERE",
    "platform": "web",
    "deviceName": "Chrome Browser"
  }'
```

### Step 7.4: Send Test Notification

```bash
curl -X POST http://localhost:3000/push-notifications/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"deviceToken": "WEB_FCM_TOKEN_HERE"}'
```

**Expected:** Notification appears in browser notification area

---

## Phase 8: Multi-Device Testing

### Step 8.1: Register Multiple Devices

Register tokens from:
- Android phone
- Android tablet
- Web browser
- iOS device (if available)

### Step 8.2: Send to User (All Devices)

```bash
curl -X POST http://localhost:3000/push-notifications/send-to-user \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "title": "Multi-Device Test",
    "body": "This notification goes to all devices"
  }'
```

**Expected:** All registered devices receive notification

### Step 8.3: Check Statistics

```bash
curl -X GET http://localhost:3000/push-notifications/statistics \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "totalTokens": 4,
  "activeTokens": 4,
  "inactiveTokens": 0,
  "byPlatform": {
    "mobile": 3,
    "web": 1
  }
}
```

---

## Phase 9: Error Handling Testing

### Step 9.1: Test Invalid Token

```bash
curl -X POST http://localhost:3000/push-notifications/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"deviceToken": "invalid_token_12345"}'
```

**Expected:**
- Request succeeds (200 OK)
- Backend logs: "Push notification sent: 0 successful, 1 failed"
- Invalid token is deactivated

### Step 9.2: Test Unregister

```bash
curl -X DELETE http://localhost:3000/push-notifications/unregister/YOUR_FCM_TOKEN_HERE \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:**
- Token is removed from database
- Future notifications won't be sent to this token

---

## Phase 10: Permission Testing

### Step 10.1: Deny Permission

1. Uninstall app
2. Run app
3. Deny notification permission when prompted
4. App should still work (no crash)

**Expected:** App functions normally, but no notifications received

### Step 10.2: Grant Permission Later

1. Go to app settings
2. Enable notifications
3. Restart app
4. Token should be registered

---

## Troubleshooting

### Issue: "No FCM token available"

**Checklist:**
- [ ] Firebase is initialized in main.dart
- [ ] google-services.json is in android/app/
- [ ] Notification permission is granted
- [ ] Internet connection is active
- [ ] App is not force-stopped

**Solution:**
```bash
flutter clean
flutter pub get
flutter run
```

### Issue: "Notification not received"

**Checklist:**
- [ ] FCM token is registered (check database)
- [ ] Firebase project is active
- [ ] Device is connected to internet
- [ ] App is not in do-not-disturb mode
- [ ] Notification channel is created (Android 8+)

**Solution:**
1. Check backend logs for errors
2. Verify token in database
3. Check Firebase Console for delivery status

### Issue: "Token registration failed"

**Checklist:**
- [ ] Backend is running
- [ ] API endpoint is correct
- [ ] Auth token is valid
- [ ] Network connection is active

**Solution:**
```bash
# Manually register token
curl -X POST http://localhost:3000/push-notifications/register \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_FCM_TOKEN_HERE","platform":"mobile","deviceName":"Test"}'
```

### Issue: "Firebase not initialized"

**Checklist:**
- [ ] FIREBASE_SERVICE_ACCOUNT environment variable is set
- [ ] JSON is valid
- [ ] Backend is restarted after setting variable

**Solution:**
```bash
# Verify environment variable
echo $FIREBASE_SERVICE_ACCOUNT

# Restart backend
npm run start:dev
```

---

## Testing Checklist

### Backend
- [ ] Firebase service initializes
- [ ] Backend starts without errors
- [ ] Health endpoint responds
- [ ] Auth endpoint works

### Mobile
- [ ] App starts without errors
- [ ] Notification permission is requested
- [ ] FCM token is obtained
- [ ] Token is registered with backend
- [ ] FCM Test Screen shows token

### Notifications
- [ ] Test notification is sent successfully
- [ ] Notification appears on device
- [ ] Notification can be tapped
- [ ] App handles notification correctly
- [ ] Logs show correct messages

### Multi-Device
- [ ] Multiple devices can register
- [ ] All devices receive notification
- [ ] Statistics show correct counts

### Error Handling
- [ ] Invalid tokens are handled
- [ ] Failed tokens are deactivated
- [ ] Errors are logged
- [ ] App doesn't crash

### Permissions
- [ ] Permission request works
- [ ] Denied permission is handled
- [ ] Permission can be granted later

---

## Success Criteria

✅ All backend checks pass
✅ All mobile checks pass
✅ All notification checks pass
✅ All multi-device checks pass
✅ All error handling checks pass
✅ All permission checks pass

---

## Next Steps

1. ✅ Complete all testing phases
2. ✅ Document any issues
3. ✅ Fix issues if found
4. ✅ Re-test
5. 🚀 Deploy to production

---

## Support

For detailed information:
- Backend: See `FIREBASE_ADMIN_SDK_INTEGRATION.md`
- Mobile: See `FLUTTER_FCM_TOKEN_SETUP.md`
- Android: See `ANDROID_FIREBASE_SETUP.md`
- Web: See `WEB_FIREBASE_SETUP.md`

---

**Last Updated:** May 22, 2024
**Version:** 1.0.0
**Status:** Ready for Testing
