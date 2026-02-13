# CareOps API - Bookings & Staff Management Documentation

## Table of Contents
1. [Service Types / Meeting Types](#service-types--meeting-types)
2. [Availability Schedules](#availability-schedules)
3. [Public Booking Page](#public-booking-page)
4. [Staff Management](#staff-management)

---

## Service Types / Meeting Types

### 1. Create Service Type

Create a new in-person meeting/service type.

**Endpoint:** `POST /api/bookings/service-types`

**Access:** Private (Owner only)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "workspaceId": "660e8400-e29b-41d4-a716-446655440000",
  "name": "Initial Consultation",
  "description": "First meeting to discuss your needs",
  "durationMinutes": 60,
  "location": "123 Main Street, Suite 200, New York, NY 10001"
}
```

**Validation Rules:**
- `workspaceId`: UUID, required
- `name`: String, required, max 255 characters
- `description`: String, optional, max 1000 characters
- `durationMinutes`: Integer, required, between 1 and 1440 (24 hours)
- `location`: String, required, max 500 characters

**Success Response:** `201 Created`
```json
{
  "success": true,
  "message": "Service type created successfully",
  "data": {
    "serviceType": {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "workspaceId": "660e8400-e29b-41d4-a716-446655440000",
      "name": "Initial Consultation",
      "description": "First meeting to discuss your needs",
      "durationMinutes": 60,
      "location": "123 Main Street, Suite 200, New York, NY 10001",
      "isActive": true,
      "createdAt": "2025-02-11T10:00:00.000Z",
      "updatedAt": "2025-02-11T10:00:00.000Z"
    }
  }
}
```

---

### 2. Get Service Types

Get all service types for a workspace.

**Endpoint:** `GET /api/bookings/service-types/:workspaceId`

**Access:** Private (Owner or Staff)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "serviceTypes": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "workspaceId": "660e8400-e29b-41d4-a716-446655440000",
        "name": "Initial Consultation",
        "description": "First meeting to discuss your needs",
        "durationMinutes": 60,
        "location": "123 Main Street, Suite 200, New York, NY 10001",
        "isActive": true,
        "createdAt": "2025-02-11T10:00:00.000Z",
        "updatedAt": "2025-02-11T10:00:00.000Z"
      },
      {
        "id": "880e8400-e29b-41d4-a716-446655440000",
        "workspaceId": "660e8400-e29b-41d4-a716-446655440000",
        "name": "Follow-up Meeting",
        "description": "30-minute follow-up session",
        "durationMinutes": 30,
        "location": "123 Main Street, Suite 200, New York, NY 10001",
        "isActive": true,
        "createdAt": "2025-02-11T10:15:00.000Z",
        "updatedAt": "2025-02-11T10:15:00.000Z"
      }
    ],
    "count": 2
  }
}
```

---

### 3. Update Service Type

Update an existing service type.

**Endpoint:** `PUT /api/bookings/service-types/:serviceTypeId`

**Access:** Private (Owner only)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:** (All fields optional)
```json
{
  "name": "Updated Consultation",
  "description": "Updated description",
  "durationMinutes": 45,
  "location": "New location address",
  "isActive": true
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Service type updated successfully",
  "data": {
    "serviceType": {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "workspaceId": "660e8400-e29b-41d4-a716-446655440000",
      "name": "Updated Consultation",
      "description": "Updated description",
      "durationMinutes": 45,
      "location": "New location address",
      "isActive": true,
      "createdAt": "2025-02-11T10:00:00.000Z",
      "updatedAt": "2025-02-11T10:30:00.000Z"
    }
  }
}
```

---

### 4. Delete Service Type

Delete a service type.

**Endpoint:** `DELETE /api/bookings/service-types/:serviceTypeId`

**Access:** Private (Owner only)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Service type deleted successfully"
}
```

---

## Availability Schedules

### 5. Set Availability

Set availability schedules for a workspace (replaces all existing schedules).

**Endpoint:** `POST /api/bookings/availability`

**Access:** Private (Owner only)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "workspaceId": "660e8400-e29b-41d4-a716-446655440000",
  "schedules": [
    {
      "dayOfWeek": 1,
      "startTime": "09:00:00",
      "endTime": "17:00:00"
    },
    {
      "dayOfWeek": 2,
      "startTime": "09:00:00",
      "endTime": "17:00:00"
    },
    {
      "dayOfWeek": 3,
      "startTime": "09:00:00",
      "endTime": "17:00:00"
    },
    {
      "dayOfWeek": 4,
      "startTime": "09:00:00",
      "endTime": "17:00:00"
    },
    {
      "dayOfWeek": 5,
      "startTime": "09:00:00",
      "endTime": "17:00:00"
    }
  ]
}
```

**Day of Week Values:**
- 0 = Sunday
- 1 = Monday
- 2 = Tuesday
- 3 = Wednesday
- 4 = Thursday
- 5 = Friday
- 6 = Saturday

**Time Format:** HH:MM:SS (24-hour format)

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Availability schedules set successfully",
  "data": {
    "schedules": [
      {
        "id": "990e8400-e29b-41d4-a716-446655440000",
        "workspaceId": "660e8400-e29b-41d4-a716-446655440000",
        "dayOfWeek": 1,
        "startTime": "09:00:00",
        "endTime": "17:00:00",
        "isActive": true,
        "createdAt": "2025-02-11T10:00:00.000Z"
      }
      // ... more schedules
    ],
    "count": 5
  }
}
```

---

### 6. Get Availability

Get availability schedules for a workspace.

**Endpoint:** `GET /api/bookings/availability/:workspaceId`

**Access:** Private (Owner or Staff)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "schedules": [
      {
        "id": "990e8400-e29b-41d4-a716-446655440000",
        "workspaceId": "660e8400-e29b-41d4-a716-446655440000",
        "dayOfWeek": 1,
        "dayName": "Monday",
        "startTime": "09:00:00",
        "endTime": "17:00:00",
        "isActive": true,
        "createdAt": "2025-02-11T10:00:00.000Z"
      },
      {
        "id": "aa0e8400-e29b-41d4-a716-446655440000",
        "workspaceId": "660e8400-e29b-41d4-a716-446655440000",
        "dayOfWeek": 2,
        "dayName": "Tuesday",
        "startTime": "09:00:00",
        "endTime": "17:00:00",
        "isActive": true,
        "createdAt": "2025-02-11T10:00:00.000Z"
      }
    ],
    "count": 5
  }
}
```

---

## Public Booking Page

### 7. Get Public Booking Page Data

Get public booking page information (no authentication required).

**Endpoint:** `GET /api/bookings/public/:workspaceId`

**Access:** Public (No authentication)

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "workspace": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "businessName": "My Awesome Business",
      "address": "123 Main Street, City, State 12345",
      "timezone": "America/New_York"
    },
    "serviceTypes": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "name": "Initial Consultation",
        "description": "First meeting to discuss your needs",
        "durationMinutes": 60,
        "location": "123 Main Street, Suite 200, New York, NY 10001"
      }
    ],
    "availability": [
      {
        "dayOfWeek": 1,
        "dayName": "Monday",
        "startTime": "09:00:00",
        "endTime": "17:00:00"
      },
      {
        "dayOfWeek": 2,
        "dayName": "Tuesday",
        "startTime": "09:00:00",
        "endTime": "17:00:00"
      }
    ]
  }
}
```

**Error Response:** `403 Forbidden`
```json
{
  "success": false,
  "message": "This booking page is not currently active"
}
```

---

## Staff Management

### 8. Register Staff Member

Register a new staff member (can be done by anyone, but typically before being added to workspace).

**Endpoint:** `POST /api/staff/register`

**Access:** Public

**Request Body:**
```json
{
  "email": "staff@example.com",
  "password": "StaffPass123!",
  "firstName": "Jane",
  "lastName": "Smith"
}
```

**Success Response:** `201 Created`
```json
{
  "success": true,
  "message": "Staff member registered successfully",
  "data": {
    "user": {
      "id": "bb0e8400-e29b-41d4-a716-446655440000",
      "email": "staff@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "role": "staff",
      "createdAt": "2025-02-11T10:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

---

### 9. Add Staff to Workspace

Add a registered staff member to a workspace with specific permissions.

**Endpoint:** `POST /api/staff/workspaces/:workspaceId/add`

**Access:** Private (Owner only)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
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

**Permission Fields:**
- `inbox`: Can access and manage customer conversations
- `bookings`: Can view and manage bookings
- `forms`: Can view and manage forms
- `inventory`: Can view and manage inventory

**Success Response:** `201 Created`
```json
{
  "success": true,
  "message": "Staff member added to workspace successfully",
  "data": {
    "workspaceStaff": {
      "id": "cc0e8400-e29b-41d4-a716-446655440000",
      "workspaceId": "660e8400-e29b-41d4-a716-446655440000",
      "workspaceName": "My Awesome Business",
      "staff": {
        "id": "bb0e8400-e29b-41d4-a716-446655440000",
        "email": "staff@example.com",
        "firstName": "Jane",
        "lastName": "Smith",
        "role": "staff"
      },
      "permissions": {
        "inbox": true,
        "bookings": true,
        "forms": true,
        "inventory": false
      },
      "addedAt": "2025-02-11T10:05:00.000Z"
    }
  }
}
```

**Error Responses:**

`404 Not Found` - Staff member not registered
```json
{
  "success": false,
  "message": "Staff member not found. They need to register first."
}
```

`409 Conflict` - Staff already added
```json
{
  "success": false,
  "message": "Staff member is already added to this workspace"
}
```

---

### 10. Update Staff Permissions

Update a staff member's permissions in a workspace.

**Endpoint:** `PUT /api/staff/workspaces/:workspaceId/staff/:staffId/permissions`

**Access:** Private (Owner only)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "permissions": {
    "inbox": true,
    "bookings": true,
    "forms": true,
    "inventory": true
  }
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Staff permissions updated successfully",
  "data": {
    "workspaceStaff": {
      "id": "cc0e8400-e29b-41d4-a716-446655440000",
      "workspaceId": "660e8400-e29b-41d4-a716-446655440000",
      "staff": {
        "id": "bb0e8400-e29b-41d4-a716-446655440000",
        "email": "staff@example.com",
        "firstName": "Jane",
        "lastName": "Smith"
      },
      "permissions": {
        "inbox": true,
        "bookings": true,
        "forms": true,
        "inventory": true
      },
      "addedAt": "2025-02-11T10:05:00.000Z"
    }
  }
}
```

---

### 11. Remove Staff from Workspace

Remove a staff member from a workspace.

**Endpoint:** `DELETE /api/staff/workspaces/:workspaceId/staff/:staffId`

**Access:** Private (Owner only)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Staff member removed from workspace successfully"
}
```

---

### 12. Get Workspace Staff

Get all staff members in a workspace.

**Endpoint:** `GET /api/staff/workspaces/:workspaceId`

**Access:** Private (Owner or Staff)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "staff": [
      {
        "id": "cc0e8400-e29b-41d4-a716-446655440000",
        "userId": "bb0e8400-e29b-41d4-a716-446655440000",
        "email": "staff@example.com",
        "firstName": "Jane",
        "lastName": "Smith",
        "role": "staff",
        "isActive": true,
        "permissions": {
          "inbox": true,
          "bookings": true,
          "forms": true,
          "inventory": false
        },
        "addedAt": "2025-02-11T10:05:00.000Z"
      }
    ],
    "count": 1
  }
}
```

---

### 13. Get Staff Member's Workspaces

Get all workspaces where the current staff member has access.

**Endpoint:** `GET /api/staff/my-workspaces`

**Access:** Private (Staff or Owner)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "workspaces": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "businessName": "My Awesome Business",
        "address": "123 Main Street, City, State 12345",
        "timezone": "America/New_York",
        "contactEmail": "contact@business.com",
        "isActive": true,
        "permissions": {
          "inbox": true,
          "bookings": true,
          "forms": true,
          "inventory": false
        },
        "addedAt": "2025-02-11T10:05:00.000Z"
      }
    ],
    "count": 1
  }
}
```

