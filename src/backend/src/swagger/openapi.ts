import { schemas } from "./schemas";

// Security scheme definitions
const securitySchemes = {
  BearerAuth: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description: "JWT access token from login/signup",
  },
  OrgHeader: {
    type: "apiKey",
    in: "header",
    name: "x-org-id",
    description: "Organization ID (required for public/guest routes)",
  },
};

// ──────────────────────────────────────────────
// Path Parameters
// ──────────────────────────────────────────────
const pathParams = {
  memberId: {
    name: "id",
    in: "path",
    required: true,
    schema: { type: "string", format: "uuid" },
    description: "Member ID",
  },
  eventId: {
    name: "id",
    in: "path",
    required: true,
    schema: { type: "string", format: "uuid" },
    description: "Event ID",
  },
  registrationId: {
    name: "id",
    in: "path",
    required: true,
    schema: { type: "string", format: "uuid" },
    description: "Registration ID",
  },
  attendanceId: {
    name: "id",
    in: "path",
    required: true,
    schema: { type: "string", format: "uuid" },
    description: "Attendance record ID",
  },
  paymentId: {
    name: "id",
    in: "path",
    required: true,
    schema: { type: "string", format: "uuid" },
    description: "Payment ID",
  },
  announcementId: {
    name: "id",
    in: "path",
    required: true,
    schema: { type: "string", format: "uuid" },
    description: "Announcement ID",
  },
  eventIdForSub: {
    name: "eventId",
    in: "path",
    required: true,
    schema: { type: "string", format: "uuid" },
    description: "Event ID",
  },
};

// Common parameter sets
const paginationParams = [
  {
    name: "page",
    in: "query",
    schema: { type: "integer", default: 1, minimum: 1 },
    description: "Page number",
  },
  {
    name: "limit",
    in: "query",
    schema: { type: "integer", default: 20, minimum: 1, maximum: 100 },
    description: "Items per page",
  },
  {
    name: "search",
    in: "query",
    schema: { type: "string" },
    description: "Search term",
  },
  {
    name: "sortBy",
    in: "query",
    schema: { type: "string" },
    description: "Field to sort by",
  },
  {
    name: "sortOrder",
    in: "query",
    schema: { type: "string", enum: ["asc", "desc"], default: "asc" },
    description: "Sort order",
  },
];

const dateRangeParams = [
  {
    name: "startDate",
    in: "query",
    schema: { type: "string", format: "date" },
    description: "Start date filter (ISO 8601)",
  },
  {
    name: "endDate",
    in: "query",
    schema: { type: "string", format: "date" },
    description: "End date filter (ISO 8601)",
  },
];

// ──────────────────────────────────────────────
// Tags
// ──────────────────────────────────────────────
const tags = [
  { name: "Health", description: "Health check endpoints" },
  { name: "Auth", description: "Authentication & registration" },
  { name: "Organization", description: "Organization management" },
  { name: "Members", description: "Member CRUD & import/export" },
  { name: "Events", description: "Event management (staff)" },
  { name: "Public Events", description: "Public event listing (no auth)" },
  { name: "Registrations", description: "Event registration management" },
  { name: "Attendance", description: "Check-in & attendance tracking" },
  { name: "Payments", description: "Payment recording & tracking" },
  { name: "Announcements", description: "Announcement management" },
  { name: "Reports", description: "Analytics & export reports" },
];

