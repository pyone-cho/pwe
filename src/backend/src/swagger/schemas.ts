// OpenAPI Schema Definitions
// Reusable schemas for request/response bodies

export const schemas = {
  // ──────────────────────────────────────────────
  // Common
  // ──────────────────────────────────────────────
  ApiResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      data: { description: "Response data (varies by endpoint)" },
      message: { type: "string" },
      error: { type: "string" },
    },
  },
  ErrorResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Resource not found" },
      details: {
        type: "array",
        items: {
          type: "object",
          properties: {
            field: { type: "string" },
            message: { type: "string" },
          },
        },
      },
    },
  },
  PaginationQuery: {
    type: "object",
    properties: {
      page: { type: "integer", default: 1, minimum: 1 },
      limit: { type: "integer", default: 20, minimum: 1, maximum: 100 },
      search: { type: "string", description: "Search term" },
      sortBy: { type: "string", description: "Field to sort by" },
      sortOrder: { type: "string", enum: ["asc", "desc"], default: "asc" },
    },
  },
  PaginationMeta: {
    type: "object",
    properties: {
      page: { type: "integer", example: 1 },
      limit: { type: "integer", example: 20 },
      total: { type: "integer", example: 100 },
      totalPages: { type: "integer", example: 5 },
    },
  },

  // ──────────────────────────────────────────────
  // Organization
  // ──────────────────────────────────────────────
  Organization: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string", example: "EventHub Myanmar" },
      slug: { type: "string", example: "eventhub-myanmar" },
      description: { type: "string", nullable: true },
      logoUrl: { type: "string", nullable: true },
      phone: { type: "string", nullable: true },
      email: { type: "string", format: "email", nullable: true },
      address: { type: "string", nullable: true },
      settings: { type: "object" },
      status: { type: "string", enum: ["active", "inactive"] },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  OrgUpdate: {
    type: "object",
    properties: {
      name: { type: "string", minLength: 2, maxLength: 255 },
      description: { type: "string" },
      logoUrl: { type: "string" },
      phone: { type: "string" },
      email: { type: "string", format: "email" },
      address: { type: "string" },
      settings: { type: "object" },
    },
  },
  OrgStats: {
    type: "object",
    properties: {
      totalMembers: { type: "integer", example: 150 },
      activeMembers: { type: "integer", example: 120 },
      totalEvents: { type: "integer", example: 25 },
      upcomingEvents: { type: "integer", example: 5 },
      totalPayments: { type: "integer", example: 500 },
    },
  },

  // ──────────────────────────────────────────────
  // Auth
  // ──────────────────────────────────────────────
  SignupRequest: {
    type: "object",
    required: ["orgName", "slug", "email", "password", "firstName"],
    properties: {
      orgName: { type: "string", minLength: 2, maxLength: 255, example: "EventHub Myanmar" },
      slug: { type: "string", minLength: 2, maxLength: 100, pattern: "^[a-z0-9-]+$", example: "eventhub-myanmar" },
      email: { type: "string", format: "email", example: "admin@eventhub.com" },
      password: { type: "string", minLength: 8, example: "securePassword123" },
      firstName: { type: "string", minLength: 1, maxLength: 100, example: "John" },
      lastName: { type: "string", maxLength: 100, example: "Doe" },
    },
  },
  LoginRequest: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email", example: "admin@eventhub.com" },
      password: { type: "string", minLength: 1, example: "securePassword123" },
    },
  },
  RefreshTokenRequest: {
    type: "object",
    required: ["refreshToken"],
    properties: {
      refreshToken: { type: "string", example: "abc123..." },
    },
  },
  TokenResponse: {
    type: "object",
    properties: {
      accessToken: { type: "string" },
      refreshToken: { type: "string" },
      user: { $ref: "#/components/schemas/UserProfile" },
    },
  },
  UserProfile: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      email: { type: "string", format: "email" },
      role: { type: "string", enum: ["admin", "staff", "member", "guest"] },
      orgId: { type: "string", format: "uuid" },
      profile: { $ref: "#/components/schemas/Profile" },
    },
  },

  // ──────────────────────────────────────────────
  // User & Profile
  // ──────────────────────────────────────────────
  User: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      orgId: { type: "string", format: "uuid" },
      email: { type: "string", format: "email" },
      role: { type: "string", enum: ["admin", "staff", "member", "guest"] },
      phone: { type: "string", nullable: true },
      isActive: { type: "boolean" },
      lastLoginAt: { type: "string", format: "date-time", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  Profile: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      userId: { type: "string", format: "uuid" },
      firstName: { type: "string", example: "John" },
      lastName: { type: "string", nullable: true, example: "Doe" },
      avatarUrl: { type: "string", nullable: true },
      dateOfBirth: { type: "string", format: "date", nullable: true },
      gender: { type: "string", enum: ["male", "female", "other", "prefer_not_to_say"], nullable: true },
      address: { type: "string", nullable: true },
      notes: { type: "string", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },

  // ──────────────────────────────────────────────
  // Member
  // ──────────────────────────────────────────────
  Member: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      orgId: { type: "string", format: "uuid" },
      userId: { type: "string", format: "uuid", nullable: true },
      firstName: { type: "string", example: "Aung" },
      lastName: { type: "string", nullable: true, example: "Myo" },
      email: { type: "string", format: "email", nullable: true },
      phone: { type: "string", example: "+95912345678" },
      membershipStatus: { type: "string", enum: ["active", "inactive", "suspended"] },
      membershipType: { type: "string", enum: ["regular", "premium", "honorary"], nullable: true },
      joinDate: { type: "string", format: "date" },
      emergencyContact: { type: "string", nullable: true },
      notes: { type: "string", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  MemberCreate: {
    type: "object",
    required: ["firstName", "phone"],
    properties: {
      firstName: { type: "string", minLength: 1, maxLength: 100, example: "Aung" },
      lastName: { type: "string", maxLength: 100, example: "Myo" },
      phone: { type: "string", minLength: 1, maxLength: 20, example: "+95912345678" },
      email: { type: "string", format: "email", example: "aung@example.com" },
      membershipType: { type: "string", enum: ["regular", "premium", "honorary"] },
      emergencyContact: { type: "string" },
      notes: { type: "string" },
    },
  },
  MemberUpdate: {
    type: "object",
    properties: {
      firstName: { type: "string", minLength: 1, maxLength: 100 },
      lastName: { type: "string", maxLength: 100 },
      phone: { type: "string", minLength: 1, maxLength: 20 },
      email: { type: "string", format: "email" },
      membershipType: { type: "string", enum: ["regular", "premium", "honorary"] },
      membershipStatus: { type: "string", enum: ["active", "inactive", "suspended"] },
      emergencyContact: { type: "string" },
      notes: { type: "string" },
    },
  },
  MemberStatusUpdate: {
    type: "object",
    required: ["status"],
    properties: {
      status: { type: "string", enum: ["active", "inactive", "suspended"] },
    },
  },
  MemberImport: {
    type: "object",
    required: ["records"],
    properties: {
      records: {
        type: "array",
        items: { $ref: "#/components/schemas/MemberCreate" },
      },
    },
  },

  // ──────────────────────────────────────────────
  // Event
  // ──────────────────────────────────────────────
  Event: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      orgId: { type: "string", format: "uuid" },
      title: { type: "string", example: "Annual General Meeting" },
      description: { type: "string", nullable: true },
      location: { type: "string", nullable: true, example: "Yangon Conference Hall" },
      startDate: { type: "string", format: "date-time" },
      endDate: { type: "string", format: "date-time", nullable: true },
      capacity: { type: "integer", nullable: true },
      registrationMode: { type: "string", enum: ["public", "member", "both"] },
      status: { type: "string", enum: ["draft", "published", "cancelled", "completed"] },
      requiresPayment: { type: "boolean" },
      paymentAmount: { type: "number", format: "decimal", nullable: true },
      customFields: { type: "array", items: { type: "object" } },
      createdById: { type: "string", format: "uuid", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  EventCreate: {
    type: "object",
    required: ["title", "startDate"],
    properties: {
      title: { type: "string", minLength: 1, maxLength: 255, example: "Annual General Meeting" },
      description: { type: "string", example: "Yearly meeting for all members" },
      location: { type: "string", maxLength: 255, example: "Yangon Conference Hall" },
      startDate: { type: "string", format: "date-time", example: "2026-08-15T09:00:00Z" },
      endDate: { type: "string", format: "date-time", example: "2026-08-15T17:00:00Z" },
      capacity: { type: "integer", minimum: 1, example: 200 },
      registrationMode: { type: "string", enum: ["public", "member", "both"], default: "member" },
      requiresPayment: { type: "boolean", default: false },
      paymentAmount: { type: "number", minimum: 0, example: 5000 },
      customFields: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            type: { type: "string", enum: ["text", "select", "checkbox"] },
            options: { type: "array", items: { type: "string" } },
            required: { type: "boolean" },
          },
        },
      },
    },
  },
  EventUpdate: {
    type: "object",
    properties: {
      title: { type: "string", minLength: 1, maxLength: 255 },
      description: { type: "string" },
      location: { type: "string", maxLength: 255 },
      startDate: { type: "string", format: "date-time" },
      endDate: { type: "string", format: "date-time" },
      capacity: { type: "integer", minimum: 1 },
      registrationMode: { type: "string", enum: ["public", "member", "both"] },
      status: { type: "string", enum: ["draft", "published", "cancelled", "completed"] },
      requiresPayment: { type: "boolean" },
      paymentAmount: { type: "number", minimum: 0 },
      customFields: { type: "array", items: { type: "object" } },
    },
  },
  EventStatusUpdate: {
    type: "object",
    required: ["status"],
    properties: {
      status: { type: "string", enum: ["draft", "published", "cancelled", "completed"] },
    },
  },

  // ──────────────────────────────────────────────
  // Registration
  // ──────────────────────────────────────────────
  Registration: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      eventId: { type: "string", format: "uuid" },
      orgId: { type: "string", format: "uuid" },
      memberId: { type: "string", format: "uuid", nullable: true },
      guestName: { type: "string", nullable: true },
      guestEmail: { type: "string", format: "email", nullable: true },
      guestPhone: { type: "string", nullable: true },
      status: { type: "string", enum: ["registered", "cancelled", "waitlisted"] },
      formData: { type: "object" },
      registeredAt: { type: "string", format: "date-time" },
      cancelledAt: { type: "string", format: "date-time", nullable: true },
    },
  },
  RegistrationCreate: {
    type: "object",
    properties: {
      memberId: { type: "string", format: "uuid", description: "Member ID (for member registrations)" },
      guestName: { type: "string", maxLength: 200, description: "Guest name (for non-member registrations)" },
      guestEmail: { type: "string", format: "email", description: "Guest email" },
      guestPhone: { type: "string", maxLength: 20, description: "Guest phone" },
      formData: { type: "object", description: "Custom form field responses" },
    },
  },

  // ──────────────────────────────────────────────
  // Attendance
  // ──────────────────────────────────────────────
  Attendance: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      eventId: { type: "string", format: "uuid" },
      registrationId: { type: "string", format: "uuid" },
      memberId: { type: "string", format: "uuid", nullable: true },
      orgId: { type: "string", format: "uuid" },
      checkedInAt: { type: "string", format: "date-time" },
      checkedInById: { type: "string", format: "uuid", nullable: true },
      method: { type: "string", enum: ["manual", "qr", "self"] },
      notes: { type: "string", nullable: true },
    },
  },
  AttendanceCheckIn: {
    type: "object",
    required: ["registrationId"],
    properties: {
      registrationId: { type: "string", format: "uuid" },
      notes: { type: "string" },
    },
  },
  AttendanceBulkCheckIn: {
    type: "object",
    required: ["registrationIds"],
    properties: {
      registrationIds: {
        type: "array",
        items: { type: "string", format: "uuid" },
        minItems: 1,
      },
    },
  },
  AttendanceSummary: {
    type: "object",
    properties: {
      totalRegistered: { type: "integer", example: 100 },
      checkedIn: { type: "integer", example: 75 },
      absent: { type: "integer", example: 25 },
      attendanceRate: { type: "number", example: 75.0 },
    },
  },

  // ──────────────────────────────────────────────
  // Payment
  // ──────────────────────────────────────────────
  Payment: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      orgId: { type: "string", format: "uuid" },
      memberId: { type: "string", format: "uuid" },
      eventId: { type: "string", format: "uuid", nullable: true },
      registrationId: { type: "string", format: "uuid", nullable: true },
      amount: { type: "number", format: "decimal", example: 50000 },
      currency: { type: "string", example: "MMK" },
      status: { type: "string", enum: ["paid", "pending", "refunded"] },
      paymentMethod: { type: "string", enum: ["cash", "bank_transfer", "mobile_money", "other"], nullable: true },
      referenceNumber: { type: "string", nullable: true },
      receiptUrl: { type: "string", nullable: true },
      notes: { type: "string", nullable: true },
      recordedById: { type: "string", format: "uuid", nullable: true },
      paidAt: { type: "string", format: "date-time", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  PaymentCreate: {
    type: "object",
    required: ["memberId", "amount"],
    properties: {
      memberId: { type: "string", format: "uuid" },
      eventId: { type: "string", format: "uuid" },
      registrationId: { type: "string", format: "uuid" },
      amount: { type: "number", minimum: 0, example: 50000 },
      currency: { type: "string", maxLength: 3, default: "MMK" },
      paymentMethod: { type: "string", enum: ["cash", "bank_transfer", "mobile_money", "other"] },
      referenceNumber: { type: "string", maxLength: 100 },
      notes: { type: "string" },
      paidAt: { type: "string", format: "date-time" },
    },
  },
  PaymentUpdate: {
    type: "object",
    properties: {
      amount: { type: "number", minimum: 0 },
      currency: { type: "string", maxLength: 3 },
      paymentMethod: { type: "string", enum: ["cash", "bank_transfer", "mobile_money", "other"] },
      referenceNumber: { type: "string", maxLength: 100 },
      notes: { type: "string" },
      paidAt: { type: "string", format: "date-time" },
      receiptUrl: { type: "string" },
    },
  },
  PaymentStatusUpdate: {
    type: "object",
    required: ["status"],
    properties: {
      status: { type: "string", enum: ["paid", "pending", "refunded"] },
    },
  },
  PaymentSummary: {
    type: "object",
    properties: {
      totalAmount: { type: "number", example: 5000000 },
      paidAmount: { type: "number", example: 3000000 },
      pendingAmount: { type: "number", example: 1500000 },
      refundedAmount: { type: "number", example: 500000 },
      currency: { type: "string", example: "MMK" },
    },
  },

  // ──────────────────────────────────────────────
  // Announcement
  // ──────────────────────────────────────────────
  Announcement: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      orgId: { type: "string", format: "uuid" },
      eventId: { type: "string", format: "uuid", nullable: true },
      title: { type: "string", example: "Important Update" },
      content: { type: "string" },
      priority: { type: "string", enum: ["low", "normal", "high", "urgent"] },
      status: { type: "string", enum: ["draft", "published", "archived"] },
      publishedAt: { type: "string", format: "date-time", nullable: true },
      createdById: { type: "string", format: "uuid", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  AnnouncementCreate: {
    type: "object",
    required: ["title", "content"],
    properties: {
      title: { type: "string", minLength: 1, maxLength: 255, example: "Important Update" },
      content: { type: "string", minLength: 1, example: "Meeting postponed to next week." },
      eventId: { type: "string", format: "uuid" },
      priority: { type: "string", enum: ["low", "normal", "high", "urgent"], default: "normal" },
    },
  },
  AnnouncementUpdate: {
    type: "object",
    properties: {
      title: { type: "string", minLength: 1, maxLength: 255 },
      content: { type: "string", minLength: 1 },
      eventId: { type: "string", format: "uuid" },
      priority: { type: "string", enum: ["low", "normal", "high", "urgent"] },
    },
  },
  AnnouncementStatusUpdate: {
    type: "object",
    required: ["status"],
    properties: {
      status: { type: "string", enum: ["draft", "published", "archived"] },
    },
  },

  // ──────────────────────────────────────────────
  // Reports
  // ──────────────────────────────────────────────
  MemberReport: {
    type: "object",
    properties: {
      totalMembers: { type: "integer" },
      activeMembers: { type: "integer" },
      inactiveMembers: { type: "integer" },
      suspendedMembers: { type: "integer" },
      membersByType: {
        type: "object",
        properties: {
          regular: { type: "integer" },
          premium: { type: "integer" },
          honorary: { type: "integer" },
        },
      },
      recentJoins: { type: "integer", description: "Members joined in last 30 days" },
    },
  },
  EventReport: {
    type: "object",
    properties: {
      totalEvents: { type: "integer" },
      publishedEvents: { type: "integer" },
      completedEvents: { type: "integer" },
      cancelledEvents: { type: "integer" },
      totalRegistrations: { type: "integer" },
      averageAttendanceRate: { type: "number" },
    },
  },
  PaymentReport: {
    type: "object",
    properties: {
      totalPayments: { type: "integer" },
      totalAmount: { type: "number" },
      paidAmount: { type: "number" },
      pendingAmount: { type: "number" },
      refundedAmount: { type: "number" },
      paymentsByMethod: {
        type: "object",
        properties: {
          cash: { type: "integer" },
          bank_transfer: { type: "integer" },
          mobile_money: { type: "integer" },
          other: { type: "integer" },
        },
      },
    },
  },
};
