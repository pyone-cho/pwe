import { useState, useCallback } from 'react';
import type { PaginationMeta } from '@/types';

export function usePagination(initialPage = 1, initialLimit = 20) {
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  const nextPage = useCallback(() => {
    if (meta && page < meta.pages) setPage((p) => p + 1);
  }, [meta, page]);

  const prevPage = useCallback(() => {
    if (page > 1) setPage((p) => p - 1);
  }, [page]);

  const goToPage = useCallback((p: number) => {
    setPage(p);
  }, []);

  return { page, limit, meta, setMeta, nextPage, prevPage, goToPage };
}
