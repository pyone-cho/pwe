# PWE

> Membership management platform for organizations in Myanmar.

PWE helps sports clubs, university societies, community groups, and NGOs manage members, run events, accept payments, deliver announcements, and track attendance — all inside private organization workspaces.

---

## Quick Links

| Document | Description |
|----------|-------------|
| [Feature Spec](Feature-spec.md) | User stories, acceptance criteria, and UI specs for all 7 features |
| [Tech Stack](tech-stack.md) | Technology choices with rationale and alternatives |
| [Architecture](architecture.md) | System design, container layout, multi-tenancy model |
| [API Design](api-design.md) | REST API endpoint reference (40+ endpoints) |
| [Database Schema](database-schema.md) | ER diagram, table definitions, indexes |
| [Deployment](deployment.md) | Docker setup, CI/CD, server provisioning, backups |
| [Security](security.md) | Auth flow, RBAC, tenant isolation, security checklist |
| [Pre-Production](pwe-pre-production.txt) | Original product requirements document |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express + TypeScript |
| Frontend | React + Vite + Tailwind CSS |
| Database | PostgreSQL 16 + Prisma |
| Auth | JWT + bcrypt |
| Container | Docker + Docker Compose |
| CI/CD | GitHub Actions |


See [tech-stack.md](tech-stack.md) for detailed rationale and alternatives.

---

## Features

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| 1 | Organization Workspace | Private multi-tenant workspaces with data isolation | ✅ Implemented |
| 2 | Member Management | CRUD, search, filter, CSV import/export | ✅ Implemented |
| 3 | Event Management | Create events with registration modes and custom fields | ✅ Implemented |
| 4 | Registration Forms | Public and member registration flows | ✅ Implemented |
| 5 | Attendance Tracking | Check-in lists with real-time counters | ✅ Implemented |
| 6 | Payment Tracking | Manual payment recording with status management | ✅ Implemented |
| 7 | Announcements & Reports | Organization announcements and basic analytics | ✅ Implemented |

See [Feature-spec.md](Feature-spec.md) for detailed user stories and acceptance criteria.

### Validation

- **Event Dates**: End date/time must be after start date/time (validated on both frontend and backend)
- **JWT Security**: Required environment variables enforced at startup (no fallback secrets)

See [docs/fix-issue/](docs/fix-issue/) for detailed fix documentation.

---

## User Guide

### Organization Setup

1. **Sign Up** — Go to `/signup`, enter your organization name, admin email, and password. The system auto-generates a slug from the org name.
2. **Dashboard** — After signup, you land on the admin dashboard with an overview of members, events, and announcements.
3. **Settings** — Navigate to Org Settings to update your organization name, description, logo, timezone, and contact info. Changes save immediately.

### Managing Members

1. **Add a Member** — Click "Add Member" on the Members page. Fill in first name, last name, and phone (required). Optionally add email, membership type, emergency contact, and notes.
2. **Search & Filter** — Use the search bar to find members by name, email, or phone. Use filter chips to narrow by status (active/inactive/suspended) or membership type.
3. **Import from CSV** — Click "Import" to bulk-add members. Upload a `.csv` or `.xlsx` file, map columns to fields, review the validation report, then confirm import. Max 500 rows per import.
4. **Export** — Click "Export" to download your member list as CSV or Excel. Respects any active filters.
5. **Member Profile** — Click any member row to view their full profile, edit details, toggle status, or view their event history.

### Creating Events

1. **Create Event** — Click "Create Event" to open the 4-step wizard:
   - **Step 1: Basic Info** — Enter title, description, location, start/end dates, and optional capacity. End date must be after start date.
   - **Step 2: Registration** — Set registration mode (public/members/both), enable payment if needed, set amount in MMK.
   - **Step 3: Custom Fields** — Add dynamic fields (text, select, checkbox) for the registration form.
   - **Step 4: Review** — Review all details with formatted dates/times, then save as draft or publish immediately.
