# Reminders and Offline Mode Implementation Guide

## Overview

This document outlines the complete implementation of:
1. **Backend Reminder System** - Creating, scheduling, storing, and triggering reminders
2. **Mobile Offline Mode** - Offline data access and sync functionality

---

## Part 1: Backend Reminder System

### Architecture

The backend reminder system uses:
- **NestJS** with TypeORM for data persistence
- **@nestjs/schedule** for cron-based reminder triggering
- **WebSocket** for real-time notification delivery
- **Notification Service** for creating notifications when reminders are sent

### Database Schema

#### Reminder Entity (`reminder.entity.ts`)

```typescript
@Entity('reminders')
export class Reminder {
  id: UUID (primary key)
  userId: UUID (foreign key to users)
  type: enum (appointment, iron_tablet, anc_visit, vaccine, prenatal_checkup, neonatal_checkup, custom)
  title: string
  body: text
  status: enum (pending, sent, failed, cancelled)
  frequency: enum (once, daily, weekly, monthly)
  scheduledFor: timestamp
  sentAt: timestamp (nullable)
  nextReminderAt: timestamp (nullable)
  metadata: JSON (nullable)
  appointmentId: UUID (nullable)
  patientId: UUID (nullable)
  acknowledged: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Indexes:**
- `(userId, status)` - For finding pending reminders per user
- `(scheduledFor, status)` - For finding reminders to send
- `(userId, type)` - For filtering by type

### API Endpoints

#### Create Reminder
```
POST /reminders
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Appointment Reminder",
  "body": "Your appointment is tomorrow",
  "type": "appointment",
  "frequency": "once",
  "scheduledFor": "2024-05-22T09:00:00Z",
  "appointmentId": "uuid",
  "metadata": { "appointmentDate": "2024-05-23" }
}

Response: 201 Created
{
  "id": "uuid",
  "userId": "uuid",
  "title": "Appointment Reminder",
  "status": "pending",
  "scheduledFor": "2024-05-22T09:00:00Z",
  ...
}
```

#### Get All Reminders
```
GET /reminders
Authorization: Bearer <token>

Response: 200 OK
[
  { reminder object },
  ...
]
```

#### Get Pending Reminders
```
GET /reminders/pending
Authorization: Bearer <token>

Response: 200 OK
[
  { reminder object with status: "pending" },
  ...
]
```

#### Get Reminders by Date Range
```
GET /reminders/range?startDate=2024-05-20&endDate=2024-05-30
Authorization: Bearer <token>

Response: 200 OK
[
  { reminder object },
  ...
]
```

#### Get Reminder Statistics
```
GET /reminders/statistics
Authorization: Bearer <token>

Response: 200 OK
{
  "total": 10,
  "pending": 3,
  "sent": 6,
  "failed": 1,
  "cancelled": 0
}
```

#### Get Single Reminder
```
GET /reminders/:id
Authorization: Bearer <token>

Response: 200 OK
{ reminder object }
```

#### Update Reminder Status
```
PUT /reminders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "sent"
}

Response: 200 OK
{ updated reminder object }
```

#### Acknowledge Reminder
```
PUT /reminders/:id/acknowledge
Authorization: Bearer <token>

Response: 200 OK
{ reminder object with acknowledged: true }
```

#### Reschedule Reminder
```
PUT /reminders/:id/reschedule
Authorization: Bearer <token>
Content-Type: application/json

{
  "scheduledFor": "2024-05-23T10:00:00Z"
}

Response: 200 OK
{ updated reminder object }
```

#### Cancel Reminder
```
PUT /reminders/:id/cancel
Authorization: Bearer <token>

Response: 200 OK
{ reminder object with status: "cancelled" }
```

#### Delete Reminder
```
DELETE /reminders/:id
Authorization: Bearer <token>

