---
name: scaffold-frontend-feature
description: Generate complete frontend feature module for PWE (types, api, hooks, components)
---

# Scaffold Frontend Feature

Generate the complete boilerplate for a new PWE frontend feature module.

## Usage

When the user says "scaffold frontend feature X" or "create frontend module for X", follow these steps:

## Steps

1. **Read Feature-spec.md** — find the feature's API endpoints and UI screens
2. **Read CLAUDE.md** — verify frontend conventions
3. **Read existing features** — check `src/frontend/src/features/` for patterns
4. **Generate files** at `src/frontend/src/features/<feature>/`:
   - `types.ts` — TypeScript interfaces matching backend
   - `api.ts` — Axios calls matching backend endpoints
   - `hooks/use<Feature>.ts` — Data fetching hooks
   - `components/<Feature>List.tsx` — List component
   - `components/<Feature>Form.tsx` — Form component
   - `components/<Feature>Detail.tsx` — Detail component
   - `index.ts` — Public exports

## File Structure

```
features/<feature>/
├── api.ts
├── types.ts
├── hooks/
│   └── use<Feature>.ts
├── components/
│   ├── <Feature>List.tsx
│   ├── <Feature>Form.tsx
│   └── <Feature>Detail.tsx
└── index.ts
```

## Types Template

```typescript
export interface <Feature> {
  id: string;
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Create<Feature>Input { /* required fields */ }
export interface Update<Feature>Input { /* optional fields */ }
export interface <Feature>ListParams { page?: number; limit?: number; search?: string; }
```

## API Template

```typescript
import api from '../../lib/axios';

export const <feature>Api = {
  list: (params: <Feature>ListParams) => api.get('/<features>', { params }),
  get: (id: string) => api.get(`/<features>/${id}`),
  create: (data: Create<Feature>Input) => api.post('/<features>', data),
  update: (id: string, data: Update<Feature>Input) => api.put(`/<features>/${id}`, data),
  delete: (id: string) => api.delete(`/<features>/${id}`),
};
```

## Hook Template

```typescript
import { useState, useEffect, useCallback } from 'react';
import { <feature>Api } from '../api';

export const use<Feature>s = () => {
  const [<features>, set<Features>] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch<Features> = useCallback(async () => {
    setLoading(true);
    try {
      const response = await <feature>Api.list({ page: 1, limit: 20 });
      set<Features>(response.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch<Features>(); }, [fetch<Features>]);
  return { <features>, loading, error, refetch: fetch<Features> };
};
```

## Important

- Check existing features for patterns first
- Types must match backend Zod schemas
- API calls must match backend routes from api-design.md
