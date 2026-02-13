# CareOps API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_access_token>
```

## Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Error message"
    }
  ]
}
```

## HTTP Status Codes

- `200` - OK: Request successful
- `201` - Created: Resource created successfully
- `400` - Bad Request: Invalid input data
- `401` - Unauthorized: Authentication required or failed
- `403` - Forbidden: Insufficient permissions
- `404` - Not Found: Resource not found
- `409` - Conflict: Resource already exists
- `429` - Too Many Requests: Rate limit exceeded
- `500` - Internal Server Error: Server error

---

## Endpoints

## 1. Authentication Endpoints

### 1.1 Register Owner

Register a new business owner account.

**Endpoint:** `POST /auth/register`

**Access:** Public

**Request Body:**
```json
{
  "email": "owner@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Validation Rules:**
- `email`: Valid email format, required
- `password`: Minimum 8 characters, required
- `firstName`: Not empty, max 100 characters, required
- `lastName`: Not empty, max 100 characters, required

**Success Response:** `201 Created`
```json
{
  "success": true,
  "message": "Owner registered successfully",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "owner@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "owner",
      "createdAt": "2025-02-11T10:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**Error Responses:**

`409 Conflict` - Email already exists
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

`400 Bad Request` - Validation error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

---

### 1.2 Login

Login with email and password.

**Endpoint:** `POST /auth/login`

**Access:** Public

**Request Body:**
```json
{
  "email": "owner@example.com",
  "password": "SecurePass123!"
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "owner@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "owner"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**Error Responses:**

`401 Unauthorized` - Invalid credentials
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

`401 Unauthorized` - Account deactivated
```json
{
  "success": false,
  "message": "Account is deactivated. Please contact support."
}
```

---

### 1.3 Refresh Token

Get a new access token using refresh token.

**Endpoint:** `POST /auth/refresh`

**Access:** Public

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

`401 Unauthorized` - Invalid or expired token
```json
{
  "success": false,
  "message": "Invalid or expired refresh token"
}
```

---

### 1.4 Logout

Logout and revoke refresh token.

**Endpoint:** `POST /auth/logout`

**Access:** Public

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### 1.5 Get Session Context

Get current user session information and associated workspaces.

**Endpoint:** `GET /auth/session`

**Access:** Private (Authenticated users)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "owner@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "owner",
      "isActive": true,
      "createdAt": "2025-02-11T10:00:00.000Z"
    },
    "workspaces": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "businessName": "My Business",
        "address": "123 Main St",
        "timezone": "America/New_York",
        "contactEmail": "contact@business.com",
        "isActive": true,
        "setupCompleted": true,
        "role": "owner",
        "createdAt": "2025-02-11T10:00:00.000Z"
      }
    ]
  }
}
```

---

## 2. Workspace Endpoints

### 2.1 Create Workspace

Create a new business workspace.

**Endpoint:** `POST /workspaces`

**Access:** Private (Owner only)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "businessName": "My Awesome Business",
  "address": "123 Main Street, City, State 12345",
  "timezone": "America/New_York",
  "contactEmail": "contact@business.com"
}
```

**Validation Rules:**
- `businessName`: Required, max 255 characters
- `address`: Optional, max 500 characters
- `timezone`: Optional, max 100 characters (default: UTC)
- `contactEmail`: Required, valid email format

**Success Response:** `201 Created`
```json
{
  "success": true,
  "message": "Workspace created successfully",
  "data": {
    "workspace": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "ownerId": "550e8400-e29b-41d4-a716-446655440000",
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

**Error Responses:**

`403 Forbidden` - Not an owner
```json
{
  "success": false,
  "message": "Only business owners can create workspaces"
}
```

---

### 2.2 Update Workspace

Update workspace details.

**Endpoint:** `PUT /workspaces/:workspaceId`

**Access:** Private (Owner only)

**Headers:**
```
Authorization: Bearer <access_token>
```

**URL Parameters:**
- `workspaceId`: UUID of the workspace

**Request Body:** (All fields optional)
```json
{
  "businessName": "Updated Business Name",
  "address": "456 New Street",
  "timezone": "America/Los_Angeles",
  "contactEmail": "newcontact@business.com"
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Workspace updated successfully",
  "data": {
    "workspace": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "ownerId": "550e8400-e29b-41d4-a716-446655440000",
      "businessName": "Updated Business Name",
      "address": "456 New Street",
      "timezone": "America/Los_Angeles",
      "contactEmail": "newcontact@business.com",
      "isActive": false,
      "setupCompleted": false,
      "createdAt": "2025-02-11T10:00:00.000Z",
      "updatedAt": "2025-02-11T10:05:00.000Z"
    }
  }
}
```

**Error Responses:**

`404 Not Found` - Workspace not found
```json
{
  "success": false,
  "message": "Workspace not found"
}
```

`403 Forbidden` - Not the workspace owner
```json
{
  "success": false,
  "message": "Only the workspace owner can update workspace details"
}
```

---

### 2.3 Activate Workspace

Activate a workspace after completing setup requirements.

**Endpoint:** `POST /workspaces/:workspaceId/activate`

**Access:** Private (Owner only)

**Headers:**
```
Authorization: Bearer <access_token>
```

**URL Parameters:**
- `workspaceId`: UUID of the workspace

**Setup Requirements:**
1. At least one communication channel (email or SMS) configured
2. At least one service/booking type created
3. Availability schedule defined

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Workspace activated successfully",
  "data": {
    "workspace": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "ownerId": "550e8400-e29b-41d4-a716-446655440000",
      "businessName": "My Business",
      "isActive": true,
      "setupCompleted": true,
      ...
    }
  }
}
```

**Error Responses:**

`400 Bad Request` - Setup incomplete
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

`400 Bad Request` - Already active
```json
{
  "success": false,
  "message": "Workspace is already active"
}
```

---

### 2.4 Get Workspace Status

Get workspace details and setup progress.

**Endpoint:** `GET /workspaces/:workspaceId/status`

**Access:** Private (Owner or Staff member)

**Headers:**
```
Authorization: Bearer <access_token>
```

**URL Parameters:**
- `workspaceId`: UUID of the workspace

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "workspace": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "ownerId": "550e8400-e29b-41d4-a716-446655440000",
      "businessName": "My Business",
      "address": "123 Main St",
      "timezone": "America/New_York",
      "contactEmail": "contact@business.com",
      "isActive": false,
      "setupCompleted": false,
      "createdAt": "2025-02-11T10:00:00.000Z",
      "updatedAt": "2025-02-11T10:00:00.000Z"
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

**Error Responses:**

`404 Not Found` - Workspace not found
```json
{
  "success": false,
  "message": "Workspace not found"
}
```

`403 Forbidden` - No access
```json
{
  "success": false,
  "message": "You do not have access to this workspace"
}
```

---

## Rate Limiting

API requests are rate-limited to prevent abuse:
- **Window**: 15 minutes
- **Max Requests**: 100 per window per IP

When rate limit is exceeded:
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later."
}
```

