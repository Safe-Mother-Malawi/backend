# Reminders and Offline Mode - Implementation Summary

## What Was Implemented

### 1. Backend Reminder System ✅

#### New Files Created:
- `safemothermalawi/backend/src/reminders/entities/reminder.entity.ts` - Database entity
- `safemothermalawi/backend/src/reminders/dto/create-reminder.dto.ts` - Data transfer object
- `safemothermalawi/backend/src/reminders/reminders.service.ts` - Business logic
- `safemothermalawi/backend/src/reminders/reminders.controller.ts` - API endpoints
- `safemothermalawi/backend/src/reminders/reminders.module.ts` - NestJS module

#### Features:
- ✅ Create reminders with custom scheduling
- ✅ Support for recurring reminders (daily, weekly, monthly)
- ✅ Automatic reminder triggering via cron job (every minute)
- ✅ Reminder status tracking (pending, sent, failed, cancelled)
- ✅ Acknowledge, reschedule, and cancel reminders
- ✅ Reminder statistics and filtering
- ✅ WebSocket event emission for real-time updates
- ✅ Integration with notifications service
- ✅ Appointment reminder auto-creation

#### API Endpoints:
```
POST   /reminders                    - Create reminder
GET    /reminders                    - Get all reminders
GET    /reminders/pending            - Get pending reminders
GET    /reminders/range              - Get reminders by date range
GET    /reminders/statistics         - Get statistics
GET    /reminders/:id                - Get single reminder
PUT    /reminders/:id/status         - Update status
PUT    /reminders/:id/acknowledge    - Acknowledge reminder
PUT    /reminders/:id/reschedule     - Reschedule reminder
PUT    /reminders/:id/cancel         - Cancel reminder
DELETE /reminders/:id                - Delete reminder
```

#### Cron Job:
- Runs every minute at the top of the hour
- Finds all pending reminders scheduled for now or earlier
- Creates notifications for each reminder
- Handles recurring reminders by calculating next occurrence
- Emits WebSocket events for real-time delivery

---

### 2. Mobile Offline Mode ✅

#### New Files Created:
- `safemothermalawi/safe-mother-malawi/lib/services/offline_service.dart` - Offline state management
- `safemothermalawi/safe-mother-malawi/lib/services/local_cache_service.dart` - Local data caching
- `safemothermalawi/safe-mother-malawi/lib/services/offline_api_service.dart` - Offline-aware API wrapper
- `safemothermalawi/safe-mother-malawi/lib/state/reminders_store.dart` - Reminder state management

#### Features:
- ✅ Automatic connectivity detection
- ✅ Offline action queueing (POST, PUT, DELETE)
- ✅ Automatic sync when connection restored
- ✅ Periodic sync every 30 seconds
- ✅ Local data caching with expiration
- ✅ Persistent sync queue in SharedPreferences
- ✅ Fallback to cache on network errors
- ✅ Sync statistics and monitoring

#### Services:

**OfflineService:**
- Monitors connectivity using `connectivity_plus`
- Queues write operations when offline
- Automatically syncs when online
- Provides sync statistics

**LocalCacheService:**
- Caches API responses locally
- Automatic expiration (24 hours default)
- Persistent storage using SharedPreferences
- Cache statistics

**OfflineApiService:**
- Wrapper around ApiService
- Transparent offline/online switching
- Automatic cache fallback
- Offline action queueing

**RemindersStore:**
- Singleton state management
- Reminder CRUD operations
- Filtering by status and type
- Listener pattern for UI updates

---

### 3. Web UI Components ✅

#### New Files Created:
- `safemothermalawi/safe-mother-malawi/lib/web/admin/reminders_management.dart` - Admin dashboard
- `safemothermalawi/safe-mother-malawi/lib/web/shared/widgets/reminder_card.dart` - Reminder card widget

#### Features:
- ✅ Reminders management dashboard
- ✅ Summary statistics (total, pending, sent, failed)
- ✅ Filter by status and type
- ✅ Create new reminders
- ✅ Acknowledge, cancel, and delete reminders
- ✅ Reminder card with status badges
- ✅ Time until reminder display
- ✅ Responsive design

