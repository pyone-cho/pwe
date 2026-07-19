# Security Audit Report

**Date:** July 19, 2026
**Scope:** Full codebase (backend, frontend, infrastructure)
**Methodology:** Manual code review with line-by-line analysis of all critical paths

## Executive Summary

The PWE codebase demonstrates a **moderate security posture** with strong foundational patterns (Prisma parameterized queries, Zod validation, RBAC middleware, bcrypt hashing) but several critical and high-severity issues that must be remediated before production deployment.

**Finding Counts:**
| Severity | Count |
|----------|-------|
| CRITICAL | 3 |
| HIGH | 7 |
| MEDIUM | 12 |
| LOW | 5 |
| **Total** | **27** |

**Critical Risks:**
1. Hardcoded fallback JWT secrets allow token forgery if environment variables are unset
2. Frontend token refresh parsing bug completely breaks the refresh flow, causing forced logouts
3. Tokens stored in localStorage expose them to XSS-based session theft

---

## Findings

### [CRITICAL] Hardcoded Fallback JWT Secrets

- **Location:** `src/backend/src/utils/jwt.ts:5-8`
- **Category:** Auth
- **Description:** JWT_SECRET and REFRESH_TOKEN_SECRET fall back to hardcoded strings if environment variables are not set. An attacker who knows or guesses these defaults can forge arbitrary JWT tokens, including admin tokens for any organization.
- **Impact:** Complete authentication bypass. Attacker can impersonate any user, escalate to admin, and access/modify all tenant data.
- **Evidence:**
  ```typescript
  const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";
  const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "fallback-refresh-secret";
  ```
- **Remediation:** Throw an error at startup if secrets are not configured:
  ```typescript
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
  if (!REFRESH_TOKEN_SECRET) {
    throw new Error("REFRESH_TOKEN_SECRET environment variable is required");
  }
  ```
- **CWE:** CWE-798 (Use of Hard-coded Credentials)

---

### [CRITICAL] Frontend Token Refresh Response Parsing Bug

- **Location:** `src/frontend/src/lib/axios.ts:29-31`
- **Category:** Auth
- **Description:** The 401 interceptor incorrectly extracts tokens from the refresh response. The backend returns `{ success: true, data: { accessToken, refreshToken } }`, but the code reads `data.accessToken` instead of `data.data.accessToken`. This means `accessToken` and `refreshToken` are set to `undefined`, which wipes the stored tokens and forces a redirect to `/login`.
- **Impact:** Token refresh is completely broken. Every access token expiry forces a full re-authentication, degrading UX. Additionally, if the refresh succeeds but tokens are saved as `undefined`, the user is logged out on the next request.
- **Evidence:**
  ```typescript
  const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken });
  // data = { success: true, data: { accessToken: "...", refreshToken: "..." } }
  localStorage.setItem('accessToken', data.accessToken);     // undefined!
  localStorage.setItem('refreshToken', data.refreshToken);   // undefined!
  ```
- **Remediation:**
  ```typescript
  const { data: responseData } = await axios.post('/api/v1/auth/refresh', { refreshToken });
  const { accessToken, refreshToken: newRefreshToken } = responseData.data;
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', newRefreshToken);
  originalRequest.headers.Authorization = `Bearer ${accessToken}`;
  return api(originalRequest);
  ```
- **CWE:** CWE-462 (Missing YAML or XML Schema Validation)

---

### [CRITICAL] Hardcoded Database Credentials in Docker Compose

- **Location:** `src/backend/docker-compose.yml:10-11, 28`
- **Category:** Infra
- **Description:** Database password and JWT secrets are hardcoded in the docker-compose.yml file. If this file is committed to version control (it is), credentials are exposed in the repository history.
- **Impact:** Database compromise. Attacker with repository access can connect directly to the database and extract/modify all data, bypassing application-level security.
- **Evidence:**
  ```yaml
  POSTGRES_PASSWORD: mypassword
  # ...
  DATABASE_URL: postgresql://pwe_user:mypassword@db:5432/pwe_dev
  JWT_SECRET: your-super-secret-jwt-key-change-this
  ```
