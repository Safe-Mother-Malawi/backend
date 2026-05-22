# Web Firebase Setup - Safe Mother Malawi

## Overview

Firebase has been configured for the web version of Safe Mother Malawi. The web app shares the same Firebase project as the mobile app.

---

## Firebase Configuration

### Project Details
- **Project ID:** fir-mobile-app-34535
- **Auth Domain:** fir-mobile-app-34535.firebaseapp.com
- **Storage Bucket:** fir-mobile-app-34535.firebasestorage.app
- **Messaging Sender ID:** 364677454045
- **App ID:** 1:364677454045:web:6b858004f58d0656b8e334
- **Measurement ID:** G-YET8NZC3Y2

---

## Web Firebase Configuration

### For React/Vue/Angular Web App

```javascript
// firebase-config.js
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCmB-FDoPYNTBJ-WxOJe0420c6ioJVjey4",
  authDomain: "fir-mobile-app-34535.firebaseapp.com",
  projectId: "fir-mobile-app-34535",
  storageBucket: "fir-mobile-app-34535.firebasestorage.app",
  messagingSenderId: "364677454045",
  appId: "1:364677454045:web:6b858004f58d0656b8e334",
  measurementId: "G-YET8NZC3Y2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
export const messaging = getMessaging(app);

// Initialize Analytics
export const analytics = getAnalytics(app);
```

---

## Web Push Notifications Setup

### Step 1: Install Firebase SDK

```bash
npm install firebase
```

### Step 2: Create Service Worker

Create `public/firebase-messaging-sw.js`:

```javascript
// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase services
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing the options you supplied earlier.
firebase.initializeApp({
  apiKey: "AIzaSyCmB-FDoPYNTBJ-WxOJe0420c6ioJVjey4",
  authDomain: "fir-mobile-app-34535.firebaseapp.com",
  projectId: "fir-mobile-app-34535",
  storageBucket: "fir-mobile-app-34535.firebasestorage.app",
  messagingSenderId: "364677454045",
  appId: "1:364677454045:web:6b858004f58d0656b8e334",
  measurementId: "G-YET8NZC3Y2"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo/app-icon.png',
    badge: '/logo/badge-icon.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
```

### Step 3: Request Notification Permission

```javascript
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "./firebase-config";

const messaging = getMessaging(app);

// Request permission and get token
export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted');
      
      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: 'YOUR_VAPID_KEY_HERE'
      });
      
      console.log('FCM Token:', token);
      
      // Send token to backend
      await fetch('http://localhost:3000/push-notifications/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          token: token,
          platform: 'web',
          deviceName: 'Web Browser'
        })
      });
      
      return token;
    } else {
      console.log('Notification permission denied');
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
  }
}

// Handle foreground messages
export function setupForegroundMessageHandler() {
  onMessage(messaging, (payload) => {
    console.log('Message received in foreground:', payload);
    
    // Display notification
    new Notification(payload.notification.title, {
      body: payload.notification.body,
      icon: '/logo/app-icon.png',
      badge: '/logo/badge-icon.png',
      data: payload.data
    });
  });
}
```

### Step 4: Get VAPID Key

1. Go to Firebase Console
2. Select project: `fir-mobile-app-34535`
3. Go to Project Settings → Cloud Messaging
4. Copy the "Server key" (this is your VAPID key for web)
5. Add to your web app configuration

---

## Integration with Backend

The web app uses the same backend endpoints as the mobile app:

### Register Web Device Token

```javascript
const response = await fetch('http://localhost:3000/push-notifications/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  },
  body: JSON.stringify({
    token: fcmToken,
    platform: 'web',
    deviceName: 'Web Browser'
  })
});
```

### Send Test Notification

```javascript
const response = await fetch('http://localhost:3000/push-notifications/test', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  },
  body: JSON.stringify({
    deviceToken: fcmToken
  })
});
```

---

## React Example

### App.jsx

