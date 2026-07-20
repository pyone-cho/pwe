# PWE Code Review Report

**Date:** July 19, 2026  
**Reviewer:** AI Code Reviewer  
**Codebase:** PWE — Multi-tenant Membership Management Platform

---

## Executive Summary

The PWE codebase is a well-structured MVP with clean separation of concerns across controllers, services, and routes, consistent API response formats, and a thoughtful multi-tenant data model. The Prisma schema is well-indexed, the frontend has a cohesive component architecture, and the nginx + Docker setup provides a solid foundation.

However, there are several **critical security issues** that must be resolved before any production deployment. The most significant is that refresh tokens are stored in `localStorage` rather than `httpOnly` cookies as documented, making them vulnerable to XSS-based token theft. JWT fallback secrets are hardcoded in source, registration capacity checks have race conditions, and several endpoints lack proper authorization checks. The codebase also has significant `any` type usage that undermines TypeScript's safety guarantees, and there is no test coverage despite the project conventions mandating it.

---

## Security Review

### Critical Issues

**1. Refresh tokens stored in localStorage — vulnerable to XSS theft**
- **Files:** `src/frontend/src/hooks/useAuth.tsx:61,77,93`, `src/frontend/src/lib/axios.ts:26-31`
- **Description:** The CLAUDE.md documents "7d refresh in httpOnly cookies" but the implementation stores both `accessToken` and `refreshToken` in `localStorage`. Any XSS vulnerability gives an attacker full account takeover capability via the refresh token. This is the single most critical security finding.
- **Risk:** Critical
- **Fix:** Store refresh tokens in `httpOnly`, `Secure`, `SameSite=Strict` cookies set by the server. Remove `localStorage.setItem('refreshToken', ...)` from all frontend code. The server should set the cookie on login/signup/refresh and clear it on logout.

**2. Hardcoded JWT fallback secrets**
- **Files:** `src/backend/src/utils/jwt.ts:5,7`
- **Description:** `JWT_SECRET` defaults to `"fallback-secret"` and `REFRESH_TOKEN_SECRET` defaults to `"fallback-refresh-secret"` if env vars are missing. If the application starts without these env vars, tokens can be forged by anyone who reads the source code.
- **Risk:** Critical
- **Fix:** Throw an error at startup if `JWT_SECRET` or `REFRESH_TOKEN_SECRET` are not set. Never use fallback values for secrets:
  ```typescript
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');
  ```

**3. Registration capacity check has a TOCTOU race condition**
- **File:** `src/backend/src/services/registration.service.ts:52-70`
- **Description:** The capacity check (count existing registrations) and the create registration are separate, non-transactional operations. Two concurrent requests for the same event could both pass the capacity check and both create registrations, exceeding the event capacity.
- **Risk:** High
- **Fix:** Use `prisma.$transaction` with a serializable isolation level, or use a database-level `SELECT ... FOR UPDATE` pattern. Alternatively, add a unique constraint or application-level advisory lock.

**4. Registration cancel endpoint has no RBAC**
- **File:** `src/backend/src/routes/registration.routes.ts:19-22`
- **Description:** The `PATCH /registrations/:id/cancel` route requires only `authenticate` + `tenantIsolation` — any authenticated user in the org can cancel any other user's registration.
- **Risk:** High
- **Fix:** Either require the user to be staff/admin, or implement a "cancel own" endpoint that verifies the registration belongs to the requesting user's member record.

**5. No password complexity requirements**
- **File:** `src/backend/src/middleware/validate.middleware.ts:36,44,59`
- **Description:** Password validation only enforces `z.string().min(8)`. No uppercase, numbers, or special character requirements. Combined with no account lockout (only rate limiting on the endpoint), this makes brute-force easier.
- **Risk:** High
- **Fix:** Add password strength validation: `z.string().min(8).regex(/[A-Z]/, '...').regex(/[0-9]/, '...')`. Consider adding an account lockout mechanism after N failed login attempts.

**6. Swagger/OpenAPI docs exposed without authentication**
- **File:** `src/backend/src/app.ts:49-57`
- **Description:** The full API specification is publicly accessible at `/docs` and `/docs.json` without any authentication. This reveals the entire API surface, including internal endpoints and data models, to potential attackers.
- **Risk:** Medium
- **Fix:** Gate `/docs` behind authentication in production, or disable it entirely when `NODE_ENV=production`.

### High Priority Issues

