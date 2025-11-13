# BSMS Security App V1

A comprehensive Business Security Management System for managing security operations, guard scheduling, patrol tracking, incident reporting, and compliance management.

## Features

### 1. Roster & Shift Management
- **Admin Side:**
  - Create and manage shifts
  - Assign guards/officers to shifts
  - Assign sites and subcontractors
  - Track shift status and completion
- **Officer Side:**
  - View upcoming shifts
  - Accept or decline shift assignments
  - Check-in and check-out with GPS verification
  - Track equipment and key issuance

### 2. Patrol & Site Verification
- **NFC Tags & QR Codes:** Verify presence at patrol checkpoints
- **GPS Tracking:** Real-time location tracking with route replay
- **Geofencing:** Restrict actions based on location proximity
- **On-foot Tracking:** Timestamped GPS logs for mobile patrols
- **Key Register:** Digital logs for keys and equipment issued/returned

### 3. Alarm Response & Incident Reporting
- **Real-time Dispatching:** Instant alerts to mobile devices
- **On-Arrival Recording:** Time, location, photos, and notes
- **Completion Recording:** Outcomes with optional client sign-off
- **Evidence Storage:** Timestamped photos, GPS data, and officer ID
- **Client Sign-off:** Photo or signature capture

### 4. Personnel & Compliance Management
- **Officer Management:**
  - License and certification tracking
  - Expiry date alerts (30-day advance notice)
  - Induction completion tracking
  - Visa status monitoring
- **Badge/ID Scanning:** Photo upload for compliance
- **Performance Tracking:** Incidents, patrols, tasks, and ratings

### 5. Reporting & Dashboard
- **Live Dashboard:**
  - Real-time view of all sites
  - Active shifts and incidents
  - Compliance status monitoring
- **Data Export:**
  - Timesheets for payroll
  - Incident logs for audits
  - Patrol data for client reports
- **Invoice Generation:** Optional client billing

### 6. Client Portal
- **Client Access:**
  - View patrol logs and incident reports
  - Access site-specific KPIs
  - Download reports
- **Multi-brand Support:** Manage multiple divisions or subcontractors

### 7. Safety & Lone-Worker Features
- **Welfare Checks:** Automated prompts (configurable intervals)
- **Panic Button:** Immediate duress alert with GPS location
- **Compliance Logging:** Full audit trail of welfare checks

### 8. Document Management & Communication
- **Document Storage:**
  - SOPs, training materials, and inductions
  - Knowledge checks with passing scores
  - Version control
- **In-app Messaging:**
  - Push updates to staff
  - Site instructions and emergency contacts
  - Priority-based notifications

## Technology Stack

### Backend
- **Framework:** Node.js with Express
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Real-time:** Socket.IO for live updates
- **Scheduled Tasks:** node-cron for automated processes
- **Geolocation:** geolib for distance calculations

### API Features
- RESTful API design
- Role-based access control (Admin, Supervisor, Officer, Client)
- Real-time notifications
- File upload support
- Comprehensive error handling

## Project Structure

```
BSMS-Security-App-V1/
├── packages/
│   ├── backend/           # Node.js/Express API server
│   │   ├── src/
│   │   │   ├── config/    # Configuration files
│   │   │   ├── models/    # MongoDB models
│   │   │   ├── routes/    # API routes
│   │   │   ├── middleware/ # Auth and other middleware
│   │   │   ├── services/  # Business logic and scheduled tasks
│   │   │   └── index.js   # Entry point
│   │   └── package.json
│   ├── mobile/            # React Native mobile app (TODO)
│   └── admin/             # React web admin panel (TODO)
├── package.json           # Root workspace configuration
└── README.md
```

## Installation

### Prerequisites
- Node.js >= 18.0.0
- MongoDB >= 5.0
- npm >= 9.0.0

### Setup

1. Clone the repository:
```bash
git clone https://github.com/aussax-aus/BSMS-Security-App-V1.git
cd BSMS-Security-App-V1
```

2. Install dependencies:
```bash
npm install
cd packages/backend
npm install
```

3. Configure environment variables:
```bash
cd packages/backend
cp .env.example .env
# Edit .env with your configuration
```

4. Start MongoDB:
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or use your local MongoDB installation
```

5. Start the backend server:
```bash
cd packages/backend
npm run dev
```

The API will be available at `http://localhost:5000`

## API Documentation

### Authentication Endpoints

#### Register User
```
POST /api/auth/register
Body: { email, password, firstName, lastName, role }
```

#### Login
```
POST /api/auth/login
Body: { email, password }
Returns: { token, user }
```

#### Get Current User
```
GET /api/auth/me
Headers: { Authorization: "Bearer <token>" }
```

### Shift Management

#### Get All Shifts
```
GET /api/shifts
Query: ?officer=<id>&site=<id>&status=<status>
```

#### Create Shift
```
POST /api/shifts
Body: { site, officer, startTime, endTime, instructions }
```

