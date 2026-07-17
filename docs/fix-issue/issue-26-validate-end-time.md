# Fix Issue #26: Validate End Time Cannot Be Earlier Than Start Time

**Issue Title:** [Bug] Validate End Time Cannot Be Earlier Than Start Time

**Date:** 2026-07-17

**Status:** Fixed

---

## Problem

Users could select an end time that is earlier than the start time on the same date when creating or updating events. This created invalid event durations that should not be allowed.

### Example of Invalid Input

- **Start:** 19/07/2026 10:30 AM
- **End:** 19/07/2026 10:00 AM

This creates a negative duration event which is logically invalid.

### Impact

1. **Data Integrity**: Invalid event durations corrupt event data
2. **User Confusion**: Events with end times before start times are confusing
3. **Downstream Issues**: Calendar integrations, reports, and time-based queries may break
4. **Poor UX**: No immediate feedback when users make this mistake

---

## Fix

### 1. Backend Validation (Zod Schema)

Added `.refine()` validation to both `create` and `update` event schemas in `src/backend/src/middleware/validate.middleware.ts`:

```typescript
export const eventSchemas = {
  create: z.object({
    body: z.object({
      // ... existing fields
    }),
  }).refine(
    (data) => {
      const { startDate, endDate } = data.body;
      if (!endDate || endDate === "") return true;
      return new Date(endDate) > new Date(startDate);
    },
    {
      message: "End date must be after start date",
      path: ["body", "endDate"],
    }
  ),
  update: z.object({
    // ... existing schema
  }).refine(
    (data) => {
      const { startDate, endDate } = data.body;
      if (!startDate || !endDate || endDate === "") return true;
      return new Date(endDate) > new Date(startDate);
    },
    {
      message: "End date must be after start date",
      path: ["body", "endDate"],
    }
  ),
};
```

### 2. Frontend Validation (Event Creation Hook)

Added validation in `src/frontend/src/hooks/useEventsPage.ts` before submitting the form:

```typescript
const handleCreate = useCallback(
  async (publish: boolean) => {
    // Validate end date is after start date
    if (form.startDate && form.endDate) {
      const startDate = new Date(form.startDate);
      const endDate = new Date(form.endDate);
      if (endDate <= startDate) {
        toast('End date must be after start date', 'error');
        return;
      }
    }

    // ... rest of the function
  },
  [form, fetchEvents, toast]
);
```

### 3. Frontend Validation (Wizard Navigation)

Added validation in `src/frontend/src/pages/EventsPage.tsx` when clicking "Next" on step 1:

```typescript
<Button onClick={() => {
  // Validate dates on step 1
  if (step === 1 && form.startDate && form.endDate) {
    const startDate = new Date(form.startDate);
    const endDate = new Date(form.endDate);
    if (endDate <= startDate) {
      toast('End date must be after start date', 'error');
      return;
    }
  }
  setStep((s) => s + 1);
}}>
  Next
</Button>
```

---

## Validation Behavior

### When Validation Fails

1. **Frontend (Wizard)**: Toast notification "End date must be after start date" appears
2. **Frontend (Submit)**: Toast notification appears, form is not submitted
3. **Backend (API)**: Returns 400 error with message "End date must be after start date"

### Edge Cases Handled

1. **Empty end date**: Allowed (end date is optional)
2. **Same start and end time**: Not allowed (end must be strictly after start)
3. **End date before start date**: Not allowed
4. **Different dates**: End date must be after start date (regardless of time)

---

## Testing

### Test Cases

1. **Valid: End time after start time**
   - Start: 2026-07-19T10:00
   - End: 2026-07-19T11:00
   - Expected: ✅ Allowed

2. **Invalid: End time before start time**
   - Start: 2026-07-19T10:30
   - End: 2026-07-19T10:00
   - Expected: ❌ Error message

3. **Invalid: End time same as start time**
   - Start: 2026-07-19T10:00
   - End: 2026-07-19T10:00
   - Expected: ❌ Error message

4. **Valid: No end time provided**
   - Start: 2026-07-19T10:00
   - End: (empty)
   - Expected: ✅ Allowed

5. **Valid: End date after start date**
   - Start: 2026-07-19T10:00
   - End: 2026-07-20T10:00
   - Expected: ✅ Allowed

6. **Invalid: End date before start date**
   - Start: 2026-07-19T10:00
   - End: 2026-07-18T10:00
   - Expected: ❌ Error message

### Manual Testing Steps

1. Go to Events page
2. Click "Create Event"
3. Enter a start date/time
4. Enter an end date/time that is earlier
5. Click "Next"
6. Verify toast error message appears
7. Correct the end time to be after start time
8. Click "Next"
9. Verify you can proceed to next step

---

## Files Modified

1. **`src/backend/src/middleware/validate.middleware.ts`**
   - Added `.refine()` validation to `eventSchemas.create`
   - Added `.refine()` validation to `eventSchemas.update`

2. **`src/frontend/src/hooks/useEventsPage.ts`**
   - Added date validation before form submission in `handleCreate`

3. **`src/frontend/src/pages/EventsPage.tsx`**
   - Added `useToast` import
   - Added date validation when clicking "Next" on step 1

---

## Prevention

To prevent similar issues in the future:

1. **Always validate temporal relationships**: End times/dates should always be validated against start times/dates
2. **Provide immediate feedback**: Validate on step navigation, not just on form submission
3. **Use consistent validation**: Validate on both frontend and backend for defense in depth
4. **Clear error messages**: Tell users exactly what's wrong and how to fix it
5. **Consider edge cases**: Think about empty values, same values, and boundary conditions