Response: 200 OK
{ "message": "Reminder deleted successfully" }
```

### Cron Jobs

#### Send Pending Reminders
```typescript
@Cron('0 * * * * *', { timeZone: 'Africa/Blantyre' })
async sendPendingReminders(): Promise<void>
```

**Runs:** Every minute at the top of the hour
**Logic:**
1. Find all reminders with `status = 'pending'` and `scheduledFor <= now`
2. For each reminder:
   - Create a notification for the user
   - Update reminder status to 'sent'
   - If recurring, calculate next reminder time and reset status to 'pending'
   - Emit WebSocket event for real-time delivery
3. Log any failures and mark as 'failed'

**Recurring Reminder Calculation:**
- **Daily:** Add 1 day to current scheduledFor
- **Weekly:** Add 7 days to current scheduledFor
- **Monthly:** Add 1 month to current scheduledFor
- **Once:** No next reminder (status stays 'sent')

### Service Methods

#### RemindersService

```typescript
// Create reminder
create(userId: string, dto: CreateReminderDto): Promise<Reminder>

// Find reminders
findByUser(userId: string): Promise<Reminder[]>
findPendingByUser(userId: string): Promise<Reminder[]>
findById(id: string): Promise<Reminder | null>
findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Reminder[]>

// Update reminder
updateStatus(id: string, status: ReminderStatus): Promise<Reminder | null>
acknowledge(id: string): Promise<Reminder | null>
reschedule(id: string, newScheduledFor: Date): Promise<Reminder | null>
cancel(id: string): Promise<Reminder | null>

// Delete reminder
delete(id: string): Promise<boolean>

// Statistics
getStatistics(userId: string): Promise<{ total, pending, sent, failed, cancelled }>

// Helpers
createAppointmentReminder(userId, appointmentId, date, time, title): Promise<Reminder>
createDailyReminder(userId, type, title, body, startTime): Promise<Reminder>
```

### Integration Points

#### With Appointments
When an appointment is created/updated:
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

#### With Notifications
When a reminder is sent:
```typescript
// In RemindersService.sendReminder()
await this.notificationsService.create({
  userId: reminder.userId,
  title: reminder.title,
  body: reminder.body,
  type: NotificationType.APPOINTMENT, // or INFO
});
```

#### With WebSocket Events
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

## Part 2: Mobile Offline Mode

### Architecture

The mobile offline system consists of:
1. **OfflineService** - Manages connectivity state and sync queue
2. **LocalCacheService** - Caches data locally with expiration
3. **OfflineApiService** - Wrapper around ApiService for offline-aware requests
4. **RemindersStore** - State management for reminders

### Services

#### OfflineService

**Purpose:** Manages offline state and sync queue

**Key Features:**
- Monitors connectivity using `connectivity_plus`
- Queues write operations (POST, PUT, DELETE) when offline
- Automatically syncs when connection is restored
- Periodic sync every 30 seconds

**Usage:**
```dart
final offlineService = OfflineService();
await offlineService.initialize();

// Check connectivity
if (offlineService.isOnline) {
  // Online
} else {
  // Offline
}

// Get pending actions
final pending = offlineService.pendingActionsCount;

// Manual sync
await offlineService._syncOfflineActions();
```

**Data Structure:**
```dart
class OfflineAction {
  String id;
  String method; // 'POST', 'PUT', 'DELETE'
  String endpoint;
  Map<String, dynamic>? body;
  DateTime createdAt;
  bool synced;
}
```

**Storage:** Persisted in SharedPreferences as JSON under key `offline_sync_queue`

#### LocalCacheService

**Purpose:** Caches API responses locally for offline access

**Key Features:**
- Automatic expiration (default 24 hours)
- Supports multiple data types (String, List, Map)
- Persistent storage using SharedPreferences
- Cache statistics

**Usage:**
```dart
final cacheService = LocalCacheService();
await cacheService.initialize();

// Cache data
await cacheService.set('/reminders', remindersData);

// Retrieve cached data
final cached = cacheService.get('/reminders');

// Check if cache exists
if (cacheService.has('/reminders')) {
  // Use cached data
}

// Clear specific cache
await cacheService.remove('/reminders');

// Clear all cache
await cacheService.clearAll();

// Get statistics
final stats = cacheService.getStatistics();
```

**Storage:** Persisted in SharedPreferences with keys:
- `cache_<key>` - Cached data
- `cache_ts_<key>` - Timestamp for expiration

#### OfflineApiService

**Purpose:** Wrapper around ApiService that handles offline mode

**Key Features:**
- Automatic fallback to cache on network errors
- Queues write operations when offline
- Transparent offline/online switching

**Usage:**
```dart
final apiService = OfflineApiService();
await apiService.initialize();

