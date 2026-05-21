# Reminders & Offline Mode Implementation

## Overview

This implementation provides a complete reminder system for the Safe Mother Malawi application with full offline support for the mobile app.

### Key Features

✅ **Backend Reminder System**
- Create, schedule, and manage reminders
- Support for recurring reminders (daily, weekly, monthly)
- Automatic reminder triggering via cron jobs
- Real-time WebSocket notifications
- Integration with appointments and notifications

✅ **Mobile Offline Mode**
- Automatic connectivity detection
- Offline action queueing
- Local data caching with expiration
- Automatic sync when connection restored
- Persistent storage

✅ **Web Admin Dashboard**
- Reminder management interface
- Statistics and filtering
- Create/edit/delete reminders

---

## Files Created

### Backend (NestJS)

```
safemothermalawi/backend/src/reminders/
├── entities/
│   └── reminder.entity.ts          # Database entity
├── dto/
│   └── create-reminder.dto.ts      # Data transfer object
├── reminders.service.ts            # Business logic
├── reminders.controller.ts         # API endpoints
└── reminders.module.ts             # NestJS module
```

### Mobile (Flutter)

```
safemothermalawi/safe-mother-malawi/lib/
├── services/
│   ├── offline_service.dart        # Offline state management
│   ├── local_cache_service.dart    # Local data caching
│   └── offline_api_service.dart    # Offline-aware API wrapper
├── state/
│   └── reminders_store.dart        # Reminder state management
└── web/
    ├── admin/
    │   └── reminders_management.dart # Admin dashboard
    └── shared/widgets/
        └── reminder_card.dart      # Reminder card widget
```

### Documentation

```
├── REMINDERS_AND_OFFLINE_IMPLEMENTATION.md  # Comprehensive guide
├── IMPLEMENTATION_SUMMARY.md                # Overview
├── QUICK_START_GUIDE.md                     # Quick start
├── IMPLEMENTATION_CHECKLIST.md              # Checklist
├── API_EXAMPLES.md                          # API examples
└── README_REMINDERS_OFFLINE.md              # This file
```

---

## Quick Start

### Backend Setup

1. **Add RemindersModule to AppModule:**
```typescript
import { RemindersModule } from './reminders/reminders.module';

@Module({
  imports: [RemindersModule, ...],
})
export class AppModule {}
```

2. **Create and run migration:**
```bash
npm run typeorm migration:generate -- -n CreateRemindersTable
npm run typeorm migration:run
```

3. **Test the API:**
```bash
curl -X POST http://localhost:3000/api/v1/reminders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Reminder",
    "body": "This is a test",
    "type": "appointment",
    "frequency": "once",
    "scheduledFor": "2024-05-22T09:00:00Z"
  }'
```

### Mobile Setup

1. **Install dependencies:**
```bash
cd safemothermalawi/safe-mother-malawi
flutter pub get
```

2. **Initialize offline services in main.dart:**
```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  final offlineApiService = OfflineApiService();
  await offlineApiService.initialize();
  
  runApp(const MyApp());
}
```

3. **Load reminders:**
```dart
final store = RemindersStore.instance;
await store.load();
```

---

## API Endpoints

### Reminders

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/reminders` | Create reminder |
| GET | `/reminders` | Get all reminders |
| GET | `/reminders/pending` | Get pending reminders |
| GET | `/reminders/range` | Get by date range |
| GET | `/reminders/statistics` | Get statistics |
| GET | `/reminders/:id` | Get single reminder |
| PUT | `/reminders/:id/status` | Update status |
| PUT | `/reminders/:id/acknowledge` | Acknowledge |
| PUT | `/reminders/:id/reschedule` | Reschedule |
| PUT | `/reminders/:id/cancel` | Cancel |
| DELETE | `/reminders/:id` | Delete |

See `API_EXAMPLES.md` for detailed examples.

---

## Architecture

### Backend Flow
```
User creates reminder
    ↓
RemindersController.create()
    ↓
RemindersService.create()
    ↓
Save to database
    ↓
[Cron job runs every minute]
    ↓
Find pending reminders
    ↓
Create notifications
    ↓
Emit WebSocket events
    ↓
Notification delivered
```

### Mobile Offline Flow
```
User action
    ↓