**7. Dockerfile runs as root, uses `npm install` instead of `npm ci`**
- **File:** `src/backend/Dockerfile:9,22`
- **Description:** The Dockerfile has no `USER` directive (runs as root), uses `npm install` (non-deterministic), and has no multi-stage build. The `CMD ["npm", "run", "dev"]` starts a dev server in what should be a production container.
- **Risk:** High
- **Fix:** Add a non-root user, use `npm ci --omit=dev` for production, add a multi-stage build, and change CMD to `node dist/server.js`.

**8. Frontend Dockerfile runs `npm ci --legacy-peer-deps`**
- **File:** `src/frontend/Dockerfile.dev:10`
- **Description:** Using `--legacy-peer-deps` masks dependency conflicts that could cause runtime issues.
- **Risk:** Medium
- **Fix:** Resolve the peer dependency conflicts properly or pin versions to avoid conflicts.

**9. Tenant middleware allows header-based org impersonation on public routes**
- **File:** `src/backend/src/middleware/tenant.middleware.ts:11-37`
- **Description:** On unauthenticated routes, the `x-org-id` header is trusted to set the organization context. While necessary for public event listing, the guest registration endpoint (`POST /events/:eventId/register`) uses this pattern, meaning an attacker could submit registrations under any organization.
- **Risk:** Medium
- **Fix:** For the guest registration route, validate that the event actually belongs to the provided org ID by cross-referencing in the service layer (which the current `registrationService.create` does via `findFirst({ id: eventId, orgId })`, so this is partially mitigated).

**10. Hardcoded secrets in docker-compose.yml**
- **File:** `src/backend/docker-compose.yml:9-10,28-31`
- **Description:** Database password (`mypassword`), JWT secret, and refresh token secret are hardcoded in the docker-compose file. While this is a dev-only compose file, the file is committed to git.
- **Risk:** Medium
- **Fix:** Use `.env` file references (`${JWT_SECRET}`) and ensure `.env` is in `.gitignore`. The `docker-compose.dev.yml` does this better.

**11. Error handler leaks implementation details in development**
- **File:** `src/backend/src/middleware/errorHandler.ts:41`
- **Description:** In development mode, raw error messages (including stack traces and internal details) are sent to clients. If `NODE_ENV` is accidentally set to a non-production value in production, this leaks sensitive information.
- **Risk:** Medium
- **Fix:** Always sanitize error responses. Log full errors server-side but return generic messages to clients unless explicitly in development mode with IP allowlisting.

**12. Member import has no input size limits**
- **File:** `src/backend/src/services/member.service.ts:136-168`
- **Description:** The CSV import iterates all records sequentially. A malicious user could upload a massive CSV file, causing memory exhaustion and long-running requests that block the event loop.
- **Risk:** Medium
- **Fix:** Add a maximum record count (e.g., 10,000 rows). Validate record count before processing. Consider using a background job queue for large imports.

### Medium Priority Issues

**13. Event status update uses `requireMinRole("staff")` for all transitions**
- **File:** `src/backend/src/routes/event.routes.ts:30`
- **Description:** Both staff and admin can update event status, including canceling events. The `cancel` transition should likely require admin-only permissions.
- **Risk:** Low
- **Fix:** Add admin-only checks for destructive status transitions (cancelled, completed) in the service or route layer.

**14. Org update endpoint has no validation schema**
- **File:** `src/backend/src/routes/org.routes.ts:13`
- **Description:** The `PUT /org` endpoint is not wrapped with `validate()`. While the service layer has a typed interface, arbitrary fields from `req.body` are passed to Prisma, potentially updating unintended fields.
- **Risk:** Medium
- **Fix:** Add a Zod validation schema for org updates that explicitly whitelists allowed fields.

**15. Announcement update endpoint has no validation schema**
- **File:** `src/backend/src/routes/announcement.routes.ts:16`
- **Description:** Same issue as above — `PUT /announcements/:id` passes `req.body` directly to the service without validation.
- **Risk:** Low
- **Fix:** Add validation schema for announcement updates.

**16. No CSRF protection documented**
- **File:** General architecture
- **Description:** The current design uses `Authorization: Bearer` tokens in localStorage, which is not vulnerable to CSRF. However, the documented design mentions httpOnly cookies, which would be. If migration to cookies occurs, CSRF tokens will be needed.
- **Risk:** Low (current), Medium (post-migration)
- **Fix:** When migrating to httpOnly cookies, add CSRF protection via a double-submit cookie pattern or SameSite cookie attribute.

**17. `x-org-id` header on publicApi defaults to seed data slug**
- **File:** `src/frontend/src/lib/publicApi.ts:3`
- **Description:** The public API client defaults to `VITE_ORG_SLUG || 'eventhub'`. This hardcodes a specific organization slug that only exists from seed data.
- **Risk:** Low
- **Fix:** Make the org slug a required configuration parameter, or derive it from the URL/domain.

