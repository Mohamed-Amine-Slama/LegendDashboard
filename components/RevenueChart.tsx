import type { AnalyticsBucket } from "@/lib/orders";

interface RevenueChartProps {
  title: string;
  subtitle?: string;
  buckets: AnalyticsBucket[];
  formatLabel: (b: AnalyticsBucket) => string;
}

/**
 * Plain SVG bar chart. No third-party charting lib — keeps the dashboard
 * bundle small. Each bar is sized to the max revenue in the window and
 * shows the value on hover.
 */
export default function RevenueChart({
  title,
  subtitle,
  buckets,
  formatLabel,
}: RevenueChartProps) {
  const max = buckets.reduce((m, b) => Math.max(m, b.revenueTND), 0);
  const total = buckets.reduce((s, b) => s + b.revenueTND, 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      <header className="flex items-end justify-between border-b border-border px-5 py-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider">{title}</h3>
          {subtitle && <p className="text-[11px] text-muted">{subtitle}</p>}
        </div>
        <div className="text-right">
          <div className="text-sm font-bold tabular-nums">{total.toFixed(2)} TND</div>
          <div className="text-[10px] uppercase tracking-wider text-muted">in window</div>
        </div>
      </header>

      {buckets.length === 0 ? (
        <div className="px-5 py-12 text-center text-[12px] text-muted">
          No revenue recorded for this window.
        </div>
      ) : (
        <div className="px-5 py-4">
          <div className="flex h-32 items-end gap-1">
            {buckets.map((b) => {
              const pct = max > 0 ? (b.revenueTND / max) * 100 : 0;
              return (
                <div
                  key={b.bucket}
                  className="group flex flex-1 flex-col items-stretch"
                  title={`${b.bucket} — ${b.revenueTND.toFixed(2)} TND · ${b.orderCount} ${b.orderCount === 1 ? "order" : "orders"}`}
                >
                  <div className="relative flex-1">
                    <div
                      className="absolute inset-x-0 bottom-0 rounded-sm bg-bg-dark/15 transition-colors group-hover:bg-accent"
                      style={{ height: `${pct}%`, minHeight: pct > 0 ? 2 : 0 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sparse axis labels — first, middle, last */}
          <div className="mt-2 flex justify-between text-[10px] tabular-nums text-muted">
            {buckets.length > 0 && <span>{formatLabel(buckets[0])}</span>}
            {buckets.length > 2 && (
              <span>{formatLabel(buckets[Math.floor(buckets.length / 2)])}</span>
            )}
            {buckets.length > 1 && (
              <span>{formatLabel(buckets[buckets.length - 1])}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