- **Remediation:** Use Docker secrets or environment variable references from a `.env` file (which is gitignored). Never hardcode credentials in compose files. Add `docker-compose.yml` patterns to `.gitignore` if they contain environment-specific secrets.
- **CWE:** CWE-798 (Use of Hard-coded Credentials)

---

### [HIGH] Tokens Stored in localStorage (XSS Attack Surface)

- **Location:** `src/frontend/src/hooks/useAuth.tsx:60-62`
- **Category:** Auth
- **Description:** Access tokens, refresh tokens, and organization data are stored in `localStorage`. Any XSS vulnerability in the application or its dependencies would allow an attacker to steal these tokens.
- **Impact:** Session hijacking via XSS. An attacker who injects malicious script (e.g., through a stored XSS in event description, announcement content, or member notes) can exfiltrate tokens and impersonate any user.
- **Evidence:**
  ```typescript
  localStorage.setItem('accessToken', res.accessToken);
  localStorage.setItem('refreshToken', res.refreshToken);
  localStorage.setItem('organization', JSON.stringify(res.organization));
  ```
- **Remediation:** Store tokens in httpOnly cookies set by the backend. The backend should set `Set-Cookie` headers with `HttpOnly`, `Secure`, and `SameSite=Strict` flags. Remove all `localStorage.setItem` calls for tokens:
  ```typescript
  // Backend: Set-Cookie header on login
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  ```
- **CWE:** CWE-922 (Insecure Storage of Sensitive Information)

---

### [HIGH] Mass Assignment in Payment and Announcement Updates

- **Location:** `src/backend/src/services/payment.service.ts:76-79`, `src/backend/src/services/announcement.service.ts:77-79`
- **Category:** Input
- **Description:** The `update` methods pass user-controlled `data` directly to Prisma without whitelisting allowed fields. The payment update route has no Zod validation schema. An admin could modify fields like `recordedById`, `orgId`, or `createdAt` by including them in the request body.
- **Impact:** Privilege escalation and data integrity compromise. An admin could reassign payment records to different members, change payment timestamps, or alter organization-scoped data.
- **Evidence:**
  ```typescript
  // payment.service.ts:76
  return prisma.payment.update({ where: { id }, data });
  
  // payment.routes.ts:17 - no validate() middleware
  router.patch("/:id", requireMinRole("admin"), paymentController.update);
  ```
- **Remediation:** Add Zod validation schemas for all update endpoints and whitelist allowed fields in service methods:
  ```typescript
  // In validate.middleware.ts
  export const paymentUpdateSchemas = {
    update: z.object({
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        referenceNumber: z.string().max(100).optional(),
        notes: z.string().optional(),
      }),
    }),
  };
  
  // In payment.routes.ts
  router.patch("/:id", requireMinRole("admin"), validate(paymentSchemas.update), paymentController.update);
  ```
- **CWE:** CWE-915 (Mass Assignment)

---

### [HIGH] Docker Container Runs as Root

- **Location:** `src/backend/Dockerfile:1-22`
- **Category:** Infra
- **Description:** The Dockerfile does not create a non-root user. The Node.js application runs as root inside the container, which increases the blast radius of any container escape or application vulnerability.
- **Impact:** If an attacker achieves code execution inside the container (e.g., via a Node.js vulnerability), they have full root access, can install packages, read secrets, or pivot to other containers.
- **Evidence:**
  ```dockerfile
  FROM node:20-alpine
  # ... no USER instruction
  CMD ["npm", "run", "dev"]
  ```
- **Remediation:**
  ```dockerfile
  FROM node:20-alpine
  RUN apk add --no-cache curl
  WORKDIR /app
  RUN addgroup -S appgroup && adduser -S appuser -G appgroup
  COPY package*.json ./
  RUN npm ci --only=production
  COPY . .
  RUN npx prisma generate
  RUN chown -R appuser:appgroup /app
  USER appuser
  EXPOSE 3000
  HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1
  CMD ["node", "dist/server.js"]
  ```
