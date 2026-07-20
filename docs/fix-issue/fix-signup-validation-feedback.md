# Fix: Replace Generic Error with Clear Validation Feedback on Signup (Issue #43)

**Date:** 2026-07-17
**Files:** `src/frontend/src/pages/SignupPage.tsx`

## Problem

Submitting the "Create Organization" form with invalid or duplicate data showed a generic error:

> "Request failed with status code 400"

Users had no idea what went wrong or how to fix it.

## Root Cause

The `catch` block only handled `Error` instances with generic messages:

```tsx
catch (err: unknown) {
  const msg =
    err instanceof Error && err.message.includes('Network Error')
      ? 'Cannot connect to server...'
      : err instanceof Error
        ? err.message
        : 'Signup failed';
  toast(msg, 'error');
}
```

Axios errors are not standard `Error` instances — they have `response.data` with structured backend errors. The backend returns:

- **Validation errors (400)**: `{ success: false, error: "Validation failed", details: [{ field: "body.email", message: "Invalid email" }] }`
- **Business logic errors (409)**: `{ success: false, error: "Organization slug already exists" }`

None of these were extracted from the Axios error object.

## Fix

### 1. Frontend Validation Before Submission

Added a `validate()` function that checks all fields before sending:

| Field | Rule |
|-------|------|
| orgName | Required |
| slug | Required, lowercase alphanumeric with hyphens |
| email | Required, valid format |
| password | Required, min 8 characters |
| firstName | Required |

### 2. Backend Error Extraction

The catch block now handles Axios errors specifically:

```tsx
if (isAxiosError(err) && err.response?.data) {
  const data = err.response.data;
  if (data.details && Array.isArray(data.details)) {
    // Map field errors to form state
    const errors: FieldErrors = {};
    data.details.forEach((d) => {
      const field = d.field.replace('body.', '');
      errors[field] = d.message;
    });
    setFieldErrors(errors);
    toast('Please fix the form errors below', 'error');
  } else if (data.error) {
    toast(data.error, 'error');  // e.g. "Organization slug already exists"
  }
}
```

### 3. Inline Field Error Display

Each field now shows:
- **Red border** when it has an error
- **Error message** below the input
- **Clears on change** so users see errors disappear as they fix them

## Verification

1. Submit with empty fields → inline "required" errors appear
2. Enter invalid email → "Invalid email format" error
3. Enter short password → "Password must be at least 8 characters"
4. Enter existing slug → toast shows "Organization slug already exists"
5. Enter existing email → toast shows "Email already registered"
6. Fix errors → red borders clear in real-time