#### Accept/Decline Shift
```
POST /api/shifts/:id/respond
Body: { response: "accepted" | "declined" }
```

#### Check-in to Shift
```
POST /api/shifts/:id/checkin
Body: { location: { type: "Point", coordinates: [lng, lat] }, photo, notes }
```

#### Check-out from Shift
```
POST /api/shifts/:id/checkout
Body: { location, photo, notes }
```

### Patrol Management

#### Start Patrol
```
POST /api/patrols/start
Body: { shift, site }
```

#### Record Checkpoint
```
POST /api/patrols/:id/checkpoint
Body: { checkpoint, checkpointName, location, verificationMethod, photo, notes }
```

#### Update Location
```
POST /api/patrols/:id/location
Body: { location, accuracy, speed }
```

#### Complete Patrol
```
POST /api/patrols/:id/complete
Body: { notes }
```

### Incident Management

#### Create Incident
```
POST /api/incidents
Body: { type, priority, site, description, location }
```

#### Record Arrival
```
POST /api/incidents/:id/arrival
Body: { location, photo, notes }
```

#### Complete Incident
```
POST /api/incidents/:id/complete
Body: { outcome, resolution, followUpRequired, followUpNotes }
```

#### Add Client Sign-off
```
POST /api/incidents/:id/signoff
Body: { signatureUrl, photoUrl, signedBy, notes }
```

### Welfare Checks

#### Get Welfare Checks
```
GET /api/welfare
Query: ?officer=<id>&shift=<id>&status=<status>
```

#### Respond to Welfare Check
```
POST /api/welfare/:id/respond
Body: { location, notes, isDuress }
```

#### Trigger Panic Button
```
POST /api/welfare/panic
Body: { location, shift, site, notes }
```

### Dashboard

#### Get Dashboard Overview
```
GET /api/dashboard
```

#### Get Site Dashboard
```
GET /api/dashboard/site/:siteId
```

### Reports

#### Timesheet Report
```
GET /api/reports/timesheets
Query: ?startDate=<date>&endDate=<date>&officer=<id>
```

#### Incident Report
```
GET /api/reports/incidents
Query: ?startDate=<date>&endDate=<date>&site=<id>&type=<type>
```

#### Patrol Report
```
GET /api/reports/patrols
Query: ?startDate=<date>&endDate=<date>&site=<id>&officer=<id>
```

#### Export Data
```
GET /api/reports/export/:type
Query: ?format=json|csv&startDate=<date>&endDate=<date>
```

## User Roles

### Admin
- Full system access
- Create/manage users, sites, and companies
- View all reports and analytics
- Configure system settings

### Supervisor
- Manage shifts and assignments
- View and respond to incidents
- Access reports for assigned areas
- Monitor officer compliance

### Officer
- View assigned shifts
- Accept/decline shifts
- Check-in/check-out
- Conduct patrols and record checkpoints
- Report incidents
- Respond to welfare checks

### Client
- View assigned sites
- Access patrol logs and incident reports
- View KPIs and performance metrics
- Limited read-only access

## Scheduled Tasks

The system automatically runs the following scheduled tasks:

1. **Welfare Check Scheduler** (every 5 minutes)
   - Creates welfare checks for active shifts at high-risk sites
   - Based on configurable intervals per site

2. **Missed Check Monitor** (every minute)
   - Identifies missed welfare checks (>5 minutes overdue)
   - Sends alerts to supervisors

3. **Certification Expiry Checker** (daily at 9 AM)
   - Identifies officers with expiring certifications (30-day window)
   - Sends notifications to supervisors

## Real-time Features

The application uses Socket.IO for real-time updates:

- **New Incidents:** Broadcast to all supervisors
- **Duress Alerts:** Immediate notification to supervisors
- **Panic Button:** Emergency broadcast
- **Messages:** Push notifications to specific users

## Security Features

- **JWT Authentication:** Secure token-based authentication
- **Password Hashing:** bcryptjs with salt rounds
- **Role-based Access Control:** Route-level authorization
- **Geofencing Verification:** Location-based action restrictions
- **Audit Trail:** Comprehensive logging of all actions

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Starting in Development Mode
```bash
npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the UNLICENSED license - see the LICENSE file for details.

## Support

For support, please contact the development team or open an issue on GitHub.

## Roadmap

### Phase 2 (Planned)
- [ ] React Native mobile app
- [ ] React web admin panel
- [ ] Push notifications (FCM/APNS)
- [ ] Offline mode support
- [ ] Advanced analytics and ML insights
- [ ] Integration with third-party security systems
- [ ] Automated invoice generation
- [ ] Client portal enhancements
- [ ] Multi-language support
- [ ] Dark mode

### Phase 3 (Future)
- [ ] IoT device integration
- [ ] Video surveillance integration
- [ ] Advanced biometric authentication
- [ ] Predictive maintenance alerts
- [ ] AI-powered incident analysis