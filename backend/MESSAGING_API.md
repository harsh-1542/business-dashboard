# CareOps - Messaging & Automation API Documentation

## Overview

The CareOps platform includes automated email and SMS messaging powered by SendGrid and Twilio. Messages are automatically sent based on specific triggers (contact form submission, booking creation, etc.).

---

## Table of Contents
1. [Setup & Configuration](#setup--configuration)
2. [Integrations Management](#integrations-management)
3. [Contact Forms](#contact-forms)
4. [Customer Bookings](#customer-bookings)
5. [Automated Messages](#automated-messages)

---

## Setup & Configuration

### Environment Variables

Add these to your `.env` file:

```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.your_actual_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Your Business Name

# Twilio Configuration (for SMS)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### Getting API Keys

**SendGrid:**
1. Sign up at https://sendgrid.com/
2. Go to Settings → API Keys
3. Create new API key with "Mail Send" permissions
4. Copy the key to `SENDGRID_API_KEY`

**Twilio:**
1. Sign up at https://www.twilio.com/
2. Go to Console Dashboard
3. Copy Account SID and Auth Token
4. Purchase a phone number for SMS sending

---

## Integrations Management

### 1. Add Integration to Workspace

Configure email or SMS integration for a workspace.

**Endpoint:** `POST /api/integrations/:workspaceId`

**Access:** Private (Owner only)

**Request Body:**
```json
{
  "type": "email",
  "provider": "sendgrid",
  "config": {
    "fromEmail": "noreply@mybusiness.com",
    "fromName": "My Business"
  }
}
```

Or for SMS:
```json
{
  "type": "sms",
  "provider": "twilio",
  "config": {
    "phoneNumber": "+1234567890"
  }
}
```

**Valid Types:**
- `email` - Email communication
- `sms` - SMS messaging
- `calendar` - Calendar integration (future)
- `storage` - File storage (future)
- `webhook` - Webhook integration (future)

**Success Response:** `201 Created`
```json
{
  "success": true,
  "message": "Integration added successfully",
  "data": {
    "integration": {
      "id": "uuid",
      "workspaceId": "uuid",
      "type": "email",
      "provider": "sendgrid",
      "isActive": true,
      "createdAt": "2025-02-11T10:00:00.000Z"
    }
  }
}
```

---

### 2. Get Workspace Integrations

**Endpoint:** `GET /api/integrations/:workspaceId`

**Access:** Private

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "integrations": [
      {
        "id": "uuid",
        "workspaceId": "uuid",
        "type": "email",
        "provider": "sendgrid",
        "isActive": true,
        "createdAt": "2025-02-11T10:00:00.000Z"
      },
      {
        "id": "uuid",
        "workspaceId": "uuid",
        "type": "sms",
        "provider": "twilio",
        "isActive": true,
        "createdAt": "2025-02-11T10:05:00.000Z"
      }
    ],
    "count": 2
  }
}
```

---

### 3. Update Integration

**Endpoint:** `PUT /api/integrations/:integrationId`

**Access:** Private (Owner only)

**Request Body:**
```json
{
  "isActive": true,
  "config": {
    "fromEmail": "updated@mybusiness.com"
  }
}
```

---

### 4. Delete Integration

**Endpoint:** `DELETE /api/integrations/:integrationId`

**Access:** Private (Owner only)

---

## Contact Forms

### 1. Submit Contact Form (Public)

Customer submits a contact form. Automatically:
- Creates or finds contact
- Creates conversation
- Sends welcome email/SMS (if configured)
- Logs automation

**Endpoint:** `POST /api/contacts/submit`

**Access:** Public (no authentication)

**Request Body:**
```json
{
  "workspaceId": "workspace-uuid",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "message": "I'm interested in your services"
}
```

**Note:** Either `email` or `phone` is required (can provide both).

**Success Response:** `201 Created`
```json
{
  "success": true,
  "message": "Thank you for contacting us! We will get back to you shortly.",
  "data": {
    "contactId": "uuid",
    "conversationId": "uuid"
  }
}
```

**Automated Actions:**
- ✅ Welcome email sent (if email integration active)
- ✅ Welcome SMS sent (if SMS integration active)
- ✅ Automation logged in database

---

### 2. Get Contact Form Config

Get form configuration for a workspace.

**Endpoint:** `GET /api/contacts/form-config/:workspaceId`

**Access:** Public

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "workspaceId": "uuid",
    "businessName": "My Business",
    "isActive": true,
    "fields": [
      {
        "name": "firstName",
        "label": "First Name",
        "type": "text",
        "required": true
      },
      {
        "name": "lastName",
        "label": "Last Name",
        "type": "text",
        "required": true
      },
      {
        "name": "email",
        "label": "Email",
        "type": "email",
        "required": false
      },
      {
        "name": "phone",
        "label": "Phone",
        "type": "tel",
        "required": false
      },
      {
        "name": "message",
        "label": "Message",
        "type": "textarea",
        "required": false
      }
    ]
  }
}
```

---

## Customer Bookings

### 1. Create Booking (Public)

Customer creates a booking. Automatically:
- Creates or finds contact
- Creates conversation
- Creates booking
- Sends booking confirmation email/SMS
- Logs automation

**Endpoint:** `POST /api/customer-bookings/create`

**Access:** Public (no authentication)

**Request Body:**
```json
{
  "workspaceId": "workspace-uuid",
  "serviceTypeId": "service-uuid",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "bookingDate": "2025-03-15",
  "bookingTime": "14:00:00",
  "notes": "Please send parking instructions"
}
```

**Success Response:** `201 Created`
```json
{
  "success": true,
  "message": "Booking created successfully! You will receive a confirmation shortly.",
  "data": {
    "booking": {
      "id": "uuid",
      "serviceType": "Initial Consultation",
      "date": "2025-03-15",
      "time": "14:00:00",
      "duration": 60,
      "location": "123 Business St, Suite 200",
      "status": "pending"
    },
    "contact": {
      "id": "uuid",
      "name": "Jane Smith"
    }
  }
}
```

**Automated Actions:**
- ✅ Booking confirmation email sent
- ✅ Booking confirmation SMS sent
- ✅ Automation logged in database

---

### 2. Get Workspace Bookings

**Endpoint:** `GET /api/customer-bookings/:workspaceId`

**Access:** Private (Owner or Staff)

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "uuid",
        "date": "2025-03-15",
        "time": "14:00:00",
        "status": "pending",
        "notes": "Please send parking instructions",
        "createdAt": "2025-02-11T10:00:00.000Z",
        "contact": {
          "id": "uuid",
          "firstName": "Jane",
          "lastName": "Smith",
          "email": "jane@example.com",
          "phone": "+1234567890"
        },
        "serviceType": {
          "id": "uuid",
          "name": "Initial Consultation",
          "duration": 60,
          "location": "123 Business St"
        }
      }
    ],
    "count": 1
  }
}
```

---

### 3. Update Booking Status

**Endpoint:** `PUT /api/customer-bookings/:bookingId/status`

**Access:** Private (Owner or Staff)

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Valid Statuses:**
- `pending` - Awaiting confirmation
- `confirmed` - Confirmed by business
- `completed` - Meeting completed
- `no_show` - Customer didn't show up
- `cancelled` - Booking cancelled

---

## Automated Messages

### Email Templates

#### Welcome Email
Sent when: Contact form submitted

Contains:
- Personalized greeting
- Thank you message
- Business name
- Professional HTML formatting

#### Booking Confirmation Email
Sent when: Booking created

Contains:
- Booking details (service, date, time, location)
- Duration
- Calendar reminder suggestion
- Business contact info
- Professional HTML formatting

#### Booking Reminder Email
Sent when: Manually triggered (or via scheduled job - future)

Contains:
- Appointment details
- Date and time reminder
- Location
- Cancellation instructions

#### Form Request Email
Sent when: Form assigned to customer (future feature)

Contains:
- Form name
- Link to complete form
- Business name
- Call to action button

---

### SMS Templates

#### Welcome SMS
```
Hi [Name]! Welcome to [Business]. We've received your inquiry and will get back to you soon. Reply STOP to unsubscribe.
```

#### Booking Confirmation SMS
```
Hi [Name]! Your [Service] booking at [Business] is confirmed for [Date] at [Time]. Location: [Address]. See you there!
```

#### Booking Reminder SMS
```
Reminder: [Name], you have a [Service] appointment tomorrow at [Time]. Location: [Address]. [Business]
```

---

## Automation Logs

All automated actions are logged in the `automation_logs` table:

**Log Structure:**
```sql
{
  workspace_id: UUID,
  event_type: 'contact_created' | 'booking_created' | 'form_assigned',
  entity_type: 'contact' | 'booking' | 'form_submission',
  entity_id: UUID,
  action_taken: 'welcome_email_sent' | 'confirmation_sms_sent' | ...,
  status: 'success' | 'failed',
  error_message: TEXT (if failed),
  created_at: TIMESTAMP
}
```

---

## Complete Workflow Example

### Setting Up Automated Messaging

```bash
# 1. Owner creates workspace
POST /api/workspaces
{
  "businessName": "Consulting Inc",
  "contactEmail": "contact@consulting.com"
}

# 2. Add email integration
POST /api/integrations/WORKSPACE_ID
{
  "type": "email",
  "provider": "sendgrid",
  "config": {
    "fromEmail": "noreply@consulting.com",
    "fromName": "Consulting Inc"
  }
}

# 3. Add SMS integration
POST /api/integrations/WORKSPACE_ID
{
  "type": "sms",
  "provider": "twilio",
  "config": {
    "phoneNumber": "+1234567890"
  }
}

# 4. Create service types and availability (see previous docs)

# 5. Customer submits contact form (PUBLIC - no auth)
POST /api/contacts/submit
{
  "workspaceId": "WORKSPACE_ID",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1987654321",
  "message": "Interested in consulting services"
}
# ✅ Automatic: Welcome email + SMS sent

# 6. Customer creates booking (PUBLIC - no auth)
POST /api/customer-bookings/create
{
  "workspaceId": "WORKSPACE_ID",
  "serviceTypeId": "SERVICE_ID",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1987654321",
  "bookingDate": "2025-03-20",
  "bookingTime": "10:00:00"
}
# ✅ Automatic: Booking confirmation email + SMS sent

# 7. Staff/Owner views bookings
GET /api/customer-bookings/WORKSPACE_ID
Authorization: Bearer TOKEN

# 8. Staff updates booking status
PUT /api/customer-bookings/BOOKING_ID/status
{
  "status": "confirmed"
}
```

---

## Error Handling

### Mock Mode (No Credentials)

If SendGrid or Twilio credentials are not configured, the system operates in **mock mode**:
- Messages are logged to console instead of being sent
- Returns success with `mockMode: true`
- Automation logs still record the attempt
- No actual emails/SMS are sent

This allows development and testing without API keys.

### Production Mode

With valid credentials:
- Messages are sent via SendGrid/Twilio
- Failures are caught and logged
- System continues operating even if messages fail
- Automation logs track success/failure

---

## Best Practices

1. **Always configure at least one channel** (email or SMS)
2. **Test in mock mode** before adding real API keys
3. **Monitor automation logs** for failed messages
4. **Keep email templates professional** and on-brand
5. **Include unsubscribe options** in SMS (required by law)
6. **Respect rate limits** for SendGrid/Twilio

---

## Pricing Considerations

**SendGrid:**
- Free tier: 100 emails/day
- Paid plans start at $19.95/month for 50,000 emails

**Twilio:**
- Pay-as-you-go: ~$0.0079 per SMS
- No monthly fee, only per-message cost

---

## Support

- SendGrid Docs: https://docs.sendgrid.com/
- Twilio Docs: https://www.twilio.com/docs/sms