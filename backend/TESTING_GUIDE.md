# CareOps Backend - Complete Testing Guide

This guide walks you through testing the entire backend system from scratch.

## Prerequisites

- Backend server running on `http://localhost:5000`
- cURL or Postman installed
- PostgreSQL database set up

## Test Sequence

### Phase 1: Authentication & Workspace Setup

#### Test 1.1: Register Business Owner

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@mybusiness.com",
    "password": "SecureOwner123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Expected Response:** `201 Created`
```json
{
  "success": true,
  "message": "Owner registered successfully",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "owner@mybusiness.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "owner"
    },
    "tokens": {
      "accessToken": "save-this-token",
      "refreshToken": "save-this-token"
    }
  }
}
```

**🔑 Save the `accessToken` for subsequent requests!**

---

#### Test 1.2: Create Workspace

```bash
curl -X POST http://localhost:5000/api/workspaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "businessName": "Acme Consulting Services",
    "address": "123 Business Avenue, New York, NY 10001",
    "timezone": "America/New_York",
    "contactEmail": "contact@acmeconsulting.com"
  }'
```

**Expected Response:** `201 Created`
- Workspace created with `isActive: false` and `setupCompleted: false`

**🔑 Save the `workspace.id` for subsequent requests!**

---

#### Test 1.3: Check Workspace Status

```bash
curl -X GET http://localhost:5000/api/workspaces/WORKSPACE_ID/status \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "workspace": { ... },
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

---

### Phase 2: Booking Configuration

#### Test 2.1: Create First Service Type

```bash
curl -X POST http://localhost:5000/api/bookings/service-types \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "workspaceId": "WORKSPACE_ID",
    "name": "Initial Consultation",
    "description": "60-minute initial strategy consultation to understand your needs",
    "durationMinutes": 60,
    "location": "123 Business Avenue, Suite 500, New York, NY 10001"
  }'
```

**Expected Response:** `201 Created`

**🔑 Save the `serviceType.id`**

---

#### Test 2.2: Create Additional Service Types

```bash
# Follow-up Meeting (30 minutes)
curl -X POST http://localhost:5000/api/bookings/service-types \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "workspaceId": "WORKSPACE_ID",
    "name": "Follow-up Meeting",
    "description": "30-minute follow-up session",
    "durationMinutes": 30,
    "location": "123 Business Avenue, Suite 500, New York, NY 10001"
  }'

# Workshop Session (2 hours)
curl -X POST http://localhost:5000/api/bookings/service-types \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "workspaceId": "WORKSPACE_ID",
    "name": "Workshop Session",
    "description": "2-hour intensive workshop",
    "durationMinutes": 120,
    "location": "123 Business Avenue, Conference Room A, New York, NY 10001"
  }'
```

---

#### Test 2.3: Get All Service Types

```bash
curl -X GET http://localhost:5000/api/bookings/service-types/WORKSPACE_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:** List of all 3 service types

---

#### Test 2.4: Update Service Type

```bash
curl -X PUT http://localhost:5000/api/bookings/service-types/SERVICE_TYPE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "durationMinutes": 90,
    "description": "Updated to 90-minute consultation"
  }'
```

---

#### Test 2.5: Set Availability Schedule

Set business hours: Monday-Friday, 9 AM - 5 PM

```bash
curl -X POST http://localhost:5000/api/bookings/availability \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
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

**Day of Week Reference:**
- 0 = Sunday
- 1 = Monday
- 2 = Tuesday
- 3 = Wednesday
- 4 = Thursday
- 5 = Friday
- 6 = Saturday

---

#### Test 2.6: Get Availability Schedule

```bash
curl -X GET http://localhost:5000/api/bookings/availability/WORKSPACE_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:** All 5 schedules with day names

---

### Phase 3: Staff Management

#### Test 3.1: Register Staff Member

```bash
curl -X POST http://localhost:5000/api/staff/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane.smith@acmeconsulting.com",
    "password": "StaffSecure123!",
    "firstName": "Jane",
    "lastName": "Smith"
  }'
```

