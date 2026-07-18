# Fix: Axios Refresh Call Uses Raw `axios` Instead of Configured `api` Instance (Issue #30)

**Date:** 2026-07-17
**File:** `src/frontend/src/lib/axios.ts`

## Problem

The token refresh interceptor called `axios.post('/api/v1/auth/refresh', ...)` using the raw `axios` import instead of the configured `api` instance. The `api` instance has `baseURL: '/api/v1'` set, so all requests via `api` are relative to that base. The raw `axios` call:

- Has no `baseURL` configured — works by coincidence with an absolute path
- Does not carry the same interceptors, default headers, or shared configuration
- Will break silently if the backend is proxied or the base URL changes

## Root Cause

```typescript
// BEFORE (broken)
const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken });
```

The raw `axios` instance bypasses the configured `api` instance's `baseURL`, headers, and interceptors.

## Fix

Use the configured `api` instance with a relative path (since `baseURL: '/api/v1'` is already set):

```typescript
// AFTER (fixed)
const { data } = await api.post('/auth/refresh', { refreshToken });
```

### Key Changes

| Line | Before | After |
|------|--------|-------|
| 29 | `axios.post('/api/v1/auth/refresh', ...)` | `api.post('/auth/refresh', ...)` |

## Benefits

- Consistent with all other API calls in the application
- Carries the correct `baseURL`, default headers, and shared configuration
- Resilient to proxy changes or base URL updates
- Future configuration added to `api` automatically applies to refresh calls

## Verification

1. Log in and obtain tokens
2. Open DevTools → Network tab
3. Trigger a 401 by removing `accessToken` from localStorage
4. Verify the refresh request uses the `api` instance's configuration
5. Confirm the request goes to the correct endpoint
