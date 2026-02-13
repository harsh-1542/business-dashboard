# CareOps Backend API

A comprehensive backend system for the CareOps unified operations platform. Built with Node.js, Express, and PostgreSQL.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with refresh tokens
- **Workspace Management**: Multi-tenant workspace system
- **Service Types & Bookings**: In-person meeting configuration with duration, location, and availability
- **Availability Scheduling**: Set business hours per day of the week
- **Public Booking Pages**: Shareable booking links for customers (no login required)
- **Staff Management**: Add staff members with granular permissions (inbox, bookings, forms, inventory)
- **Role-Based Access Control**: Owner and Staff roles with permission management
- **Database Schema**: Comprehensive PostgreSQL schema for all operations
- **Security**: Helmet, CORS, rate limiting, and password hashing
- **Error Handling**: Centralized error handling with graceful shutdown
- **Validation**: Request validation using express-validator

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn

## 🛠️ Installation

1. Clone the repository
```bash
git clone <repository-url>
cd careops-backend
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=careops_db
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

CORS_ORIGIN=http://localhost:3000
```

4. Create PostgreSQL database
```bash
psql -U postgres
CREATE DATABASE careops_db;
\q
```

5. Run database migrations
```bash
npm run migrate
```

## 🏃 Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will start on `http://localhost:5000`

## 📡 API Endpoints

### Authentication

#### Register Owner
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "owner@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Owner registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "owner@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "owner",
      "createdAt": "2025-02-11T10:00:00.000Z"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "owner@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "owner@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "owner"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "jwt_refresh_token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new_jwt_access_token"
  }
}
```

#### Logout
```http
POST /api/auth/logout
Content-Type: application/json

{
  "refreshToken": "jwt_refresh_token"
}
```

#### Get Session Context
```http
GET /api/auth/session
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "owner@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "owner",
      "isActive": true,
      "createdAt": "2025-02-11T10:00:00.000Z"
    },
    "workspaces": [
      {
        "id": "uuid",
        "businessName": "My Business",
        "address": "123 Main St",
        "timezone": "America/New_York",
        "contactEmail": "contact@business.com",
        "isActive": true,
        "setupCompleted": false,
        "role": "owner",
        "createdAt": "2025-02-11T10:00:00.000Z"
      }
    ]
  }
}
```

### Workspace Management

#### Create Workspace
```http
POST /api/workspaces
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "businessName": "My Awesome Business",
  "address": "123 Main Street, City, State 12345",
  "timezone": "America/New_York",
  "contactEmail": "contact@business.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Workspace created successfully",
  "data": {
    "workspace": {
      "id": "uuid",
      "ownerId": "uuid",
      "businessName": "My Awesome Business",
      "address": "123 Main Street, City, State 12345",
      "timezone": "America/New_York",
      "contactEmail": "contact@business.com",
      "isActive": false,
      "setupCompleted": false,
      "createdAt": "2025-02-11T10:00:00.000Z",
      "updatedAt": "2025-02-11T10:00:00.000Z"
    }
  }
}
```

### Service Types / Bookings

#### Create Service Type
```http
POST /api/bookings/service-types
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "workspaceId": "workspace-uuid",
  "name": "Initial Consultation",
  "description": "60-minute strategy session",
  "durationMinutes": 60,
  "location": "123 Business St, Suite 200, New York, NY 10001"
}
```

#### Set Availability Schedule
```http
POST /api/bookings/availability
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "workspaceId": "workspace-uuid",
  "schedules": [
    {"dayOfWeek": 1, "startTime": "09:00:00", "endTime": "17:00:00"},
    {"dayOfWeek": 2, "startTime": "09:00:00", "endTime": "17:00:00"},
    {"dayOfWeek": 3, "startTime": "09:00:00", "endTime": "17:00:00"}
  ]
}
```

#### Get Public Booking Page (No Auth)
```http
GET /api/bookings/public/:workspaceId
```

### Staff Management

#### Register Staff Member
```http
POST /api/staff/register
Content-Type: application/json

