# Fix: Members Page Status Filter and Search Not Working (Issue #42)

**Date:** 2026-07-17
**File:** `src/frontend/src/pages/MembersPage.tsx`

## Problem

Two bugs on the Members page:

1. **Status filter** — Selecting a status (active, inactive, suspended) did not update the table. Previous data remained displayed.
2. **Search box** — Typing a search term and pressing Enter (or clicking Search) did not filter results.

## Root Cause

### Status Filter

The `useEffect` that triggers `fetchMembers` only depended on `[page, statusFilter]`:

```tsx
useEffect(() => {
  fetchMembers();
}, [page, statusFilter]);
```

`fetchMembers` captures `search` from its closure. When `statusFilter` changed, the effect fired but `search` was stale — it used whatever value was captured when `fetchMembers` was last defined, not the current input value.

### Search

`handleSearch` called `fetchMembers()` directly instead of triggering the `useEffect`:

```tsx
const handleSearch = () => {
  goToPage(1);
  fetchMembers();  // bypasses the effect — no state change in deps
};
```

If the user was already on page 1, `goToPage(1)` didn't change state, so the effect never fired. The direct `fetchMembers()` call worked but inconsistently — it didn't reset pagination properly in all cases.

## Fix

1. **Added `search` and `searchTrigger` to `useEffect` dependencies** — ensures the effect re-runs when search or filter changes
2. **Added `searchTrigger` counter** — incremented on Enter/Search click to force a fetch even when page is already 1
3. **Simplified `handleSearch`** — just resets page and increments trigger; the effect handles the actual fetch

```tsx
const [searchTrigger, setSearchTrigger] = useState(0);

useEffect(() => {
  fetchMembers();
}, [page, statusFilter, search, searchTrigger]);

const handleSearch = () => {
  goToPage(1);
  setSearchTrigger((t) => t + 1);
};
```

## Verification

1. Go to Members page
2. Change status filter → table updates to show only matching members
3. Type a search term and press Enter → table filters by name/email/phone
4. Change status while search is active → both filters apply correctly
5. Click Search button → results update with current search and filter
