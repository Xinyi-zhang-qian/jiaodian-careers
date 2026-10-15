'use client';

interface MarketPieChartProps {
  items: Array<{ name: string; count: number }>;
  total: number;
  colors: string[];
}

export default function MarketPieChart({ items, total, colors }: MarketPieChartProps) {
  const visibleItems = items.slice(0, 8);
  const visibleTotal = visibleItems.reduce((sum, item) => sum + item.count, 0);
  const other = Math.max(total - visibleTotal, 0);
  const slices = other > 0 ? [...visibleItems, { name: '其他', count: other }] : visibleItems;
  let cursor = 0;
  const gradient = slices.map((item, index) => {
    const start = cursor;
    cursor += (item.count / total) * 100;
    return `${colors[index % colors.length]} ${start}% ${cursor}%`;
  }).join(', ');

  return (
    <div className="mt-6 grid items-center gap-6 sm:grid-cols-[180px_minmax(0,1fr)]">
      <div className="mx-auto h-44 w-44 rounded-full" style={{ background: `conic-gradient(${gradient})` }} aria-label="分布饼图" />
      <div className="space-y-2.5">
        {slices.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-text-secondary">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
              <span className="truncate">{item.name}</span>
            </span>
            <span className="shrink-0 tabular-nums font-medium text-text-primary">{item.count} · {((item.count / total) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
