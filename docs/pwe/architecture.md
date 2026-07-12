# Architecture

> System architecture, container layout, multi-tenancy model, and request flow for PWE.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Internet                           │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                    Nginx (443/80)                        │
│              TLS Termination + Reverse Proxy             │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ /            │  │ /api/*       │  │ /static/*     │  │
│  │ → frontend   │  │ → backend    │  │ → frontend    │  │
│  └──────────────┘  └──────┬───────┘  └───────────────┘  │
└───────────────────────────┼─────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
┌──────────────────┐ ┌───────────┐ ┌───────────────┐
│   Frontend       │ │  Backend  │ │  PostgreSQL    │
│   (React/Vite)   │ │ (Express) │ │               │
│   Static files   │ │  :3000    │ │  :5432        │
│   via Nginx      │ │           │ │               │
└──────────────────┘ └─────┬─────┘ └───────┬───────┘
                           │               │
                           └───────────────┘
                      Connection Pooling
```

---

## Container Layout

Single Docker host with 4 containers:

```yaml
# docker-compose.prod.yml (simplified)
services:
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - frontend-dist:/usr/share/nginx/html:ro
    depends_on: [backend]

  backend:
    build: ./backend
    environment:
      - DATABASE_URL=postgresql://pwe_user:${DB_PASSWORD}@db:5432/pwe_prod
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    expose: ["3000"]
    depends_on: [db]

  frontend:
    build: ./frontend
    # Build output is a static dist/ folder mounted into nginx

  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=pwe_prod
      - POSTGRES_USER=pwe_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    expose: ["5432"]
```

### Container Responsibilities

| Container | Role | Port | Notes |
|-----------|------|------|-------|
| **nginx** | TLS termination, static serving, rate limiting, gzip | 80, 443 | Public-facing entry point |
| **backend** | API server, auth, business logic | 3000 (internal only) | Not exposed publicly |
| **frontend** | React SPA (built static files) | — | Served by nginx |
| **db** | PostgreSQL database | 5432 (internal only) | Not exposed publicly |

---

## Multi-Tenancy Model

### Strategy: Shared Database, Shared Schema with `org_id`

All tenant-scoped tables include an `org_id` column. Every query is filtered by this column.

```
Request → Extract org_id from JWT → Set on request context →
Prisma middleware injects WHERE org_id = ? → Query executes
```

### Tenant Resolution

```
1. User logs in → JWT contains { userId, orgId, role }
2. Every API request → middleware extracts orgId from JWT
3. Sets request context: req.orgId = jwt.orgId
4. Prisma middleware: automatically adds `where: { orgId: req.orgId }`
5. User can NEVER access data from another org
```

### Subdomain Routing

```
pwe.example.com          → Production (main org or public)
org-name.pwe.example.com → Specific organization workspace
test.pwe.example.com     → Staging/test environment
```

For MVP, subdomain routing is handled at the application level (JWT-based), not DNS-level. DNS wildcard (`*.pwe.example.com`) can be added later.

---

## Request Flow

### Authentication Flow

```
┌─────────┐     POST /api/auth/login     ┌─────────┐
│  Client  │ ──────────────────────────→ │  Nginx   │
│ (React)  │                              │          │
│          │ ←────────────────────────── │          │
│          │     Set-Cookie: refresh     │          │
└─────────┘                              └─────┬────┘
                                               │ proxy_pass
                                               ▼
                                         ┌──────────┐
                                         │ Backend  │
                                         │          │
                                         │ 1. Validate credentials
                                         │ 2. bcrypt.compare()
                                         │ 3. Generate JWT (15min)
                                         │ 4. Generate Refresh (7d)
                                         │ 5. Store refresh hash in DB
                                         │ 6. Return access token
                                         └──────────┘
```

### API Request Flow

```
Client → Nginx → Backend Middleware Chain → Route Handler → Response

Middleware chain:
  1. CORS
  2. Rate Limiter
  3. Body Parser
  4. Auth (JWT verify) → sets req.user, req.orgId
  5. RBAC (role check)
  6. Route Handler
  7. Response
```

---

## Environment Separation

| Environment | Domain | DB | Purpose |
|-------------|--------|-----|---------|
| **Local** | localhost:5173 | pwe_dev | Development |
| **Test/Staging** | test.pwe.example.com | pwe_test | Integration testing, QA |
| **Production** | pwe.example.com | pwe_prod | Live users |

### Database Separation

Single PostgreSQL instance with two databases:
- `pwe_prod` — production data
- `pwe_test` — staging/test data

This avoids provisioning two separate DB servers while keeping data fully isolated.

---

## Frontend Architecture

```
src/
├── components/          # Reusable UI components
│   ├── ui/              # Base components (Button, Input, Table, etc.)
│   ├── layout/          # Sidebar, Header, PageWrapper
│   └── features/        # Feature-specific components
├── pages/               # Route-level page components
│   ├── auth/            # Login, Register
│   ├── dashboard/       # Admin dashboard
│   ├── members/         # Member management
│   ├── events/          # Event management
│   ├── reports/         # Reports & analytics
│   └── settings/        # Org settings
├── hooks/               # Custom React hooks
├── services/            # API client functions (Axios)
├── stores/              # State management (Zustand or Context)
├── utils/               # Helpers, formatters
├── types/               # TypeScript type definitions
├── App.tsx              # Router setup
└── main.tsx             # Entry point
```

---

## Backend Architecture

```
src/
├── routes/              # Express route definitions
│   ├── auth.routes.ts
│   ├── member.routes.ts
│   ├── event.routes.ts
│   └── ...
├── controllers/         # Request handlers
│   ├── auth.controller.ts
│   ├── member.controller.ts
│   └── ...
├── services/            # Business logic
│   ├── auth.service.ts
│   ├── member.service.ts
│   └── ...
├── middleware/           # Express middleware
│   ├── auth.middleware.ts       # JWT verification
│   ├── tenant.middleware.ts     # Org isolation
│   ├── rbac.middleware.ts       # Role-based access
│   ├── validate.middleware.ts   # Zod validation
│   └── rateLimit.middleware.ts  # Rate limiting
├── prisma/              # Database
│   ├── client.ts        # Prisma client singleton
│   ├── middleware.ts     # Tenant isolation middleware
│   └── migrations/      # Migration files
├── utils/               # Helpers
│   ├── jwt.ts           # Token generation/verification
│   ├── email.ts         # Email sending (future)
│   └── export.ts        # CSV/PDF generation
├── types/               # TypeScript types
│   ├── express.d.ts     # Extended Express types
│   └── index.ts
├── app.ts               # Express app setup
└── server.ts            # Entry point
```

---

## Scalability Considerations

### Current: Single Server (MVP)
- One DigitalOcean droplet handles everything
- Docker Compose for service orchestration
- Sufficient for <1000 users, <50 concurrent

### Future Growth Path

```
Phase 1 (MVP)          Phase 2 (Growth)         Phase 3 (Scale)
──────────────         ────────────────         ───────────────
Single server          Add Redis cache          Kubernetes cluster
No caching             Separate DB server       Load balancer
Manual backups         Automated backups        Multi-region
Single process         PM2 clustering           Microservices
```

### When to Upgrade
- **Redis**: When response times exceed 200ms consistently, or for session caching
- **Separate DB**: When concurrent connections > 100 or data > 10GB
- **Clustering**: When single process CPU > 80% sustained
- **Kubernetes**: When uptime SLA requires multi-server deployment
