---
name: scaffold-hook
description: Generate a custom React hook for data fetching or state management in PWE
---

# Scaffold Hook

Generate a custom React hook for data fetching or state management.

## Usage

When the user says "create hook X" or "build useMembers hook", follow these steps:

## Steps

1. **Check existing hooks** — look in `src/frontend/src/hooks/` or `src/frontend/src/features/<feature>/hooks/`
2. **Define interface** — TypeScript types for return value
3. **Implement hook** — useState, useEffect, useCallback
4. **Export hook** — from feature directory or hooks directory

## Data Fetching Hook Template

```typescript
import { useState, useEffect, useCallback } from 'react';
import api from '../../../lib/axios';
import { Member } from '../types';

interface UseMembersResult {
  members: Member[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  search: string;
  setSearch: (search: string) => void;
  setPage: (page: number) => void;
  refetch: () => void;
}

export const useMembers = (): UseMembersResult => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/members', { params: { page, limit: 20, search } });
      setMembers(response.data.data);
      setTotalPages(response.data.meta.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);
  return { members, loading, error, page, totalPages, search, setSearch, setPage, refetch: fetchMembers };
};
```

## Key Rules

1. **Return consistent shape** — `{ data, loading, error, refetch }`
2. **Use Axios instance** — from `lib/axios.ts`
3. **Handle errors gracefully** — catch and set error state
4. **Memoize callbacks** — use useCallback

## When Working

- Check existing hooks before creating new ones
- Run `npx tsc --noEmit` to verify TypeScript types
