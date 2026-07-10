# PWE Backend API

Backend API for the PWE Event Management System built with Express.js, TypeScript, and Prisma.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL 16
- **Auth**: JWT (access + refresh tokens)

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed data
├── src/
│   ├── controllers/       # Request handlers
│   ├── middleware/         # Express middleware
│   ├── prisma/            # Prisma client
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── types/             # TypeScript types
│   ├── utils/             # Utilities
│   ├── app.ts             # Express app setup
│   └── server.ts          # Entry point
├── package.json
├── tsconfig.json
└── .env.example
```

## Setup

### 1. Install dependencies

```bash
cd src/backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Setup database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed
```

### 4. Start development server

```bash
npm run dev
```

The API will be available at `http://localhost:3000/api/v1`.

## API Endpoints

### Authentication
- `POST /api/v1/auth/signup` - Register organization + admin
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/profile` - Get profile

### Organization
- `GET /api/v1/org` - Get org details
- `PUT /api/v1/org` - Update org
- `GET /api/v1/org/stats` - Get org stats

### Members
- `GET /api/v1/members` - List members
- `GET /api/v1/members/:id` - Get member
- `POST /api/v1/members` - Create member
- `PUT /api/v1/members/:id` - Update member
- `PATCH /api/v1/members/:id/status` - Update status
- `POST /api/v1/members/import` - Import CSV
- `GET /api/v1/members/export` - Export CSV

### Events
- `GET /api/v1/events` - List events
- `GET /api/v1/events/:id` - Get event
- `POST /api/v1/events` - Create event
- `PUT /api/v1/events/:id` - Update event
- `PATCH /api/v1/events/:id/status` - Update status
- `GET /api/v1/events/public` - Public events
- `GET /api/v1/events/public/:id` - Public event

### Registrations
- `GET /api/v1/events/:eventId/registrations` - List registrations
- `POST /api/v1/events/:eventId/register` - Register
- `PATCH /api/v1/registrations/:id/cancel` - Cancel

### Attendance
- `GET /api/v1/events/:eventId/attendance` - List attendance
- `GET /api/v1/events/:eventId/attendance/summary` - Summary
- `GET /api/v1/events/:eventId/attendance/export` - Export
- `POST /api/v1/events/:eventId/attendance` - Check in
- `POST /api/v1/events/:eventId/attendance/bulk` - Bulk check in
- `DELETE /api/v1/attendance/:id` - Undo check in

### Payments
- `GET /api/v1/payments` - List payments
- `GET /api/v1/payments/summary` - Summary
- `GET /api/v1/payments/export` - Export
- `POST /api/v1/payments` - Record payment
- `PATCH /api/v1/payments/:id` - Update payment
- `PATCH /api/v1/payments/:id/status` - Update status

### Announcements
- `GET /api/v1/announcements` - List announcements
- `GET /api/v1/announcements/:id` - Get announcement
- `POST /api/v1/announcements` - Create
- `PUT /api/v1/announcements/:id` - Update
- `PATCH /api/v1/announcements/:id/status` - Update status

### Reports
- `GET /api/v1/reports/members` - Member report
- `GET /api/v1/reports/members/export` - Export members
- `GET /api/v1/reports/events` - Event report
- `GET /api/v1/reports/events/export` - Export events
- `GET /api/v1/reports/payments` - Payment report
- `GET /api/v1/reports/payments/export` - Export payments

## Test Credentials

After seeding:
- **Admin**: admin@eventhub.com / admin123
- **Staff**: staff@eventhub.com / admin123

## Multi-Tenancy

All tenant-scoped endpoints require:
1. Valid JWT token in `Authorization: Bearer <token>` header
2. `orgId` is extracted from JWT and used to filter all queries

## Roles

- **admin**: Full access
- **staff**: Can manage members, events, registrations, attendance
- **member**: Can view announcements, register for events
- **guest**: Public access only
