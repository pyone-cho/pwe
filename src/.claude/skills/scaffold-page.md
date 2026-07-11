---
name: scaffold-page
description: Generate a page component with layout, routing, and navigation for PWE
---

# Scaffold Page

Generate a page component with layout wrapper and route setup.

## Usage

When the user says "create page X" or "add MembersPage", follow these steps:

## Steps

1. **Determine page type** — admin (DashboardLayout) or public (PublicLayout)
2. **Create page component** in `src/frontend/src/pages/`
3. **Add route** to `App.tsx`
4. **Add navigation link** to `Sidebar.tsx` (if admin page)

## Admin Page Template

```tsx
import React from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { use<Feature>s } from '../features/<feature>/hooks/use<Feature>';
import { Spinner } from '../components/ui/Spinner';
import { ErrorState } from '../components/shared/ErrorState';
import { EmptyState } from '../components/shared/EmptyState';

export const <Feature>Page: React.FC = () => {
  const { <features>, loading, error } = use<Feature>s();

  if (loading) return <DashboardLayout><Spinner /></DashboardLayout>;
  if (error) return <DashboardLayout><ErrorState message={error} /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900"><Feature>s</h1>
        {<features>.length === 0 ? <EmptyState message="No <features> found" /> : <<Feature>List <features>={<features>} />}
      </div>
    </DashboardLayout>
  );
};
```

## Route Setup (App.tsx)

```tsx
import { <Feature>Page } from './pages/<Feature>Page';

<Route path="<feature>" element={<<Feature>Page />} />
```

## Important

- Check existing pages for patterns first
- Use appropriate layout wrapper
- Handle loading, error, and empty states
- Add route to App.tsx