### Low Priority / Suggestions

**18. Rate limiter does not use Redis for distributed deployments**
- **File:** `src/backend/src/middleware/rateLimit.middleware.ts`
- **Description:** The in-memory rate limiter won't work across multiple instances. For production with horizontal scaling, a Redis-backed store is needed.
- **Risk:** Low
- **Fix:** Use `rate-limit-redis` package with a Redis store for production.

**19. No account lockout mechanism**
- **File:** `src/backend/src/services/auth.service.ts:212-234`
- **Description:** While rate limiting exists on the auth endpoint (10 attempts per 15 minutes), there's no account-level lockout after repeated failed passwords.
- **Risk:** Low
- **Fix:** Track failed login attempts per user and lock accounts after N failures.

**20. Seed data credentials printed to console**
- **File:** `src/backend/prisma/seed.ts:125-126`
- **Description:** Test credentials are printed to stdout during seeding. In a CI/CD pipeline, this could leak to build logs.
- **Risk:** Low
- **Fix:** Gate credential printing behind `NODE_ENV === 'development'`.

---

## Architecture Review

### Strengths

1. **Clean layered architecture:** The `routes -> controller -> service -> prisma` pipeline is well-maintained. Controllers handle HTTP concerns, services encapsulate business logic, and Prisma handles data access.

2. **Consistent API response format:** The `{ success, data, error }` pattern is used consistently across all endpoints, making frontend consumption predictable.

3. **Good multi-tenant data model:** Every tenant-scoped table has an `orgId` column with proper indexes. The Prisma schema has comprehensive index coverage (composite indexes for common query patterns like `orgId + status`).

4. **Thoughtful middleware pipeline:** The combination of `authenticate -> tenantIsolation -> requireRole -> validate` provides defense-in-depth for authorization.

### Issues

**21. No asyncHandler wrapper despite convention**
- **Files:** All controller files
- **Description:** CLAUDE.md specifies "Use `asyncHandler` wrapper for all route handlers" but every controller method manually wraps logic in `try/catch` blocks. This creates ~30 identical try/catch blocks across the codebase.
- **Fix:** Create an `asyncHandler` utility that wraps async route handlers and forwards errors to `next()`. This eliminates boilerplate and reduces the risk of forgotten error handling.

**22. Inconsistent error response shape**
- **File:** `src/backend/src/app.ts:79`, `src/backend/src/middleware/errorHandler.ts:18-22`
- **Description:** The 404 handler returns `{ success: false, error: "Route not found" }` (string), while the documented API format specifies `{ error: { code, message } }`. The Zod validation middleware returns `{ success: false, error: "Validation failed", details: [...] }` (three-level shape).
- **Fix:** Standardize all error responses to the documented format: `{ success: false, error: { code: string, message: string, details?: unknown } }`.

**23. Unused `User` import in Express type augmentation**
- **File:** `src/backend/src/types/express.d.ts:1`
- **Description:** `import { User } from "@prisma/client"` is imported but never used. The Express `Request.user` type is manually defined instead of using the Prisma `User` type.
- **Fix:** Remove the unused import or align the `Request.user` type with the Prisma model.

---

## Code Quality Review

**24. Pervasive `any` types**
- **Files:** `src/backend/src/services/member.service.ts:7,87,106`, `src/backend/src/services/event.service.ts:6,11,92,109`, `src/backend/src/services/payment.service.ts:7,48,67`, `src/backend/src/services/announcement.service.ts:6,58,68,83`, `src/backend/src/utils/export.ts:8,33,47,59,69`, `src/backend/src/middleware/errorHandler.ts:27`, `src/backend/src/types/index.ts:32`
- **Description:** Despite CLAUDE.md's strict "No `any` — use `unknown` and narrow" convention, `any` is used extensively — in service method signatures, export utility functions, Prisma query types, error handling, and type definitions. This undermines TypeScript's value.
- **Fix:** Define proper input/output types for each service method. Use `unknown` for error catches and narrow. The `Record<string, any>` pattern in export utilities should use the actual data shapes.

**25. Duplicate bcrypt dependencies**
- **File:** `src/backend/package.json:24-25`
- **Description:** Both `bcrypt` (native, requires compilation) and `bcryptjs` (pure JS) are listed as dependencies. Only `bcryptjs` is actually used in the code (`import bcrypt from "bcryptjs"` in seed.ts and auth.service.ts).
- **Fix:** Remove `bcrypt` from dependencies since only `bcryptjs` is used.

