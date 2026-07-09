---
name: scaffold-feature
description: Generate boilerplate for a new PWE feature module (backend routes + frontend components)
---

# Scaffold Feature

Generate the complete boilerplate for a new PWE feature module.

## Usage

When the user says "scaffold feature X" or "create feature module for X", follow these steps:

## Steps

1. **Read Feature-spec.md** — find the feature's user stories, API endpoints, and UI screens
2. **Read CLAUDE.md** — verify conventions
3. **Ask which layers to generate** (or default to all):
   - Backend module (routes, controller, service, validation, tests)
   - Frontend feature (components, hooks, api, types)
   - Prisma schema additions (if new models needed)

4. **Generate backend module** at `apps/backend/src/modules/<feature>/`:
   - `<feature>.routes.ts` — Express router with all endpoints from spec
   - `<feature>.controller.ts` — Req/res handlers calling service
   - `<feature>.service.ts` — Business logic with Prisma queries (include `orgId`)
   - `<feature>.validation.ts` — Zod schemas for all request bodies/params
   - `<feature>.test.ts` — Integration test skeleton with Supertest

5. **Generate frontend feature** at `apps/frontend/src/features/<feature>/`:
   - `api.ts` — Axios calls matching backend endpoints
   - `types.ts` — TypeScript interfaces matching backend types
   - `hooks/<hook>.ts` — Data fetching hooks (useQuery/useMutation pattern or custom)
   - `components/<Component>.tsx` — Main UI components from spec's UI screens
   - `index.ts` — Public exports

6. **Update router** — add routes to `apps/frontend/src/App.tsx` if new pages

## Backend Template

```typescript
// <feature>.routes.ts
import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authMiddleware } from '../../middleware/auth';
import { roleMiddleware } from '../../middleware/role';
import { validate } from '../../middleware/validate';
import { create<Feature>Schema } from './<feature>.validation';
import * as controller from './<feature>.controller';

const router = Router();

router.get('/', authMiddleware, roleMiddleware(['admin', 'staff']), asyncHandler(controller.list));
router.get('/:id', authMiddleware, roleMiddleware(['admin', 'staff']), asyncHandler(controller.getById));
router.post('/', authMiddleware, roleMiddleware(['admin', 'staff']), validate(create<Feature>Schema), asyncHandler(controller.create));

export default router;
```

```typescript
// <feature>.validation.ts
import { z } from 'zod';

export const create<Feature>Schema = z.object({
  name: z.string().min(1).max(255),
  // ... fields from spec
});
```

## Frontend Template

```typescript
// features/<feature>/api.ts
import api from '@/lib/axios';
import { <Feature>, Create<Feature>Input } from './types';

export const <feature>Api = {
  list: (params?: ListParams) => api.get('/<features>', { params }),
  get: (id: string) => api.get(`/<features>/${id}`),
  create: (data: Create<Feature>Input) => api.post('/<features>', data),
  update: (id: string, data: Partial<Create<Feature>Input>) => api.put(`/<features>/${id}`, data),
};
```

## Important

- Always check existing modules for patterns first
- Include `orgId` in all backend queries
- Follow the API response format from CLAUDE.md
- Create types that match backend Zod schemas