OfflineApiService
    ↓
Check connectivity
    ↓
If online: Send to backend
If offline: Queue action
    ↓
[Connection restored]
    ↓
Automatic sync
    ↓
Backend processes
    ↓
Update UI
```

---

## Key Components

### RemindersService (Backend)
- `create()` - Create reminder
- `findByUser()` - Get user's reminders
- `findPendingByUser()` - Get pending reminders
- `updateStatus()` - Update status
- `acknowledge()` - Mark as acknowledged
- `cancel()` - Cancel reminder
- `reschedule()` - Reschedule reminder
- `delete()` - Delete reminder
- `sendPendingReminders()` - Cron job

### OfflineService (Mobile)
- Monitors connectivity
- Queues offline actions
- Syncs when online
- Periodic sync every 30 seconds
- Persistent storage

### LocalCacheService (Mobile)
- Caches API responses
- Automatic expiration (24 hours)
- Persistent storage
- Cache statistics

### RemindersStore (Mobile)
- State management
- CRUD operations
- Filtering
- Listener pattern

---

## Testing

### Backend
```bash
# Test reminder creation
curl -X POST http://localhost:3000/api/v1/reminders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","body":"Test","type":"appointment","frequency":"once","scheduledFor":"2024-05-22T09:00:00Z"}'

# Check cron job
docker logs <container> | grep "send-pending-reminders"
```

### Mobile
1. Enable airplane mode
2. Create a reminder
3. Verify it's queued
4. Disable airplane mode
5. Verify sync occurs

---

## Documentation

- **Comprehensive Guide:** `REMINDERS_AND_OFFLINE_IMPLEMENTATION.md`
- **Quick Start:** `QUICK_START_GUIDE.md`
- **API Examples:** `API_EXAMPLES.md`
- **Checklist:** `IMPLEMENTATION_CHECKLIST.md`
- **Summary:** `IMPLEMENTATION_SUMMARY.md`

---

## Integration Points

### With Appointments
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
```typescript
// In RemindersService.sendReminder()
await this.notificationsService.create({
  userId: reminder.userId,
  title: reminder.title,
  body: reminder.body,
  type: NotificationType.APPOINTMENT,
});
```

---

## Database Schema

### Reminders Table
```sql
CREATE TABLE reminders (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL REFERENCES users(id),
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

## Deployment

### Backend
1. Create migration
2. Run migration
3. Deploy RemindersModule
4. Verify cron job
5. Test endpoints

### Mobile
1. Run `flutter pub get`
2. Build APK/IPA
3. Test offline mode
4. Deploy to stores

---

## Troubleshooting

### Reminders Not Sending
- Check cron job logs
- Verify reminder status is 'pending'
- Check scheduledFor time
- Verify NotificationsService

### Offline Sync Not Working
- Check connectivity detection
- Verify sync queue
- Check API token
- Review error logs

### Cache Not Working
- Verify initialization
- Check SharedPreferences
- Verify cache keys
- Check expiration

---

## Performance

### Backend
- Cron job runs every minute
- Database indexes for fast queries
- Batch notification creation
- WebSocket for real-time delivery

### Mobile
- Sync queue in SharedPreferences
- Cache with 24-hour expiration
- Periodic sync every 30 seconds
- Connectivity listener for immediate sync

---

## Security

### Backend
- JWT authentication required
- User can only access own reminders
- Input validation on all DTOs
- SQL injection prevention

### Mobile
- Token stored securely
- HTTPS for all API calls
- Offline queue encrypted
- Cache cleared on logout

---

## Future Enhancements

1. Push notifications (Firebase)
2. Local notifications (flutter_local_notifications)
3. Reminder preferences UI
4. Batch reminder creation
5. Reminder templates
6. Smart scheduling (ML)
7. Reminder analytics
8. Escalation logic
9. Calendar integration
10. Timezone support

---

## Support

For questions or issues:
1. Check the documentation files
2. Review API examples
3. Check troubleshooting section
4. Contact the development team

---

## Version

- **Version:** 1.0.0
- **Release Date:** May 2024
- **Status:** Production Ready

---

## Contributors

- Backend Team
- Mobile Team
- QA Team
- Product Team

---

## License

Same as Safe Mother Malawi project