---

### 4. Updated Files ✅

#### Backend:
- `safemothermalawi/backend/src/events/events.gateway.ts` - Added REMINDER_SENT and NOTIFICATION_RECEIVED events

#### Mobile:
- `safemothermalawi/safe-mother-malawi/pubspec.yaml` - Added connectivity_plus dependency

---

## Architecture Overview

### Backend Reminder Flow
```
User creates reminder
    ↓
RemindersController.create()
    ↓
RemindersService.create()
    ↓
Save to database
    ↓
Return reminder object
    ↓
[Cron job runs every minute]
    ↓
Find pending reminders (scheduledFor <= now)
    ↓
For each reminder:
  - Create notification
  - Update status to 'sent'
  - If recurring, calculate next time
  - Emit WebSocket event
    ↓
Notification delivered to user
```

### Mobile Offline Flow
```
User action (create/update/delete)
    ↓
OfflineApiService.post/put/delete()
    ↓
Check connectivity
    ↓
If online:
  - Send to backend
  - Cache response
  - Update UI
Else:
  - Queue action
  - Return queued response
  - Update UI with "queued" status
    ↓
[Connection restored]
    ↓
OfflineService detects connection
    ↓
Sync all queued actions
    ↓
Backend processes actions
    ↓
Update local state
    ↓
Update UI
```

---

## Database Schema

### Reminders Table
```sql
CREATE TABLE reminders (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending',
  frequency VARCHAR NOT NULL DEFAULT 'once',
  scheduledFor TIMESTAMP NOT NULL,
  sentAt TIMESTAMP,
  nextReminderAt TIMESTAMP,
  metadata JSON,
  appointmentId UUID,
  patientId UUID,
  acknowledged BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_user_status (userId, status),
  INDEX idx_scheduled_status (scheduledFor, status),
  INDEX idx_user_type (userId, type)
);
```

---

## Integration Points

### With Appointments
When an appointment is created:
```typescript
// In AppointmentsService.create()
await this.remindersService.createAppointmentReminder(
  userId,
  appointment.id,
  appointment.date,
  appointment.time,
  appointment.title,
);
```

### With Notifications
When a reminder is sent:
```typescript
// In RemindersService.sendReminder()
await this.notificationsService.create({
  userId: reminder.userId,
  title: reminder.title,
  body: reminder.body,
  type: NotificationType.APPOINTMENT,
});
```

### With WebSocket
```typescript
// In RemindersService.sendReminder()
this.eventsGateway.emit(SocketEvent.REMINDER_SENT, {
  userId: reminder.userId,
  reminderId: reminder.id,
  title: reminder.title,
  type: reminder.type,
});
```

---

## Usage Examples

### Backend - Create Reminder
```bash
curl -X POST http://localhost:3000/api/v1/reminders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Appointment Reminder",
    "body": "Your appointment is tomorrow",
    "type": "appointment",
    "frequency": "once",
    "scheduledFor": "2024-05-22T09:00:00Z",
    "appointmentId": "uuid"
  }'
```

### Mobile - Create Reminder
```dart
final store = RemindersStore.instance;

await store.createReminder(
  title: 'Appointment Reminder',
  body: 'Your appointment is tomorrow',
  type: ReminderType.appointment,
  frequency: ReminderFrequency.once,
  scheduledFor: DateTime.now().add(Duration(days: 1)),
  appointmentId: 'uuid',
);
```

### Mobile - Offline Usage
```dart
final offlineApi = OfflineApiService();
await offlineApi.initialize();

// This works both online and offline
try {
  final result = await offlineApi.post('/reminders', {
    'title': 'New Reminder',
    'scheduledFor': '2024-05-22T09:00:00Z',
  });
  
  if (result['queued'] == true) {
    print('Action queued for sync');
  }
} catch (e) {
  print('Error: $e');
}

// Check sync status
print('Pending actions: ${offlineApi.offlineService.pendingActionsCount}');
print('Is syncing: ${offlineApi.offlineService.isSyncing}');
```

