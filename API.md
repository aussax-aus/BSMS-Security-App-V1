# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "count": 10  // For list endpoints
}
```

### Error Response
```json
{
  "error": {
    "message": "Error message"
  }
}
```

## Endpoints

### Authentication

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "officer"  // optional: admin, supervisor, officer, client
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

### Shifts

#### Get All Shifts
```http
GET /shifts?officer=<id>&site=<id>&status=<status>&startDate=<date>&endDate=<date>
Authorization: Bearer <token>
```

#### Get Single Shift
```http
GET /shifts/:id
Authorization: Bearer <token>
```

#### Create Shift
```http
POST /shifts
Authorization: Bearer <token>
Content-Type: application/json

{
  "site": "site_id",
  "officer": "officer_id",
  "startTime": "2025-11-15T08:00:00Z",
  "endTime": "2025-11-15T16:00:00Z",
  "instructions": "Regular patrol shift"
}
```

#### Accept/Decline Shift
```http
POST /shifts/:id/respond
Authorization: Bearer <token>
Content-Type: application/json

{
  "response": "accepted"  // or "declined"
}
```

#### Check-in to Shift
```http
POST /shifts/:id/checkin
Authorization: Bearer <token>
Content-Type: application/json

{
  "location": {
    "type": "Point",
    "coordinates": [151.2093, -33.8688]  // [longitude, latitude]
  },
  "photo": "url_to_photo",
  "notes": "Arrived on time"
}
```

#### Check-out from Shift
```http
POST /shifts/:id/checkout
Authorization: Bearer <token>
Content-Type: application/json

{
  "location": {
    "type": "Point",
    "coordinates": [151.2093, -33.8688]
  },
  "photo": "url_to_photo",
  "notes": "Shift completed"
}
```

### Patrols

#### Start Patrol
```http
POST /patrols/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "shift": "shift_id",
  "site": "site_id"
}
```

#### Record Checkpoint
```http
POST /patrols/:id/checkpoint
Authorization: Bearer <token>
Content-Type: application/json

{
  "checkpoint": "checkpoint_id",
  "checkpointName": "Main Entrance",
  "location": {
    "type": "Point",
    "coordinates": [151.2093, -33.8688]
  },
  "verificationMethod": "nfc",  // or "qr", "gps"
  "photo": "url_to_photo",
  "notes": "All clear"
}
```

#### Update Location (GPS Tracking)
```http
POST /patrols/:id/location
Authorization: Bearer <token>
Content-Type: application/json

{
  "location": {
    "type": "Point",
    "coordinates": [151.2093, -33.8688]
  },
  "accuracy": 10,
  "speed": 0
}
```

#### Complete Patrol
```http
POST /patrols/:id/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "Patrol completed successfully"
}
```

### Incidents

#### Get All Incidents
```http
GET /incidents?site=<id>&officer=<id>&status=<status>&type=<type>&priority=<priority>
Authorization: Bearer <token>
```

#### Create Incident
```http
POST /incidents
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "alarm",  // alarm, security-breach, safety-issue, medical, fire, theft, vandalism, other
  "priority": "high",  // low, medium, high, critical
  "site": "site_id",
  "description": "Alarm triggered at main entrance",
  "location": {
    "type": "Point",
    "coordinates": [151.2093, -33.8688]
  },
  "locationDescription": "Main entrance"
}
```

#### Record Arrival
```http
POST /incidents/:id/arrival
Authorization: Bearer <token>
Content-Type: application/json

{
  "location": {
    "type": "Point",
    "coordinates": [151.2093, -33.8688]
  },
  "photo": "url_to_photo",
  "notes": "On scene, investigating"
}
```

#### Complete Incident
```http
POST /incidents/:id/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "outcome": "False alarm",
  "resolution": "Verified all entrances secure",
  "followUpRequired": false,
  "followUpNotes": ""
}
```

#### Add Client Sign-off
```http
POST /incidents/:id/signoff
Authorization: Bearer <token>
Content-Type: application/json

{
  "signatureUrl": "url_to_signature_image",
  "photoUrl": "url_to_photo",
  "signedBy": "Client Name",
  "notes": "Client satisfied with response"
}
```

### Welfare Checks

#### Get Welfare Checks
```http
GET /welfare?officer=<id>&shift=<id>&status=<status>
Authorization: Bearer <token>
```

#### Respond to Welfare Check
```http
POST /welfare/:id/respond
Authorization: Bearer <token>
Content-Type: application/json

{
  "location": {
    "type": "Point",
    "coordinates": [151.2093, -33.8688]
  },
  "notes": "All good",
  "isDuress": false
}
```

#### Trigger Panic Button
```http
POST /welfare/panic
Authorization: Bearer <token>
Content-Type: application/json