- **CWE:** CWE-250 (Execution with Unnecessary Privileges)

---

### [HIGH] Database Port Exposed to Host Network

- **Location:** `src/backend/docker-compose.yml:6-7`, `src/dev-deployment/docker-compose.dev.yml:6`
- **Category:** Infra
- **Description:** PostgreSQL port 5432 is mapped to the host, making the database accessible from the host network and potentially from the internet if the server is publicly accessible.
- **Impact:** Direct database access bypassing all application-level authentication and authorization. Combined with the weak hardcoded password, this is easily exploitable.
- **Evidence:**
  ```yaml
  ports:
    - "5432:5432"
  ```
- **Remediation:** Remove port mappings for the database. Use Docker's internal networking for inter-container communication:
  ```yaml
  # Remove ports section entirely, or use:
  expose:
    - "5432"  # Only accessible within Docker network
  ```
- **CWE:** CWE-284 (Improper Access Control)

---

### [HIGH] Weak Seed Password and Credentials Logged

- **Location:** `src/backend/prisma/seed.ts:23, 124-126`
- **Category:** Auth
- **Description:** The seed script creates an admin account with the password `admin123` and logs credentials to stdout. If this seed runs in production or if logs are collected centrally, the credentials are compromised.
- **Impact:** Compromise of the admin account in any environment where the seed runs. Credentials in logs could be accessed by log aggregation services.
- **Evidence:**
  ```typescript
  const passwordHash = await bcrypt.hash("admin123", 12);
  // ...
  console.log("   Admin: admin@eventhub.com / admin123");
  console.log("   Staff: staff@eventhub.com / admin123");
  ```
- **Remediation:** Generate random passwords during seeding and output them only once, or require password setup via a separate mechanism. Never log plaintext passwords.
- **CWE:** CWE-256 (Plaintext Storage of a Password)

---

### [HIGH] Error Details Leaked in Non-Production Environments

- **Location:** `src/backend/src/middleware/errorHandler.ts:39-42`
- **Category:** Data
- **Description:** The error handler returns full error messages when `NODE_ENV !== "production"`. The docker-compose files set `NODE_ENV: development`, meaning error details (stack traces, database errors, internal paths) are exposed to API consumers.
- **Impact:** Information disclosure that aids attackers in understanding the application's internal structure, database schema, and potential vulnerabilities.
- **Evidence:**
  ```typescript
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
  ```
- **Remediation:** Always return generic errors to clients. Log detailed errors server-side only:
  ```typescript
  // Always return generic error
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
  // Log details server-side (already done with console.error above)
  ```
- **CWE:** CWE-209 (Generation of Error Message Containing Sensitive Information)

---

### [HIGH] Dockerfile Uses Dev Mode and npm install

- **Location:** `src/backend/Dockerfile:9, 22`
- **Category:** Infra
- **Description:** The Dockerfile uses `npm install` (non-deterministic) and runs with `npm run dev` (tsx watch), which is a development server without production optimizations, error handling, or proper process management.
- **Impact:** Development server in production is slower, less stable, has verbose error output, and the tsx watch process may expose file system information. Non-reproducible builds could introduce supply chain vulnerabilities.
- **Evidence:**
  ```dockerfile
  RUN npm install    # Should be npm ci
  CMD ["npm", "run", "dev"]  # tsx watch src/server.ts
  ```
- **Remediation:** Use multi-stage build with production dependencies only:
  ```dockerfile
  # Build stage
  FROM node:20-alpine AS builder
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci
  COPY . .
  RUN npx prisma generate
  RUN npm run build
  
  # Production stage
  FROM node:20-alpine
  RUN apk add --no-cache curl
  WORKDIR /app
  RUN addgroup -S app && adduser -S app -G app
  COPY --from=builder /app/dist ./dist
  COPY --from=builder /app/node_modules ./node_modules
  COPY --from=builder /app/prisma ./prisma
  RUN npx prisma generate
  USER app
  EXPOSE 3000
  CMD ["node", "dist/server.js"]
  ```
- **CWE:** CWE-693 (Protection Mechanism Failure)