{
  "email": "staff@example.com",
  "password": "StaffPass123!",
  "firstName": "Jane",
  "lastName": "Smith"
}
```

#### Add Staff to Workspace (Owner Only)
```http
POST /api/staff/workspaces/:workspaceId/add
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "staffEmail": "staff@example.com",
  "permissions": {
    "inbox": true,
    "bookings": true,
    "forms": true,
    "inventory": false
  }
}
```

**For complete API documentation**, see:
- `API_DOCUMENTATION.md` - Core authentication and workspace endpoints
- `BOOKINGS_STAFF_API.md` - Bookings and staff management endpoints

#### Update Workspace
```http
PUT /api/workspaces/:workspaceId
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "businessName": "Updated Business Name",
  "address": "456 New Street"
}
```

#### Activate Workspace
```http
POST /api/workspaces/:workspaceId/activate
Authorization: Bearer <access_token>
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Workspace activated successfully",
  "data": {
    "workspace": {
      "id": "uuid",
      "isActive": true,
      "setupCompleted": true,
      ...
    }
  }
}
```

**Response (Incomplete Setup):**
```json
{
  "success": false,
  "message": "Workspace cannot be activated. Setup is incomplete.",
  "errors": [
    "At least one communication channel (email or SMS) must be configured",
    "At least one service/booking type must be created",
    "Availability schedule must be defined"
  ]
}
```

#### Get Workspace Status
```http
GET /api/workspaces/:workspaceId/status
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "workspace": {
      "id": "uuid",
      "businessName": "My Business",
      "isActive": false,
      "setupCompleted": false,
      ...
    },
    "setupProgress": {
      "workspaceCreated": true,
      "communicationConfigured": false,
      "contactFormCreated": false,
      "bookingTypesCreated": false,
      "availabilityDefined": false,
      "formsUploaded": false,
      "inventorySetup": false,
      "staffAdded": false
    },
    "completionPercentage": 12,
    "canActivate": false
  }
}
```

## 🗄️ Database Schema

The application uses a comprehensive PostgreSQL schema with the following main tables:

- **users**: Business owners and staff members
- **refresh_tokens**: JWT refresh token storage
- **workspaces**: Business workspace information
- **workspace_staff**: Staff members assigned to workspaces
- **integrations**: Email, SMS, and other service integrations
- **service_types**: Types of services/bookings offered
- **availability_schedules**: Business availability hours
- **contacts**: Customer contact information
- **conversations**: Customer conversation threads
- **messages**: Individual messages in conversations
- **bookings**: Customer appointments and bookings
- **forms**: Custom forms for data collection
- **form_submissions**: Completed form submissions
- **inventory_items**: Business inventory tracking
- **inventory_usage**: Inventory usage logs
- **alerts**: System notifications and alerts
- **automation_logs**: Automation action logs

## 🔐 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Refresh Tokens**: Stored in database with expiry tracking
- **Rate Limiting**: Prevents API abuse
- **Helmet**: Security headers
- **CORS**: Configurable cross-origin resource sharing
- **Input Validation**: express-validator for request validation

## 🏗️ Project Structure

```
careops-backend/
├── src/
│   ├── config/
│   │   └── database.js           # Database configuration
│   ├── controllers/
│   │   ├── auth.controller.js    # Authentication logic
│   │   └── workspace.controller.js # Workspace logic
│   ├── database/
│   │   ├── migrate.js            # Migration runner
│   │   └── schema.js             # Database schema
│   ├── middleware/
│   │   ├── auth.middleware.js    # JWT verification
│   │   ├── error.middleware.js   # Error handling
│   │   └── validation.middleware.js # Validation handling
│   ├── routes/
│   │   ├── auth.routes.js        # Auth endpoints
│   │   ├── workspace.routes.js   # Workspace endpoints
│   │   └── index.js              # Route aggregator
│   ├── utils/
│   │   ├── jwt.utils.js          # JWT helpers
│   │   └── password.utils.js     # Password helpers
│   ├── validators/
│   │   ├── auth.validator.js     # Auth validation rules
│   │   └── workspace.validator.js # Workspace validation rules
│   └── server.js                 # Main application file
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 🧪 Testing API with cURL

### Register a new owner
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@example.com",
    "password": "SecurePass123!"
  }'
```

### Create workspace (replace TOKEN with actual access token)
```bash
curl -X POST http://localhost:5000/api/workspaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "businessName": "My Business",
    "address": "123 Main St",
    "timezone": "America/New_York",
    "contactEmail": "contact@business.com"
  }'
```

## 🐛 Error Handling

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]
}
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Environment mode | development |
| DB_HOST | PostgreSQL host | localhost |
| DB_PORT | PostgreSQL port | 5432 |
| DB_NAME | Database name | careops_db |
| DB_USER | Database user | postgres |
| DB_PASSWORD | Database password | - |
| JWT_SECRET | JWT signing secret | - |
| JWT_REFRESH_SECRET | Refresh token secret | - |
| JWT_EXPIRE | Access token expiry | 15m |
| JWT_REFRESH_EXPIRE | Refresh token expiry | 7d |
| CORS_ORIGIN | Allowed CORS origin | http://localhost:3000 |

## 🚀 Deployment

### Production Checklist

1. Set `NODE_ENV=production`
2. Use strong JWT secrets
3. Configure proper CORS origins
4. Set up SSL/TLS certificates
5. Configure firewall rules
6. Set up database backups
7. Configure logging service
8. Set up monitoring

### Docker Deployment (Coming Soon)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License

## 👥 Authors

CareOps Development Team

## 📞 Support

For support, email support@careops.com or join our Slack channel.