2. **Event List** — View events in card or table format. Tabs show Upcoming, Past, and Drafts. Each card shows title, date, location, registration count vs capacity, and status badge.
3. **Event Detail** — Click an event to see stats (registrations, attendance, revenue), manage registrations, track attendance, and record payments.
4. **Status Management** — Change event status: Draft → Published → Completed or Cancelled. Cancelled events show a red badge and disable registration.

### Registration

1. **Member Registration** — Logged-in members see a "Register" button on event pages. Click to register with pre-filled info. Only custom fields need responses.
2. **Guest Registration** — Public events allow anyone to register without an account. Fill in name, email, phone, and custom fields.
3. **Waitlist** — When an event reaches capacity, new registrations go to a waitlist. Staff can promote from waitlist when spots open.
4. **Cancellation** — Registrants can cancel via a link in their confirmation. This frees up the spot for waitlisted people.

### Attendance Tracking

1. **Check-In** — During an event, open the Attendance tab. Tap/click a member's name to mark them present. Shows check-in time and who checked them in.
2. **Real-Time Counter** — Top of the attendance list shows "18 / 30 checked in" with a live count.
3. **Search** — Use the search bar to quickly find a specific person in the list.
4. **Bulk Check-In** — Select multiple members and check them in at once.
5. **Dashboard** — Admins see an attendance overview with total registered, checked in, absent, and attendance rate percentage.

### Payment Tracking

1. **Record Payment** — Click "Record Payment" on the event's Payments tab. Select the member, enter amount in MMK, choose payment method (cash, bank transfer, mobile money, other), add reference number and notes.
2. **Track Status** — View payment summary: total expected, collected, and pending. Filter by status, member, or payment method.
3. **Update Status** — Toggle payment status: Pending → Paid → Refunded. Status changes are logged with timestamp.
4. **Export** — Download payment reports as CSV for accounting.

### Announcements

1. **Create Announcement** — Admins and staff can click "New Announcement" to write a title, content, and set priority (low/normal/high/urgent). Optionally link to an event.
2. **View Announcements** — Members see announcements on their dashboard, sorted by priority then date. Urgent announcements show a red badge.
3. **Draft/Publish** — Announcements can be saved as draft and published later.

### Reports

1. **Member Report** — View total members, status breakdown, new members over time (monthly chart), and membership type distribution.
2. **Event Report** — Per-event stats (registrations, attendance rate, revenue) and aggregate totals.
3. **Export** — Download any report as PDF or CSV.

---

## Getting Started

### Prerequisites

- Docker + Docker Compose v2+
- Git

### Local Development

```bash
# Clone
git clone https://github.com/your-org/pwe.git
cd pwe/src/dev-deployment

# Setup environment
cp .env.example .env

# Start services
docker compose -f docker-compose.dev.yml up --build

# Run migrations
docker compose -f docker-compose.dev.yml exec backend npx prisma migrate dev

# Seed data (optional)
docker compose -f docker-compose.dev.yml exec backend npx prisma db seed
```

**Services:**
- Frontend: http://localhost (via nginx)
- Backend API: http://localhost/api/v1
- Prisma Studio: http://localhost:5555
- Swagger UI: http://localhost/api/v1/docs

See [dev-deployment/README.md](src/dev-deployment/README.md) for full setup guide and [deployment.md](deployment.md) for production deployment.

---

## Project Structure