---

## CORS

The API supports Cross-Origin Resource Sharing (CORS). Configure allowed origins in the `.env` file:
```
CORS_ORIGIN=http://localhost:3000
```

---

## Token Expiry

- **Access Token**: 15 minutes (configurable)
- **Refresh Token**: 7 days (configurable)

When access token expires, use the refresh endpoint to get a new one.

---

## Database Schema Reference

### Users Table
- Stores business owners and staff members
- Password is hashed using bcrypt
- Role: 'owner' or 'staff'

### Workspaces Table
- One owner per workspace
- Can have multiple staff members
- Must complete setup before activation

### Refresh Tokens Table
- Stores JWT refresh tokens
- Can be revoked (logout)
- Has expiry date

---

## Error Codes Quick Reference

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 400 | Bad Request | Invalid input, validation errors |
| 401 | Unauthorized | Missing or invalid token, expired token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists (e.g., duplicate email) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal server error |

---

## Best Practices

1. **Always store refresh tokens securely** (httpOnly cookies recommended)
2. **Use HTTPS in production** to encrypt token transmission
3. **Implement token refresh** before access token expires
4. **Handle 401 errors** by refreshing token or redirecting to login
5. **Validate all input** on the client side before sending
6. **Handle rate limiting** with exponential backoff
7. **Never expose sensitive data** in error messages

---

## Support

For API support:
- Email: api-support@careops.com
- Documentation: https://docs.careops.com
- Status Page: https://status.careops.com