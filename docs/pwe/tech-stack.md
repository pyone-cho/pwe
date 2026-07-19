# Tech Stack

> PWE technology choices, rationale, and alternatives considered.

## Overview

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | 20 LTS |
| Backend Framework | Express.js + TypeScript | 4.x / 5.x |
| Frontend Framework | React | 19.x |
| Build Tool | Vite | 8.x |
| CSS | Tailwind CSS | 3.x |
| Database | PostgreSQL | 16 |
| ORM | Prisma | 6.x |
| Auth | JWT + bcryptjs | — |
| HTTP Client | Axios | 1.x |
| Forms | Formik + Zod | — |
| Containerization | Docker + Docker Compose | — |
| CI/CD | GitHub Actions | — |
| Reverse Proxy | Nginx | — |

---

## Backend

### Runtime: Node.js 20 LTS
- **Why**: Mature ecosystem, excellent TypeScript support, strong async I/O for API workloads.
- **Alternatives considered**:
  - *Deno* — better security defaults, but smaller ecosystem, less mature Prisma support.
  - *Go* — better raw performance, but slower dev velocity for 2-week MVP.
  - *Python/FastAPI* — good DX, but team familiarity and React integration favor Node.

### Framework: Express.js + TypeScript
- **Why**: Battle-tested, huge middleware ecosystem, easy to hire for, Prisma integrates cleanly.
- **Alternatives considered**:
  - *Fastify* — faster benchmarks, but smaller community, fewer middleware options.
  - *NestJS* — more opinionated structure, overkill for MVP scope.
  - *Hono* — lightweight and fast, but less mature ecosystem.
- **TypeScript**: Non-negotiable — type safety across frontend/backend, better IDE support, catches bugs early.

### Validation: Zod
- **Why**: TypeScript-first schema validation, used on both backend (request validation) and frontend (form validation). Single source of truth for schemas.
- **Alternatives**: Joi (no TS inference), Yup (less TS-native), class-validator (decorator-heavy).

---

## Frontend

### Framework: React 19 + Vite
- **Why**: Largest ecosystem, team familiarity, Vite gives fast HMR and build times.
- **Alternatives considered**:
  - *Next.js* — SSR/SSG not needed for this SPA, adds complexity.
  - *Vue.js* — smaller learning curve, but React ecosystem is larger.
  - *Svelte* — better perf, but smaller talent pool.

### CSS: Tailwind CSS 3
- **Why**: Rapid UI development, mobile-first utilities, small production CSS via purging, works well with component libraries.
- **Alternatives**: Bootstrap (heavier), CSS Modules (more manual), styled-components (runtime overhead).

### Forms: Formik + Zod
- **Why**: Formik handles form state, touched, errors. Zod schemas validate on submit and real-time. Shared schemas with backend.
- **Alternatives**: React Hook Form (faster, but Formik is more familiar to most teams), native forms (too manual).

### HTTP Client: Axios
- **Why**: Interceptors for auth tokens, automatic JSON parsing, request/response transformation, widely used.
- **Alternatives**: Fetch API (no interceptors), ky (smaller but less ecosystem).

---

## Database

### PostgreSQL 16
- **Why**: ACID compliant, JSON support for flexible fields, excellent Prisma support, handles multi-tenant schema well, free and open source.
- **Alternatives considered**:
  - *MySQL* — simpler, but weaker JSON and array support.
  - *MongoDB* — flexible schema, but relational data (members → events → payments) fits RDBMS better.
  - *SQLite* — too limited for concurrent multi-tenant.

### ORM: Prisma
- **Why**: TypeScript-first, excellent migration system, type-safe queries, good DX with Prisma Studio.
- **Alternatives considered**:
  - *TypeORM* — more traditional, less type-safe queries.
  - *Sequelize* — mature but older API style, weaker TypeScript support.
  - *Drizzle* — faster, but less mature migration system and smaller community.
- **Multi-tenancy approach**: Single database, shared tables with `org_id` column on all tenant-scoped tables. RLS (Row Level Security) as an additional safety layer.

---

## Authentication & Security

### JWT (JSON Web Tokens)
- **Why**: Stateless auth, works across subdomains, easy to implement with refresh token rotation.
- **Token strategy**: Short-lived access tokens (15 min) + longer-lived refresh tokens (7 days) stored in httpOnly cookies.
- **Alternatives**: Session-based (requires server-side store), OAuth (overkill for MVP — add later for social login).

### Password Hashing: bcryptjs
- **Why**: Pure JavaScript implementation of bcrypt — no native compilation required, works reliably in Docker Alpine containers.
- **Cost factor**: 12 (configurable via env).
- **Note**: Using `bcryptjs` (pure JS) instead of `bcrypt` (native) to avoid build dependencies (`python3`, `g++`) in Docker images.

---

## DevOps & Infrastructure

### Containerization: Docker + Docker Compose
- **Why**: Consistent environments across dev/test/prod, easy onboarding (one command to start), matches production deployment model.
- **Container layout**:
  - `nginx` — reverse proxy, static file serving, TLS termination
  - `backend` — Express API server
  - `frontend` — Built React app served by nginx
  - `db` — PostgreSQL with two logical databases (prod + test)

### CI/CD: GitHub Actions
- **Why**: Free for public repos, tight GitHub integration, good Docker support.
- **Pipeline**: Lint → Test → Build → Deploy
- **Branch strategy**: `main` → production, feature branches → PR to `main`


### Reverse Proxy: Nginx
- **Why**: battle-tested, handles TLS termination, rate limiting, static file serving, gzip compression.
- **Alternatives**: Caddy (auto-TLS but less control), Traefik (Docker-native but overkill for single server).

---

## Testing

### Backend: Jest + Supertest
- **Why**: Jest is the Node.js standard, Supertest for HTTP endpoint testing, Prisma has test utilities.
- **Scope**: Unit tests for services, integration tests for API endpoints.

### Frontend: Vitest + React Testing Library
- **Why**: Vitest is Vite-native (fast), React Testing Library tests user behavior not implementation.
- **Scope**: Component rendering tests, form validation tests.

---

## Code Quality

### Linting: ESLint
- **Why**: Standard JS/TS linting, catch errors early, enforce consistent style.

### Formatting: Prettier
- **Why**: Opinionated, zero-config, works with ESLint.

---

## Monitoring (Post-MVP)

### Application: Prometheus + Grafana
- **Why**: Free, excellent Node.js metrics exporters, Grafana dashboards.
- **Metrics**: Request latency, error rates, memory usage, active connections.

### Logging: Structured JSON logs → Loki or simple logrotate
- **Why**: Searchable logs, low overhead. Start with logrotate for MVP, upgrade to Loki/Grafana later.

---

## Summary: Why This Stack Wins for PWE

| Criterion | How This Stack Delivers |
|-----------|------------------------|
| **2-week MVP** | Express + React + Prisma = fast dev velocity |
| **Myanmar context** | Mobile-first Tailwind, low-bandwidth friendly, Unicode support |
| **Multi-tenancy** | PostgreSQL + org_id pattern + Prisma middleware |
| **Cost** | Single DigitalOcean droplet, free OSS tools, no managed services |
| **Team hiring** | Node/React/TS = largest talent pool in Myanmar tech |
| **Future scale** | Can split to microservices, add Redis caching, upgrade to Kubernetes if needed |
