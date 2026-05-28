# Referral System Implementation - Safe Mother Malawi

## Overview

The referral system enables healthcare facilities to refer patients to higher-level facilities when they cannot handle a case. The system tracks the entire referral journey from creation through completion, including transport status, acceptance/rejection, and treatment outcomes.

## Architecture

### Backend (NestJS)

#### Module Structure
```
src/referrals/
├── entities/
│   └── referral.entity.ts          # Referral data model
├── dto/
│   └── create-referral.dto.ts      # Request validation
├── referrals.service.ts            # Business logic
├── referrals.controller.ts         # API endpoints
└── referrals.module.ts             # Module configuration
```

#### Database Schema

**Referral Entity**
- `id` (UUID): Primary key
- `prenatalPatientId` (UUID, nullable): Link to prenatal patient
- `neonatalPatientId` (UUID, nullable): Link to neonatal patient
- `patientName` (string): Patient name
- `patientContact` (string): Patient contact information
- `patientAge` (string, nullable): Patient age
- `reason` (enum): Referral reason (hypertension, bleeding, infection, etc.)
- `clinicalSummary` (text): Clinical details and justification
- `urgencyNotes` (text, nullable): Urgency information
- `status` (enum): Current status (pending, accepted, in_transit, arrived, completed, rejected, cancelled)
- `referringFacilityId` (UUID): Sending facility
- `receivingFacilityId` (UUID): Receiving facility
- `referringClinicianId` (UUID): Clinician creating referral
- `receivingClinicianId` (UUID, nullable): Clinician accepting referral
- `transportMode` (enum): Transport type (ambulance, personal_vehicle, motorcycle, walking, other)
- `transportProvider` (string, nullable): Transport provider name
- `transportContact` (string, nullable): Transport contact
- `departureTime` (timestamp, nullable): When patient left
- `arrivalTime` (timestamp, nullable): When patient arrived
- `transportNotes` (text, nullable): Transport details
- `acceptedByReceivingFacility` (boolean): Acceptance status
- `acceptedAt` (timestamp, nullable): When accepted
- `rejectionReason` (text, nullable): Why referral was rejected
- `rejectedAt` (timestamp, nullable): When rejected
- `treatmentOutcome` (text, nullable): Treatment result
- `completedAt` (timestamp, nullable): When completed
- `metadata` (jsonb, nullable): Additional data
- `referralCode` (string, nullable): Unique referral code
- `createdAt` (timestamp): Creation time
- `updatedAt` (timestamp): Last update time

#### Enums

**ReferralReason**
- HYPERTENSION
- BLEEDING
- INFECTION
- FETAL_DISTRESS
- PREMATURE_LABOR
- PLACENTAL_ISSUES
- NEONATAL_EMERGENCY
- NEONATAL_INFECTION
- LOW_BIRTH_WEIGHT
- RESPIRATORY_DISTRESS
- JAUNDICE
- OTHER

**ReferralStatus**
- PENDING: Awaiting receiving facility response
- ACCEPTED: Receiving facility accepted
- IN_TRANSIT: Patient in transport
- ARRIVED: Patient arrived at receiving facility
- COMPLETED: Treatment completed
- REJECTED: Receiving facility rejected
- CANCELLED: Referral cancelled

**TransportMode**
- AMBULANCE
- PERSONAL_VEHICLE
- MOTORCYCLE
- WALKING
- OTHER

### API Endpoints

#### Create Referral
```
POST /referrals
Authorization: Required (Clinician, DHO, Admin)
Body: CreateReferralDto
Response: Referral
```

#### Get All Referrals
```
GET /referrals
Authorization: Required (Clinician, DHO, Admin)
Response: Referral[]
```

#### Get Referrals by Facility
```
GET /referrals/facility/:facilityId?type=receiving
Authorization: Required (Clinician, DHO, Admin)
Query: type (referring | receiving)
Response: Referral[]
```

