import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function Section({ title, description, action, children, className }: SectionProps) {
  return (
    <section className={cn('rounded-xl border border-gray-200 bg-white shadow-sm', className)}>
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="px-6 py-4">{children}</div>
    </section>
  );
}
