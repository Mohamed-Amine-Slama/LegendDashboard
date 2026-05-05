import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import OrdersTable from "@/components/OrdersTable";
import { fetchOrders } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

interface OrdersPageProps {
  searchParams: Promise<{
    status?: string;
    search?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const sp = await searchParams;
  const statusFilter =
    sp.status && ["pending", "confirmed", "shipped", "delivered", "cancelled"].includes(sp.status)
      ? (sp.status as OrderStatus)
      : undefined;

  const orders = await fetchOrders({
    status: statusFilter,
    search: sp.search,
    from: sp.from,
    to: sp.to,
  });

  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.totalTND, 0);

  const pendingCount = orders.filter((o) => o.status === "pending").length;

  // Build the export URL with the same filters so the Excel matches what's
  // visible. (Date filters are passthrough; status/search included.)
  const exportParams = new URLSearchParams();
  if (statusFilter) exportParams.set("status", statusFilter);
  if (sp.search) exportParams.set("search", sp.search);
  if (sp.from) exportParams.set("from", sp.from);
  if (sp.to) exportParams.set("to", sp.to);
  const exportHref = `/api/orders/export${exportParams.size ? `?${exportParams.toString()}` : ""}`;

  return (
    <AdminShell>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Orders</h1>
          <p className="mt-1 text-sm text-muted">
            {orders.length} {orders.length === 1 ? "order" : "orders"}
            {pendingCount > 0 && (
              <>
                {" · "}
                <span className="font-semibold text-danger">
                  {pendingCount} pending
                </span>
              </>
            )}
            {" · "}
            <span className="font-semibold">
              {totalRevenue.toFixed(2)} TND total
            </span>
          </p>
        </div>
        <a
          href={exportHref}
          className="self-start rounded-full bg-bg-dark px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-bg-light transition-opacity hover:opacity-90 sm:self-auto"
        >
          Export Excel
        </a>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center">
          <p className="text-base font-semibold">No orders yet</p>
          <p className="mt-1 text-sm text-muted">
            Orders placed on the storefront will appear here.
          </p>
          <Link
            href="/products"
            className="mt-4 inline-block rounded-full bg-accent px-5 py-2 text-xs font-semibold uppercase tracking-wider text-bg-dark"
          >
            Manage products
          </Link>
        </div>
      ) : (
        <OrdersTable orders={orders} initialStatus={statusFilter ?? "all"} initialSearch={sp.search ?? ""} />
      )}
    </AdminShell>
  );
}