```jsx
import { useEffect, useState } from 'react';
import { requestNotificationPermission, setupForegroundMessageHandler } from './firebase-config';

function App() {
  const [fcmToken, setFcmToken] = useState(null);

  useEffect(() => {
    // Request notification permission on app load
    const initializeNotifications = async () => {
      const token = await requestNotificationPermission();
      setFcmToken(token);
    };

    initializeNotifications();

    // Setup foreground message handler
    setupForegroundMessageHandler();
  }, []);

  const sendTestNotification = async () => {
    if (!fcmToken) {
      alert('FCM token not available');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/push-notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          deviceToken: fcmToken
        })
      });

      const data = await response.json();
      alert('Test notification sent!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert('Error sending notification');
    }
  };

  return (
    <div>
      <h1>Safe Mother Malawi - Web</h1>
      <p>FCM Token: {fcmToken ? fcmToken.substring(0, 20) + '...' : 'Loading...'}</p>
      <button onClick={sendTestNotification}>Send Test Notification</button>
    </div>
  );
}

export default App;
```

---

## Testing Web Push Notifications

### 1. Start Backend

```bash
cd safemothermalawi/backend
npm run start:dev
```

### 2. Run Web App

```bash
npm start  # or your web app start command
```

### 3. Grant Notification Permission

- Browser will prompt for notification permission
- Click "Allow"

### 4. Check FCM Token

- Open browser console
- Look for: "FCM Token: eXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

### 5. Send Test Notification

- Click "Send Test Notification" button
- Check browser notification tray

---

## Troubleshooting

### Issue: "Notification permission denied"

**Solution:**
1. Check browser notification settings
2. Allow notifications for the domain
3. Reload page

### Issue: "No FCM token available"

**Solution:**
1. Verify Firebase is initialized
2. Check browser console for errors
3. Verify VAPID key is correct
4. Check internet connection

### Issue: "Notification not received"

**Solution:**
1. Verify FCM token is registered with backend
2. Check backend logs for errors
3. Verify Firebase project is active
4. Check browser is not in do-not-disturb mode

### Issue: "Service worker not registered"

**Solution:**
1. Verify `firebase-messaging-sw.js` is in `public/` directory
2. Check browser console for errors
3. Verify service worker registration code

---

## Browser Support

✅ Chrome 50+
✅ Firefox 48+
✅ Edge 15+
✅ Opera 37+
❌ Safari (limited support)
❌ Internet Explorer (not supported)

---

## CORS Configuration

If web app is on different domain, update backend CORS:

```typescript
// main.ts
app.enableCors({
  origin: ['http://localhost:3000', 'https://yourdomain.com'],
  credentials: true
});
```

---

## Environment Variables

### Web App (.env)

```
REACT_APP_FIREBASE_API_KEY=AIzaSyCmB-FDoPYNTBJ-WxOJe0420c6ioJVjey4
REACT_APP_FIREBASE_AUTH_DOMAIN=fir-mobile-app-34535.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=fir-mobile-app-34535
REACT_APP_FIREBASE_STORAGE_BUCKET=fir-mobile-app-34535.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=364677454045
REACT_APP_FIREBASE_APP_ID=1:364677454045:web:6b858004f58d0656b8e334
REACT_APP_FIREBASE_MEASUREMENT_ID=G-YET8NZC3Y2
REACT_APP_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY_HERE
REACT_APP_BACKEND_URL=http://localhost:3000
```

---

## Deployment

### Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy web app
firebase deploy
```

### Custom Domain

```bash
# Configure custom domain in Firebase Console
# Project Settings → Hosting → Add custom domain
```

---

## Multi-Platform Support

The backend now supports:
- ✅ Android (mobile)
- ✅ iOS (mobile)
- ✅ Web (browser)

All platforms use the same backend endpoints and database.

---

## Next Steps

1. Install Firebase SDK: `npm install firebase`
2. Create service worker: `public/firebase-messaging-sw.js`
3. Setup Firebase config in your web app
4. Request notification permission
5. Register FCM token with backend
6. Test push notifications
7. Deploy to production

---

## Resources

- [Firebase Web Setup](https://firebase.google.com/docs/web/setup)
- [Firebase Cloud Messaging Web](https://firebase.google.com/docs/cloud-messaging/js/client)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)

---

**Last Updated:** May 22, 2024
**Version:** 1.0.0
**Status:** Ready for Web Implementation
