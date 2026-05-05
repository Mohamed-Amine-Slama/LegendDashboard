import AdminShell from "@/components/AdminShell";
import RevenueChart from "@/components/RevenueChart";
import { computeAnalytics } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const a = await computeAnalytics();

  return (
    <AdminShell>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Analytics</h1>
          <p className="mt-1 text-sm text-muted">
            Revenue, products sold, and best sellers from the orders collection. Cancelled orders are excluded.
          </p>
        </div>
        <a
          href="/api/orders/export"
          className="self-start rounded-full border border-border bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors hover:border-bg-dark hover:bg-bg-dark hover:text-bg-light sm:self-auto"
        >
          Export Excel
        </a>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <Kpi label="Total revenue"   value={`${a.totalRevenueTND.toFixed(2)} TND`} accent />
        <Kpi label="Total orders"    value={a.totalOrders.toString()} />
        <Kpi label="Units sold"      value={a.totalUnitsSold.toString()} />
        <Kpi label="Pending orders"  value={a.pendingOrders.toString()} tone={a.pendingOrders > 0 ? "danger" : undefined} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <Kpi label="Today"        value={`${a.revenueToday.toFixed(2)} TND`} sub="last 24h" />
        <Kpi label="Last 7 days"  value={`${a.revenue7d.toFixed(2)} TND`} />
        <Kpi label="Last 30 days" value={`${a.revenue30d.toFixed(2)} TND`} />
      </div>

      {/* Revenue charts */}
      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <RevenueChart
          title="Daily"
          subtitle="Last 30 days"
          buckets={a.daily}
          formatLabel={(b) => b.bucket.slice(5)}
        />
        <RevenueChart
          title="Weekly"
          subtitle="Last 12 weeks"
          buckets={a.weekly}
          formatLabel={(b) => b.bucket.replace(/^\d{4}-/, "")}
        />
        <RevenueChart
          title="Monthly"
          subtitle="Last 12 months"
          buckets={a.monthly}
          formatLabel={(b) => b.bucket}
        />
      </section>

      {/* Best sellers */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-white">
        <header className="flex items-end justify-between border-b border-border px-5 py-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider">Best sellers</h2>
            <p className="text-[11px] text-muted">Top 10 products by units sold</p>
          </div>
        </header>

        {a.bestSellers.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">
            No sales recorded yet.
          </p>
        ) : (
          <ol className="divide-y divide-border">
            {a.bestSellers.map((p, i) => (
              <li key={p.productId} className="flex items-center gap-4 px-5 py-3">
                <span className="w-6 text-[12px] font-bold tabular-nums text-muted">
                  {(i + 1).toString().padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{p.name}</div>
                  <div className="text-[11px] text-muted">
                    <span className="font-mono">{p.productId}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold tabular-nums">{p.unitsSold}</div>
                  <div className="text-[11px] uppercase tracking-wider text-muted">
                    {p.unitsSold === 1 ? "unit" : "units"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold tabular-nums">
                    {p.revenueTND.toFixed(2)} TND
                  </div>
                  <div className="text-[11px] uppercase tracking-wider text-muted">revenue</div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </AdminShell>
  );
}

function Kpi({
  label,
  value,
  sub,
  accent,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  tone?: "danger";
}) {
  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 ${
        accent
          ? "border-accent/40 bg-accent/10"
          : tone === "danger"
            ? "border-rose-200 bg-rose-50"
            : "border-border bg-white"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="mt-1.5 text-xl font-bold tabular-nums sm:text-2xl">{value}</p>
      {sub && (
        <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted">{sub}</p>
      )}
    </div>
  );
}
