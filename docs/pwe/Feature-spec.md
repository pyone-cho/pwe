# Feature Specifications

> Detailed feature specifications for PWE MVP. Each feature includes user stories, acceptance criteria, API endpoints, and UI descriptions.

---

## Feature 1: Organization Workspace

> Each organization gets its own private workspace. Foundation for all multi-tenant functionality.

### Priority: Critical | Effort: 16h (Week 1)

### User Stories

**US-1.1: Organization Registration**
> As an **admin**, I want to **register my organization** so that **my team has a private workspace**.

**Acceptance Criteria:**
- [ ] Registration form collects: org name, slug, admin email, password, admin name
- [ ] Slug is validated (lowercase alphanumeric + hyphens, unique)
- [ ] On success: creates org + admin user + profile in one transaction
- [ ] Redirects to dashboard after signup
- [ ] Error shown if slug already exists

**US-1.2: Organization Settings**
> As an **admin**, I want to **manage my organization's settings** so that **my workspace reflects our identity**.

**Acceptance Criteria:**
- [ ] Admin can update: name, description, logo, contact info
- [ ] Admin can set: timezone, locale, default event settings
- [ ] Changes save immediately with success toast
- [ ] Logo upload compresses and resizes image

**US-1.3: Multi-Tenant Data Isolation**
> As a **user**, I want to be **confident that my organization's data is completely separated** from other organizations.

**Acceptance Criteria:**
- [ ] All API queries automatically filtered by org_id
- [ ] JWT contains orgId claim
- [ ] Prisma middleware enforces org_id on every tenant-scoped query
- [ ] A user from Org A cannot access Org B data even with crafted requests
- [ ] RLS policies provide database-level safety net

### API Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/v1/auth/signup | Public | Create org + admin |
| GET | /api/v1/org | admin, staff | Get org details |
| PUT | /api/v1/org | admin | Update org settings |

### UI Screens
- **Registration Page**: Single-page form with org name, slug (auto-generated from name), email, password, name fields. Mobile-first layout.
- **Settings Page**: Sidebar section under Org settings. Form with fields, logo upload with preview, save button.

---

## Feature 2: Member Management

> Admins and staff can create, update, search, filter, import, and export member records.

### Priority: High | Effort: 22h (Week 1-2)

### User Stories

**US-2.1: Create Member**
> As a **staff member**, I want to **add a new member** so that **our member database stays up to date**.

**Acceptance Criteria:**
- [ ] Form collects: first name, last name, phone (required), email, membership type, emergency contact, notes
- [ ] Phone number validated for Myanmar format (+95 9...)
- [ ] Duplicate phone number shows warning (not blocking)
- [ ] On success: member created, shown in list, success toast
- [ ] Optional: link to existing user account for self-service access

**US-2.2: Search and Filter Members**
> As a **staff member**, I want to **quickly find a member** so that **I can assist them or update their record**.

**Acceptance Criteria:**
- [ ] Search bar filters by name, email, phone (real-time or debounced)
- [ ] Filter chips for: status (active/inactive/suspended), membership type
- [ ] Results show: name, phone, status, join date
- [ ] Empty state shows "No members found" with illustration
- [ ] Pagination: 20 per page, page numbers + prev/next

**US-2.3: Import Members from CSV**
> As an **admin**, I want to **bulk import members from a CSV file** so that **I don't have to enter them one by one**.

**Acceptance Criteria:**
- [ ] Upload accepts .csv and .xlsx files
- [ ] Preview step shows first 10 rows with column mapping
- [ ] Required fields: first_name, phone. Optional: last_name, email, membership_type
- [ ] Validation report shows errors per row before import
- [ ] On import: success count, skip count, error details shown
- [ ] Max 500 rows per import

**US-2.4: Export Members**
> As an **admin**, I want to **export our member list** so that **I can share it with team leads or use it offline**.

**Acceptance Criteria:**
- [ ] Export as CSV or Excel
- [ ] Respects current filters (export filtered subset)
- [ ] Includes all member fields
- [ ] Download starts immediately for small lists (<1000)
- [ ] Large exports queued and download link shown

### API Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/members | admin, staff | List with search/filter/pagination |
| GET | /api/v1/members/:id | admin, staff | Get member detail |
| POST | /api/v1/members | admin, staff | Create member |
| PUT | /api/v1/members/:id | admin, staff | Update member |
| PATCH | /api/v1/members/:id/status | admin | Toggle status |
| POST | /api/v1/members/import | admin | Bulk import CSV |
| GET | /api/v1/members/export | admin, staff | Export as CSV/Excel |