---

### [MEDIUM] Registration Cancel Lacks RBAC Enforcement

- **Location:** `src/backend/src/routes/registration.routes.ts:19-22`
- **Category:** Logic
- **Description:** The `PATCH /registrations/:id/cancel` route requires authentication and tenant isolation but does not enforce any role requirement. Any authenticated user (including `member` role) can cancel any registration within their organization, not just their own.
- **Impact:** A member could cancel other members' event registrations, disrupting event attendance.
- **Evidence:**
  ```typescript
  router.patch(
    "/registrations/:id/cancel",
    registrationController.cancel  // No requireMinRole middleware!
  );
  ```
- **Remediation:** Add role-based access control. Members should only be able to cancel their own registrations via the `/events/:eventId/register/member` endpoint. The generic cancel endpoint should require staff role:
  ```typescript
  router.patch(
    "/registrations/:id/cancel",
    requireMinRole("staff"),
    registrationController.cancel
  );
  ```
- **CWE:** CWE-862 (Missing Authorization)

---

### [MEDIUM] Guest Registration Bypasses Registration Mode

- **Location:** `src/backend/src/services/registration.service.ts:37-94`
- **Category:** Logic
- **Description:** The guest registration endpoint (`POST /events/:eventId/register`) accepts any registration regardless of the event's `registrationMode` setting. An event set to `member`-only registration can still be registered for by unauthenticated guests who supply the correct `x-org-id` header.
- **Impact:** Event organizers who set events to member-only registration cannot prevent unauthorized registrations.
- **Evidence:**
  ```typescript
  // registration.service.ts:37 - create() only checks event.status, not registrationMode
  async create(orgId: string, eventId: string, data: any) {
    const event = await prisma.event.findFirst({ where: { id: eventId, orgId } });
    if (event.status !== "published") {
      throw new AppError(400, "Event is not open for registration");
    }
    // Missing: if (event.registrationMode === "member" && !data.memberId) ...
  ```
- **Remediation:** Add registration mode check:
  ```typescript
  if (event.registrationMode === "member" && !data.memberId) {
    throw new AppError(403, "This event is restricted to members only");
  }
  if (event.registrationMode === "public" && data.memberId) {
    // Allow both member and guest for public events
  }
  ```
- **CWE:** CWE-863 (Incorrect Authorization)

---

### [MEDIUM] Arbitrary formData Stored in Registrations

- **Location:** `src/backend/src/middleware/validate.middleware.ts:145`, `src/backend/prisma/schema.prisma:172`
- **Category:** Input
- **Description:** The registration schema accepts `formData: z.record(z.any()).optional()` which allows arbitrary key-value pairs. This data is stored as JSON in the database and could be rendered unsafely in admin dashboards, leading to stored XSS.
- **Impact:** If any admin view renders `formData` values without sanitization, an attacker can inject malicious HTML/JavaScript through the registration form that executes when staff view registrations.
- **Evidence:**
  ```typescript
  // validate.middleware.ts:145
  formData: z.record(z.any()).optional(),
  
  // schema.prisma:172
  formData Json @default("{}") @map("form_data")
  ```
- **Remediation:** Validate formData values against expected custom field definitions from the event, and sanitize/encode all values before storage:
  ```typescript
  formData: z.record(z.string().max(1000)).optional(),
  ```
- **CWE:** CWE-79 (Cross-site Scripting - Stored)

---

### [MEDIUM] Inconsistent Zod Validation on Event Custom Fields Update

- **Location:** `src/backend/src/middleware/validate.middleware.ts:132`
- **Category:** Input
- **Description:** The event create schema properly validates `customFields` with specific type and options constraints, but the update schema uses `z.array(z.any())`, allowing arbitrary data to be written.
- **Impact:** Bypass of custom field validation on event updates, allowing invalid data types or excessively large payloads.
- **Evidence:**
  ```typescript
  // Create schema - properly validated:
  customFields: z.array(z.object({
    name: z.string(),
    type: z.enum(["text", "select", "checkbox"]),
    options: z.array(z.string()).optional(),
    required: z.boolean().optional(),
  })).optional(),
  
  // Update schema - unvalidated:
  customFields: z.array(z.any()).optional(),
  ```