#### Get Referrals by Patient
```
GET /referrals/patient/:patientId
Authorization: Required (Clinician, DHO, Admin, Prenatal, Neonatal)
Response: Referral[]
```

#### Get Referral by Code
```
GET /referrals/code/:referralCode
Authorization: Required (Clinician, DHO, Admin)
Response: Referral
```

#### Get Referral Statistics
```
GET /referrals/stats?facilityId=optional
Authorization: Required (Admin, DHO)
Response: {
  total: number,
  pending: number,
  accepted: number,
  inTransit: number,
  arrived: number,
  completed: number,
  rejected: number,
  cancelled: number,
  byReason: Record<string, number>
}
```

#### Get Specific Referral
```
GET /referrals/:id
Authorization: Required (Clinician, DHO, Admin)
Response: Referral
```

#### Accept Referral
```
PUT /referrals/:id/accept
Authorization: Required (Clinician, DHO, Admin)
Response: Referral
```

#### Reject Referral
```
PUT /referrals/:id/reject
Authorization: Required (Clinician, DHO, Admin)
Body: { rejectionReason: string }
Response: Referral
```

#### Update Transport Status
```
PUT /referrals/:id/transport
Authorization: Required (Clinician, DHO, Admin)
Body: { status: 'in_transit' | 'arrived', timestamp?: string }
Response: Referral
```

#### Complete Referral
```
PUT /referrals/:id/complete
Authorization: Required (Clinician, DHO, Admin)
Body: { treatmentOutcome: string }
Response: Referral
```

#### Cancel Referral
```
PUT /referrals/:id/cancel
Authorization: Required (Clinician, DHO, Admin)
Response: Referral
```

## Referral Workflow

### 1. Creation
```
Clinician at Facility A identifies case that needs higher-level care
    ↓
Creates referral with:
  - Patient information
  - Clinical summary and reason
  - Urgency notes
  - Receiving facility
  - Transport mode
    ↓
System generates unique referral code
    ↓
Receiving facility notified
    ↓
Status: PENDING
```

### 2. Acceptance/Rejection
```
Receiving facility reviews referral
    ↓
Option 1: ACCEPT
  - Receiving clinician assigned
  - Status: ACCEPTED
  - Referring facility notified
    ↓
Option 2: REJECT
  - Rejection reason recorded
  - Status: REJECTED
  - Referring facility notified
```

### 3. Transport
```
If ACCEPTED:
  ↓
Transport arranged
  ↓
Patient departs
  - Status: IN_TRANSIT
  - Departure time recorded
  ↓
Patient arrives
  - Status: ARRIVED
  - Arrival time recorded
  - Receiving facility notified
```

### 4. Treatment & Completion
```
Patient receives treatment at receiving facility
  ↓
Treatment completed
  - Status: COMPLETED
  - Treatment outcome documented
  - Referring facility notified
```

## Service Methods

### ReferralsService

#### create(dto: CreateReferralDto, referringClinicianId: string): Promise<Referral>
Creates a new referral with validation and notifications.

#### findAll(): Promise<Referral[]>
Returns all referrals with related entities.

#### findByFacility(facilityId: string, type: 'referring' | 'receiving'): Promise<Referral[]>
Gets referrals for a facility (as referring or receiving).

#### findByPatient(prenatalPatientId?: string, neonatalPatientId?: string): Promise<Referral[]>
Gets all referrals for a patient.

#### findById(id: string): Promise<Referral | null>
Gets a specific referral.

#### findByCode(referralCode: string): Promise<Referral | null>
Gets referral by unique code.

#### acceptReferral(id: string, receivingClinicianId: string): Promise<Referral>
Accepts a referral at receiving facility.

#### rejectReferral(id: string, rejectionReason: string): Promise<Referral>
Rejects a referral with reason.

#### updateTransportStatus(id: string, status: 'in_transit' | 'arrived', timestamp?: Date): Promise<Referral>
Updates transport status and records timestamps.

