# Fix: Login Error Handling — Inline Field Errors and No Page Reload

**Date:** 2026-07-18
**Files:** `src/frontend/src/pages/LoginPage.tsx`, `src/frontend/src/lib/axios.ts`

## Problem

Two issues with the login error flow:

1. **Page reloads on failed login** — The axios response interceptor catches all 401 errors and redirects to `/login` via `window.location.href`. During a login attempt (where no valid refresh token exists), this causes a full page reload, losing the user's input and showing a flash of the login page.

2. **No inline error feedback** — Login failures only showed a toast notification. Users couldn't easily see which credentials were wrong or that an error occurred without noticing the toast.

## Root Cause

### Axios Interceptor Redirect

```ts
// Original — catches ALL 401s including login failures
if (error.response?.status === 401 && !originalRequest._retry) {
  // ... tries refresh, then redirects to /login
  window.location.href = '/login';
}
```

When the login endpoint returns 401 (wrong email/password), the interceptor intercepts it, attempts a refresh (which fails since there's no valid token), and then does a hard redirect to `/login` — causing a full page reload.

### Toast-Only Error Display

The catch block in `handleSubmit` extracted the error message but only showed it via `toast()`:

```tsx
catch (err: unknown) {
  const msg = err instanceof Error ? err.message : 'Login failed';
  toast(msg, 'error');
}
```

No visual indicator on the form fields themselves.

## Fix

### 1. Skip Axios Redirect for Login Requests (`axios.ts`)

Added `isLoginRequest` detection to skip the auto-refresh redirect logic for `/auth/login` calls:

```ts
const isLoginRequest = originalRequest.url?.includes('/auth/login');

if (error.response?.status === 401 && !originalRequest._retry && !isLoginRequest) {
  // ... refresh logic
}
```

Also added `isLoginRequest` guard on the redirect calls inside the refresh catch block and the no-refresh-token branch.

### 2. Inline Field Errors (`LoginPage.tsx`)

Replaced toast-only error handling with field-level error state:

```tsx
const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

// In catch block:
if (msg.toLowerCase().includes('invalid email or password')) {
  setErrors({ email: 'Invalid email or password', password: 'Invalid email or password' });
} else {
  setErrors({ general: msg });
}
```

Each field now displays:
- **Red border** (`border-red-300`) when it has an error
- **Error text** below the input
- **Clears on change** — typing in a field removes its error

General errors (e.g., "Account is disabled") show in a red banner at the top of the form.

### 3. Removed Unused Imports

Removed `useToast` and `Input` imports that were no longer needed.

## Verification

1. Enter wrong email → both fields show red border + "Invalid email or password"
2. Enter wrong password → same behavior
3. Page does NOT reload — form state is preserved
4. Type in email field → error clears on that field
5. Account disabled → red banner shows "Account is disabled"
6. Successful login → navigates to dashboard as before
