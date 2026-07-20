# API Design

> REST API endpoint reference for PWE. Base URL: `/api/v1`

## Conventions

- **Auth**: Bearer JWT in `Authorization` header (access token) + httpOnly cookie (refresh token)
- **Tenant**: `orgId` extracted from JWT, applied automatically via middleware
- **Pagination**: `?page=1&limit=20` — response includes `{ data, meta: { total, page, limit, totalPages } }`
- **Filtering**: `?status=active&search=john` — field-specific filters
- **Sorting**: `?sort=created_at&order=desc`
- **Dates**: ISO 8601 format (`2026-07-05T10:00:00Z`)
- **IDs**: UUID v4
- **Errors**: `{ error: { code: string, message: string, details?: any } }`

---

## 1. Authentication

### POST /api/v1/auth/signup
Create a new organization and admin user.

**Request Body:**
```json
{
  "organizationName": "Yangon Sports Club",
  "slug": "yangon-sports",
  "email": "admin@yangonsports.com",
  "password": "securePassword123",
  "firstName": "Ko",
  "lastName": "Thant"
}
```

**Response:** `201 Created`
```json
{
  "user": { "id": "...", "email": "...", "role": "admin" },
  "organization": { "id": "...", "name": "...", "slug": "..." },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

**Auth:** Public

---

### POST /api/v1/auth/login
Authenticate user and return tokens.

**Request Body:**
```json
{
  "email": "admin@yangonsports.com",
  "password": "SecurePass123"
}
```

**Response:** `200 OK`
```json
{
  "user": { "id": "...", "email": "...", "role": "admin", "orgId": "..." },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

**Auth:** Public

---

### POST /api/v1/auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

**Auth:** Public (valid refresh token required)

---

### POST /api/v1/auth/logout
Revoke refresh token.

**Response:** `204 No Content`

**Auth:** Authenticated

---

### GET /api/v1/auth/profile
Get current user profile.

**Response:** `200 OK`
```json
{
  "user": {
    "id": "...",
    "email": "...",
    "role": "admin",
    "orgId": "...",
    "profile": { "firstName": "Ko", "lastName": "Thant" }
  },
  "organization": {
    "id": "...",
    "name": "Yangon Sports Club",
    "slug": "yangon-sports"
  }
}
```

**Auth:** Authenticated

---

### PATCH /api/v1/auth/change-password
Change the authenticated user's password. Verifies current password, hashes new one, and revokes all refresh tokens (forcing re-login).

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password changed successfully"
}
```

**Errors:**
- `400` — Current password is incorrect

**Auth:** Authenticated

---

## 2. Organization

### GET /api/v1/org
Get current organization details.

**Response:** `200 OK`
```json
{
  "organization": {
    "id": "...",
    "name": "Yangon Sports Club",
    "slug": "yangon-sports",
    "settings": {},
    "memberCount": 45,
    "activeEvents": 3
  }
}
```

**Auth:** admin, staff

---

### PUT /api/v1/org
Update organization settings.

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "...",
  "phone": "+95 9...",
  "settings": { "timezone": "Asia/Yangon", "locale": "my" }
}
```

**Response:** `200 OK` — Updated organization

**Auth:** admin

---

## 3. Members

### GET /api/v1/members/me
Get the authenticated member's own profile (including recent registrations).

**Response:** `200 OK`
```json
{
  "id": "...",
  "firstName": "Aung",
  "lastName": "Myo",
  "phone": "+95 9...",
  "email": "aung@email.com",
  "membershipStatus": "active",
  "membershipType": "regular",
  "joinDate": "2026-01-15",
  "registrations": [...]
}
```

**Auth:** member, staff, admin

---

### PUT /api/v1/members/me
Update the authenticated member's own profile. Members cannot change `membershipType` or `membershipStatus` (admin-controlled).

**Request Body:**
```json
{
  "firstName": "Aung",
  "lastName": "Myo",
  "phone": "+95 9 1234 5678",
  "email": "aung@email.com",
  "emergencyContact": "Daw May (+95 9 9999 0000)",
  "notes": "Prefers morning events"
}
```