#### completeReferral(id: string, treatmentOutcome: string): Promise<Referral>
Marks referral as completed with outcome.

#### cancelReferral(id: string): Promise<Referral>
Cancels a referral.

#### getStatistics(facilityId?: string): Promise<Statistics>
Returns referral statistics by status and reason.

## Integration Points

### Notifications
- Receiving facility notified when referral created
- Referring facility notified when referral accepted/rejected
- Receiving facility notified when patient arrives
- Referring facility notified when referral completed

### Activity Logging
- All referral actions logged for audit trail
- Includes actor, action, and metadata

### WebSocket Events
- REFERRAL_CREATED: New referral created
- REFERRAL_UPDATED: Referral status changed

### Database
- Integrated into app.module.ts
- Referral entity registered with TypeORM
- Automatic table creation on startup

## Frontend Implementation (Future)

### Screens Needed
1. **Create Referral Screen** (Clinician)
   - Patient selection
   - Reason selection
   - Clinical summary input
   - Facility selection
   - Transport mode selection

2. **Referral List Screen** (Clinician/DHO)
   - Filter by status
   - Filter by facility
   - Search by patient name or code

3. **Referral Detail Screen** (Clinician/DHO)
   - Full referral information
   - Status timeline
   - Accept/Reject buttons
   - Transport status updates

4. **Referral Dashboard** (DHO/Admin)
   - Statistics and charts
   - Pending referrals
   - Referral trends

5. **Patient Referral Status** (Patient)
   - View referral status
   - Track transport
   - View receiving facility info

## Error Handling

### Validation Errors
- Invalid facility IDs
- Missing required fields
- Invalid status transitions

### Business Logic Errors
- Cannot accept already accepted referral
- Cannot reject already rejected referral
- Cannot update transport status of non-accepted referral

### Notifications
- Failed notifications logged but don't block referral creation
- Retry logic for failed notifications (future enhancement)

## Security

### Authorization
- Only clinicians, DHOs, and admins can create referrals
- Only receiving facility clinicians can accept/reject
- Only authorized users can update transport status

### Data Validation
- All inputs validated with class-validator
- SQL injection prevention via TypeORM
- CORS enabled for frontend access

## Performance Considerations

### Indexes
- `referringFacilityId + status`
- `receivingFacilityId + status`
- `prenatalPatientId + status`
- `neonatalPatientId + status`
- `createdAt + status`

### Query Optimization
- Relations loaded only when needed
- Pagination support (future enhancement)
- Caching for facility lookups (future enhancement)

## Testing

### Unit Tests (Future)
- Service method tests
- Validation tests
- Error handling tests

### Integration Tests (Future)
- API endpoint tests
- Database transaction tests
- Notification tests

### E2E Tests (Future)
- Complete referral workflow
- Multi-facility scenarios
- Transport status updates

## Deployment

### Prerequisites
- PostgreSQL database
- NestJS backend running
- Firebase configured for notifications

### Environment Variables
- DATABASE_URL: PostgreSQL connection string
- NODE_ENV: development/production

### Database Migration
- Automatic table creation on startup (synchronize: true)
- Manual migration recommended for production

## Future Enhancements

1. **Referral Tracking**
   - Real-time GPS tracking of transport
   - ETA calculation
   - Route optimization

2. **Communication**
   - Direct messaging between facilities
   - Referral notes and updates
   - Document sharing

3. **Analytics**
   - Referral trends and patterns
   - Facility performance metrics
   - Outcome analysis

4. **Automation**
   - Auto-assignment of receiving clinician
   - Automatic status updates based on time
   - Escalation for delayed referrals

5. **Integration**
   - SMS notifications
   - WhatsApp integration
   - External facility systems

## Support

For issues or questions about the referral system:
1. Check the API documentation
2. Review error logs
3. Contact the development team

---

**Last Updated**: May 27, 2026
**Status**: Production Ready
**Version**: 1.0.0