```
src/
├── .claude/              # AI agent/skill configs (Claude Code)
│   ├── agents/           # Specialized subagents
│   ├── skills/           # Scaffolding skills
│   └── rules/            # Workflow rules
├── CLAUDE.md             # Project conventions and tech stack
├── backend/              # Express API server
│   ├── src/
│   │   ├── routes/       # API route definitions
│   │   ├── controllers/  # Request handlers
│   │   ├── services/     # Business logic
│   │   ├── middleware/    # Auth, tenant, RBAC
│   │   ├── prisma/       # Prisma client singleton
│   │   ├── swagger/      # OpenAPI docs
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # JWT, email, export helpers
│   ├── prisma/           # Schema and migrations
│   ├── Dockerfile
│   └── package.json
├── frontend/             # React SPA
│   ├── src/
│   │   ├── components/   # Reusable UI components (ui/ + layout/)
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Axios instance, utils
│   │   ├── pages/        # Route-level pages
│   │   ├── services/     # API client modules
│   │   └── types/        # TypeScript types
│   ├── Dockerfile.dev
│   └── package.json
├── dev-deployment/       # Docker deployment files
│   ├── docker-compose.dev.yml
│   ├── nginx.conf
│   ├── .env.example
│   ├── .dockerignore
│   ├── generate-certs.sh # SSL certificate generation
│   ├── setup-server.sh   # Server provisioning
│   └── README.md
└── backend/docker-compose.yml  # Basic dev compose (backend + db only)
```

---

## API Overview

Base URL: `/api/v1`

| Category | Endpoints | Auth |
|----------|-----------|------|
| Auth | signup, login, refresh, logout, me | Public / Authenticated |
| Organization | get, update | admin, staff |
| Members | CRUD, search, import, export, status | admin, staff |
| Events | CRUD, status, public listing | admin, staff / Public |
| Registrations | register, list, cancel | Public / Authenticated |
| Attendance | list, check-in, bulk, undo | admin, staff |
| Payments | list, record, update, summary | admin, staff |
| Announcements | CRUD, publish/archive | admin, staff, member |
| Reports | members, events, attendance, payments | admin, staff |

See [api-design.md](api-design.md) for full endpoint documentation with request/response examples.

---

## Multi-Tenancy

Every organization gets complete data isolation:

- **Application level**: Prisma middleware auto-filters by `org_id`
- **Database level**: PostgreSQL Row-Level Security (RLS) policies
- **Auth level**: JWT contains `orgId`, middleware enforces access

See [architecture.md](architecture.md) and [security.md](security.md) for details.

---

## Deployment

### Environments

| Environment | Domain | Purpose |
|-------------|--------|---------|
| Local | localhost | Development |
| Dev | dev.your-domain.com | Shared dev/staging |
| Production | your-domain.com | Live users |

### Deploy

```bash
# Dev deployment (on DigitalOcean droplet)
cd src/dev-deployment
docker compose -f docker-compose.dev.yml up -d --build

# Production (main branch)
git push origin main
```

See [dev-deployment/README.md](src/dev-deployment/README.md) for DigitalOcean setup and [deployment.md](deployment.md) for CI/CD pipeline and backup strategy.

---

## Roadmap

### MVP (2 Weeks)

- [x] Documentation and planning
- [x] Organization workspace + auth
- [x] Member management
- [x] Event management
- [x] Registration forms
- [x] Attendance tracking
- [x] Payment tracking
- [x] Announcements & reports
- [ ] Testing and deployment
- [ ] CI/CD pipeline setup

### Post-MVP

- [ ] QR code attendance
- [ ] Payment gateway integration (KBZ Pay, Wave Money)
- [ ] Email/SMS notifications
- [ ] Advanced analytics
- [ ] Burmese language UI
- [ ] Offline-first PWA
- [ ] Custom branding per org

---

## Security

See [security.md](security.md) for full details.

**Key practices:**
- JWT with 15-min access tokens + refresh token rotation
- **Required environment variables**: `JWT_SECRET` and `REFRESH_TOKEN_SECRET` must be set (application fails to start without them)
- Generate secure secrets: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- bcrypt password hashing (cost factor 12)
- RBAC roles: Admin → Staff → Member → Guest
- Tenant isolation on every query
- Rate limiting on all endpoints
- TLS everywhere, security headers via nginx

See [docs/fix-issue/issue-25-weak-jwt-secrets.md](docs/fix-issue/issue-25-weak-jwt-secrets.md) for JWT security fix details.

---

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run linting and tests: `npm run lint && npm test`
4. Submit a pull request to `main`
5. After review and CI passes, merge to `main`

---

## License

MIT — Copyright 2026 pyone-cho
