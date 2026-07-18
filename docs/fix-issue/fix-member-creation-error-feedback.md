# Fix: Member Creation Fails with Generic Error Message (Issue #44)

**Date:** 2026-07-17
**File:** `src/frontend/src/pages/MembersPage.tsx`

## Problem

Creating or updating a member showed a generic "Failed to create member" / "Failed to update member" toast with no details about what went wrong.

## Root Cause

The `catch` blocks discarded the error entirely:

```tsx
catch {
  toast('Failed to create member', 'error');
}
```

The backend returns structured errors (`{ success: false, error: "...", details: [...] }`) but they were never extracted from the Axios error object.

## Fix

### 1. Frontend Validation Before Submission

Added `validateMember()` that checks required fields before sending:

| Field | Rule |
|-------|------|
| firstName | Required |
| lastName | Required |
| phone | Required |
| email | Valid format (if provided) |

### 2. Backend Error Extraction

Added `extractBackendErrors()` helper that:
- Extracts field-level errors from `response.data.details` and maps them to form state
- Falls back to `response.data.error` for general messages (e.g., "Email already registered")
- Returns a user-friendly string for the toast

```tsx
const extractBackendErrors = (err: unknown): string => {
  if (isAxiosError(err) && err.response?.data) {
    const data = err.response.data;
    if (data.details && Array.isArray(data.details)) {
      // Map field errors to form state for inline display
      setFieldErrors(errors);
      return 'Please fix the form errors below';
    }
    if (data.error) return data.error;
  }
  return 'An unexpected error occurred';
};
```

### 3. Inline Field Error Display

Both create and update forms now show:
- **Red borders** on invalid fields via the `error` prop on Input/Select
- **Error messages** below each field
- **Real-time clearing** as the user corrects input

### Applied to Both Flows

- `handleCreate` — validates, extracts backend errors, shows field errors
- `handleUpdate` — same treatment for the edit flow

## Verification

1. Open Add Member modal
2. Submit with empty required fields → inline "required" errors appear
3. Enter invalid email → "Invalid email format" error
4. Submit with valid data → member created successfully
5. Try creating duplicate → toast shows specific backend error