### UI Screens
- **Member List Page**: Table with avatar placeholder, name, phone, status badge, join date. Top bar has search + filter dropdown + "Add Member" button + "Import" button.
- **Member Detail Page**: Profile card with all fields, edit button, status toggle, event history tab.
- **Import Modal**: File upload area, column mapping table, validation results, import button with progress.
- **Create/Edit Member Form**: Modal or drawer with form fields, validation, save/cancel.

---

## Feature 3: Event Management

> Staff can create events with dates, location, capacity, registration settings, and custom fields.

### Priority: High | Effort: 24h (Week 2)

### User Stories

**US-3.1: Create Event**
> As a **staff member**, I want to **create an event** so that **members and guests can see and register for it**.

**Acceptance Criteria:**
- [ ] Multi-step wizard: (1) Basic info, (2) Registration settings, (3) Custom fields, (4) Review & publish
- [ ] Basic info: title, description, location, start/end date, capacity (optional)
- [ ] Registration: mode (public/member/both), requires payment, payment amount
- [ ] Custom fields: add dynamic fields (text, select, checkbox) for registration form
- [ ] Can save as draft or publish immediately
- [ ] Date validation: start must be before end, cannot be in the past

**US-3.2: Manage Event Lifecycle**
> As a **staff member**, I want to **publish, cancel, or complete events** so that **the event status reflects reality**.

**Acceptance Criteria:**
- [ ] Status transitions: draft → published → completed, draft → published → cancelled
- [ ] Published events visible on public page
- [ ] Cancelled events show "Cancelled" badge, registration disabled
- [ ] Completed events move to past events tab
- [ ] Status change confirms with dialog for destructive actions (cancel)

**US-3.3: View Event Details**
> As a **staff member**, I want to **see a summary of an event** including registrations, attendance, and payments.

**Acceptance Criteria:**
- [ ] Event detail page shows: info, registration stats, attendance rate, payment summary
- [ ] Tabs: Overview, Registrations, Attendance, Payments, Announcements
- [ ] Quick actions: Edit, Publish, Cancel, Export attendance
- [ ] Mobile responsive layout

### API Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/events | admin, staff | List org events |
| GET | /api/v1/events/:id | admin, staff | Event detail |
| POST | /api/v1/events | admin, staff | Create event |
| PUT | /api/v1/events/:id | admin, staff | Update event |
| PATCH | /api/v1/events/:id/status | admin, staff | Change status |
| GET | /api/v1/events/public | Public | Public event listing |
| GET | /api/v1/events/public/:id | Public | Public event detail |

### UI Screens
- **Event List Page**: Cards or table view. Tabs: Upcoming, Past, Drafts. Each card shows title, date, location, registration count vs capacity, status badge.
- **Event Creation Wizard**: 4-step form with progress indicator. Step 1: Basic info (title, desc, location, dates). Step 2: Registration settings (mode, payment). Step 3: Custom fields (drag to reorder). Step 4: Review all, save draft or publish.
- **Event Detail Page**: Hero section with title/date/location. Stats row (registrations, attendance, revenue). Tabbed content area.
- **Public Event Page**: Clean, mobile-optimized page with event info and registration form.

---

## Feature 4: Registration Forms

> Members and guests can register for events through simple mobile-friendly forms.

### Priority: High | Effort: 18h (Week 2)

### User Stories

**US-4.1: Member Registration**
> As a **member**, I want to **register for an event with one click** so that **I can join quickly**.

**Acceptance Criteria:**
- [ ] "Register" button on event page for logged-in members
- [ ] Pre-fills member info (name, phone, email)
- [ ] Only shows custom fields that need response
- [ ] Immediate confirmation with "You're registered!" message
- [ ] Prevents duplicate registration (shows "Already registered")

**US-4.2: Guest Registration**
> As a **guest**, I want to **register for a public event without creating an account** so that **I can participate easily**.

**Acceptance Criteria:**
- [ ] Public registration form collects: name, email, phone, custom fields
- [ ] No account creation required
- [ ] Email confirmation shown after registration
- [ ] Guest can cancel registration via link in confirmation
- [ ] If event is member-only, shows "Members only — please log in"

**US-4.3: Registration Capacity Management**
> As a **staff member**, I want the system to **handle capacity limits** so that **events don't exceed their space**.

