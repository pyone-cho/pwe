# PWE - Organization Management Platform

Multi-tenant SaaS for managing organizations, members, events, registrations, attendance, and payments in Myanmar.

**Current status**: MVP implementation complete. All 7 core features are implemented and running. Documentation and CI/CD pipeline are pending.

## Current Structure

```
src/
├── README.md                 # Project overview
├── .gitignore                # Ignores node_modules, .env, dist, coverage
└── .claude/                  # Claude Code configuration
    ├── agents/               # Specialized subagents
    │   ├── backend-api.md    # Backend API development (Express, Prisma, JWT)
    │   ├── database.md       # Database/Prisma work (schema, migrations, RLS)
    │   ├── frontend.md       # React frontend development (Vite, Tailwind, Formik)
    │   ├── ui-ux-pro-max.md  # UI/UX design, review, and component generation
    │   └── devops.md         # Docker, CI/CD, deployment, Nginx
    ├── skills/               # Scaffolding skills
    │   ├── scaffold-api.md   # Add API endpoints (routes → controller → service → validation)
    │   ├── scaffold-feature.md # Scaffold full feature modules
    │   └── scaffold-model.md # Add database models and migrations
    └── rules/
        └── project-workflow.md # Workflow rules (read specs before impl, update docs after)
```

### Target Application Structure

```
src/
├── backend/          # Express.js + TypeScript API
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/      # auth, error, tenant, validation, rbac, rateLimit
│   │   ├── routes/         # Express route definitions
│   │   ├── services/       # Business logic
│   │   ├── prisma/         # Prisma client singleton
│   │   ├── swagger/        # OpenAPI docs
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # jwt, email, export helpers
│   │   ├── app.ts          # Express app setup
│   │   └── server.ts       # Entry point
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   ├── Dockerfile
│   └── docker-compose.yml  # Basic dev (backend + db only)
├── frontend/         # React 19 + Vite + Tailwind
│   ├── src/
│   │   ├── components/     # shared UI components (ui/ + layout/)
│   │   ├── hooks/          # custom React hooks
│   │   ├── lib/            # axios instance, utils
│   │   ├── pages/          # route-level page components
│   │   ├── services/       # API client modules
│   │   ├── types/          # TypeScript type definitions
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── Dockerfile.dev
├── dev-deployment/   # Docker deployment files
│   ├── docker-compose.dev.yml
│   ├── nginx.conf
│   ├── .env.example
│   ├── .dockerignore
│   ├── generate-certs.sh  # SSL certificate generation
│   ├── setup-server.sh    # Server provisioning
│   └── README.md
└── .gitignore
```

## Tech Stack (Canonical)

- **Runtime**: Node.js 20 LTS
- **Backend**: Express.js 4.x + TypeScript
- **Frontend**: React 19 + Vite 8 + Tailwind CSS 3
- **Database**: PostgreSQL 16 + Prisma 6
- **Auth**: JWT (15min access + 7d refresh in httpOnly cookies) + bcrypt
- **Validation**: Zod (shared schemas frontend + backend)
- **HTTP Client**: Axios
- **Forms**: Formik + Zod
- **Testing**: Jest + Supertest (backend), Vitest + RTL (frontend)
- **Linting**: ESLint + Prettier
- **Containerization**: Docker + Docker Compose

## Conventions

### TypeScript
- Strict mode enabled everywhere
- No `any` — use `unknown` and narrow
- Prefer `interface` for object shapes, `type` for unions/intersections

### Backend (Express)
- One module per feature: `modules/<feature>/`
- Each module has: routes → controller → service (layers)
- Routes define HTTP shape, controller handles req/res, service has business logic
- All tenant-scoped queries must include `orgId` — enforced via Prisma middleware
- Use Zod for request validation middleware
- Return consistent response shape: `{ success, data, error?, pagination? }`
- Use `asyncHandler` wrapper for all route handlers

### Frontend (React)
- Functional components only, no class components
- Use custom hooks for reusable logic (data fetching, form handling)
- Tailwind utility classes — no CSS modules or inline styles
- Forms use Formik + Zod schemas (shared with backend where possible)
- API calls go through the shared Axios instance in `lib/axios.ts`

### Database (Prisma)
- `orgId` column on ALL tenant-scoped tables
- Use Prisma middleware to inject `orgId` filter automatically
- Migrations named descriptively: `add_member_status_field`
- Always provide default values for new non-nullable columns

### Git
- Branch from `main`, PR back to `main`
- Commit messages: `feat:`, `fix:`, `chore:`, `docs:` prefix
- Never commit `.env` files or `node_modules`

### Testing
- Test files live in `__tests__/` next to source
- Backend: integration tests for API endpoints using Supertest + test DB
- Frontend: component tests with Vitest + RTL, test user behavior

## Multi-Tenancy Rules

- JWT contains `orgId` claim
- Prisma middleware enforces `orgId` on every tenant-scoped query
- Never trust client-provided `orgId` — extract from JWT
- RLS policies as database-level safety net
- A user from Org A must never see Org B data, even with crafted requests

## Role Hierarchy

- **admin**: Full access to org settings, members, events, payments, reports
- **staff**: Can manage members, events, registrations, attendance
- **member**: Can view events, self-register, view own profile

## API Response Format

```typescript
// Success
{ success: true, data: T }

// Success with pagination
{ success: true, data: T[], pagination: { page, limit, total, totalPages } }

// Error
{ success: false, error: { code: string, message: string } }
```

## Environment Variables

Backend `.env` (never commit):
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
REFRESH_TOKEN_SECRET=...
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost
```

Frontend `.env`:
```
VITE_API_URL=http://localhost/api/v1
```

## Quick Commands

```bash
# Start dev environment
cd src/dev-deployment && docker compose -f docker-compose.dev.yml up --build

# Run migrations
cd src/dev-deployment && docker compose -f docker-compose.dev.yml exec backend npx prisma migrate dev

# Seed database
cd src/dev-deployment && docker compose -f docker-compose.dev.yml exec backend npx prisma db seed

# Run backend tests
cd src/backend && npm test

# Run frontend tests
cd src/frontend && npx vitest

# Type check
cd src/backend && npx tsc --noEmit
cd src/frontend && npx tsc --noEmit
```
