# Quick Start Guide - Reminders & Offline Mode

## For Backend Developers

### 1. Setup Reminders Module

Add to `app.module.ts`:
```typescript
import { RemindersModule } from './reminders/reminders.module';

@Module({
  imports: [
    // ... other imports
    RemindersModule,
  ],
})
export class AppModule {}
```

### 2. Create Database Migration

```bash
npm run typeorm migration:generate -- -n CreateRemindersTable
npm run typeorm migration:run
```

### 3. Test Reminder Creation

```bash
# Get your JWT token first
TOKEN="your-jwt-token"

# Create a reminder
curl -X POST http://localhost:3000/api/v1/reminders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Reminder",
    "body": "This is a test reminder",
    "type": "appointment",
    "frequency": "once",
    "scheduledFor": "2024-05-22T09:00:00Z"
  }'

# Get all reminders
curl -X GET http://localhost:3000/api/v1/reminders \
  -H "Authorization: Bearer $TOKEN"

# Get pending reminders
curl -X GET http://localhost:3000/api/v1/reminders/pending \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Verify Cron Job

Check logs for cron execution:
```bash
# Docker
docker logs <container-id> | grep "send-pending-reminders"

# Local
npm run start:dev | grep "send-pending-reminders"
```

### 5. Integrate with Appointments

In `appointments.service.ts`:
```typescript
import { RemindersService } from '../reminders/reminders.service';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly remindersService: RemindersService,
    // ... other services
  ) {}

  async create(dto: CreateAppointmentDto, user: User): Promise<Appointment> {
    const appointment = await this.appointmentRepo.save(
      this.appointmentRepo.create({ ...dto, userId: user.id }),
    );

    // Create reminder for appointment
    await this.remindersService.createAppointmentReminder(
      user.id,
      appointment.id,
      appointment.date,
      appointment.time,
      appointment.title,
    );

    return appointment;
  }
}
```

---

## For Mobile Developers

### 1. Install Dependencies

```bash
cd safemothermalawi/safe-mother-malawi
flutter pub get
```

### 2. Initialize Offline Services

In `main.dart`:
```dart
import 'package:safemothermalawi_frontend/services/offline_api_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize offline services
  final offlineApiService = OfflineApiService();
  await offlineApiService.initialize();
  
  runApp(const MyApp());
}
```

### 3. Load Reminders

In your screen:
```dart
import 'package:safemothermalawi_frontend/state/reminders_store.dart';

class MyScreen extends StatefulWidget {
  @override
  State<MyScreen> createState() => _MyScreenState();
}

class _MyScreenState extends State<MyScreen> {
  final store = RemindersStore.instance;

  @override
  void initState() {
    super.initState();
    _loadReminders();
  }