**Acceptance Criteria:**
- [ ] When capacity reached, new registrations go to waitlist
- [ ] Waitlist position shown to registrant
- [ ] Staff can promote from waitlist when spots open
- [ ] Cancelled registrations free up spots for waitlisted people

### API Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/v1/events/:eventId/register | Public/Auth | Register for event |
| GET | /api/v1/events/:eventId/registrations | admin, staff | List registrations |
| PATCH | /api/v1/registrations/:id/cancel | Auth | Cancel registration |

### UI Screens
- **Registration Form**: Mobile-first card layout. Member: pre-filled form with confirm button. Guest: blank form with name/email/phone + custom fields + submit.
- **Registration Confirmation**: Success screen with event details, "Add to Calendar" button, cancel link.
- **Registration Management (Staff)**: Table with registrant name, type (member/guest), status, registration date. Actions: view, cancel, promote from waitlist.

---

## Feature 5: Attendance Tracking

> Event staff can check participants in during an event. MVP uses basic attendance list.

### Priority: High | Effort: 20h (Week 2)

### User Stories

**US-5.1: Check-In Members**
> As an **event staff member**, I want to **mark attendees as present** so that **we have an accurate attendance record**.

**Acceptance Criteria:**
- [ ] Attendance list shows all registered participants
- [ ] Toggle check-in with single tap/click
- [ ] Shows check-in time and who checked them in
- [ ] Real-time count: "18 / 30 checked in"
- [ ] Works offline with sync when reconnected (nice-to-have)

**US-5.2: View Attendance Summary**
> As a **staff member**, I want to **see a real-time attendance overview** so that **I know how many people showed up**.

**Acceptance Criteria:**
- [ ] Dashboard shows: total registered, checked in, absent, late
- [ ] Attendance rate percentage
- [ ] List of who hasn't checked in (for follow-up)
- [ ] Export attendance as CSV/Excel

**US-5.3: QR Code Check-In (Future Enhancement)**
> As a **member**, I want to **scan a QR code to check in** so that **the process is faster and touchless**.

**Acceptance Criteria (Future):**
- [ ] Staff generates QR code per event
- [ ] Member scans QR → auto check-in
- [ ] Fallback to manual if QR fails

### API Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/events/:eventId/attendance | admin, staff | List attendance |
| POST | /api/v1/events/:eventId/attendance | admin, staff | Check in single |
| POST | /api/v1/events/:eventId/attendance/bulk | admin, staff | Bulk check-in |
| DELETE | /api/v1/attendance/:id | admin | Undo check-in |
| GET | /api/v1/reports/attendance/:eventId | admin, staff | Attendance report |

### UI Screens
- **Attendance List (Staff Mobile)**: Simple list with name, checkbox, check-in time. Top counter: "18 / 30". Search bar to find specific person. Bulk select option.
- **Attendance Dashboard (Admin)**: Overview cards (registered, present, absent). Bar chart of attendance rate. Export button.
- **QR Code Screen (Future)**: Full-screen QR code display for members to scan.

---

## Feature 6: Payment Tracking

> Admins can record manual payments, mark participants as paid or pending. MVP focuses on manual tracking.

### Priority: Medium | Effort: 16h (Week 2)

### User Stories

**US-6.1: Record Payment**
> As an **admin**, I want to **log a payment** so that **we track who has paid for events**.

**Acceptance Criteria:**
- [ ] Form: select member, event, amount, payment method, reference number, date, notes
- [ ] Payment methods: cash, bank transfer, mobile money, other
- [ ] Amount in MMK (Myanmar Kyat)
- [ ] Optional: upload receipt image
- [ ] Creates payment record linked to member + event

**US-6.2: Track Payment Status**
> As an **admin**, I want to **see payment status at a glance** so that **I can follow up on pending payments**.

**Acceptance Criteria:**
- [ ] Event payments tab shows: paid, pending, refunded counts
- [ ] Filter by status, member, payment method
- [ ] Summary: total expected, total collected, total pending
- [ ] Export payment report as CSV

**US-6.3: Update Payment Status**
> As an **admin**, I want to **mark a payment as paid or refunded** so that **our records stay accurate**.

**Acceptance Criteria:**
- [ ] Toggle status: pending → paid, paid → refunded
- [ ] Status change logs timestamp and who changed it
- [ ] Refunded payments shown with distinct badge

### API Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/payments | admin, staff | List payments |
| POST | /api/v1/payments | admin, staff | Record payment |
| PATCH | /api/v1/payments/:id | admin | Update payment |
| GET | /api/v1/payments/summary | admin, staff | Payment summary |

