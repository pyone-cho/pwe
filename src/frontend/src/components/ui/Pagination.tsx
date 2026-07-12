import Button from './Button';
import type { PaginationMeta } from '@/types';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export default function Pagination({ meta, onPageChange }: PaginationProps) {
  if (meta.pages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
      <p className="text-sm text-gray-600">
        Showing {(meta.page - 1) * meta.limit + 1} to{' '}
        {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
      </p>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
        >
          Prev
        </Button>
        {Array.from({ length: Math.min(meta.pages, 5) }, (_, i) => {
          const start = Math.max(1, Math.min(meta.page - 2, meta.pages - 4));
          const pageNum = start + i;
          if (pageNum > meta.pages) return null;
          return (
            <Button
              key={pageNum}
              variant={pageNum === meta.page ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </Button>
          );
        })}
        <Button
          variant="ghost"
          size="sm"
          disabled={meta.page >= meta.pages}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