// GET with cache fallback
try {
  final data = await apiService.get('/reminders');
} catch (e) {
  // Falls back to cache if available
}

// POST with offline queueing
try {
  final result = await apiService.post('/reminders', {
    'title': 'New Reminder',
    'scheduledFor': '2024-05-22T09:00:00Z',
  });
  // If offline, returns { queued: true }
} catch (e) {
  // Handle error
}

// PUT with offline queueing
await apiService.put('/reminders/123', { 'status': 'acknowledged' });

// DELETE with offline queueing
await apiService.delete('/reminders/123');

// Access underlying services
final offlineService = apiService.offlineService;
final cacheService = apiService.cacheService;
```

### State Management

#### RemindersStore

**Purpose:** Manages reminder state and API interactions

**Key Features:**
- Singleton pattern
- Automatic filtering by status and type
- Listener pattern for UI updates
- Offline-aware operations

**Usage:**
```dart
final store = RemindersStore.instance;

// Load reminders
await store.load();

// Load pending reminders only
await store.loadPending();

// Create reminder
await store.createReminder(
  title: 'Appointment Reminder',
  body: 'Your appointment is tomorrow',
  type: ReminderType.appointment,
  frequency: ReminderFrequency.once,
  scheduledFor: DateTime.now().add(Duration(days: 1)),
  appointmentId: 'uuid',
);

// Acknowledge reminder
await store.acknowledgeReminder('reminder-id');

// Cancel reminder
await store.cancelReminder('reminder-id');

// Reschedule reminder
await store.rescheduleReminder('reminder-id', newDateTime);

// Delete reminder
await store.deleteReminder('reminder-id');

// Filter by status
store.setStatusFilter(ReminderStatus.pending);

// Filter by type
store.setTypeFilter(ReminderType.appointment);

// Clear filters
store.clearFilters();

// Get statistics
print('Total: ${store.totalCount}');
print('Pending: ${store.pendingCount}');
print('Sent: ${store.sentCount}');

// Listen for changes
store.addListener(() {
  setState(() {});
});
```

### UI Integration

#### Reminders Screen Example

```dart
class RemindersScreen extends StatefulWidget {
  @override
  State<RemindersScreen> createState() => _RemindersScreenState();
}

class _RemindersScreenState extends State<RemindersScreen> {
  final store = RemindersStore.instance;
  late VoidCallback _listener;

  @override
  void initState() {
    super.initState();
    _listener = () => setState(() {});
    store.addListener(_listener);
    _loadReminders();
  }

  @override
  void dispose() {
    store.removeListener(_listener);
    super.dispose();
  }

  Future<void> _loadReminders() async {
    if (!store.loaded) {
      await store.load();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Reminders'),
        actions: [
          if (store.pendingCount > 0)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Center(
                child: Badge(
                  label: Text(store.pendingCount.toString()),
                  child: const Icon(Icons.notifications),
                ),
              ),
            ),
        ],
      ),
      body: store.loading
          ? const Center(child: CircularProgressIndicator())
          : store.reminders.isEmpty
              ? const Center(child: Text('No reminders'))
              : ListView.builder(
                  itemCount: store.reminders.length,
                  itemBuilder: (context, index) {
                    final reminder = store.reminders[index];
                    return ReminderCard(
                      reminder: reminder,
                      onAcknowledge: () => store.acknowledgeReminder(reminder.id),
                      onCancel: () => store.cancelReminder(reminder.id),
                      onReschedule: (newTime) => store.rescheduleReminder(reminder.id, newTime),
                    );
                  },
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateReminderDialog,
        child: const Icon(Icons.add),
      ),
    );
  }

  void _showCreateReminderDialog() {
    // Dialog implementation
  }
}
```

#### Offline Indicator Widget

```dart
class OfflineIndicator extends StatefulWidget {
  @override
  State<OfflineIndicator> createState() => _OfflineIndicatorState();
}

class _OfflineIndicatorState extends State<OfflineIndicator> {
  final offlineService = OfflineService();
  late VoidCallback _listener;

  @override
  void initState() {
    super.initState();
    _listener = () => setState(() {});
    offlineService.addListener(_listener);
  }