- **Remediation:** Reuse the same schema from create:
  ```typescript
  customFields: z.array(z.object({
    name: z.string().max(255),
    type: z.enum(["text", "select", "checkbox"]),
    options: z.array(z.string()).optional(),
    required: z.boolean().optional(),
  })).optional(),
  ```
- **CWE:** CWE-20 (Improper Input Validation)

---

### [MEDIUM] Missing Security Headers in Nginx Configuration

- **Location:** `src/dev-deployment/nginx.conf:63-66`
- **Category:** Infra
- **Description:** The nginx configuration includes some security headers but is missing several important ones: Content-Security-Policy, Referrer-Policy, Permissions-Policy, and X-Permitted-Cross-Domain-Policies.
- **Impact:** Without CSP, the application is more vulnerable to XSS attacks. Without Referrer-Policy, sensitive URL data may leak via the Referer header.
- **Evidence:**
  ```nginx
  add_header X-Content-Type-Options nosniff;
  add_header X-Frame-Options DENY;
  add_header X-XSS-Protection "1; mode=block";
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  # Missing: Content-Security-Policy, Referrer-Policy, Permissions-Policy
  ```
- **Remediation:**
  ```nginx
  add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
  add_header X-Permitted-Cross-Domain-Policies "none" always;
  ```
- **CWE:** CWE-693 (Protection Mechanism Failure)

---

### [MEDIUM] Frontend Has No Route-Level Authorization

- **Location:** `src/frontend/src/components/layout/Layout.tsx:20`, `src/frontend/src/App.tsx:31-40`
- **Category:** Logic
- **Description:** The Layout component only checks `isAuthenticated` (line 20), not the user's role. All protected routes are accessible to any authenticated user regardless of role. A member-level user can navigate to `/settings`, `/reports`, `/members` and see error messages from the backend rather than being redirected.
- **Impact:** Poor user experience and potential information leakage from backend error messages. While the backend enforces authorization, the frontend should provide graceful access control.
- **Evidence:**
  ```typescript
  // Layout.tsx:20 - only checks isAuthenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  ```
- **Remediation:** Create a `ProtectedRoute` component that checks role:
  ```typescript
  function ProtectedRoute({ allowedRoles, children }) {
    const { user } = useAuth();
    if (!allowedRoles.includes(user?.role)) {
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  }
  ```
- **CWE:** CWE-862 (Missing Authorization)

---

### [MEDIUM] Organization Data Stored in localStorage

- **Location:** `src/frontend/src/hooks/useAuth.tsx:45-46, 62, 78, 94`
- **Category:** Auth
- **Description:** Organization data (including org ID, name, slug) is stored in localStorage and parsed without validation. An attacker who gains XSS access could modify the organization context, potentially causing the user to interact with a different organization's data.
- **Impact:** Context manipulation that could lead to cross-tenant data leakage if the application relies on client-side organization context for any decisions.
- **Evidence:**
  ```typescript
  localStorage.setItem('organization', JSON.stringify(res.organization));
  // Later:
  const storedOrg = localStorage.getItem('organization');
  if (storedOrg) setOrganization(JSON.parse(storedOrg));
  ```
- **Remediation:** Derive organization data from the JWT token (which already contains `orgId`) rather than localStorage. Fetch organization details from the server on auth initialization.
- **CWE:** CWE-922 (Insecure Storage of Sensitive Information)

---

### [MEDIUM] Console Error Logging May Expose Sensitive Data

- **Location:** `src/frontend/src/lib/axios.ts:21`, `src/backend/src/middleware/errorHandler.ts:15`
- **Category:** Data
- **Description:** The frontend logs full API error responses to console, and the backend logs full Error objects. In production, this could include tokens, PII, or internal paths visible in browser devtools or server logs.
- **Impact:** Sensitive data (tokens, user data, internal paths) exposed in browser console and server logs.
- **Evidence:**
  ```typescript
  // axios.ts:21
  console.error('API Error:', error.response?.data || error.message);
  
  // errorHandler.ts:15
  console.error("Error:", err);
  ```