---

## Complete Workflow Example

### Setup a Workspace for Bookings

#### Step 1: Owner registers and creates workspace
```bash
# Register as owner
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@business.com",
    "password": "OwnerPass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Create workspace
curl -X POST http://localhost:5000/api/workspaces \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Consulting Services Inc",
    "address": "123 Business St, New York, NY",
    "timezone": "America/New_York",
    "contactEmail": "contact@business.com"
  }'
```

#### Step 2: Create service types
```bash
curl -X POST http://localhost:5000/api/bookings/service-types \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "WORKSPACE_ID",
    "name": "Initial Consultation",
    "description": "60-minute strategy session",
    "durationMinutes": 60,
    "location": "123 Business St, Suite 200, New York, NY"
  }'
```

#### Step 3: Set availability
```bash
curl -X POST http://localhost:5000/api/bookings/availability \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "WORKSPACE_ID",
    "schedules": [
      {"dayOfWeek": 1, "startTime": "09:00:00", "endTime": "17:00:00"},
      {"dayOfWeek": 2, "startTime": "09:00:00", "endTime": "17:00:00"},
      {"dayOfWeek": 3, "startTime": "09:00:00", "endTime": "17:00:00"},
      {"dayOfWeek": 4, "startTime": "09:00:00", "endTime": "17:00:00"},
      {"dayOfWeek": 5, "startTime": "09:00:00", "endTime": "17:00:00"}
    ]
  }'
```

#### Step 4: Add staff member
```bash
# Staff registers first
curl -X POST http://localhost:5000/api/staff/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "staff@business.com",
    "password": "StaffPass123!",
    "firstName": "Jane",
    "lastName": "Smith"
  }'

# Owner adds staff to workspace
curl -X POST http://localhost:5000/api/staff/workspaces/WORKSPACE_ID/add \
  -H "Authorization: Bearer OWNER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "staffEmail": "staff@business.com",
    "permissions": {
      "inbox": true,
      "bookings": true,
      "forms": true,
      "inventory": false
    }
  }'
```

#### Step 5: Get public booking page (for customers)
```bash
# No authentication needed
curl http://localhost:5000/api/bookings/public/WORKSPACE_ID
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- UUIDs are version 4
- All authentication uses JWT Bearer tokens
- Owner-only endpoints return 403 if accessed by staff
- Staff can only access workspaces they've been added to
- Public booking page only works for active workspaces