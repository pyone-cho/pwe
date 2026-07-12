// ── Auth & Users ──

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'staff' | 'member';
  orgId: string;
  profile: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  organization: Organization;
  accessToken: string;
  refreshToken: string;
}

// ── Organization ──

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  phone?: string;
  logo?: string;
  settings: OrgSettings;
  memberCount?: number;
  activeEvents?: number;
  createdAt: string;
}

export interface OrgSettings {
  timezone?: string;
  locale?: string;
  defaultEventSettings?: Record<string, unknown>;
}

// ── Members ──

export type MembershipStatus = 'active' | 'inactive' | 'suspended';
export type MembershipType = 'regular' | 'student' | 'honorary' | 'lifetime';

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  membershipStatus: MembershipStatus;
  membershipType?: MembershipType;
  emergencyContact?: string;
  notes?: string;
  joinDate: string;
  userId?: string;
  createdAt: string;
}

export interface MemberListResponse {
  data: Member[];
  meta: PaginationMeta;
}

// ── Events ──

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';
export type RegistrationMode = 'public' | 'member' | 'both';

export interface CustomField {
  name: string;
  type: 'text' | 'select' | 'checkbox';
  options?: string[];
  required?: boolean;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
  registrationMode: RegistrationMode;
  capacity?: number;
  registeredCount: number;
  requiresPayment: boolean;
  paymentAmount?: number;
  customFields: CustomField[];
  registrationStats?: RegistrationStats;
  createdAt: string;
}

export interface EventListResponse {
  data: Event[];
  meta: PaginationMeta;
}

export interface RegistrationStats {
  registered: number;
  waitlisted: number;
  cancelled: number;
}

// ── Registrations ──

export type RegistrationStatus = 'registered' | 'cancelled' | 'waitlisted';
export type RegistrantType = 'member' | 'guest';

export interface Registration {
  id: string;
  eventId: string;
  memberId?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  status: RegistrationStatus;
  type: RegistrantType;
  formData?: Record<string, unknown>;
  registeredAt: string;
  member?: Member;
}

export interface RegistrationListResponse {
  data: Registration[];
  meta: PaginationMeta;
}

// ── Attendance ──

export type AttendanceMethod = 'manual' | 'qr';

export interface AttendanceRecord {
  id: string;
  registrationId: string;
  memberName: string;
  checkedInAt: string;
  checkedInBy: string;
  method: AttendanceMethod;
}

export interface AttendanceStats {
  total: number;
  checkedIn: number;
  absent: number;
}

export interface AttendanceResponse {
  data: AttendanceRecord[];
  stats: AttendanceStats;
}

// ── Payments ──

export type PaymentStatus = 'pending' | 'paid' | 'refunded';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'mobile_money' | 'other';

export interface Payment {
  id: string;
  memberId: string;
  memberName: string;
  eventId: string;
  eventTitle: string;
  registrationId?: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  status: PaymentStatus;
  paidAt: string;
  createdAt: string;
}

export interface PaymentListResponse {
  data: Payment[];
  meta: PaginationMeta;
}

export interface PaymentSummary {
  totalExpected: number;
  totalCollected: number;
  totalPending: number;
  byMethod: Record<PaymentMethod, number>;
}

// ── Announcements ──

export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent';
export type AnnouncementStatus = 'draft' | 'published' | 'archived';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  eventId?: string;
  eventTitle?: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementListResponse {
  data: Announcement[];
  meta: PaginationMeta;
}

// ── Reports ──

export interface MemberReport {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  byType: { type: string; count: number }[];
  monthly: { month: string; count: number }[];
}

export interface EventReport {
  total: number;
  byStatus: { status: string; count: number }[];
  totalRevenue: number;
  avgAttendance: number;
  events: {
    id: string;
    title: string;
    startDate: string;
    status: string;
    registrations: number;
    attendance: number;
    attendanceRate: number;
    revenue: number;
  }[];
}

// ── Common ──

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface MemberFilters extends PaginationParams {
  search?: string;
  status?: MembershipStatus;
  type?: MembershipType;
}

export interface EventFilters extends PaginationParams {
  status?: EventStatus;
  from?: string;
  to?: string;
}

export interface PaymentFilters extends PaginationParams {
  memberId?: string;
  eventId?: string;
  status?: PaymentStatus;
}

export interface AnnouncementFilters extends PaginationParams {
  status?: AnnouncementStatus;
}
