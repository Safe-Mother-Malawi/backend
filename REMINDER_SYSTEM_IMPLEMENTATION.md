# Safe Mother Malawi - Reminder System Implementation

## Overview
A comprehensive reminder system for managing appointment reminders, high-risk follow-ups, and escalation logic across the Safe Mother Malawi platform.

## Architecture

### Backend (NestJS)

#### 1. Reminder Entity (`src/reminders/entities/reminder.entity.ts`)
- **Fields:**
  - `id`: UUID primary key
  - `userId`: User who receives the reminder
  - `type`: ReminderType enum (appointment, iron_tablet, anc_visit, vaccine, prenatal_checkup, neonatal_checkup, custom)
  - `title`: Reminder title
  - `body`: Reminder message
  - `status`: ReminderStatus enum (pending, sent, failed, cancelled)
  - `frequency`: ReminderFrequency enum (once, daily, weekly, monthly)
  - `scheduledFor`: When the reminder should be sent
  - `sentAt`: When the reminder was actually sent
  - `nextReminderAt`: For recurring reminders
  - `metadata`: Additional data (appointment details, patient info, etc.)
  - `appointmentId`: Link to appointment
  - `patientId`: Link to patient
  - `acknowledged`: Whether user has seen the reminder
  - `createdAt`, `updatedAt`: Timestamps

#### 2. Reminder Service (`src/reminders/reminders.service.ts`)
**Key Methods:**
- `create()`: Create a new reminder
- `findByUser()`: Get all reminders for a user
- `findPendingByUser()`: Get pending reminders
- `updateStatus()`: Update reminder status
- `acknowledge()`: Mark reminder as seen
- `cancel()`: Cancel a reminder
- `reschedule()`: Reschedule a reminder
- `sendPendingReminders()`: Cron job that runs every minute
- `createAppointmentReminder()`: Create single appointment reminder
- `replaceAppointmentReminders()`: Create 24h and 1h reminders
- `createDailyReminder()`: Create recurring daily reminders
- `findByDateRange()`: Get reminders for a date range
- `getStatistics()`: Get reminder statistics

#### 3. Cron Job (`@Cron('0 * * * * *')`)
- Runs every minute
- Finds all pending reminders scheduled for now or earlier
- Sends reminders via:
  - In-app notifications
  - Push notifications
  - WebSocket events for real-time updates
- Updates reminder status to SENT
- Handles recurring reminders by calculating next reminder time

#### 4. API Endpoints (`src/reminders/reminders.controller.ts`)

**POST /reminders**
- Create a new reminder
- Body: `{ title, body, type, frequency, scheduledFor, appointmentId?, patientId?, metadata? }`

**GET /reminders**
- Get all reminders for current user

**GET /reminders/pending**
- Get pending reminders for current user

**GET /reminders/range**
- Get reminders for a date range
- Query: `startDate`, `endDate`

**GET /reminders/statistics**
- Get reminder statistics (total, pending, sent, failed, cancelled)

**GET /reminders/:id**
- Get a specific reminder

**PUT /reminders/:id/status**
- Update reminder status
- Body: `{ status }`

**PUT /reminders/:id/acknowledge**
- Mark reminder as acknowledged

**PUT /reminders/:id/reschedule**
- Reschedule a reminder
- Body: `{ scheduledFor }`

**PUT /reminders/:id/cancel**
- Cancel a reminder

**DELETE /reminders/:id**
- Delete a reminder

### Frontend (Flutter)

#### 1. Reminder Service (`lib/services/reminder_service.dart`)
**Key Methods:**
- `initialize()`: Initialize local notifications
- `scheduleAppointmentReminders()`: Schedule 24h and 1h reminders
- `cancelAppointmentReminders()`: Cancel scheduled reminders
- `showNotification()`: Show immediate notification

**Features:**
- Uses `flutter_local_notifications` for local notifications
- Timezone support (Africa/Blantyre)
- Android and iOS support
- Offline support (notifications work without internet)

#### 2. Reminders Store (`lib/state/reminders_store.dart`)
**State Management:**
- Manages reminder list
- Filters by status and type
- Provides statistics (total, pending, sent, failed)

**Key Methods:**
- `load()`: Load all reminders from API
- `loadPending()`: Load pending reminders
- `createReminder()`: Create new reminder
- `acknowledgeReminder()`: Mark as seen
- `cancelReminder()`: Cancel reminder
- `rescheduleReminder()`: Reschedule reminder
- `deleteReminder()`: Delete reminder
- `setStatusFilter()`: Filter by status
- `setTypeFilter()`: Filter by type