{
  "location": {
    "type": "Point",
    "coordinates": [151.2093, -33.8688]
  },
  "shift": "shift_id",
  "site": "site_id",
  "notes": "Emergency situation"
}
```

### Dashboard

#### Get Dashboard Overview
```http
GET /dashboard
Authorization: Bearer <token>
```

Response includes:
- Today's shifts summary
- Active incidents
- In-progress patrols
- Pending welfare checks
- Officer statistics
- Compliance alerts
- Site statistics

#### Get Site Dashboard
```http
GET /dashboard/site/:siteId
Authorization: Bearer <token>
```

### Reports

#### Timesheet Report
```http
GET /reports/timesheets?startDate=<date>&endDate=<date>&officer=<id>
Authorization: Bearer <token>
```

#### Incident Report
```http
GET /reports/incidents?startDate=<date>&endDate=<date>&site=<id>&type=<type>&priority=<priority>
Authorization: Bearer <token>
```

#### Patrol Report
```http
GET /reports/patrols?startDate=<date>&endDate=<date>&site=<id>&officer=<id>
Authorization: Bearer <token>
```

#### Export Data
```http
GET /reports/export/:type?format=json&startDate=<date>&endDate=<date>
Authorization: Bearer <token>
```
Types: `timesheets`, `incidents`, `patrols`
Formats: `json`, `csv`

### Sites

#### Get All Sites
```http
GET /sites?client=<id>&isActive=true
Authorization: Bearer <token>
```

#### Create Site
```http
POST /sites
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Downtown Office",
  "address": {
    "street": "123 Main St",
    "city": "Sydney",
    "state": "NSW",
    "postcode": "2000",
    "country": "Australia"
  },
  "location": {
    "type": "Point",
    "coordinates": [151.2093, -33.8688]
  },
  "geofenceRadius": 100,
  "client": "client_company_id",
  "requiresWelfareChecks": true,
  "welfareCheckInterval": 30,
  "checkpoints": [
    {
      "name": "Main Entrance",
      "type": "nfc",
      "identifier": "NFC_TAG_001",
      "location": {
        "type": "Point",
        "coordinates": [151.2093, -33.8688]
      },
      "description": "Front entrance checkpoint"
    }
  ]
}
```

### Companies

#### Get All Companies
```http
GET /companies?type=client&isActive=true
Authorization: Bearer <token>
```

#### Create Company
```http
POST /companies
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "ABC Security Services",
  "type": "client",  // client, subcontractor, both
  "abn": "12345678901",
  "address": {
    "street": "456 Business Ave",
    "city": "Sydney",
    "state": "NSW",
    "postcode": "2000"
  },
  "contact": {
    "name": "John Manager",
    "phone": "+61400000000",
    "email": "john@abc.com"
  }
}
```

### Documents

#### Get All Documents
```http
GET /documents?type=sop&site=<id>
Authorization: Bearer <token>
```

#### Create Document
```http
POST /documents
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Site Safety Procedures",
  "type": "sop",
  "description": "Standard operating procedures for site safety",
  "fileUrl": "url_to_document",
  "site": "site_id",
  "accessibleTo": "all",  // all, officers, supervisors, specific
  "knowledgeCheck": {
    "enabled": true,
    "questions": [
      {
        "question": "What should you do in case of fire?",
        "options": ["Run", "Call 000", "Hide", "Wait"],
        "correctAnswer": 1,
        "explanation": "Always call emergency services first"
      }
    ],
    "passingScore": 80
  }
}
```

#### Record Document Completion
```http
POST /documents/:id/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "score": 85
}
```

### Messages

#### Get All Messages
```http
GET /messages
Authorization: Bearer <token>
```

#### Send Message
```http
POST /messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "to": ["user_id_1", "user_id_2"],  // Optional if using toAll or toRole
  "toAll": false,
  "toRole": "officer",  // Optional
  "site": "site_id",  // Optional
  "subject": "Important Update",
  "message": "Please check the new safety procedures",
  "priority": "high"  // normal, high, urgent
}
```

#### Mark Message as Read
```http
POST /messages/:id/read
Authorization: Bearer <token>
```

### Users

#### Get All Users
```http
GET /users?role=officer&isActive=true
Authorization: Bearer <token>
```

#### Get User by ID
```http
GET /users/:id
Authorization: Bearer <token>
```

#### Update User
```http
PUT /users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+61400000000",
  "licenseNumber": "SEC123456",
  "licenseExpiry": "2026-12-31",
  "certifications": [
    {
      "name": "First Aid",
      "issueDate": "2024-01-15",
      "expiryDate": "2026-01-15",
      "documentUrl": "url_to_cert"
    }
  ]
}
```

#### Get Expiring Certifications
```http
GET /users/:id/expiring-certifications
Authorization: Bearer <token>
```

## WebSocket Events

Connect to Socket.IO at `http://localhost:5000`

### Events to Listen For

- `new-incident` - New incident created
- `duress-alert` - Officer triggered duress alert
- `panic-alert` - Panic button activated
- `new-message` - New message received

### Events to Emit

- `join-shift` - Join a shift room for real-time updates
  ```javascript
  socket.emit('join-shift', shiftId);
  ```

## Error Codes

- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

## Date Formats

All dates should be in ISO 8601 format:
```
2025-11-15T08:00:00Z
```

## Coordinates Format

Locations use GeoJSON Point format:
```json
{
  "type": "Point",
  "coordinates": [longitude, latitude]
}
```

Example: Sydney Opera House
```json
{
  "type": "Point",
  "coordinates": [151.2153, -33.8568]
}
```