---

## Testing Checklist

### Backend Testing
- [ ] Create reminder endpoint
- [ ] Get all reminders endpoint
- [ ] Get pending reminders endpoint
- [ ] Update reminder status endpoint
- [ ] Acknowledge reminder endpoint
- [ ] Reschedule reminder endpoint
- [ ] Cancel reminder endpoint
- [ ] Delete reminder endpoint
- [ ] Cron job execution
- [ ] Recurring reminder calculation
- [ ] WebSocket event emission
- [ ] Notification creation

### Mobile Testing
- [ ] Offline service initialization
- [ ] Connectivity detection
- [ ] Action queueing when offline
- [ ] Cache storage and retrieval
- [ ] Automatic sync on connection
- [ ] Periodic sync timer
- [ ] Reminders store CRUD operations
- [ ] Filter by status and type
- [ ] UI updates on state changes
- [ ] Offline indicator display

### Integration Testing
- [ ] Create reminder while offline, sync when online
- [ ] Load reminders while offline (from cache)
- [ ] Acknowledge reminder while offline
- [ ] Cancel reminder while offline
- [ ] Delete reminder while offline
- [ ] Multiple offline actions sync correctly
- [ ] Cache expiration works
- [ ] Sync queue persists across app restarts

---

## Deployment Steps

### Backend Deployment
1. Create migration for Reminder entity
2. Run migration: `npm run typeorm migration:run`
3. Deploy RemindersModule to production
4. Verify cron job is running
5. Test all endpoints
6. Monitor logs for errors

### Mobile Deployment
1. Run `flutter pub get` to install dependencies
2. Build APK/IPA with new code
3. Test offline mode on device
4. Test sync functionality
5. Deploy to app stores

---

## Future Enhancements

1. **Push Notifications** - Firebase Cloud Messaging integration
2. **Local Notifications** - Device-level notifications
3. **Reminder Preferences** - User customization
4. **Smart Scheduling** - ML-based timing optimization
5. **Batch Operations** - Create multiple reminders at once
6. **Reminder Templates** - Pre-defined templates
7. **Timezone Support** - Handle different timezones
8. **Escalation** - Increase frequency if not acknowledged
9. **Analytics** - Track reminder engagement
10. **Calendar Integration** - Sync with device calendar

---

## Troubleshooting

### Reminders Not Sending
1. Check cron job logs: `docker logs <container> | grep send-pending-reminders`
2. Verify reminder status is 'pending'
3. Verify scheduledFor time is in the past
4. Check NotificationsService is working
5. Verify user exists in database

### Offline Sync Not Working
1. Check connectivity detection: `offlineService.isOnline`
2. Verify sync queue is populated: `offlineService.syncQueue`
3. Check API token is valid
4. Review sync error logs
5. Manually trigger sync: `await offlineService._syncOfflineActions()`

### Cache Not Working
1. Verify LocalCacheService is initialized
2. Check SharedPreferences permissions
3. Verify cache keys are correct
4. Check cache expiration time
5. Clear cache and retry: `await cacheService.clearAll()`

---

## Performance Considerations

### Backend
- Cron job runs every minute (configurable)
- Database indexes on (userId, status) and (scheduledFor, status)
- Batch notification creation for efficiency
- WebSocket events for real-time delivery

### Mobile
- Sync queue persisted in SharedPreferences
- Cache with 24-hour expiration
- Periodic sync every 30 seconds (configurable)
- Connectivity listener for immediate sync on connection

---

## Security Considerations

### Backend
- JWT authentication required for all endpoints
- User can only access their own reminders
- Role-based access control for admin endpoints
- Input validation on all DTOs
- SQL injection prevention via TypeORM

### Mobile
- Token stored securely in SharedPreferences
- HTTPS for all API calls
- Offline queue encrypted in SharedPreferences
- Cache cleared on logout

---

## Documentation

For detailed implementation guide, see: `REMINDERS_AND_OFFLINE_IMPLEMENTATION.md`