  @override
  void dispose() {
    offlineService.removeListener(_listener);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (offlineService.isOnline) {
      return const SizedBox.shrink();
    }

    return Container(
      color: Colors.orange,
      padding: const EdgeInsets.all(8),
      child: Row(
        children: [
          const Icon(Icons.cloud_off, color: Colors.white),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Offline Mode - ${offlineService.pendingActionsCount} pending actions',
              style: const TextStyle(color: Colors.white),
            ),
          ),
          if (offlineService.isSyncing)
            const SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              ),
            ),
        ],
      ),
    );
  }
}
```

### Data Flow

#### Online Flow
```
User Action
    ↓
OfflineApiService.post/put/delete
    ↓
Check connectivity (online)
    ↓
ApiService.post/put/delete
    ↓
Backend API
    ↓
Response
    ↓
Cache response
    ↓
Update UI
```

#### Offline Flow
```
User Action
    ↓
OfflineApiService.post/put/delete
    ↓
Check connectivity (offline)
    ↓
Queue action in OfflineService
    ↓
Return queued response
    ↓
Update UI (show "queued" status)
    ↓
[Connection restored]
    ↓
OfflineService detects connection
    ↓
Sync all queued actions
    ↓
Backend API
    ↓
Update local state
    ↓
Update UI
```

### Initialization

#### App Startup

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize offline services
  final offlineApiService = OfflineApiService();
  await offlineApiService.initialize();
  
  // Initialize stores
  final remindersStore = RemindersStore.instance;
  
  runApp(const MyApp());
}
```

#### In Main App Widget

```dart
class MyApp extends StatefulWidget {
  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    // Load reminders
    await RemindersStore.instance.load();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        body: Column(
          children: [
            const OfflineIndicator(),
            Expanded(
              child: RemindersScreen(),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

## Testing

### Backend Testing

#### Test Reminder Creation
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

#### Test Cron Job
```bash
# Check logs for cron execution
docker logs <container-id> | grep "send-pending-reminders"
```

### Mobile Testing

#### Test Offline Mode
1. Enable airplane mode
2. Create a reminder
3. Verify it's queued
4. Disable airplane mode
5. Verify sync occurs

#### Test Cache
1. Load reminders while online
2. Enable airplane mode
3. Navigate away and back
4. Verify cached reminders are displayed

---

## Deployment Checklist

### Backend
- [ ] Create Reminder entity and migration
- [ ] Create RemindersService with cron job
- [ ] Create RemindersController with all endpoints
- [ ] Create RemindersModule and import in AppModule
- [ ] Update EventsGateway with REMINDER_SENT event
- [ ] Test all endpoints
- [ ] Test cron job execution
- [ ] Deploy to production

### Mobile
- [ ] Add connectivity_plus dependency
- [ ] Create OfflineService
- [ ] Create LocalCacheService
- [ ] Create OfflineApiService
- [ ] Create RemindersStore
- [ ] Create UI components
- [ ] Test offline mode
- [ ] Test sync functionality
- [ ] Deploy to app stores

---

## Future Enhancements

1. **Push Notifications** - Integrate Firebase Cloud Messaging
2. **Local Notifications** - Use flutter_local_notifications for device notifications
3. **Reminder Preferences** - Allow users to customize reminder times
4. **Smart Reminders** - ML-based reminder timing optimization
5. **Reminder Analytics** - Track reminder engagement
6. **Batch Operations** - Create multiple reminders at once
7. **Reminder Templates** - Pre-defined reminder templates
8. **Timezone Support** - Handle different timezones
9. **Reminder Escalation** - Increase frequency if not acknowledged
10. **Integration with Calendar** - Sync with device calendar

---

## Troubleshooting

### Reminders Not Sending
1. Check cron job logs
2. Verify reminder status is 'pending'
3. Verify scheduledFor time is in the past
4. Check NotificationsService is working

### Offline Sync Not Working
1. Check connectivity detection
2. Verify sync queue is populated
3. Check API token is valid
4. Review sync error logs

### Cache Not Working
1. Verify LocalCacheService is initialized
2. Check SharedPreferences permissions
3. Verify cache keys are correct
4. Check cache expiration time