**Response:** `200 OK` — Updated member record

**Auth:** member, staff, admin

---

### GET /api/v1/members
List members with filtering, search, and pagination.

**Query Parameters:**
- `search` — Full-text search across name, email, phone
- `status` — Filter by membership_status (active/inactive/suspended)
- `type` — Filter by membership_type
- `page`, `limit`, `sort`, `order`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "...",
      "firstName": "Aung",
      "lastName": "Myo",
      "phone": "+95 9...",
      "email": "aung@email.com",
      "membershipStatus": "active",
      "joinDate": "2026-01-15"
    }
  ],
  "meta": { "total": 45, "page": 1, "limit": 20, "totalPages": 3 }
}
```

**Auth:** admin, staff

---

### GET /api/v1/members/:id
Get single member details.

**Response:** `200 OK` — Full member record with profile

**Auth:** admin, staff

---

### POST /api/v1/members
Create a new member.

**Request Body:**
```json
{
  "firstName": "Aung",
  "lastName": "Myo",
  "phone": "+95 9 1234 5678",
  "email": "aung@email.com",
  "membershipType": "regular",
  "emergencyContact": "Daw May (+95 9 9999 0000)",
  "notes": "Prefers morning events"
}
```

**Response:** `201 Created` — Created member

**Auth:** admin, staff

---

### PUT /api/v1/members/:id
Update member details.

**Request Body:** Partial update of member fields

**Response:** `200 OK` — Updated member

**Auth:** admin, staff

---

### PATCH /api/v1/members/:id/status
Toggle member status (active/inactive/suspended).

**Request Body:**
```json
{ "status": "suspended" }
```

**Response:** `200 OK`

**Auth:** admin

---

### PATCH /api/v1/members/:id/reset-password
Reset a member's password. Generates a random temporary password, hashes it, updates the user's credentials, and revokes all existing refresh tokens (forcing re-login).

**Response:** `200 OK`
```json
{
  "temporaryPassword": "a3f1b2c4"
}
```

**Errors:**
- `400` — Member has no linked user account
- `404` — Member not found

**Auth:** admin

---

### POST /api/v1/members/import
Bulk import members from CSV.

**Request:** `multipart/form-data` with CSV file

**Response:** `200 OK`
```json
{
  "imported": 23,
  "skipped": 2,
  "errors": [
    { "row": 15, "reason": "Invalid phone format" },
    { "row": 28, "reason": "Duplicate email" }
  ]
}
```

**Auth:** admin

---

### GET /api/v1/members/export
Export members as CSV.

**Query:** `?status=active&format=csv`

**Response:** `200 OK` — CSV file download

**Auth:** admin, staff

---

## 4. Events

### GET /api/v1/events
List events for the organization.

**Query Parameters:**
- `status` — draft/published/cancelled/completed
- `from` — Start date filter (ISO 8601)
- `to` — End date filter (ISO 8601)
- `page`, `limit`, `sort`, `order`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "...",
      "title": "Weekend Training",
      "startDate": "2026-07-12T08:00:00Z",
      "location": "Thuwunna Ground",
      "status": "published",
      "registrationMode": "member",
      "capacity": 30,
      "registeredCount": 18
    }
  ],
  "meta": { "total": 12, "page": 1, "limit": 20, "totalPages": 1 }
}
```

**Auth:** admin, staff

---

### GET /api/v1/events/:id
Get event details with registration count.

**Response:** `200 OK` — Full event with `customFields` and `registrationStats`

**Auth:** admin, staff

---

### POST /api/v1/events
Create a new event.

**Request Body:**
```json
{
  "title": "Weekend Training",
  "description": "Regular weekend practice session",
  "location": "Thuwunna Ground",
  "startDate": "2026-07-12T08:00:00Z",
  "endDate": "2026-07-12T11:00:00Z",
  "capacity": 30,
  "registrationMode": "both",
  "requiresPayment": true,
  "paymentAmount": 5000,
  "customFields": [
    { "name": "T-Shirt Size", "type": "select", "options": ["S", "M", "L", "XL"], "required": true }
  ]
}
```