**Expected Response:** `201 Created` with staff user and tokens

**🔑 Save staff user's `id` from response**

---

#### Test 3.2: Add Staff to Workspace (as Owner)

```bash
curl -X POST http://localhost:5000/api/staff/workspaces/WORKSPACE_ID/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer OWNER_ACCESS_TOKEN" \
  -d '{
    "staffEmail": "jane.smith@acmeconsulting.com",
    "permissions": {
      "inbox": true,
      "bookings": true,
      "forms": true,
      "inventory": false
    }
  }'
```

**Expected Response:** `201 Created`

---

#### Test 3.3: Get All Workspace Staff

```bash
curl -X GET http://localhost:5000/api/staff/workspaces/WORKSPACE_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:** List with Jane Smith

---

#### Test 3.4: Update Staff Permissions

```bash
curl -X PUT http://localhost:5000/api/staff/workspaces/WORKSPACE_ID/staff/STAFF_USER_ID/permissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer OWNER_ACCESS_TOKEN" \
  -d '{
    "permissions": {
      "inbox": true,
      "bookings": true,
      "forms": true,
      "inventory": true
    }
  }'
```

**Expected Response:** Updated permissions with `inventory: true`

---

#### Test 3.5: Staff Login and Check Workspaces

```bash
# Login as staff
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane.smith@acmeconsulting.com",
    "password": "StaffSecure123!"
  }'

# Get staff's workspaces (using staff access token)
curl -X GET http://localhost:5000/api/staff/my-workspaces \
  -H "Authorization: Bearer STAFF_ACCESS_TOKEN"
```

**Expected Response:** List showing Acme Consulting Services with permissions

---

### Phase 4: Public Booking Page

#### Test 4.1: Try to Access Public Page (Before Activation)

```bash
curl -X GET http://localhost:5000/api/bookings/public/WORKSPACE_ID
```

**Expected Response:** `403 Forbidden` - "This booking page is not currently active"

---

#### Test 4.2: Check Workspace Status Again

```bash
curl -X GET http://localhost:5000/api/workspaces/WORKSPACE_ID/status \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "setupProgress": {
    "workspaceCreated": true,
    "communicationConfigured": false,  // Still need this
    "contactFormCreated": false,
    "bookingTypesCreated": true,       // ✓ Done
    "availabilityDefined": true,        // ✓ Done
    "formsUploaded": false,
    "inventorySetup": false,
    "staffAdded": true                  // ✓ Done
  },
  "canActivate": false  // Need communication channel
}
```

---

### Phase 5: Advanced Testing

#### Test 5.1: Session Context

```bash
curl -X GET http://localhost:5000/api/auth/session \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:** User info with all workspaces

---

#### Test 5.2: Token Refresh

```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

**Expected Response:** New access token

---

#### Test 5.3: Update Workspace Details

```bash
curl -X PUT http://localhost:5000/api/workspaces/WORKSPACE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "businessName": "Acme Consulting Services LLC",
    "timezone": "America/Los_Angeles"
  }'
```

---

#### Test 5.4: Delete Service Type

```bash
curl -X DELETE http://localhost:5000/api/bookings/service-types/SERVICE_TYPE_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

#### Test 5.5: Remove Staff from Workspace

```bash
curl -X DELETE http://localhost:5000/api/staff/workspaces/WORKSPACE_ID/staff/STAFF_USER_ID \
  -H "Authorization: Bearer OWNER_ACCESS_TOKEN"
```

---

#### Test 5.6: Logout

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

---

## Error Cases to Test

### Test E.1: Duplicate Email Registration

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@mybusiness.com",
    "password": "AnotherPass123!",
    "firstName": "Duplicate",
    "lastName": "User"
  }'
```

**Expected:** `409 Conflict` - "User with this email already exists"

---

### Test E.2: Invalid Token

```bash
curl -X GET http://localhost:5000/api/workspaces/WORKSPACE_ID/status \
  -H "Authorization: Bearer invalid_token"
