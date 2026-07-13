export interface JwtPayload {
  userId: string;
  orgId: string;
  role: string;
  email: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export type UserRole = "admin" | "staff" | "member" | "guest";
export type MemberStatus = "active" | "inactive" | "suspended";
export type EventStatus = "draft" | "published" | "cancelled" | "completed";
export type RegistrationStatus = "registered" | "cancelled" | "waitlisted";
export type PaymentStatus = "paid" | "pending" | "refunded";
export type AnnouncementStatus = "draft" | "published" | "archived";
export type Priority = "low" | "normal" | "high" | "urgent";