**26. Unused `slug` parameter in login**
- **File:** `src/frontend/src/hooks/useAuth.tsx:59`
- **Description:** `login()` calls `authService.login({ email, password, slug: '' })` — the `slug` parameter is hardcoded as empty string and the backend login endpoint doesn't use it.
- **Fix:** Remove the `slug` parameter from the login service function signature and the auth hook call.

**27. Frontend types don't match backend response shapes**
- **File:** `src/frontend/src/types/index.ts:63-66,98-101,128-131,179-182`
- **Description:** Frontend list response types use `{ data: T[], meta: PaginationMeta }` but the backend returns `{ data: T[], pagination: { page, limit, total, totalPages } }`. The field name `meta` vs `pagination` and `pages` vs `totalPages` don't match.
- **Fix:** Align frontend types with actual backend response shapes, or add a response transformer in the Axios interceptor.

**28. Dead code: `login` function passes `slug: ''`**
- **File:** `src/frontend/src/services/auth.ts:19`
- **Description:** The login function accepts `slug?: string` but the backend doesn't use a slug for login. The frontend always passes `slug: ''`.
- **Fix:** Remove the `slug` parameter from the login service function.

---

## Performance Review

**29. N+1 API call pattern for member registration checks**
- **File:** `src/frontend/src/hooks/useEventsPage.ts:57-66`
- **Description:** For non-staff users, a separate `getMyRegistration(eventId)` API call is made for each event in the list. With 20 events per page, this creates 20 additional HTTP requests.
- **Fix:** Add a batch endpoint like `GET /registrations/my?eventIds=...` or include registration status in the event list response for authenticated users.

**30. N+1 API call in event detail page**
- **File:** `src/frontend/src/hooks/useEventDetailPage.ts:65-93`
- **Description:** The `loadTab` function makes separate API calls for each tab's data. While this is on-demand (only when the tab is clicked), loading the overview tab doesn't pre-fetch related data.
- **Fix:** Consider adding a single "event detail with stats" endpoint that returns event data along with registration count, attendance count, and payment summary.

**31. Export endpoints load all records without pagination**
- **Files:** `src/backend/src/services/member.service.ts:170-179`, `src/backend/src/services/attendance.service.ts:149-167`, `src/backend/src/services/payment.service.ts:127-144`
- **Description:** Export functions fetch all records from the database without any pagination or streaming. For organizations with thousands of members/payments, this can cause memory and performance issues.
- **Fix:** Use Prisma's cursor-based pagination to stream large exports, or implement background export jobs with download links.

**32. Report queries run multiple counts in parallel**
- **File:** `src/backend/src/services/report.service.ts:6-24,51-75,116-130`
- **Description:** Report endpoints issue 5-6 separate `count()` queries. While `Promise.all` runs them concurrently, each still opens a separate database connection.
- **Fix:** Consider using a single SQL query with window functions or CTEs for the report summaries.

---

## Reliability Review

**33. Graceful shutdown may not wait for in-flight requests**
- **File:** `src/backend/src/server.ts:28-38`
- **Description:** On SIGINT/SIGTERM, the server immediately disconnects Prisma and exits. In-flight requests may fail. The HTTP server's `close()` method is never called.
- **Fix:** Store the server reference, call `server.close()` to stop accepting new connections, drain existing requests, then disconnect Prisma.

**34. `trust proxy` set to `1` but health check doesn't account for it**
- **File:** `src/backend/src/app.ts:26`
- **Description:** `app.set("trust proxy", 1)` is correct for nginx, but the rate limiter's default key generator uses `req.ip`. If the proxy chain is misconfigured, the rate limiter could be bypassed by all clients sharing the same IP.
- **Fix:** Ensure the nginx config always sets `X-Forwarded-For` correctly. Consider using a custom `keyGenerator` for rate limiting that validates the IP.

**35. No error boundary in React app**
- **File:** `src/frontend/src/App.tsx`
- **Description:** There is no React error boundary wrapping the application. An unhandled error in any component will crash the entire app with a blank screen.
- **Fix:** Add an `ErrorBoundary` component wrapping the routes that displays a fallback UI.

**36. Missing `index.html` in frontend Dockerfile COPY**
- **File:** `src/frontend/Dockerfile.dev:13`
- **Description:** The Dockerfile copies config files but the source code is mounted via volumes. For a production build, `src/` and `index.html` would need to be copied.
- **Fix:** This is a dev-only Dockerfile, which is fine. But create a separate production `Dockerfile` with multi-stage build.

---

## Infrastructure Review

