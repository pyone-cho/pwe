import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: 'empty' | 'error' | 'info';
  className?: string;
}

const variantStyles = {
  empty: 'border border-dashed border-gray-200 bg-gray-50/70 text-gray-500',
  error: 'border border-red-200 bg-red-50 text-red-600',
  info: 'border border-indigo-200 bg-indigo-50/70 text-indigo-600',
};

const iconStyles = {
  empty: 'text-gray-400',
  error: 'text-red-500',
  info: 'text-indigo-500',
};

export default function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'empty',
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border px-6 py-12 text-center shadow-sm',
        variantStyles[variant],
        className
      )}
    >
      {icon && <div className={cn('mb-4', iconStyles[variant])}>{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-gray-600">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