  Future<void> _loadReminders() async {
    await store.load();
  }

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: store.reminders.length,
      itemBuilder: (context, index) {
        final reminder = store.reminders[index];
        return ListTile(
          title: Text(reminder.title),
          subtitle: Text(reminder.body),
          trailing: Text(reminder.statusLabel),
        );
      },
    );
  }
}
```

### 4. Create a Reminder

```dart
await store.createReminder(
  title: 'Appointment Reminder',
  body: 'Your appointment is tomorrow',
  type: ReminderType.appointment,
  frequency: ReminderFrequency.once,
  scheduledFor: DateTime.now().add(Duration(days: 1)),
);
```

### 5. Test Offline Mode

1. Enable airplane mode
2. Create a reminder
3. Verify it shows "queued" status
4. Disable airplane mode
5. Verify sync occurs automatically

### 6. Add Offline Indicator

```dart
import 'package:safemothermalawi_frontend/services/offline_service.dart';

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        body: Column(
          children: [
            OfflineIndicator(), // Shows when offline
            Expanded(child: MyScreen()),
          ],
        ),
      ),
    );
  }
}
```

---

## Common Tasks

### Backend: Create Recurring Daily Reminder

```typescript
// In RemindersService
await this.createDailyReminder(
  userId,
  ReminderType.IRON_TABLET,
  'Take your iron tablet',
  'Remember to take your iron tablet today',
  new Date('2024-05-20T09:00:00Z'),
);
```

### Backend: Get Reminders for Date Range

```typescript
const reminders = await this.remindersService.findByDateRange(
  userId,
  new Date('2024-05-20'),
  new Date('2024-05-30'),
);
```

### Mobile: Filter Reminders by Status

```dart
store.setStatusFilter(ReminderStatus.pending);
// Now store.reminders only contains pending reminders
```

### Mobile: Get Sync Statistics

```dart
final stats = offlineService.getStatistics();
print('Total: ${stats['total']}');
print('Pending: ${stats['pending']}');
print('Synced: ${stats['synced']}');
```

### Mobile: Clear Cache

```dart
await cacheService.clearAll();
```

### Mobile: Manual Sync

```dart
await offlineService._syncOfflineActions();
```

---

## Debugging

### Backend: Check Reminder Status

```typescript
const reminder = await this.remindersService.findById(reminderId);
console.log('Status:', reminder.status);
console.log('Scheduled for:', reminder.scheduledFor);
console.log('Sent at:', reminder.sentAt);
```

### Backend: Check Cron Job

```typescript
// Add logging to RemindersService.sendPendingReminders()
this.logger.log(`Found ${pendingReminders.length} reminders to send`);
```

### Mobile: Check Offline Queue

```dart
print('Queue: ${offlineService.syncQueue}');
print('Pending: ${offlineService.pendingActionsCount}');
print('Is syncing: ${offlineService.isSyncing}');
```

### Mobile: Check Cache

```dart
final cached = cacheService.get('/reminders');
print('Cached: $cached');
print('Stats: ${cacheService.getStatistics()}');
```

---

## Troubleshooting

### Reminders Not Sending

**Backend:**
1. Check cron job is running: `docker logs <container> | grep send-pending-reminders`
2. Verify reminder status: `SELECT * FROM reminders WHERE id = '<id>'`
3. Check scheduledFor time: `SELECT scheduledFor, NOW() FROM reminders WHERE id = '<id>'`
4. Verify notification was created: `SELECT * FROM notifications WHERE userId = '<userId>'`

**Solution:**
- Ensure cron job is enabled in NestJS
- Verify database connection
- Check timezone settings

### Offline Sync Not Working

**Mobile:**
1. Check connectivity: `print(offlineService.isOnline)`
2. Check queue: `print(offlineService.syncQueue)`
3. Check token: `final token = await ApiService.instance.getToken()`

**Solution:**
- Verify internet connection
- Check API token is valid
- Manually trigger sync: `await offlineService._syncOfflineActions()`

### Cache Not Working

**Mobile:**
1. Check cache exists: `cacheService.has('/reminders')`
2. Check cache content: `print(cacheService.get('/reminders'))`
3. Check expiration: `print(cacheService.getStatistics())`

**Solution:**
- Clear cache: `await cacheService.clearAll()`
- Verify SharedPreferences permissions
- Check cache key is correct

---

## Performance Tips

### Backend
- Cron job runs every minute - adjust if needed
- Use database indexes for faster queries
- Batch create notifications for multiple reminders
- Consider pagination for large result sets

### Mobile
- Cache data to reduce API calls
- Use offline mode for better UX
- Batch sync operations
- Clear old cache periodically

---

## Security Checklist

### Backend
- [ ] JWT authentication on all endpoints
- [ ] User can only access their own reminders
- [ ] Input validation on all DTOs
- [ ] SQL injection prevention via TypeORM
- [ ] Rate limiting on reminder creation

### Mobile
- [ ] Token stored securely
- [ ] HTTPS for all API calls
- [ ] Offline queue encrypted
- [ ] Cache cleared on logout
- [ ] No sensitive data in logs

---

## Next Steps

1. **Backend:** Integrate with appointments service
2. **Mobile:** Add UI for reminder management
3. **Both:** Add push notifications
4. **Both:** Add reminder preferences
5. **Both:** Add analytics

---

## Resources

- Full Implementation Guide: `REMINDERS_AND_OFFLINE_IMPLEMENTATION.md`
- Implementation Summary: `IMPLEMENTATION_SUMMARY.md`
- API Documentation: See RemindersController
- State Management: RemindersStore
- Offline Services: OfflineService, LocalCacheService, OfflineApiService

