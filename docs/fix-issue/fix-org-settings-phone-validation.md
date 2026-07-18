# Fix: Phone Input Field Lacks Validation in Org Settings (Issue #36)

**Date:** 2026-07-17
**File:** `src/frontend/src/pages/SettingsPage.tsx`

## Problem

The **Phone** field in Organization Settings accepted any characters including letters (e.g., `rrrr`) and saved successfully without any format validation.

### Steps to Reproduce

1. Go to Organization Settings
2. Enter letters (`rrrr`) in the Phone field
3. Click "Save Changes" — it saves without errors

## Root Cause

The Phone `<Input>` had no validation attributes or handler:

```tsx
// BEFORE (no validation)
<Input
  label="Phone"
  value={form.phone}
  onChange={(e) => setForm({ ...form, phone: e.target.value })}
/>
```

No `pattern`, no `onChange` validation, and no submit-time check.

## Fix

Added a regex validation function and real-time error feedback:

```tsx
// Regex: allows digits, spaces, hyphens, parentheses, optional leading +
const phoneRegex = /^[+]?[\d\s\-()]+$/;
```

### Changes

1. **`validatePhone()` function** — validates against the regex, sets error state
2. **`onChange` handler** — validates on each keystroke for instant feedback
3. **`pattern` attribute** — HTML5 native validation as fallback
4. **Error message** — displays below the input when validation fails
5. **Submit guard** — blocks form submission if phone is invalid

### Allowed Characters

| Character | Example | Allowed |
|-----------|---------|---------|
| Digits | `09123456789` | ✅ |
| Leading `+` | `+959123456789` | ✅ |
| Hyphens | `09-123-456` | ✅ |
| Parentheses | `(09) 123 456` | ✅ |
| Spaces | `091 234 567` | ✅ |
| Letters | `rrrr` | ❌ |
| Other symbols | `@#$%` | ❌ |

## Verification

1. Go to Organization Settings
2. Enter letters in the Phone field → error message appears, save is blocked
3. Enter valid phone number (e.g., `+959123456789`) → no error, saves successfully
4. Clear the phone field → no error (phone is optional)
