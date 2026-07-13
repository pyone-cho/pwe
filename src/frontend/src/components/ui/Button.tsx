import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'glow';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  children: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:from-brand-700 hover:to-brand-600 focus:ring-brand-500 shadow-soft hover:shadow-glow hover:-translate-y-0.5 active:translate-y-0',
  secondary:
    'bg-gray-100 text-gray-900 hover:bg-gray-200/80 focus:ring-gray-400 hover:shadow-soft',
  danger:
    'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 focus:ring-red-500 shadow-soft hover:shadow-md hover:-translate-y-0.5 active:translate-y-0',
  ghost:
    'text-gray-700 hover:bg-gray-100/80 focus:ring-gray-400 hover:shadow-sm',
  outline:
    'border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 focus:ring-brand-500 hover:shadow-soft',
  glow:
    'bg-gradient-to-r from-brand-500 to-violet-500 text-white hover:from-brand-600 hover:to-violet-600 focus:ring-brand-500 shadow-glow hover:shadow-glow-lg hover:-translate-y-0.5 active:translate-y-0',
};

const sizes: Record<Size, string> = {
  sm: 'px-3.5 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