**Response:** `201 Created` — Created event

**Auth:** admin, staff

---

### PUT /api/v1/events/:id
Update event details.

**Response:** `200 OK` — Updated event

**Auth:** admin, staff

---

### PATCH /api/v1/events/:id/status
Publish, cancel, or complete an event.

**Request Body:**
```json
{ "status": "published" }
```

**Response:** `200 OK`

**Auth:** admin, staff

---

### GET /api/v1/events/public
Public event listing (no auth required, filtered by org).

**Query:** `?slug=yangon-sports&page=1`

**Response:** `200 OK` — Published events with basic info

**Auth:** Public

---

### GET /api/v1/events/public/:id
Public event detail page (for registration).

**Response:** `200 OK` — Event details with registration form fields

**Auth:** Public

---

## 5. Registrations

### POST /api/v1/events/:eventId/register
Register for an event.

**Request Body (Member):**
```json
{
  "memberId": "...",
  "formData": { "tshirtSize": "L" }
}
```

**Request Body (Guest):**
```json
{
  "guestName": "Ko Win",
  "guestEmail": "win@email.com",
  "guestPhone": "+95 9 1111 2222",
  "formData": { "tshirtSize": "M" }
}
```

**Response:** `201 Created`
```json
{
  "registration": {
    "id": "...",
    "status": "registered",
    "registeredAt": "2026-07-05T10:00:00Z"
  }
}
```

**Auth:** Public (guest) or Authenticated (member)

---

### GET /api/v1/events/:eventId/registrations
List registrations for an event.

**Query Parameters:**
- `status` — registered/cancelled/waitlisted
- `type` — member/guest
- `page`, `limit`

**Response:** `200 OK` — Paginated registrations with member/guest details

**Auth:** admin, staff

---

### PATCH /api/v1/registrations/:id/cancel
Cancel a registration. Staff can cancel any registration; members can cancel their own via the `/events/:eventId/register/member` DELETE endpoint.

**Response:** `200 OK`

**Auth:** admin, staff

---

## 6. Attendance

