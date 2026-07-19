# Security

> Security practices, checklist, and implementation guide for PWE.

## Security Principles

1. **Least privilege** — Users only access what their role requires
2. **Defense in depth** — Multiple layers: app, middleware, database
3. **Never trust user input** — Validate and sanitize everything
4. **Encrypt in transit and at rest** — TLS everywhere, hashed passwords
5. **Tenant isolation is sacred** — No cross-org data leaks, ever

---

## Authentication

### JWT Token Strategy

```
Access Token (15 min)          Refresh Token (7 days)
─────────────────────          ──────────────────────
- Short-lived                  - Longer-lived
- In Authorization header      - In httpOnly cookie
- Contains: userId, orgId,     - Contains: userId, tokenId
  role, exp                    - Hash stored in DB
- Stateless                    - Stateful (can revoke)
```

### Token Flow

```
1. Login → Backend validates credentials
2. Generate access token (15 min expiry)
3. Generate refresh token (7 day expiry)
4. Store refresh token HASH in refresh_tokens table
5. Set refresh token as httpOnly, Secure, SameSite=Strict cookie
6. Return access token in response body

API Request:
  Authorization: Bearer <access_token>

Access token expired?
  → POST /api/v1/auth/refresh with refresh token cookie
  → New access + refresh tokens issued
  → Old refresh token revoked (rotation)

Refresh token expired?
  → User must re-login
```

### Password Hashing

```typescript
// bcrypt with cost factor 12
const hash = await bcrypt.hash(password, 12);
const isValid = await bcrypt.compare(password, hash);
```

**Rules:**
- Minimum 8 characters, maximum 128 characters
- At least 1 uppercase letter and 1 number (enforced at registration via Zod)
- Never log passwords or hashes
- Never return password hash in API responses

---

## Authorization (RBAC)

### Role Hierarchy

```
Admin ──── Full access to org settings, users, all data
  │
Staff ──── Can manage members, events, attendance, payments
  │
Member ──── Can view events, register, view own profile
  │
Guest ──── Can register for public events only
```

### Permission Matrix

| Resource | Admin | Staff | Member | Guest |
|----------|-------|-------|--------|-------|
| Org settings | CRUD | Read | — | — |
| Users (staff) | CRU+role | — | — | — |
| Members | CRUD | CRU | Read (own) | — |
| Events | CRUD | CRUD | Read | Read (public) |
| Registrations | CRUD | CRU | Create (self), Read | Create |
| Attendance | CRUD | CRU | Read (own) | — |
| Payments | CRUD | CRU | Read (own) | — |
| Announcements | CRUD | CRU | Read | — |
| Reports | Full | Limited | — | — |

### Middleware Implementation

```typescript
// RBAC middleware
const authorize = (...roles: string[]) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' }
      });
    }
    next();
  };
};

// Usage
router.get('/users', auth, authorize('admin'), userController.list);
router.post('/members', auth, authorize('admin', 'staff'), memberController.create);
```

---

## Tenant Isolation

### Application Level

```typescript
// Prisma middleware — automatically filters by org_id
prisma.$use(async (params, next) => {
  // Skip for non-tenant-scoped models
  const tenantModels = ['Organization', 'User', 'Member', 'Event',
    'Registration', 'Attendance', 'Payment', 'Announcement'];

  if (tenantModels.includes(params.model) && params.action !== 'findFirst') {
    // Inject org_id filter
    if (!params.args.where) params.args.where = {};
    if (!params.args.where.orgId) {
      params.args.where.orgId = req.orgId; // From JWT
    }
  }

  return next(params);
});
```

### Database Level (RLS)

```sql
-- Enable Row Level Security on all tenant tables
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
-- ... etc

-- Policy: users can only see their org's data
CREATE POLICY org_isolation ON members
  USING (org_id = current_setting('app.current_org_id')::uuid);

-- Backend sets this per request:
-- SET app.current_org_id = '<org-id-from-jwt>';
```

### What This Prevents
- ❌ User from Org A querying Org B's members
- ❌ Forged API requests with different org_id
- ❌ SQL injection that tries to cross tenant boundaries
- ❌ Batch queries that accidentally mix org data

---

## Input Validation

### Backend: Zod Schemas

```typescript
import { z } from 'zod';

const CreateMemberSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional(),
  phone: z.string().regex(/^\+95\s?9\s?\d{4}\s?\d{4}$/, 'Invalid Myanmar phone'),
  email: z.string().email().optional(),
  membershipType: z.enum(['regular', 'premium', 'honorary']).default('regular'),
});

// Middleware
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', details: result.error.flatten() }
    });
  }
  req.body = result.data;
  next();
};

router.post('/members', auth, validate(CreateMemberSchema), memberController.create);
```

### Frontend: Same Zod Schemas

```typescript
// Shared schema used by both Formik and backend
import { CreateMemberSchema } from '@shared/schemas';

// In React component
const form = useFormik({
  validationSchema: toFormikValidationSchema(CreateMemberSchema),
  onSubmit: async (values) => {
    await api.post('/members', values);
  }
});
```