**37. Backend Dockerfile runs `npm run dev` in production context**
- **File:** `src/backend/Dockerfile:22`
- **Description:** The CMD is `npm run dev` (which runs `tsx watch src/server.ts`). This is a development-only command with file watching. There's no production Dockerfile.
- **Fix:** Create a separate production Dockerfile or use build stages. The production CMD should be `node dist/server.js` with `npm run build` in the build stage.

**38. docker-compose.yml exposes PostgreSQL port 5432 externally**
- **File:** `src/backend/docker-compose.yml:6-7`
- **Description:** The PostgreSQL port is mapped to the host, making the database accessible from outside the Docker network. This is a security risk in production.
- **Fix:** Remove the `ports` mapping for the database service in production compose files.

**39. No `.dockerignore` in backend**
- **File:** `src/backend/`
- **Description:** There is no `.dockerignore` file in the backend directory. The `COPY . .` in the Dockerfile will copy `.env`, `node_modules`, `.git`, and other unnecessary files into the container.
- **Fix:** Add a `.dockerignore` file excluding `.env*`, `node_modules`, `dist`, `.git`, `*.md`.

**40. nginx auth location block order issue**
- **File:** `src/dev-deployment/nginx.conf:79-86`
- **Description:** The `/api/v1/auth/` location block is defined after the `/api/` block. In nginx, more specific prefixes match first, so this works correctly. However, the auth zone rate limit (`5r/m`) may be too aggressive for login attempts from shared IPs (e.g., offices behind NAT).
- **Fix:** Consider using `limit_req_status 429` explicitly and documenting the rate limits for users.

---

## Positive Observations

1. **Excellent Prisma schema design:** Comprehensive indexing strategy with composite indexes (`orgId + status`, `orgId + startDate`, etc.), proper UUID primary keys, timestamptz columns, and sensible constraints.

2. **Consistent code organization:** Every feature follows the same `routes -> controller -> service` pattern. The directory structure is clean and predictable.

3. **Good middleware architecture:** The auth -> tenant -> RBAC -> validation middleware chain provides defense-in-depth. The `requireMinRole` helper with role hierarchy is elegant.

4. **Refresh token rotation:** The refresh token flow properly rotates tokens (revoking old, issuing new) which limits the window of token reuse.

5. **Thoughtful event status transitions:** The event service implements a state machine for status transitions (`draft -> published -> completed/cancelled`) with validation.

6. **Clean frontend component architecture:** Well-organized UI components, consistent Tailwind usage, custom hooks for data fetching, and a clean separation between UI and logic.

7. **Multi-tenant by design:** Every tenant-scoped query includes `orgId`, and the tenant middleware extracts it from JWT (authenticated) or headers (public routes).

8. **Proper CORS and security headers:** Helmet is used for security headers, CORS is configured with credentials, and the nginx config adds additional security headers (HSTS, nosniff, etc.).

9. **Good error handling patterns:** The `AppError` class with operational error flag, Prisma-specific error handling, and consistent response format.

10. **Responsive frontend design:** The UI uses Tailwind breakpoints effectively for mobile-first responsive layouts with a clean sidebar navigation pattern.

---

## Summary & Recommendations

### Must-Fix Before Production (Priority Order)

| # | Issue | Severity | Effort |
|---|-------|----------|--------|
| 1 | Move refresh tokens to httpOnly cookies | Critical | High |
| 2 | Remove JWT fallback secrets, require env vars at startup | Critical | Low |
| 3 | Add registration capacity race condition protection | High | Medium |
| 4 | Add RBAC to registration cancel endpoint | High | Low |
| 5 | Add password complexity requirements | High | Low |
| 6 | Add non-root user to Dockerfiles, use `npm ci` | High | Low |
| 7 | Create production Dockerfile with multi-stage build | High | Medium |
| 8 | Add input validation schemas for all update endpoints | Medium | Medium |
| 9 | Align frontend/backend response types | Medium | Medium |
| 10 | Remove duplicate `bcrypt` dependency | Low | Low |

### Should-Fix Soon

| # | Issue | Effort |
|---|-------|--------|
| 11 | Replace `any` types with proper interfaces | Medium |
| 12 | Implement `asyncHandler` wrapper | Low |
| 13 | Add React error boundary | Low |
| 14 | Fix graceful shutdown to drain connections | Low |
| 15 | Add batch endpoint for registration checks (N+1) | Medium |
| 16 | Add `.dockerignore` for backend | Low |
| 17 | Standardize error response format | Medium |
| 18 | Remove Swagger from production or gate behind auth | Low |
| 19 | Add structured logging / request IDs | Medium |
| 20 | Add tests (backend + frontend) | High |