- **Remediation:** Remove or gate console.error calls behind a debug flag. Never log full error responses in production:
  ```typescript
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', error.response?.data || error.message);
  }
  ```
- **CWE:** CWE-532 (Insertion of Sensitive Information into Log File)

---

### [MEDIUM] Static File Serving Without Access Controls

- **Location:** `src/backend/src/app.ts:46`
- **Category:** Infra
- **Description:** The `/uploads` directory is served as static files without authentication or access controls. If user-uploaded files contain sensitive data or if the uploads directory is writable, unauthorized users can access all files.
- **Impact:** Unauthorized access to uploaded files which may contain sensitive documents, member data, or organizational information.
- **Evidence:**
  ```typescript
  app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
  ```
- **Remediation:** Add authentication middleware for uploads or implement signed URLs with expiration. At minimum, validate file types and scan for malicious content:
  ```typescript
  app.use("/uploads", authenticate, express.static(path.join(__dirname, "../uploads")));
  ```
- **CWE:** CWE-284 (Improper Access Control)

---

### [MEDIUM] No Soft Delete for Data Records

- **Location:** `src/backend/prisma/schema.prisma` (all models)
- **Category:** Data
- **Description:** All database models lack soft delete fields (`deletedAt`). Hard deletes via `prisma.attendance.delete()` (in `attendance.service.ts:109`) permanently remove data with no recovery option.
- **Impact:** Accidental or malicious data deletion is irreversible. Audit trails are lost. Compliance requirements (GDPR, financial records) may mandate retention.
- **Evidence:**
  ```typescript
  // attendance.service.ts:109
  await prisma.attendance.delete({ where: { id } });
  ```
- **Remediation:** Add `deletedAt DateTime?` field to all tenant-scoped models and use Prisma middleware to filter deleted records by default. Replace hard deletes with soft deletes:
  ```prisma
  model Attendance {
    // ... existing fields
    deletedAt DateTime? @map("deleted_at") @db.Timestamptz()
  }
  ```
- **CWE:** CWE-459 (Incomplete Cleanup)

---

### [MEDIUM] User Password Hash Potentially Exposed in Queries

- **Location:** `src/backend/src/services/auth.service.ts:214-220`
- **Category:** Data
- **Description:** The `login` method queries the user with `include: { profile: true, organization: true }`, which includes `passwordHash` in the result object. While it's not returned to the client, the password hash is loaded into memory and could be leaked through error handling or memory dumps.
- **Impact:** Password hash exposure in server memory increases risk of compromise through memory-based attacks.
- **Evidence:**
  ```typescript
  const user = await prisma.user.findFirst({
    where: { email: input.email },
    include: { profile: true, organization: true },
  });
  // user.passwordHash is available in memory
  ```
- **Remediation:** Use `select` to explicitly exclude sensitive fields, or use Prisma's `omit` feature:
  ```typescript
  const user = await prisma.user.findFirst({
    where: { email: input.email },
    include: { profile: true, organization: true },
    omit: { passwordHash: true },
  });
  // Only fetch passwordHash separately when needed
  const userWithHash = await prisma.user.findFirst({
    where: { email: input.email },
    select: { passwordHash: true },
  });
  ```
- **CWE:** CWE-200 (Exposure of Sensitive Information)

---

### [LOW] Swagger Docs Exposed Without Authentication

- **Location:** `src/backend/src/app.ts:49-52`
- **Category:** Infra
- **Description:** The Swagger API documentation is accessible at `/docs` without authentication, exposing the full API surface including endpoint signatures, parameter types, and response schemas.
- **Impact:** Assists attackers in mapping the attack surface and understanding API behavior.
- **Evidence:**
  ```typescript
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec, { ... }));
  ```
- **Remediation:** Restrict access in production or add authentication:
  ```typescript
  if (process.env.NODE_ENV !== 'production') {
    app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
  }
  ```
