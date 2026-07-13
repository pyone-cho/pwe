// Simple cn utility (clsx-like, no dependency needed)
export function cn(...inputs: (string | undefined | null | false | Record<string, boolean>)[]): string {
  return inputs
    .filter(Boolean)
    .map((input) => {
      if (typeof input === 'string') return input;
      if (typeof input === 'object' && input !== null) {
        return Object.entries(input)
          .filter(([, v]) => v)
          .map(([k]) => k)
          .join(' ');
      }
      return '';
    })
    .join(' ')
    .trim();
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatMMK(amount: number): string {
  return new Intl.NumberFormat('en-MM', {
    style: 'currency',
    currency: 'MMK',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    inactive: 'bg-gray-50 text-gray-600 ring-1 ring-gray-200',
    suspended: 'bg-red-50 text-red-700 ring-1 ring-red-200',
    published: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200',
    draft: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    cancelled: 'bg-red-50 text-red-700 ring-1 ring-red-200',
    completed: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    paid: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    refunded: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
    registered: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    waitlisted: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
    low: 'bg-gray-50 text-gray-600 ring-1 ring-gray-200',
    normal: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200',
    high: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
    urgent: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  };
  return map[status] || 'bg-gray-50 text-gray-600 ring-1 ring-gray-200';
}
