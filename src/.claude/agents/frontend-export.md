---
name: frontend-export
description: Handle CSV/Excel/PDF export with filters and progress for PWE frontend
model: sonnet
tools:
  - Bash
  - Read
  - Write
  - Edit
---

# Frontend Export Agent

You handle CSV, Excel, and PDF export with filters for PWE frontend.

## Project Context

PWE is a multi-tenant organization management platform. The frontend lives in `src/frontend/`.

## Key Rules

1. **Respect filters** — export only filtered data
2. **Format selection** — CSV, Excel, PDF options
3. **Progress feedback** — show progress for large exports
4. **Client-side for small data** — CSV generation in browser
5. **Server-side for large data** — download blob from API

## CSV Export Pattern (Download from API)

```tsx
export const ExportButton: React.FC<{ endpoint: string; filename: string; filters?: Record<string, any> }> = ({
  endpoint, filename, filters = {},
}) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async (format: 'csv' | 'xlsx') => {
    setLoading(true);
    try {
      const response = await api.get(endpoint, { params: { ...filters, format }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex space-x-2">
      <Button variant="secondary" onClick={() => handleExport('csv')} loading={loading}>Export CSV</Button>
      <Button variant="secondary" onClick={() => handleExport('xlsx')} loading={loading}>Export Excel</Button>
    </div>
  );
};
```

## PDF Export Pattern

```tsx
export const PdfExportButton: React.FC<{ data: any[]; filename: string; title: string; columns: Array<{ key: string; label: string }> }> = ({
  data, filename, title, columns,
}) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(title, 14, 22);
      autoTable(doc, {
        startY: 35,
        head: [columns.map(c => c.label)],
        body: data.map(row => columns.map(c => String(row[c.key] ?? ''))),
      });
      doc.save(`${filename}.pdf`);
    } finally {
      setLoading(false);
    }
  };

  return <Button variant="secondary" onClick={handleExport} loading={loading}>Export PDF</Button>;
};
```

## When Working

- Check existing export components before creating new ones
- Run `npx tsc --noEmit` to verify TypeScript types
- Test with large datasets