### GET /api/v1/events/:eventId/attendance
List attendance records for an event.

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "...",
      "registrationId": "...",
      "memberName": "Aung Myo",
      "checkedInAt": "2026-07-12T08:05:00Z",
      "checkedInBy": "Ko Thant",
      "method": "manual"
    }
  ],
  "stats": { "total": 30, "checkedIn": 18, "absent": 12 }
}
```

**Auth:** admin, staff

---

### POST /api/v1/events/:eventId/attendance
Check in a participant.

**Request Body:**
```json
{
  "registrationId": "...",
  "method": "manual"
}
```

**Response:** `201 Created`

**Auth:** admin, staff

---

### POST /api/v1/events/:eventId/attendance/bulk
Bulk check-in multiple participants.

**Request Body:**
```json
{
  "registrationIds": ["...", "...", "..."],
  "method": "manual"
}
```

**Response:** `200 OK` — `{ checkedIn: 3 }`

**Auth:** admin, staff

---

### DELETE /api/v1/attendance/:id
Remove an attendance record (undo check-in).

**Response:** `204 No Content`

**Auth:** admin

---

## 7. Payments

### GET /api/v1/payments
List payments for the organization.

**Query Parameters:**
- `memberId` — Filter by member
- `eventId` — Filter by event
- `status` — paid/pending/refunded
- `page`, `limit`

**Response:** `200 OK` — Paginated payment records

**Auth:** admin, staff

---

### POST /api/v1/payments
Record a manual payment.

**Request Body:**
```json
{
  "memberId": "...",
  "eventId": "...",
  "registrationId": "...",
  "amount": 5000,
  "currency": "MMK",
  "paymentMethod": "cash",
  "referenceNumber": "RCP-001",
  "notes": "Paid in cash at venue",
  "paidAt": "2026-07-12T08:30:00Z"
}
```

**Response:** `201 Created`

**Auth:** admin, staff

---

### PATCH /api/v1/payments/:id
Update payment status or details.

**Request Body:**
```json
{
  "status": "paid",
  "referenceNumber": "RCP-002"
}
```

**Response:** `200 OK`

**Auth:** admin

---

### GET /api/v1/payments/summary
Get payment summary for an event or organization.

**Query:** `?eventId=...`

**Response:** `200 OK`
```json
{
  "totalExpected": 150000,
  "totalCollected": 95000,
  "totalPending": 55000,
  "byMethod": {
    "cash": 50000,
    "bank_transfer": 30000,
    "mobile_money": 15000
  }
}
```

**Auth:** admin, staff

---

## 8. Announcements

### GET /api/v1/announcements
List announcements.

**Query:** `?status=published&page=1`

**Response:** `200 OK` — Paginated announcements

**Auth:** admin, staff, member

---

### POST /api/v1/announcements
Create an announcement.

**Request Body:**
```json
{
  "title": "Schedule Change",
  "content": "This Saturday's training is moved to 9am.",
  "priority": "high",
  "eventId": "...",
  "status": "published"
}
```

**Response:** `201 Created`

**Auth:** admin, staff

---

### PUT /api/v1/announcements/:id
Update an announcement.

**Response:** `200 OK`

**Auth:** admin, staff

---

### PATCH /api/v1/announcements/:id/status
Publish, archive, or draft an announcement.

**Response:** `200 OK`

**Auth:** admin, staff

---

## 9. Reports

### GET /api/v1/reports/members
Member list report.

**Query:** `?status=active&format=json|csv`

**Response:** `200 OK` — Member data or CSV download

**Auth:** admin, staff

---

### GET /api/v1/reports/events
Event summary report.

**Query:** `?from=2026-01-01&to=2026-12-31`

**Response:** `200 OK`
```json
{
  "events": [
    {
      "id": "...",
      "title": "Weekend Training",
      "date": "2026-07-12",
      "registrations": 25,
      "attended": 18,
      "attendanceRate": 72,
      "revenue": 90000
    }
  ],
  "summary": {
    "totalEvents": 12,
    "avgAttendance": 78,
    "totalRevenue": 450000
  }
}
```

**Auth:** admin, staff

---

### GET /api/v1/reports/attendance/:eventId
Attendance report for a specific event.

**Query:** `?format=json|csv|xlsx`

**Response:** Attendance data or file download

**Auth:** admin, staff

---

### GET /api/v1/reports/payments
Payment status report.

**Query:** `?from=...&to=...&status=paid`

**Response:** `200 OK` — Payment summary and details

**Auth:** admin

---

## 10. Users (Internal — Admin Management)

> **Note:** User management endpoints are planned but not yet implemented.

### GET /api/v1/users
List staff users in the organization.

**Response:** `200 OK` — User list with roles

**Auth:** admin

---

### POST /api/v1/users/invite
Invite a staff member.

**Request Body:**
```json
{
  "email": "staff@yangonsports.com",
  "role": "staff"
}
```

**Response:** `201 Created`

**Auth:** admin

---

### PATCH /api/v1/users/:id/role
Change a user's role.

**Request Body:** `{ "role": "admin" }`

**Response:** `200 OK`

**Auth:** admin

---

## Error Codes

All error responses follow the format: `{ success: false, error: { code: string, message: string } }`

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `CONFLICT` | 409 | Resource already exists |
| `TENANT_MISMATCH` | 403 | Attempting to access cross-org data |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error (no internal details leaked) |

---

## Rate Limiting

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Auth (login/signup) | 5 requests | 1 minute |
| General API | 100 requests | 1 minute |
| File upload | 10 requests | 1 minute |
| Public endpoints | 30 requests | 1 minute |
