# Fix: Login and Registration Endpoints Return HTTP 429 on First Request

**Issue:** [#46](https://github.com/pyone-cho/pwe/issues/46)
**Date:** 2026-07-18
**Status:** Fixed

---

## Problem

The Login and Registration endpoints (`/api/v1/auth/login`, `/api/v1/auth/register`) returned **HTTP 429 (Too Many Requests)** on the very first attempt, without the user having exceeded any rate limit. This rendered the application completely unusable — existing users could not log in and new users could not register.

## Root Cause

The application had **two layers of rate limiting** on auth endpoints, with the nginx layer being overly restrictive:

### Layer 1: Nginx Rate Limiting (nginx.conf)

```nginx
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
# ...
location /api/v1/auth/ {
    limit_req zone=auth burst=5 nodelay;
}
```

- **Rate:** 5 requests per minute per IP
- **Burst:** 5 additional requests allowed in quick succession
- **Effective limit:** ~10 requests in a short burst, then blocked

This is far too restrictive for authentication endpoints. Legitimate users attempting to log in or register would hit this limit almost immediately, especially if:
- The frontend makes multiple requests (e.g., login + profile fetch)
- The user retries after a brief error
- Multiple users share the same IP (e.g., behind NAT/VPN)

### Layer 2: Express Rate Limiting (rateLimit.middleware.ts)

```typescript
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  // ...
});
```

- **Rate:** 10 requests per 15 minutes per IP
- This layer was reasonable on its own, but combined with nginx's aggressive limit, users were blocked before requests even reached Express.

### How the Double Rate Limit Caused the Issue

1. Nginx applies its `5r/m` limit first (at the proxy layer)
2. If nginx passes the request through, Express applies its own `10 req/15min` limit
3. The nginx limit was so restrictive that most requests were blocked at step 1
4. The error message `"Too many requests, please try again later."` was returned by nginx, not Express

## Fix

### Nginx Configuration Change

**File:** `src/dev-deployment/nginx.conf`

**Before:**
```nginx
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
# ...
limit_req zone=auth burst=5 nodelay;
```

**After:**
```nginx
limit_req_zone $binary_remote_addr zone=auth:10m rate=30r/m;
# ...
limit_req zone=auth burst=10 nodelay;
```

### Changes Made

| Setting | Before | After | Rationale |
|---------|--------|-------|-----------|
| `rate` | `5r/m` | `30r/m` | Allows 30 requests/minute — sufficient for login/register with retries |
| `burst` | `5` | `10` | Allows burst of 10 requests for rapid form submissions and page loads |

### Why These Values

- **30r/m** provides a reasonable balance:
  - Allows legitimate users to log in/register without hitting limits
  - Still protects against brute-force attacks (30 attempts/minute is far below what an attacker needs)
  - Accounts for frontend making multiple requests per user action

- **burst=10** handles:
  - Initial page load + API calls on login/register pages
  - User retries after validation errors
  - Multiple rapid requests during form submission

### Express Rate Limiter (Unchanged)

The Express `authLimiter` (10 requests per 15 minutes) was left unchanged because:
- It serves as a second layer of defense behind nginx
- Its limits are reasonable for auth endpoints
- It provides per-application protection if nginx is bypassed

## Architecture: Two-Layer Rate Limiting

```
Client → Nginx (Layer 1) → Express (Layer 2) → Application
```

| Layer | Purpose | Limit |
|-------|---------|-------|
| Nginx | Per-IP, per-minute protection at proxy level | 30r/m, burst 10 |
| Express | Per-IP, per-15min protection at application level | 10 req/15min |

This defense-in-depth approach ensures:
1. Nginx blocks obvious abuse early (before it reaches the application)
2. Express provides application-level protection as a fallback
3. Both layers work together without conflicting

## Verification

After deploying this fix:
1. Navigate to the Login or Registration page
2. Enter valid credentials or registration details
3. Submit the form — should receive `200 OK` or validation errors (not 429)
4. Rapid retry (5-10 times) should still work without hitting limits
5. Excessive retry (30+ times in a minute) should trigger 429

## Related Files

- `src/dev-deployment/nginx.conf` — nginx rate limit configuration
- `src/backend/src/middleware/rateLimit.middleware.ts` — Express rate limiters
- `src/backend/src/routes/auth.routes.ts` — Auth route definitions with rate limiters applied