- **CWE:** CWE-200 (Exposure of Sensitive Information)

---

### [LOW] npm install Instead of npm ci in Dockerfile

- **Location:** `src/backend/Dockerfile:9`
- **Category:** Infra
- **Description:** `npm install` resolves and potentially modifies `package-lock.json`, leading to non-reproducible builds. This could introduce dependency confusion or supply chain attacks.
- **Impact:** Non-deterministic builds may install different dependency versions than intended.
- **Evidence:**
  ```dockerfile
  RUN npm install
  ```
- **Remediation:** Use `npm ci` for deterministic builds:
  ```dockerfile
  RUN npm ci --only=production
  ```
- **CWE:** CWE-829 (Inclusion of Functionality from Untrusted Control Sphere)

---

### [LOW] Email Templates Use Unescaped User Input

- **Location:** `src/backend/src/utils/email.ts:25, 37`
- **Category:** Input
- **Description:** Email templates interpolate user-provided values (name, org name, event title) directly into HTML strings without entity encoding.
- **Impact:** If email content is rendered by email clients that don't sanitize HTML, this could lead to email content injection (though modern email clients largely mitigate this).
- **Evidence:**
  ```typescript
  html: `<h1>Welcome, ${name}!</h1><p>Thank you for joining ${orgName}.</p>`,
  html: `<p>You're registered for <strong>${eventTitle}</strong> on ${eventDate.toLocaleDateString()}.</p>`,
  ```
- **Remediation:** HTML-encode all user-provided values:
  ```typescript
  function escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  html: `<h1>Welcome, ${escapeHtml(name)}!</h1>`,
  ```
- **CWE:** CWE-79 (Improper Neutralization of Input During Web Page Generation)

---

### [LOW] Full Error Object Logged to Console

- **Location:** `src/backend/src/middleware/errorHandler.ts:15`
- **Category:** Data
- **Description:** The error handler logs the full Error object, which may contain stack traces with file paths, database connection details, or sensitive data embedded in error messages.
- **Impact:** Information disclosure in server logs, especially if logs are aggregated or shipped to third-party services.
- **Evidence:**
  ```typescript
  console.error("Error:", err);
  ```
- **Remediation:** Log only sanitized error information:
  ```typescript
  console.error("Error:", err.message, process.env.NODE_ENV === 'development' ? err.stack : '');
  ```
- **CWE:** CWE-532 (Insertion of Sensitive Information into Log File)

---

### [LOW] Vite dev server allowedHosts Set to True

- **Location:** `src/frontend/vite.config.ts:14`
- **Category:** Infra
- **Description:** `allowedHosts: true` disables host header checking, allowing the Vite dev server to respond to requests with any Host header. This can be exploited for DNS rebinding attacks during development.
- **Impact:** DNS rebinding attacks during development could allow cross-origin requests to the dev server.
- **Evidence:**
  ```typescript
  server: {
    port: 5173,
    allowedHosts: true,
  ```
- **Remediation:** Restrict to specific hosts:
  ```typescript
  allowedHosts: ['localhost', 'dev.pwe-mm.site'],
  ```
- **CWE:** CWE-346 (Origin Validation Error)

---

## Positive Security Controls

The codebase implements several strong security patterns:

1. **Prisma ORM** - All database queries use parameterized statements, eliminating SQL injection risk entirely
2. **Zod Validation** - Request validation middleware applies schemas before controllers process data
3. **bcrypt Password Hashing** - Passwords hashed with 12 salt rounds via bcryptjs
4. **Refresh Token Rotation** - Old refresh tokens are revoked when new ones are issued, preventing token reuse
5. **Refresh Token Hashing** - Refresh tokens stored as SHA-256 hashes, not plaintext
6. **Helmet** - HTTP security headers applied via Express middleware
7. **Rate Limiting** - Both general API limiter (100/15min) and strict auth limiter (10/15min)
8. **RBAC Middleware** - Role hierarchy enforced at the route level with `requireMinRole` and `requireRole`
9. **Tenant Isolation** - `orgId` enforced on all tenant-scoped queries via JWT extraction
10. **CORS Configuration** - Origin restricted to `FRONTEND_URL` with credentials support
11. **Generic Error Messages** - Login errors don't reveal whether email or password is incorrect
12. **Transaction Safety** - Multi-step operations (signup, registration) wrapped in Prisma transactions
13. **JWT Access Token Expiry** - 15-minute expiry limits token theft window
14. **TLS Configuration** - Nginx enforces TLS 1.2/1.3 with strong ciphers
15. **HSTS** - HTTP Strict Transport Security enabled with 1-year max-age

---

## Remediation Priority Matrix

| # | Finding | Severity | Effort | Category |
|---|---------|----------|--------|----------|
| 1 | Hardcoded fallback JWT secrets | CRITICAL | Low | Auth |
| 2 | Token refresh parsing bug | CRITICAL | Low | Auth |
| 3 | Hardcoded DB credentials in compose | CRITICAL | Low | Infra |
| 4 | Tokens in localStorage | HIGH | High | Auth |
| 5 | Mass assignment in payment/announcement update | HIGH | Medium | Input |
| 6 | Docker container runs as root | HIGH | Low | Infra |
| 7 | Database port exposed | HIGH | Low | Infra |
| 8 | Weak seed password + logged credentials | HIGH | Low | Auth |
| 9 | Error details in non-production | HIGH | Low | Data |
| 10 | Dev mode in Dockerfile | HIGH | Medium | Infra |
| 11 | Registration cancel lacks RBAC | MEDIUM | Low | Logic |
| 12 | Guest registration mode bypass | MEDIUM | Low | Logic |
| 13 | Arbitrary formData in registration | MEDIUM | Medium | Input |
| 14 | Inconsistent Zod validation (customFields) | MEDIUM | Low | Input |
| 15 | Missing security headers in nginx | MEDIUM | Low | Infra |
| 16 | No frontend route-level auth | MEDIUM | Medium | Logic |
| 17 | Org data in localStorage | MEDIUM | Medium | Auth |
| 18 | Console error logging sensitive data | MEDIUM | Low | Data |
| 19 | Static file serving without auth | MEDIUM | Low | Infra |
| 20 | No soft delete | MEDIUM | High | Data |
| 21 | Password hash in query memory | MEDIUM | Low | Data |
| 22 | Swagger docs exposed | LOW | Low | Infra |
| 23 | npm install vs npm ci | LOW | Low | Infra |
| 24 | Email template HTML injection | LOW | Low | Input |
| 25 | Full error logged | LOW | Low | Data |
| 26 | Vite allowedHosts true | LOW | Low | Infra |
| 27 | Prisma Studio port exposed | LOW | Low | Infra |

---

## OWASP Top 10 (2021) Mapping

| OWASP Category | Findings |
|----------------|----------|
| **A01: Broken Access Control** | Mass assignment (#5), Registration cancel RBAC (#11), Guest registration bypass (#12), Frontend route auth (#16), Static file access (#19) |
| **A02: Cryptographic Failures** | Hardcoded JWT secrets (#1), Tokens in localStorage (#4), Weak seed password (#8) |
| **A03: Injection** | Arbitrary formData stored (#13), Email template injection (#24) |
| **A04: Insecure Design** | No soft delete (#20), Inconsistent validation (#14) |
| **A05: Security Misconfiguration** | Hardcoded DB creds (#3), DB port exposed (#7), Dev mode in Docker (#10), Missing security headers (#15), Swagger exposed (#22), Vite allowedHosts (#26) |
| **A06: Vulnerable and Outdated Components** | No known vulnerable dependencies at time of audit |
| **A07: Identification and Authentication Failures** | Token refresh parsing bug (#2), Docker root user (#6) |
| **A08: Software and Data Integrity Failures** | npm install non-deterministic (#23) |
| **A09: Security Logging and Monitoring Failures** | Error details leaked (#9), Console logging sensitive data (#18), Full error logged (#25) |
| **A10: Server-Side Request Forgery** | Not directly identified, though tenant isolation header trust could be exploited in specific scenarios |
