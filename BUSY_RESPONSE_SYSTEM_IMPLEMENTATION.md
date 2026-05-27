# Busy Response System Implementation - Safe Mother Malawi

## Overview

The busy response system allows patients to indicate they cannot attend a scheduled appointment and optionally request a reschedule. This system helps clinicians manage appointment no-shows and enables better patient engagement.

## Architecture

### Backend (NestJS)

#### Module Structure
```
src/appointments/
├── entities/
│   ├── appointment.entity.ts       # Appointment data model
│   └── busy-response.entity.ts     # Busy response data model
├── dto/
│   └── mark-busy.dto.ts            # Request validation
├── services/
│   ├── appointments.service.ts     # Appointment logic
│   └── busy-response.service.ts    # Busy response logic
├── appointments.controller.ts      # API endpoints
└── appointments.module.ts          # Module configuration
```

#### Database Schema

**BusyResponse Entity**
- `id` (UUID): Primary key
- `appointmentId` (UUID): Reference to appointment
- `appointment` (Appointment): Appointment relation
- `patientId` (UUID): Patient who marked busy
- `reason` (string): Why patient is busy
- `additionalNotes` (text, nullable): Extra details
- `rescheduleRequested` (boolean): Whether reschedule requested
- `preferredRescheduleDate` (date, nullable): Preferred new date
- `preferredRescheduleTime` (string, nullable): Preferred new time
- `status` (enum): Response status (pending, approved, rejected, rescheduled)
- `clinicianResponse` (text, nullable): Clinician's response
- `respondedAt` (timestamp, nullable): When clinician responded
- `createdAt` (timestamp): When marked busy
- `updatedAt` (timestamp): Last update

#### Enums

**BusyResponseStatus**
- PENDING: Awaiting clinician review
- APPROVED: Clinician acknowledged
- REJECTED: Reschedule request rejected
- RESCHEDULED: New appointment scheduled

### API Endpoints

#### Mark Appointment as Busy
```
POST /appointments/:appointmentId/busy
Authorization: Required (Patient)
Body: MarkBusyDto
Response: BusyResponse
```

**MarkBusyDto**
```typescript
{
  reason: string;                    // Why patient is busy
  additionalNotes?: string;          // Optional extra details
  rescheduleRequested: boolean;      // Request reschedule?
  preferredRescheduleDate?: string;  // ISO date string
  preferredRescheduleTime?: string;  // Time string (HH:mm)
}
```

#### Get Busy Responses
```
GET /appointments/busy-responses
Authorization: Required (Clinician, DHO, Admin)
Response: BusyResponse[]
```

#### Get Busy Responses for Appointment
```
GET /appointments/:appointmentId/busy-responses
Authorization: Required (Clinician, DHO, Admin)
Response: BusyResponse[]
```

#### Approve Reschedule Request
```
PUT /appointments/busy-responses/:id/approve
Authorization: Required (Clinician, DHO, Admin)
Body: { clinicianResponse?: string }
Response: BusyResponse
```

#### Reject Reschedule Request
```
PUT /appointments/busy-responses/:id/reject
Authorization: Required (Clinician, DHO, Admin)
Body: { clinicianResponse: string }
Response: BusyResponse
```

#### Reschedule Appointment
```
PUT /appointments/busy-responses/:id/reschedule
Authorization: Required (Clinician, DHO, Admin)
Body: { newDate: string, newTime?: string }
Response: { busyResponse: BusyResponse, appointment: Appointment }
```

## Workflow

### 1. Patient Marks Busy
```
Patient receives appointment reminder
    ↓
Patient opens appointment details
    ↓
Patient clicks "I'm Busy" button
    ↓
BusyResponseScreen opens with:
  - Appointment details
  - Reason selection dropdown
  - Additional notes field
  - Reschedule request checkbox
  - Preferred date/time pickers
    ↓
Patient submits response
    ↓
System creates BusyResponse record
    ↓
Appointment status updated to BUSY
    ↓
Existing reminders cancelled
    ↓
Clinician notified
```

### 2. Clinician Reviews Response
```
Clinician receives notification
    ↓
Clinician views pending busy responses
    ↓
Clinician reviews:
  - Patient reason
  - Additional notes
  - Reschedule request
  - Preferred date/time
    ↓
Clinician decides:
  Option 1: APPROVE reschedule
    - New appointment created
    - Patient notified
    - Status: RESCHEDULED
    ↓
  Option 2: REJECT reschedule
    - Rejection reason recorded
    - Patient notified
    - Status: REJECTED
    ↓
  Option 3: ACKNOWLEDGE only
    - No reschedule
    - Status: APPROVED
```

### 3. Patient Receives Response
```
Patient notified of clinician's decision
    ↓
If RESCHEDULED:
  - New appointment details sent
  - New reminders scheduled
    ↓
If REJECTED:
  - Rejection reason shown
  - Option to contact clinician
    ↓
If APPROVED:
  - Acknowledgment shown
```

## Busy Response Reasons

Predefined reasons in BusyResponseScreen:
- `work_conflict`: Work conflict
- `health_issue`: Health issue
- `transportation`: Transportation issue
- `family_emergency`: Family emergency
- `forgot`: Forgot about appointment
- `other`: Other reason

## Service Methods

### BusyResponseService

#### markBusy(appointmentId: string, patientId: string, dto: MarkBusyDto): Promise<BusyResponse>
Creates a busy response record and updates appointment status.