#### 3. Reminder Card Widget (`lib/web/shared/widgets/reminder_card.dart`)
- Displays reminder information
- Shows status and type
- Provides action buttons

#### 4. Integration with Appointments
- When appointment is created, reminders are automatically scheduled
- When appointment is updated, reminders are rescheduled
- When appointment is deleted, reminders are cancelled
- Users can toggle reminders on/off for each appointment

## Appointment Reminder Flow

```
Appointment Created
    ↓
System creates reminders:
  - 24 hours before
  - 1 hour before
    ↓
Cron job processes reminders every minute
    ↓
Sends notifications:
  - In-app notification
  - Push notification
  - WebSocket event
    ↓
User receives notification
    ↓
User can:
  - Acknowledge (mark as seen)
  - Reschedule
  - Cancel
```

## High-Risk Follow-up Reminders

For high-risk patients:
1. System creates follow-up reminders
2. Escalates if patient misses appointment
3. Notifies clinician for manual follow-up
4. Tracks escalation history

## Recurring Reminders

**Daily Reminders** (e.g., iron tablets):
- Created with `frequency: DAILY`
- Cron job automatically creates next reminder
- Continues until manually cancelled

**Weekly/Monthly Reminders**:
- Similar to daily but with different intervals
- Useful for ANC visits, vaccinations, etc.

## Offline Support

**Mobile App:**
- Local notifications work offline
- Reminders are stored locally using Hive
- When online, syncs with backend
- Notifications display even without internet

## Error Handling

**Failed Reminders:**
- If push notification fails, status is set to FAILED
- Retry logic can be implemented
- Admin can view failed reminders and retry

**Validation:**
- Checks if user exists before creating reminder
- Validates appointment exists
- Validates date/time format

## Database Indexes

For performance:
- `(userId, status)`: Fast filtering by user and status
- `(scheduledFor, status)`: Fast finding of pending reminders
- `(userId, type)`: Fast filtering by type

## Deployment Checklist

- [x] Reminder entity created
- [x] Reminder service implemented
- [x] Cron job configured
- [x] API endpoints created
- [x] Frontend service implemented
- [x] State management setup
- [x] Local notifications configured
- [x] Appointment integration complete
- [x] Error handling implemented
- [x] Database indexes created

## Future Enhancements

1. **SMS Fallback**: Send SMS if push notification fails
2. **Email Reminders**: Send email reminders
3. **WhatsApp Integration**: Send reminders via WhatsApp
4. **Smart Timing**: AI-based optimal reminder timing
5. **Multilingual Reminders**: Support multiple languages
6. **Clinician Auto-Assignment**: Automatically assign clinician for follow-up
7. **Predictive Missed Appointments**: ML model to predict missed appointments
8. **Reminder Analytics**: Dashboard showing reminder delivery rates, response rates, etc.

## Testing

**Backend:**
```bash
# Test creating a reminder
POST /reminders
{
  "title": "Test Reminder",
  "body": "This is a test",
  "type": "appointment",
  "frequency": "once",
  "scheduledFor": "2026-05-28T10:00:00Z"
}

# Test getting pending reminders
GET /reminders/pending

# Test acknowledging a reminder
PUT /reminders/{id}/acknowledge
```

**Frontend:**
```dart
// Test scheduling appointment reminders
await ReminderService.scheduleAppointmentReminders(
  appointmentId: 'apt-123',
  patientName: 'Jane Doe',
  appointmentDateTime: DateTime.now().add(Duration(days: 1)),
);

// Test cancelling reminders
await ReminderService.cancelAppointmentReminders('apt-123');
```

## Monitoring

**Key Metrics:**
- Total reminders created
- Reminders sent successfully
- Failed reminders
- Reminder delivery rate
- User acknowledgment rate
- Missed appointments after reminders

**Logs:**
- Check `RemindersService` logs for cron job execution
- Check `PushNotificationsService` logs for delivery failures
- Check `flutter_local_notifications` logs on mobile

## Support

For issues or questions:
1. Check backend logs: `docker logs backend`
2. Check frontend logs: Browser console
3. Check database: Query reminders table
4. Check Firebase: Push notification delivery status

## References

- NestJS Schedule: https://docs.nestjs.com/techniques/task-scheduling
- Flutter Local Notifications: https://pub.dev/packages/flutter_local_notifications
- Firebase Cloud Messaging: https://firebase.google.com/docs/cloud-messaging
- TypeORM: https://typeorm.io/