// ──────────────────────────────────────────────
// Paths (all endpoints)
// ──────────────────────────────────────────────
const paths = {
  // ── Health ──
  "/health": {
    get: {
      tags: ["Health"],
      summary: "Health check",
      operationId: "healthCheck",
      responses: {
        "200": {
          description: "Service is healthy",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "ok" },
                  timestamp: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
      },
    },
  },

  // ── Auth ──
  "/api/v1/auth/signup": {
    post: {
      tags: ["Auth"],
      summary: "Register new organization and admin user",
      operationId: "signup",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/SignupRequest" },
          },
        },
      },
      responses: {
        "201": {
          description: "Signup successful",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          user: { $ref: "#/components/schemas/UserProfile" },
                          organization: { $ref: "#/components/schemas/Organization" },
                          accessToken: { type: "string" },
                          refreshToken: { type: "string" },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        "400": { $ref: "#/components/responses/ValidationError" },
        "409": { description: "Email or slug already exists" },
      },
    },
  },
  "/api/v1/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "Login with email and password",
      operationId: "login",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/LoginRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Login successful",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          user: { $ref: "#/components/schemas/UserProfile" },
                          organization: { $ref: "#/components/schemas/Organization" },
                          accessToken: { type: "string" },
                          refreshToken: { type: "string" },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        "401": { description: "Invalid credentials" },
      },
    },
  },
  "/api/v1/auth/refresh": {
    post: {
      tags: ["Auth"],
      summary: "Refresh access token",
      operationId: "refreshToken",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RefreshTokenRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Token refreshed",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/TokenResponse" },
                    },
                  },
                ],
              },
            },
          },
        },
        "401": { description: "Invalid or expired refresh token" },
      },
    },
  },
  "/api/v1/auth/logout": {
    post: {
      tags: ["Auth"],
      summary: "Logout and revoke refresh tokens",
      operationId: "logout",
      responses: {
        "200": {
          description: "Logged out successfully",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          message: { type: "string", example: "Logged out successfully" },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/auth/profile": {
    get: {
      tags: ["Auth"],
      summary: "Get current user profile",
      operationId: "getProfile",
      responses: {
        "200": {
          description: "Profile retrieved",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          user: {
                            allOf: [
                              { $ref: "#/components/schemas/UserProfile" },
                              {
                                type: "object",
                                properties: {
                                  phone: { type: "string", nullable: true },
                                  profile: { $ref: "#/components/schemas/Profile" },
                                },
                              },
                            ],
                          },
                          organization: { $ref: "#/components/schemas/Organization" },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    },
  },

  // ── Organization ──
  "/api/v1/org/": {
    get: {
      tags: ["Organization"],
      summary: "Get organization details",
      operationId: "getOrganization",
      responses: {
        "200": {
          description: "Organization details",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Organization" },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    },
    put: {
      tags: ["Organization"],
      summary: "Update organization details",
      operationId: "updateOrganization",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/OrgUpdate" },
          },
        },
      },
      responses: {
        "200": {
          description: "Organization updated",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Organization" },
                    },
                  },
                ],
              },
            },
          },
        },
        "403": { description: "Admin role required" },
      },
    },
  },
  "/api/v1/org/stats": {
    get: {
      tags: ["Organization"],
      summary: "Get organization statistics",
      operationId: "getOrgStats",
      responses: {
        "200": {
          description: "Organization statistics",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/OrgStats" },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    },
  },

  // ── Members ──
  "/api/v1/members/": {
    get: {
      tags: ["Members"],
      summary: "List members with pagination",
      operationId: "listMembers",
      parameters: paginationParams,
      responses: {
        "200": {
          description: "Paginated member list",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          data: {
                            type: "array",
                            items: { $ref: "#/components/schemas/Member" },
                          },
                          pagination: { $ref: "#/components/schemas/PaginationMeta" },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    },
    post: {
      tags: ["Members"],
      summary: "Create a new member",
      operationId: "createMember",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/MemberCreate" },
          },
        },
      },
      responses: {
        "201": {
          description: "Member created",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Member" },
                    },
                  },
                ],
              },
            },
          },
        },
        "400": { $ref: "#/components/responses/ValidationError" },
      },
    },
  },
  "/api/v1/members/export": {
    get: {
      tags: ["Members"],
      summary: "Export members as CSV",
      operationId: "exportMembers",
      parameters: paginationParams,
      responses: {
        "200": {
          description: "CSV file download",
          content: {
            "text/csv": {
              schema: { type: "string", format: "binary" },
            },
          },
        },
      },
    },
  },
  "/api/v1/members/{id}": {
    get: {
      tags: ["Members"],
      summary: "Get member by ID",
      operationId: "getMember",
      parameters: [pathParams.memberId],
      responses: {
        "200": {
          description: "Member details with recent registrations",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        allOf: [
                          { $ref: "#/components/schemas/Member" },
                          {
                            type: "object",
                            properties: {
                              registrations: {
                                type: "array",
                                items: { $ref: "#/components/schemas/Registration" },
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        "404": { description: "Member not found" },
      },
    },
    put: {
      tags: ["Members"],
      summary: "Update a member",
      operationId: "updateMember",
      parameters: [pathParams.memberId],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/MemberUpdate" },
          },
        },
      },
      responses: {
        "200": {
          description: "Member updated",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Member" },
                    },
                  },
                ],
              },
            },
          },
        },
        "400": { $ref: "#/components/responses/ValidationError" },
        "404": { description: "Member not found" },
      },
    },
  },
  "/api/v1/members/{id}/status": {
    patch: {
      tags: ["Members"],
      summary: "Update member status (admin only)",
      operationId: "updateMemberStatus",
      parameters: [pathParams.memberId],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/MemberStatusUpdate" },
          },
        },
      },
      responses: {
        "200": {
          description: "Member status updated",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Member" },
                    },
                  },
                ],
              },
            },
          },
        },
        "403": { description: "Admin role required" },
      },
    },
  },
  "/api/v1/members/import": {
    post: {
      tags: ["Members"],
      summary: "Bulk import members (admin only)",
      operationId: "importMembers",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/MemberImport" },
          },
        },
      },
      responses: {
        "200": {
          description: "Import results",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          successCount: { type: "integer", example: 10 },
                          skipCount: { type: "integer", example: 2 },
                          errors: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                row: { type: "integer" },
                                error: { type: "string" },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        "403": { description: "Admin role required" },
      },
    },
  },

  // ── Public Events ──
  "/api/v1/events/public": {
    get: {
      tags: ["Public Events"],
      summary: "List published events (public)",
      operationId: "listPublicEvents",
      security: [{ OrgHeader: [] }],
      responses: {
        "200": {
          description: "List of published upcoming events",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: {
                          allOf: [
                            { $ref: "#/components/schemas/Event" },
                            {
                              type: "object",
                              properties: {
                                _count: {
                                  type: "object",
                                  properties: {
                                    registrations: { type: "integer" },
                                  },
                                },
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        "403": { description: "x-org-id header required" },
      },
    },
  },
  "/api/v1/events/public/{id}": {
    get: {
      tags: ["Public Events"],
      summary: "Get published event by ID (public)",
      operationId: "getPublicEvent",
      security: [{ OrgHeader: [] }],
      parameters: [pathParams.eventId],
      responses: {
        "200": {
          description: "Published event details",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        allOf: [
                          { $ref: "#/components/schemas/Event" },
                          {
                            type: "object",
                            properties: {
                              _count: {
                                type: "object",
                                properties: {
                                  registrations: { type: "integer" },
                                },
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        "404": { description: "Event not found or not published" },
      },
    },
  },

  // ── Events (staff) ──
  "/api/v1/events/": {
    get: {
      tags: ["Events"],
      summary: "List events with pagination",
      operationId: "listEvents",
      parameters: paginationParams,
      responses: {
        "200": {
          description: "Paginated event list",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          data: {
                            type: "array",
                            items: {
                              allOf: [
                                { $ref: "#/components/schemas/Event" },
                                {
                                  type: "object",
                                  properties: {
                                    _count: {
                                      type: "object",
                                      properties: {
                                        registrations: { type: "integer" },
                                      },
                                    },
                                  },
                                },
                              ],
                            },
                          },
                          pagination: { $ref: "#/components/schemas/PaginationMeta" },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    },
    post: {
      tags: ["Events"],
      summary: "Create a new event",
      operationId: "createEvent",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/EventCreate" },
          },
        },
      },
      responses: {
        "201": {
          description: "Event created",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Event" },
                    },
                  },
                ],
              },
            },
          },
        },
        "400": { $ref: "#/components/responses/ValidationError" },
      },
    },
  },
  "/api/v1/events/{id}": {
    get: {
      tags: ["Events"],
      summary: "Get event details",
      operationId: "getEvent",
      parameters: [pathParams.eventId],
      responses: {
        "200": {
          description: "Event details with counts and creator",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        allOf: [
                          { $ref: "#/components/schemas/Event" },
                          {
                            type: "object",
                            properties: {
                              _count: {
                                type: "object",
                                properties: {
                                  registrations: { type: "integer" },
                                  attendance: { type: "integer" },
                                },
                              },
                              createdBy: {
                                type: "object",
                                properties: {
                                  id: { type: "string", format: "uuid" },
                                  profile: { $ref: "#/components/schemas/Profile" },
                                },
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        "404": { description: "Event not found" },
      },
    },
    put: {
      tags: ["Events"],
      summary: "Update an event",
      operationId: "updateEvent",
      parameters: [pathParams.eventId],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/EventUpdate" },
          },
        },
      },
      responses: {
        "200": {
          description: "Event updated",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Event" },
                    },
                  },
                ],
              },
            },
          },
        },
        "400": { $ref: "#/components/responses/ValidationError" },
        "404": { description: "Event not found" },
      },
    },
  },
  "/api/v1/events/{id}/status": {
    patch: {
      tags: ["Events"],
      summary: "Update event status (state machine)",
      operationId: "updateEventStatus",
      parameters: [pathParams.eventId],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/EventStatusUpdate" },
          },
        },
      },
      description:
        "Valid transitions: draft→published, published→completed|cancelled, completed/cancelled are terminal",
      responses: {
        "200": {
          description: "Event status updated",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Event" },
                    },
                  },
                ],
              },
            },
          },
        },
        "400": { description: "Invalid status transition" },
      },
    },
  },

  // ── Registrations ──
  "/api/v1/events/{eventId}/register": {
    post: {
      tags: ["Registrations"],
      summary: "Register for an event (guests allowed)",
      operationId: "registerForEvent",
      security: [{ BearerAuth: [] }, {}],
      parameters: [pathParams.eventIdForSub],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RegistrationCreate" },
          },
        },
      },
      responses: {
        "201": {
          description: "Registration created",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Registration" },
                    },
                  },
                ],
              },
            },
          },
        },
        "400": { $ref: "#/components/responses/ValidationError" },
        "404": { description: "Event not found or registration closed" },
      },
    },
  },
  "/api/v1/events/{eventId}/registrations": {
    get: {
      tags: ["Registrations"],
      summary: "List event registrations",
      operationId: "listRegistrations",
      parameters: [pathParams.eventIdForSub, ...paginationParams],
      responses: {
        "200": {
          description: "Paginated registration list",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          data: {
                            type: "array",
                            items: {
                              allOf: [
                                { $ref: "#/components/schemas/Registration" },
                                {
                                  type: "object",
                                  properties: {
                                    member: { $ref: "#/components/schemas/Member" },
                                  },
                                },
                              ],
                            },
                          },
                          pagination: { $ref: "#/components/schemas/PaginationMeta" },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/registrations/{id}/cancel": {
    patch: {
      tags: ["Registrations"],
      summary: "Cancel a registration",
      operationId: "cancelRegistration",
      parameters: [pathParams.registrationId],
      responses: {
        "200": {
          description: "Registration cancelled (promotes waitlisted if any)",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Registration" },
                    },
                  },
                ],
              },
            },
          },
        },
        "404": { description: "Registration not found" },
      },
    },
  },

  // ── Attendance ──
  "/api/v1/events/{eventId}/attendance": {
    get: {
      tags: ["Attendance"],
      summary: "List attendance records",
      operationId: "listAttendance",
      parameters: [pathParams.eventIdForSub, ...paginationParams],
      responses: {
        "200": {
          description: "Paginated attendance list",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          data: {
                            type: "array",
                            items: {
                              allOf: [
                                { $ref: "#/components/schemas/Attendance" },
                                {
                                  type: "object",
                                  properties: {
                                    registration: {
                                      type: "object",
                                      properties: {
                                        member: { $ref: "#/components/schemas/Member" },
                                      },
                                    },
                                    checkedInBy: {
                                      type: "object",
                                      properties: {
                                        profile: { $ref: "#/components/schemas/Profile" },
                                      },
                                    },
                                  },
                                },
                              ],
                            },
                          },
                          pagination: { $ref: "#/components/schemas/PaginationMeta" },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    },
    post: {
      tags: ["Attendance"],
      summary: "Check in a registration",
      operationId: "checkIn",
      parameters: [pathParams.eventIdForSub],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/AttendanceCheckIn" },
          },
        },
      },
      responses: {
        "201": {
          description: "Check-in recorded",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Attendance" },
                    },
                  },
                ],
              },
            },
          },
        },
        "400": { description: "Registration not found, not registered, or already checked in" },
      },
    },
  },
  "/api/v1/events/{eventId}/attendance/summary": {
    get: {
      tags: ["Attendance"],
      summary: "Get attendance summary for an event",
      operationId: "getAttendanceSummary",
      parameters: [pathParams.eventIdForSub],
      responses: {
        "200": {
          description: "Attendance summary",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/AttendanceSummary" },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/events/{eventId}/attendance/export": {
    get: {
      tags: ["Attendance"],
      summary: "Export attendance report as CSV",
      operationId: "exportAttendance",
      parameters: [pathParams.eventIdForSub],
      responses: {
        "200": {
          description: "CSV file download",
          content: {
            "text/csv": {
              schema: { type: "string", format: "binary" },
            },
          },
        },
      },
    },
  },
  "/api/v1/events/{eventId}/attendance/bulk": {
    post: {
      tags: ["Attendance"],
      summary: "Bulk check-in registrations",
      operationId: "bulkCheckIn",
      parameters: [pathParams.eventIdForSub],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/AttendanceBulkCheckIn" },
          },
        },
      },
      responses: {
        "200": {
          description: "Bulk check-in results",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          checkedIn: { type: "integer", example: 5 },
                          errors: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                registrationId: { type: "string", format: "uuid" },
                                error: { type: "string" },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/attendance/{id}": {
    delete: {
      tags: ["Attendance"],
      summary: "Undo a check-in (admin only)",
      operationId: "undoCheckIn",
      parameters: [pathParams.attendanceId],
      responses: {
        "200": {
          description: "Check-in undone",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          message: { type: "string", example: "Check-in undone" },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        "403": { description: "Admin role required" },
      },
    },
  },

  // ── Payments ──
  "/api/v1/payments/": {
    get: {
      tags: ["Payments"],
      summary: "List payments with pagination",
      operationId: "listPayments",
      parameters: paginationParams,
      responses: {
        "200": {
          description: "Paginated payment list",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          data: {
                            type: "array",
                            items: {
                              allOf: [
                                { $ref: "#/components/schemas/Payment" },
                                {
                                  type: "object",
                                  properties: {
                                    member: { $ref: "#/components/schemas/Member" },
                                    event: { $ref: "#/components/schemas/Event" },
                                  },
                                },
                              ],
                            },
                          },
                          pagination: { $ref: "#/components/schemas/PaginationMeta" },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    },
    post: {
      tags: ["Payments"],
      summary: "Record a new payment",
      operationId: "createPayment",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/PaymentCreate" },
          },
        },
      },
      responses: {
        "201": {
          description: "Payment recorded",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Payment" },
                    },
                  },
                ],
              },
            },
          },
        },
        "400": { $ref: "#/components/responses/ValidationError" },
      },
    },
  },
  "/api/v1/payments/summary": {
    get: {
      tags: ["Payments"],
      summary: "Get payment summary",
      operationId: "getPaymentSummary",
      parameters: [
        {
          name: "eventId",
          in: "query",
          schema: { type: "string", format: "uuid" },
          description: "Filter by event ID",
        },
      ],
      responses: {
        "200": {
          description: "Payment summary",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/PaymentSummary" },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/payments/export": {
    get: {
      tags: ["Payments"],
      summary: "Export payments as CSV",
      operationId: "exportPayments",
      parameters: [
        {
          name: "eventId",
          in: "query",
          schema: { type: "string", format: "uuid" },
          description: "Filter by event ID",
        },
      ],
      responses: {
        "200": {
          description: "CSV file download",
          content: {
            "text/csv": {
              schema: { type: "string", format: "binary" },
            },
          },
        },
      },
    },
  },
  "/api/v1/payments/{id}": {
    patch: {
      tags: ["Payments"],
      summary: "Update a payment (admin only)",
      operationId: "updatePayment",
      parameters: [pathParams.paymentId],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/PaymentUpdate" },
          },
        },
      },
      responses: {
        "200": {
          description: "Payment updated",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Payment" },
                    },
                  },
                ],
              },
            },
          },
        },
        "403": { description: "Admin role required" },
      },
    },
  },
  "/api/v1/payments/{id}/status": {
    patch: {
      tags: ["Payments"],
      summary: "Update payment status (admin only)",
      operationId: "updatePaymentStatus",
      parameters: [pathParams.paymentId],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/PaymentStatusUpdate" },
          },
        },
      },
      responses: {
        "200": {
          description: "Payment status updated",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Payment" },
                    },
                  },
                ],
              },
            },
          },
        },
        "403": { description: "Admin role required" },
      },
    },
  },

  // ── Announcements ──
  "/api/v1/announcements/": {
    get: {
      tags: ["Announcements"],
      summary: "List announcements with pagination",
      operationId: "listAnnouncements",
      parameters: paginationParams,
      responses: {
        "200": {
          description: "Paginated announcement list",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          data: {
                            type: "array",
                            items: {
                              allOf: [
                                { $ref: "#/components/schemas/Announcement" },
                                {
                                  type: "object",
                                  properties: {
                                    event: { $ref: "#/components/schemas/Event" },
                                    createdBy: {
                                      type: "object",
                                      properties: {
                                        profile: { $ref: "#/components/schemas/Profile" },
                                      },
                                    },
                                  },
                                },
                              ],
                            },
                          },
                          pagination: { $ref: "#/components/schemas/PaginationMeta" },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    },
    post: {
      tags: ["Announcements"],
      summary: "Create a new announcement",
      operationId: "createAnnouncement",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/AnnouncementCreate" },
          },
        },
      },
      responses: {
        "201": {
          description: "Announcement created",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Announcement" },
                    },
                  },
                ],
              },
            },
          },
        },
        "400": { $ref: "#/components/responses/ValidationError" },
      },
    },
  },
  "/api/v1/announcements/{id}": {
    get: {
      tags: ["Announcements"],
      summary: "Get announcement by ID",
      operationId: "getAnnouncement",
      parameters: [pathParams.announcementId],
      responses: {
        "200": {
          description: "Announcement details",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        allOf: [
                          { $ref: "#/components/schemas/Announcement" },
                          {
                            type: "object",
                            properties: {
                              event: { $ref: "#/components/schemas/Event" },
                              createdBy: {
                                type: "object",
                                properties: {
                                  profile: { $ref: "#/components/schemas/Profile" },
                                },
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        "404": { description: "Announcement not found" },
      },
    },
    put: {
      tags: ["Announcements"],
      summary: "Update an announcement",
      operationId: "updateAnnouncement",
      parameters: [pathParams.announcementId],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/AnnouncementUpdate" },
          },
        },
      },
      responses: {
        "200": {
          description: "Announcement updated",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Announcement" },
                    },
                  },
                ],
              },
            },
          },
        },
        "400": { $ref: "#/components/responses/ValidationError" },
        "404": { description: "Announcement not found" },
      },
    },
  },
  "/api/v1/announcements/{id}/status": {
    patch: {
      tags: ["Announcements"],
      summary: "Update announcement status",
      operationId: "updateAnnouncementStatus",
      parameters: [pathParams.announcementId],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/AnnouncementStatusUpdate" },
          },
        },
      },
      responses: {
        "200": {
          description: "Announcement status updated",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Announcement" },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    },
  },

  // ── Reports ──
  "/api/v1/reports/members": {
    get: {
      tags: ["Reports"],
      summary: "Get member statistics report",
      operationId: "getMemberReport",
      responses: {
        "200": {
          description: "Member report",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/MemberReport" },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/reports/members/export": {
    get: {
      tags: ["Reports"],
      summary: "Export member report as CSV",
      operationId: "exportMemberReport",
      responses: {
        "200": {
          description: "CSV file download",
          content: {
            "text/csv": {
              schema: { type: "string", format: "binary" },
            },
          },
        },
      },
    },
  },
  "/api/v1/reports/events": {
    get: {
      tags: ["Reports"],
      summary: "Get event statistics report",
      operationId: "getEventReport",
      parameters: dateRangeParams,
      responses: {
        "200": {
          description: "Event report",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/EventReport" },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/reports/events/export": {
    get: {
      tags: ["Reports"],
      summary: "Export event report as CSV",
      operationId: "exportEventReport",
      responses: {
        "200": {
          description: "CSV file download",
          content: {
            "text/csv": {
              schema: { type: "string", format: "binary" },
            },
          },
        },
      },
    },
  },
  "/api/v1/reports/payments": {
    get: {
      tags: ["Reports"],
      summary: "Get payment statistics report (admin only)",
      operationId: "getPaymentReport",
      parameters: dateRangeParams,
      responses: {
        "200": {
          description: "Payment report",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/PaymentReport" },
                    },
                  },
                ],
              },
            },
          },
        },
        "403": { description: "Admin role required" },
      },
    },
  },
  "/api/v1/reports/payments/export": {
    get: {
      tags: ["Reports"],
      summary: "Export payment report as CSV (admin only)",
      operationId: "exportPaymentReport",
      responses: {
        "200": {
          description: "CSV file download",
          content: {
            "text/csv": {
              schema: { type: "string", format: "binary" },
            },
          },
        },
        "403": { description: "Admin role required" },
      },
    },
  },
};

// ──────────────────────────────────────────────
// Full OpenAPI 3.0.3 Spec
// ──────────────────────────────────────────────
export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "PWE Event Management API",
    description:
      "Multi-tenant event management system for organizations. " +
      "Handles member management, event creation, registration, attendance tracking, " +
      "payments, and announcements. " +
      "All authenticated endpoints require a Bearer JWT token. " +
      "Tenant isolation is enforced via the JWT or the `x-org-id` header.",
    version: "1.0.0",
    contact: {
      name: "PWE Development Team",
    },
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development server",
    },
  ],
  tags,
  paths,
  components: {
    securitySchemes,
    schemas,
    responses: {
      ValidationError: {
        description: "Validation error",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      Unauthorized: {
        description: "Missing or invalid authentication",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      Forbidden: {
        description: "Insufficient permissions",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      NotFound: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
    },
  },
  security: [{ BearerAuth: [] }],
};
