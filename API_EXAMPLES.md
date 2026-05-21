# API Examples - Reminders & Offline Mode

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Reminder Endpoints

### 1. Create Reminder

**Endpoint:** `POST /reminders`

**Request:**
```json
{
  "title": "Appointment Reminder",
  "body": "Your appointment is scheduled for tomorrow at 2:00 PM",
  "type": "appointment",
  "frequency": "once",
  "scheduledFor": "2024-05-22T09:00:00Z",
  "appointmentId": "550e8400-e29b-41d4-a716-446655440000",
  "metadata": {
    "appointmentDate": "2024-05-23",
    "appointmentTime": "14:00"
  }
}
```

**Response:** `201 Created`
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "userId": "770e8400-e29b-41d4-a716-446655440002",
  "title": "Appointment Reminder",
  "body": "Your appointment is scheduled for tomorrow at 2:00 PM",
  "type": "appointment",
  "status": "pending",
  "frequency": "once",
  "scheduledFor": "2024-05-22T09:00:00.000Z",
  "sentAt": null,
  "nextReminderAt": null,
  "acknowledged": false,
  "metadata": {
    "appointmentDate": "2024-05-23",
    "appointmentTime": "14:00"
  },
  "appointmentId": "550e8400-e29b-41d4-a716-446655440000",
  "patientId": null,
  "createdAt": "2024-05-21T10:30:00.000Z",
  "updatedAt": "2024-05-21T10:30:00.000Z"
}
```

### 2. Get All Reminders

**Endpoint:** `GET /reminders`

**Response:** `200 OK`
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "title": "Appointment Reminder",
    "body": "Your appointment is scheduled for tomorrow at 2:00 PM",
    "type": "appointment",
    "status": "pending",
    "frequency": "once",
    "scheduledFor": "2024-05-22T09:00:00.000Z",
    "sentAt": null,
    "nextReminderAt": null,
    "acknowledged": false,
    "createdAt": "2024-05-21T10:30:00.000Z",
    "updatedAt": "2024-05-21T10:30:00.000Z"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440002",
    "title": "Iron Tablet Reminder",
    "body": "Remember to take your iron tablet",
    "type": "iron_tablet",
    "status": "sent",
    "frequency": "daily",
    "scheduledFor": "2024-05-21T09:00:00.000Z",
    "sentAt": "2024-05-21T09:00:15.000Z",
    "nextReminderAt": "2024-05-22T09:00:00.000Z",
    "acknowledged": false,
    "createdAt": "2024-05-20T10:30:00.000Z",
    "updatedAt": "2024-05-21T09:00:15.000Z"
  }
]
```

### 3. Get Pending Reminders

**Endpoint:** `GET /reminders/pending`

**Response:** `200 OK`
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "title": "Appointment Reminder",
    "body": "Your appointment is scheduled for tomorrow at 2:00 PM",
    "type": "appointment",
    "status": "pending",
    "frequency": "once",
    "scheduledFor": "2024-05-22T09:00:00.000Z",
    "sentAt": null,
    "nextReminderAt": null,
    "acknowledged": false,
    "createdAt": "2024-05-21T10:30:00.000Z",
    "updatedAt": "2024-05-21T10:30:00.000Z"
  }
]
```

### 4. Get Reminders by Date Range

**Endpoint:** `GET /reminders/range?startDate=2024-05-20&endDate=2024-05-30`

**Query Parameters:**
- `startDate` (required): Start date in ISO format
- `endDate` (required): End date in ISO format

**Response:** `200 OK`
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "title": "Appointment Reminder",
    "body": "Your appointment is scheduled for tomorrow at 2:00 PM",
    "type": "appointment",
    "status": "pending",
    "frequency": "once",
    "scheduledFor": "2024-05-22T09:00:00.000Z",
    "sentAt": null,
    "nextReminderAt": null,
    "acknowledged": false,
    "createdAt": "2024-05-21T10:30:00.000Z",
    "updatedAt": "2024-05-21T10:30:00.000Z"
  }
]
```

### 5. Get Reminder Statistics

**Endpoint:** `GET /reminders/statistics`

**Response:** `200 OK`
```json
{
  "total": 10,
  "pending": 3,
  "sent": 6,
  "failed": 1,
  "cancelled": 0
}
```

### 6. Get Single Reminder

**Endpoint:** `GET /reminders/:id`

**Response:** `200 OK`
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "userId": "770e8400-e29b-41d4-a716-446655440002",
  "title": "Appointment Reminder",
  "body": "Your appointment is scheduled for tomorrow at 2:00 PM",
  "type": "appointment",
  "status": "pending",
  "frequency": "once",
  "scheduledFor": "2024-05-22T09:00:00.000Z",
  "sentAt": null,
  "nextReminderAt": null,
  "acknowledged": false,
  "metadata": {
    "appointmentDate": "2024-05-23",
    "appointmentTime": "14:00"
  },
  "appointmentId": "550e8400-e29b-41d4-a716-446655440000",
  "patientId": null,
  "createdAt": "2024-05-21T10:30:00.000Z",
  "updatedAt": "2024-05-21T10:30:00.000Z"
}
```

### 7. Update Reminder Status

**Endpoint:** `PUT /reminders/:id/status`

**Request:**
```json
{
  "status": "sent"
}
```

**Response:** `200 OK`
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "title": "Appointment Reminder",
  "body": "Your appointment is scheduled for tomorrow at 2:00 PM",
  "type": "appointment",
  "status": "sent",
  "frequency": "once",
  "scheduledFor": "2024-05-22T09:00:00.000Z",
  "sentAt": "2024-05-22T09:00:15.000Z",
  "nextReminderAt": null,
  "acknowledged": false,
  "createdAt": "2024-05-21T10:30:00.000Z",
  "updatedAt": "2024-05-22T09:00:15.000Z"
}
```