```

**Expected:** `401 Unauthorized` - "Invalid token"

---

### Test E.3: Staff Trying Owner-Only Action

```bash
# Login as staff first, then try to create service type
curl -X POST http://localhost:5000/api/bookings/service-types \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer STAFF_ACCESS_TOKEN" \
  -d '{
    "workspaceId": "WORKSPACE_ID",
    "name": "Unauthorized Service",
    "durationMinutes": 60,
    "location": "Test"
  }'
```

**Expected:** `403 Forbidden` - "Access denied. Owner role required."

---

### Test E.4: Invalid Input Validation

```bash
curl -X POST http://localhost:5000/api/bookings/service-types \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "workspaceId": "not-a-uuid",
    "name": "",
    "durationMinutes": -5
  }'
```

**Expected:** `400 Bad Request` with validation errors

---

### Test E.5: Accessing Non-existent Resource

```bash
curl -X GET http://localhost:5000/api/workspaces/00000000-0000-0000-0000-000000000000/status \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected:** `404 Not Found` - "Workspace not found"

---

## Quick Test Script

Save this as `test-careops.sh`:

```bash
#!/bin/bash

API_URL="http://localhost:5000/api"

echo "=== Test 1: Register Owner ==="
OWNER_RESPONSE=$(curl -s -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@test.com","password":"Test123!","firstName":"Test","lastName":"Owner"}')
echo $OWNER_RESPONSE | jq .

OWNER_TOKEN=$(echo $OWNER_RESPONSE | jq -r '.data.tokens.accessToken')
echo "Owner Token: $OWNER_TOKEN"

echo -e "\n=== Test 2: Create Workspace ==="
WORKSPACE_RESPONSE=$(curl -s -X POST $API_URL/workspaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -d '{"businessName":"Test Business","address":"123 Test St","timezone":"UTC","contactEmail":"test@test.com"}')
echo $WORKSPACE_RESPONSE | jq .

WORKSPACE_ID=$(echo $WORKSPACE_RESPONSE | jq -r '.data.workspace.id')
echo "Workspace ID: $WORKSPACE_ID"

echo -e "\n=== Test 3: Create Service Type ==="
curl -s -X POST $API_URL/bookings/service-types \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -d "{\"workspaceId\":\"$WORKSPACE_ID\",\"name\":\"Test Service\",\"durationMinutes\":60,\"location\":\"Test Location\"}" | jq .

echo -e "\n=== Test 4: Set Availability ==="
curl -s -X POST $API_URL/bookings/availability \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -d "{\"workspaceId\":\"$WORKSPACE_ID\",\"schedules\":[{\"dayOfWeek\":1,\"startTime\":\"09:00:00\",\"endTime\":\"17:00:00\"}]}" | jq .

echo -e "\n=== Test 5: Get Workspace Status ==="
curl -s -X GET $API_URL/workspaces/$WORKSPACE_ID/status \
  -H "Authorization: Bearer $OWNER_TOKEN" | jq .
```

Run with:
```bash
chmod +x test-careops.sh
./test-careops.sh
```

---

## Testing Checklist

- [ ] Owner registration works
- [ ] Owner login works
- [ ] Workspace creation works
- [ ] Service type creation works
- [ ] Availability scheduling works
- [ ] Staff registration works
- [ ] Adding staff to workspace works
- [ ] Staff login works
- [ ] Permission updates work
- [ ] Public booking page returns workspace info (after activation)
- [ ] Token refresh works
- [ ] Logout revokes tokens
- [ ] Error handling works correctly
- [ ] Validation catches invalid inputs
- [ ] Authorization prevents unauthorized access

---

## Notes

- Always save tokens and IDs for subsequent requests
- Test both success and error cases
- Verify response structure matches documentation
- Check that timestamps are in correct format
- Ensure UUIDs are properly formatted
- Test with both owner and staff roles