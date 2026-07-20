# Fix: Axios Token Refresh Reads Wrong Response Path (Issue #29)

**Date:** 2026-07-17
**File:** `src/frontend/src/lib/axios.ts`
**Reporter:** thet-naing-lin

## Problem

The Axios response interceptor for auto-refreshing tokens on 401 errors destructured `data.accessToken` and `data.refreshToken` from the API response. However, the backend wraps all responses in a nested structure:

```json
{
  "success": true,
  "data": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

The interceptor was reading `data.accessToken` (top-level `data` from Axios response destructuring), which resolved to `undefined` because the actual tokens were nested inside `data.data`.

### Impact

- Refreshed tokens were `undefined` when stored in `localStorage`
- The failed request retry used `undefined` as the Bearer token
- Users were immediately redirected to `/login` on the next request despite having valid refresh tokens

## Root Cause

```typescript
// BEFORE (broken)
const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken });
localStorage.setItem('accessToken', data.accessToken);      // undefined
localStorage.setItem('refreshToken', data.refreshToken);    // undefined
originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;  // "Bearer undefined"
```

The `data` variable from Axios destructuring is the response body (`{ success: true, data: { ... } }`). Accessing `data.accessToken` looks for a property that doesn't exist at that level.

## Fix

Destructure the nested `data.data` to correctly extract the tokens:

```typescript
// AFTER (fixed)
const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken });
const { accessToken, refreshToken: newRefreshToken } = data.data;
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', newRefreshToken);
originalRequest.headers.Authorization = `Bearer ${accessToken}`;
return api(originalRequest);
```

### Key Changes

| Line | Before | After |
|------|--------|-------|
| 30 | `data.accessToken` | `data.data.accessToken` (destructured as `accessToken`) |
| 31 | `data.data.refreshToken` | `data.data.refreshToken` (destructured as `newRefreshToken`) |
| 32 | `Bearer ${data.accessToken}` | `Bearer ${accessToken}` |

## Verification

1. Log in and obtain tokens
2. Wait for access token expiry or simulate a 401 response
3. Trigger an authenticated API request
4. Verify the interceptor successfully refreshes and stores new tokens
5. Confirm the original request is retried with the new token
6. User should NOT be redirected to `/login`