### UI Screens
- **Payment List**: Table with member name, event, amount, method, status badge, date. Filter bar with status and method dropdowns.
- **Record Payment Modal**: Form with member search, event selector, amount input (MMK), method dropdown, reference number, notes, save button.
- **Payment Summary Card**: At top of event detail page. Three stat cards: Total Expected, Collected, Pending. Mini bar chart by method.

---

## Feature 7: Announcements & Reports

> Admins can send announcements and generate basic reports. MVP covers essentials; advanced analytics are roadmap items.

### Priority: Medium | Effort: 20h (Week 2)

### User Stories

**US-7.1: Create Announcement**
> As an **admin**, I want to **publish an announcement** so that **all members are informed about important updates**.

**Acceptance Criteria:**
- [ ] Form: title, content (rich text or markdown), priority (low/normal/high/urgent)
- [ ] Optional: link to specific event
- [ ] Can save as draft or publish immediately
- [ ] Published announcements appear on member dashboard
- [ ] Urgent announcements highlighted with red badge

**US-7.2: View Announcements**
> As a **member**, I want to **see announcements** so that **I stay informed about my organization**.

**Acceptance Criteria:**
- [ ] Announcements tab on member dashboard
- [ ] Sorted by: priority then date (urgent first)
- [ ] Unread/read status tracking
- [ ] Can expand to read full content

**US-7.3: Generate Member Report**
> As an **admin**, I want to **see a member summary report** so that **I understand our membership health**.

**Acceptance Criteria:**
- [ ] Total members, active/inactive/suspended breakdown
- [ ] New members over time (monthly chart)
- [ ] Membership type distribution
- [ ] Export as PDF or CSV

**US-7.4: Generate Event Report**
> As an **admin**, I want to **see event performance** so that **I can plan better future events**.

**Acceptance Criteria:**
- [ ] Per-event: registrations, attendance rate, revenue
- [ ] Aggregate: total events, average attendance, total revenue
- [ ] Date range filter
- [ ] Export as PDF or CSV

### API Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/announcements | admin, staff, member | List announcements |
| POST | /api/v1/announcements | admin, staff | Create announcement |
| PUT | /api/v1/announcements/:id | admin, staff | Update announcement |
| PATCH | /api/v1/announcements/:id/status | admin, staff | Publish/archive |
| GET | /api/v1/reports/members | admin, staff | Member report |
| GET | /api/v1/reports/events | admin, staff | Event report |
| GET | /api/v1/reports/payments | admin | Payment report |

### UI Screens
- **Announcements Feed**: List with priority badges, date, title. Expandable cards. "New Announcement" button for admin.
- **Create Announcement Modal**: Title, content textarea, priority selector, event link (optional), draft/publish toggle.
- **Reports Dashboard**: Tabbed view — Members, Events, Payments. Each tab has stat cards, charts (using lightweight chart lib like Recharts), and export button.

---

## Feature Cross-Reference

| Feature | Depends On | Provides To |
|---------|-----------|-------------|
| 1. Organization Workspace | — | All features (tenant context) |
| 2. Member Management | 1. Organization | 4. Registration, 6. Payment |
| 3. Event Management | 1. Organization | 4. Registration, 5. Attendance, 6. Payment |
| 4. Registration Forms | 2. Member, 3. Event | 5. Attendance, 6. Payment |
| 5. Attendance Tracking | 4. Registration | 7. Reports |
| 6. Payment Tracking | 2. Member, 3. Event | 7. Reports |
| 7. Announcements & Reports | 2, 3, 4, 5, 6 | — |

---

## MVP Scope Summary

| Feature | MVP Status | Hours |
|---------|-----------|-------|
| Organization Workspace | Must-have | 16h |
| Member Management | Must-have | 22h |
| Event Management | Must-have | 24h |
| Registration Forms | Must-have | 18h |
| Attendance Tracking | Must-have (list only) | 20h |
| Payment Tracking | Must-have (manual only) | 16h |
| Announcements & Reports | Must-have (basic) | 20h |
| **Total** | | **136h** |

## Future Enhancements (Post-MVP)

- [ ] QR code attendance check-in
- [ ] Automated payment gateway integration (KBZ Pay, Wave Money)
- [ ] Email/SMS notification system
- [ ] Advanced analytics dashboard
- [ ] Multi-language (Burmese + English)
- [ ] Offline-first mobile PWA
- [ ] Parent/guardian registration for youth members
- [ ] Equipment/inventory management
- [ ] Custom branding per organization
- [ ] API for third-party integrations