### 8. Acknowledge Reminder

**Endpoint:** `PUT /reminders/:id/acknowledge`

**Response:** `200 OK`
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "title": "Appointment Reminder",
  "body": "Your appointment is scheduled for tomorrow at 2:00 PM",
  "type": "appointment",
  "status": "sent",
  "frequency": "once",
  "scheduledFor": "2024-05-22T09:00:00.000Z",
  "sentAt": "2024-05-22T09:00:15.000Z",
  "nextReminderAt": null,
  "acknowledged": true,
  "createdAt": "2024-05-21T10:30:00.000Z",
  "updatedAt": "2024-05-22T09:00:20.000Z"
}
```

### 9. Reschedule Reminder

**Endpoint:** `PUT /reminders/:id/reschedule`

**Request:**
```json
{
  "scheduledFor": "2024-05-23T10:00:00Z"
}
```

**Response:** `200 OK`
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "title": "Appointment Reminder",
  "body": "Your appointment is scheduled for tomorrow at 2:00 PM",
  "type": "appointment",
  "status": "pending",
  "frequency": "once",
  "scheduledFor": "2024-05-23T10:00:00.000Z",
  "sentAt": null,
  "nextReminderAt": null,
  "acknowledged": false,
  "createdAt": "2024-05-21T10:30:00.000Z",
  "updatedAt": "2024-05-22T09:00:25.000Z"
}
```

### 10. Cancel Reminder

**Endpoint:** `PUT /reminders/:id/cancel`

**Response:** `200 OK`
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "title": "Appointment Reminder",
  "body": "Your appointment is scheduled for tomorrow at 2:00 PM",
  "type": "appointment",
  "status": "cancelled",
  "frequency": "once",
  "scheduledFor": "2024-05-22T09:00:00.000Z",
  "sentAt": null,
  "nextReminderAt": null,
  "acknowledged": false,
  "createdAt": "2024-05-21T10:30:00.000Z",
  "updatedAt": "2024-05-22T09:00:30.000Z"
}
```

### 11. Delete Reminder

**Endpoint:** `DELETE /reminders/:id`

**Response:** `200 OK`
```json
{
  "message": "Reminder deleted successfully"
}
```

---

## cURL Examples

### Create Reminder
```bash
curl -X POST http://localhost:3000/api/v1/reminders \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Appointment Reminder",
    "body": "Your appointment is tomorrow",
    "type": "appointment",
    "frequency": "once",
    "scheduledFor": "2024-05-22T09:00:00Z"
  }'
```

### Get All Reminders
```bash
curl -X GET http://localhost:3000/api/v1/reminders \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Get Pending Reminders
```bash
curl -X GET http://localhost:3000/api/v1/reminders/pending \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Get Reminders by Date Range
```bash
curl -X GET "http://localhost:3000/api/v1/reminders/range?startDate=2024-05-20&endDate=2024-05-30" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Get Statistics
```bash
curl -X GET http://localhost:3000/api/v1/reminders/statistics \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Get Single Reminder
```bash
curl -X GET http://localhost:3000/api/v1/reminders/660e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Acknowledge Reminder
```bash
curl -X PUT http://localhost:3000/api/v1/reminders/660e8400-e29b-41d4-a716-446655440001/acknowledge \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

### Reschedule Reminder
```bash
curl -X PUT http://localhost:3000/api/v1/reminders/660e8400-e29b-41d4-a716-446655440001/reschedule \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "scheduledFor": "2024-05-23T10:00:00Z"
  }'
```

### Cancel Reminder
```bash
curl -X PUT http://localhost:3000/api/v1/reminders/660e8400-e29b-41d4-a716-446655440001/cancel \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

### Delete Reminder
```bash
curl -X DELETE http://localhost:3000/api/v1/reminders/660e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Reminder with ID 660e8400-e29b-41d4-a716-446655440001 not found",
  "error": "Not Found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## Reminder Types

- `appointment` - Appointment reminders
- `iron_tablet` - Iron tablet reminders
- `anc_visit` - ANC visit reminders
- `vaccine` - Vaccine reminders
- `prenatal_checkup` - Prenatal checkup reminders
- `neonatal_checkup` - Neonatal checkup reminders
- `custom` - Custom reminders

---

## Reminder Frequencies

- `once` - One-time reminder
- `daily` - Daily recurring reminder
- `weekly` - Weekly recurring reminder
- `monthly` - Monthly recurring reminder

---

## Reminder Statuses

- `pending` - Reminder is pending (not yet sent)
- `sent` - Reminder has been sent
- `failed` - Reminder failed to send
- `cancelled` - Reminder has been cancelled

---

## WebSocket Events

### REMINDER_SENT
Emitted when a reminder is sent:
```json
{
  "userId": "770e8400-e29b-41d4-a716-446655440002",
  "reminderId": "660e8400-e29b-41d4-a716-446655440001",
  "title": "Appointment Reminder",
  "type": "appointment"
}
```

### NOTIFICATION_RECEIVED
Emitted when a notification is created:
```json
{
  "userId": "770e8400-e29b-41d4-a716-446655440002",
  "notificationId": "880e8400-e29b-41d4-a716-446655440003",
  "title": "Appointment Reminder",
  "type": "appointment"
}
```

