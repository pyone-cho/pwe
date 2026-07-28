# Frontend Refactoring Plan

## Goal
Improve maintainability, readability, and scalability of the frontend without changing core product behavior.

## Priority 1 — Extract page logic from large components

### Target files
- src/frontend/src/pages/MembersPage.tsx
- src/frontend/src/pages/AnnouncementsPage.tsx
- src/frontend/src/pages/SettingsPage.tsx
- src/frontend/src/pages/MemberDashboardPage.tsx

### Refactor approach
- Move stateful logic (fetching, form handling, validation, mutations) into custom hooks.
- Keep page components focused on layout and rendering.
- Introduce dedicated hooks such as:
  - useMembersPage()
  - useAnnouncementsPage()
  - useSettingsPage()

### Expected benefit
- Easier testing
- Cleaner components
- Less duplication across related pages

## Priority 2 — Consolidate authentication and token handling

### Target files
- src/frontend/src/hooks/useAuth.tsx
- src/frontend/src/lib/axios.ts

### Refactor approach
- Create a shared auth utility for token storage and refresh handling.
- Centralize token persistence logic so the hook and axios client use the same source.
- Consider introducing a small auth service wrapper for login, logout, refresh, and session initialization.

### Expected benefit
- Fewer inconsistencies
- Easier debugging of auth issues
- Simpler future changes around session expiration

## Priority 3 — Improve type safety in services

### Target files
- src/frontend/src/services/events.ts
- src/frontend/src/services/auth.ts
- other service modules that still use loose typing

### Refactor approach
- Replace `any` with explicit types from the shared types module.
- Add response mapping helpers with typed return values.
- Define clear interfaces for API payloads and mapped UI models.

### Expected benefit
- Better editor support
- Fewer runtime errors from shape mismatches
- Safer refactors when the API changes

## Priority 4 — Split large presentational pages into smaller components

### Target files
- src/frontend/src/pages/HomePage.tsx
- src/frontend/src/pages/DashboardPage.tsx

### Refactor approach
- Break large sections into smaller components such as:
  - HeroSection
  - FeatureGrid
  - EventCardList
  - StatsSection
- Move repeated UI patterns into reusable components under src/frontend/src/components/

### Expected benefit
- Easier maintenance
- Better reusability
- Smaller files that are easier to reason about

## Priority 5 — Standardize form and validation patterns

### Target files
- src/frontend/src/pages/*Page.tsx
- src/frontend/src/components/ui/*

### Refactor approach
- Use a consistent pattern for form state, validation, and error display.
- Extract shared helpers for:
  - field errors
  - validation rules
  - submit handlers
- Reduce inline form logic repeated across pages.

### Expected benefit
- More consistent UX
- Less boilerplate
- Simpler future form additions

## Priority 6 — Improve project structure and naming

### Refactor approach
- Keep feature-based grouping where practical.
- Ensure hooks, services, and components follow consistent naming.
- Avoid mixing page-specific logic into generic UI components.

### Expected benefit
- Faster onboarding for new developers
- Clearer boundaries between layers

## Suggested implementation order
1. Start with MembersPage and auth flow.
2. Extract shared hooks for the most complex pages.
3. Improve service typing.
4. Break down large presentational pages.
5. Review and remove leftover duplication.

## Definition of done
- Core pages are easier to read and maintain.
- Shared logic is centralized.
- Type safety is stronger.
- No regression in user-visible behavior.
