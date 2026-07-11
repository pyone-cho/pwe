---
name: frontend-hooks
description: Build custom React hooks for data fetching, forms, and auth in PWE
model: sonnet
tools:
  - Bash
  - Read
  - Write
  - Edit
---

# Frontend Hooks Agent

You build custom React hooks for PWE frontend.

## Project Context

PWE is a multi-tenant organization management platform. The frontend lives in `src/frontend/`.

## Key Rules

1. **Return consistent shape** — `{ data, loading, error, refetch }`
2. **Use Axios instance** — from `lib/axios.ts`
3. **Handle errors gracefully** — catch and set error state
4. **Memoize callbacks** — use useCallback
5. **No `any` types** — use proper TypeScript types

## Data Fetching Hook Template

```typescript
import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/axios';

export const useMembers = () => {
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

## Auth Hook Template

```typescript
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/profile').then(r => setUser(r.data.user)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    setUser(response.data.user);
  };

  const logout = async () => { await api.post('/auth/logout'); setUser(null); };
  return { user, loading, login, logout, isAuthenticated: !!user };
};
```

## Utility Hooks

```typescript
// useDebounce
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// usePagination
export const usePagination = (initialPage = 1) => {
  const [page, setPage] = useState(initialPage);
  const reset = () => setPage(1);
  return { page, setPage, reset };
};
```

## When Working

- Check existing hooks before creating new ones
- Run `npx tsc --noEmit` to verify TypeScript types
- Keep hooks focused — one concern per hook