#### findByAppointment(appointmentId: string): Promise<BusyResponse[]>
Gets all busy responses for an appointment.

#### findPending(): Promise<BusyResponse[]>
Gets all pending busy responses awaiting clinician review.

#### approveBusyResponse(id: string, clinicianResponse?: string): Promise<BusyResponse>
Approves a busy response.

#### rejectBusyResponse(id: string, clinicianResponse: string): Promise<BusyResponse>
Rejects a busy response with reason.

#### rescheduleAppointment(busyResponseId: string, newDate: Date, newTime?: string): Promise<{ busyResponse: BusyResponse, appointment: Appointment }>
Creates new appointment and updates busy response status.

## Frontend Implementation

### Mobile App (Flutter)

#### BusyResponseScreen
Located: `lib/mobile/prenatal/screens/busy_response_screen.dart`

**Features**
- Displays appointment details
- Reason selection with radio buttons
- Additional notes text field
- Reschedule request checkbox
- Date picker for preferred reschedule date
- Time picker for preferred reschedule time
- Submit button with loading state
- Error handling and user feedback

**Props**
```dart
BusyResponseScreen({
  required String appointmentId,
  required String appointmentTitle,
  required String appointmentDate,
  String? appointmentTime,
})
```

#### AppointmentsScreen Integration
Located: `lib/mobile/prenatal/screens/appointments_screen.dart`

**Changes**
- Added "I'm Busy" button to appointment detail view
- Button only shows for future appointments
- Navigates to BusyResponseScreen on click
- Reloads appointments after busy response submitted

**Button Implementation**
```dart
if (date.isAfter(DateTime.now()))
  TextButton(
    onPressed: () {
      Navigator.pop(ctx);
      _navigateToBusyResponse(appointment);
    },
    child: const Text('I\'m Busy', style: TextStyle(color: Colors.orange)),
  ),
```

### Web App (Angular/React)

#### Clinician Dashboard
**Pending Busy Responses Widget**
- List of pending busy responses
- Patient name and appointment details
- Reason and notes display
- Action buttons (Approve, Reject, Reschedule)

#### Busy Response Detail View
- Full busy response information
- Appointment details
- Patient's reason and notes
- Reschedule request details
- Clinician response form
- Action buttons

## Notifications

### Patient Notifications
1. **Busy Response Submitted**
   - Title: "Appointment Status Updated"
   - Body: "Your clinician will review your response"

2. **Reschedule Approved**
   - Title: "Appointment Rescheduled"
   - Body: "New appointment: [date] at [time]"

3. **Reschedule Rejected**
   - Title: "Reschedule Request Rejected"
   - Body: "Reason: [clinician response]"

### Clinician Notifications
1. **Patient Marked Busy**
   - Title: "Patient Unavailable"
   - Body: "[Patient Name] cannot attend appointment on [date]"

## Integration Points

### Appointments Module
- Updates appointment status to BUSY
- Cancels existing reminders
- Creates new appointment on reschedule

### Reminders Module
- Cancels reminders for busy appointments
- Schedules reminders for rescheduled appointments

### Notifications Module
- Sends notifications to patients and clinicians
- Tracks notification delivery

### Activity Logging
- Logs all busy response actions
- Tracks clinician responses

## Error Handling

### Validation Errors
- Invalid appointment ID
- Missing required fields
- Invalid date/time format

### Business Logic Errors
- Cannot mark past appointment as busy
- Cannot reschedule to past date
- Cannot reschedule without date selection

### Notifications
- Failed notifications logged but don't block response
- Retry logic for failed notifications (future)

## Security

### Authorization
- Only appointment owner can mark busy
- Only clinicians/DHOs/admins can approve/reject
- Only clinicians/DHOs/admins can reschedule

### Data Validation
- All inputs validated with class-validator
- Date/time validation
- Reason validation against predefined list

## Performance Considerations

### Indexes
- `appointmentId` on BusyResponse
- `patientId` on BusyResponse
- `status` on BusyResponse
- `createdAt` on BusyResponse

### Query Optimization
- Relations loaded only when needed
- Pagination for busy response lists (future)
- Caching for appointment lookups (future)

## Testing

### Unit Tests (Future)
- Service method tests
- Validation tests
- Status transition tests

### Integration Tests (Future)
- API endpoint tests
- Database transaction tests
- Notification tests

### E2E Tests (Future)
- Complete busy response workflow
- Reschedule workflow
- Notification delivery

## Deployment

### Prerequisites
- PostgreSQL database with BusyResponse table
- NestJS backend running
- Firebase configured for notifications
- Flutter app updated with BusyResponseScreen

### Database Migration
- Automatic table creation on startup (synchronize: true)
- Manual migration recommended for production

## Future Enhancements

1. **Smart Rescheduling**
   - Suggest available time slots
   - Auto-match with clinician availability
   - Conflict detection

2. **Analytics**
   - Busy response trends
   - Common reasons analysis
   - Reschedule success rate

3. **Communication**
   - Direct messaging with clinician
   - Reason-specific responses
   - Follow-up reminders

4. **Automation**
   - Auto-approve reschedules within policy
   - Escalation for repeated busy responses
   - Pattern detection for no-shows

5. **Integration**
   - SMS notifications
   - WhatsApp integration
   - Calendar sync

## Support

For issues or questions about the busy response system:
1. Check the API documentation
2. Review error logs
3. Contact the development team

---

**Last Updated**: May 27, 2026
**Status**: Production Ready
**Version**: 1.0.0
