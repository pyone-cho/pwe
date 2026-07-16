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
    active: 'bg-green-50 text-green-700',
    inactive: 'bg-gray-100 text-gray-600',
    suspended: 'bg-red-50 text-red-600',
    published: 'bg-brand-50 text-brand-700',
    draft: 'bg-amber-50 text-amber-700',
    cancelled: 'bg-red-50 text-red-600',
    completed: 'bg-green-50 text-green-700',
    paid: 'bg-green-50 text-green-700',
    pending: 'bg-amber-50 text-amber-700',
    refunded: 'bg-purple-50 text-purple-600',
    registered: 'bg-green-50 text-green-700',
    waitlisted: 'bg-orange-50 text-orange-600',
    low: 'bg-gray-100 text-gray-600',
    normal: 'bg-brand-50 text-brand-700',
    high: 'bg-orange-50 text-orange-600',
    urgent: 'bg-red-50 text-red-600',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
}
