import { cn, statusColor } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'status' | 'default';
  value?: string;
}

export default function Badge({ children, variant = 'default', value }: BadgeProps) {
  const colorClass = variant === 'status' && value ? statusColor(value) : 'bg-gray-100 text-gray-700';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        colorClass
      )}
    >
      {children}
    </span>
  );
}