### Sanitization Rules
- **HTML**: Strip all HTML tags from user input (prevent XSS)
- **SQL**: Prisma parameterized queries (prevent SQL injection)
- **File uploads**: Validate MIME type, scan for malware (future)
- **URLs**: Validate format, reject javascript: protocol

---

## Rate Limiting

| Endpoint | Limit | Window | Action |
|----------|-------|--------|--------|
| POST /auth/login | 5 | 1 min | 429 Too Many Requests |
| POST /auth/signup | 3 | 5 min | 429 |
| POST /auth/refresh | 10 | 1 min | 429 |
| All other API | 100 | 1 min | 429 |
| File upload | 10 | 1 min | 429 |
| Public endpoints | 30 | 1 min | 429 |

### Implementation

```typescript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 60 * 1000,     // 1 minute
  max: 5,                   // 5 attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts' } }
});

app.use('/api/v1/auth/login', authLimiter);
```

---

## CORS Policy

```typescript
// Single origin from environment variable
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,                       // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,                          // Cache preflight for 24h
}));
```

---

## Security Headers

```nginx
# Nginx security headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'" always;
```

---

## Secrets Management

### Rules
1. **Never commit** `.env` files to git
2. **Never log** secrets, tokens, or passwords
3. **Rotate** secrets periodically (quarterly)
4. **Use different** secrets per environment

### .gitignore

```
.env
.env.local
.env.*.local
*.pem
*.key
```

### Secret Inventory

| Secret | Where Used | Rotation |
|--------|-----------|----------|
| DB_PASSWORD | Backend env | Quarterly |
| JWT_SECRET | Backend env (required at startup) | Quarterly |
| REFRESH_TOKEN_SECRET | Backend env (required at startup) | Quarterly |
| DEPLOY_KEY | GitHub Secrets | On compromise |
| SMTP_PASS (future) | Backend env | Quarterly |

> **Note:** `JWT_SECRET` and `REFRESH_TOKEN_SECRET` are validated at server startup. The application will refuse to start if either is missing.

---

## Data Protection

### What We Store
- ✅ Passwords: bcrypt hash (irreversible)
- ✅ Refresh tokens: SHA-256 hash (irreversible)
- ✅ PII (names, phones, emails): Encrypted at rest (PostgreSQL)
- ✅ Payment references: Plain text (needed for reconciliation)

### What We Never Store
- ❌ Plain text passwords
- ❌ Full credit card numbers
- ❌ API keys in code
- ❌ Tokens in localStorage (use httpOnly cookies)

### Data Retention
- Member data: Retained while org is active
- Deleted orgs: Data purged after 30-day grace period
- Logs: Retained for 90 days
- Backups: Retained for 30 days

---

## Security Checklist

### Pre-Launch (MVP)

- [ ] All API endpoints require authentication (except public routes)
- [ ] RBAC middleware on every protected route
- [ ] Tenant isolation middleware active on all tenant-scoped queries
- [ ] Input validation (Zod) on all mutation endpoints
- [ ] Rate limiting on auth endpoints
- [ ] CORS configured correctly
- [ ] HTTPS/TLS enabled
- [ ] Security headers in nginx
- [ ] `.env` files in `.gitignore`
- [ ] No secrets in code or logs
- [ ] JWT secrets validated at startup (no hardcoded fallbacks)
- [ ] bcrypt cost factor >= 12
- [ ] Password complexity enforced (uppercase + number, max 128 chars)
- [ ] JWT access token expiry <= 15 minutes
- [ ] Refresh token rotation enabled
- [ ] Registration capacity check uses database transaction
- [ ] SQL injection prevented (Prisma parameterized queries)
- [ ] XSS prevention (input sanitization, CSP headers)
- [ ] Error messages don't leak internal details

### Post-Launch

- [ ] Penetration testing
- [ ] Dependency vulnerability scanning (npm audit)
- [ ] Log monitoring for suspicious activity
- [ ] Backup restoration tested
- [ ] Incident response plan documented
- [ ] Security contact published

---

## Incident Response

### Severity Levels

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| **P0 — Critical** | Data breach, system compromise | Immediate | Unauthorized data access |
| **P1 — High** | Auth bypass, tenant leak | < 1 hour | User accessing other org's data |
| **P2 — Medium** | Security weakness | < 24 hours | Missing input validation |
| **P3 — Low** | Minor security issue | < 1 week | Outdated dependency |

### Response Steps

1. **Identify** — What happened? Who is affected?
2. **Contain** — Stop the bleeding (revoke tokens, block IPs, take system offline if needed)
3. **Eradicate** — Fix the root cause
4. **Recover** — Restore normal operation
5. **Learn** — Post-mortem, update procedures

### Contact Chain
1. Lead developer → 2. Project owner → 3. Hosting provider (DigitalOcean support)

---

## Myanmar-Specific Considerations

- **Phone validation**: Myanmar format (+95 9 xxx xxxx)
- **Language**: Ensure UTF-8/Burmese text handling in DB and forms
- **Payment data**: Manual tracking only — no automated payment gateway in MVP (avoid PCI compliance burden)
- **Low bandwidth**: Minimize payload sizes, compress images, lazy-load where possible
- **Shared devices**: Implement session timeout, clear state on logout
