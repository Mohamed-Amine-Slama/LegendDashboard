import Link from "next/link";
import { notFound } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import OrderStatusUpdater from "@/components/OrderStatusUpdater";
import DeleteOrderButton from "@/components/DeleteOrderButton";
import { fetchOrder, ORDER_TTL_DAYS } from "@/lib/orders";

export const dynamic = "force-dynamic";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const order = await fetchOrder(id);
  if (!order) notFound();

  const totalQty = order.items.reduce((s, i) => s + i.qty, 0);
  const placedAt = new Date(order.createdAt);

  return (
    <AdminShell>
      <div className="mb-4">
        <Link
          href="/orders"
          className="text-[11px] font-semibold uppercase tracking-wider text-muted hover:text-bg-dark"
        >
          ← All orders
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            <span className="font-mono">{order.reference}</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            Placed {placedAt.toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {" · "}
            {totalQty} {totalQty === 1 ? "unit" : "units"} across {order.items.length}{" "}
            {order.items.length === 1 ? "line" : "lines"}
          </p>
        </div>

        <OrderStatusUpdater id={order._id ?? ""} initial={order.status} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        {/* Line items */}
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <div className="border-b border-border px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
            Items
          </div>
          <ul className="divide-y divide-border">
            {order.items.map((it, i) => (
              <li key={`${it.productId}-${i}`} className="flex items-start gap-3 px-5 py-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={it.imageSrc}
                  alt=""
                  className="h-16 w-16 flex-shrink-0 rounded-lg bg-bg-light/60 object-contain p-1"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    {it.category}
                  </div>
                  <div className="text-sm font-semibold">{it.name}</div>
                  <div className="mt-0.5 text-[12px] text-muted">
                    {it.qty} × {it.unitPriceTND.toFixed(2)} TND
                    {it.listPriceTND > it.unitPriceTND && (
                      <span className="ml-2 text-[11px] line-through text-muted/70">
                        {it.listPriceTND.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right text-sm font-semibold tabular-nums">
                  {it.lineTotalTND.toFixed(2)} TND
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-border bg-bg-light/40 px-5 py-3">
            <div className="flex items-center justify-between text-[12px] text-muted">
              <span>Subtotal</span>
              <span className="tabular-nums">{order.subtotalTND.toFixed(2)} TND</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[12px] text-muted">
              <span>Shipping</span>
              <span className="tabular-nums">
                {order.shippingTND === 0 ? "Free" : `${order.shippingTND.toFixed(2)} TND`}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-sm font-bold">
              <span>Total</span>
              <span className="tabular-nums">{order.totalTND.toFixed(2)} TND</span>
            </div>
          </div>
        </div>

        {/* Customer + delivery */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-white p-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Customer
            </h3>
            <div className="mt-2 text-sm font-semibold">{order.customer.fullName}</div>
            <a
              href={`tel:${order.customer.phone}`}
              className="mt-0.5 block text-[13px] text-bg-dark hover:text-accent"
            >
              {order.customer.phone}
            </a>
            {order.customer.email && (
              <a
                href={`mailto:${order.customer.email}`}
                className="mt-0.5 block text-[13px] text-bg-dark hover:text-accent"
              >
                {order.customer.email}
              </a>
            )}
            <a
              href={`https://wa.me/${order.customer.phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block rounded-full border border-border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors hover:border-bg-dark hover:bg-bg-dark hover:text-bg-light"
            >
              Open WhatsApp
            </a>
          </div>

          <div className="rounded-2xl border border-border bg-white p-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Delivery
            </h3>
            <div className="mt-2 text-sm leading-relaxed">
              <div>{order.delivery.address}</div>
              <div>
                {order.delivery.city}, {order.delivery.governorate}
                {order.delivery.postalCode && ` · ${order.delivery.postalCode}`}
              </div>
            </div>
            {order.delivery.notes && (
              <div className="mt-2 rounded-md bg-bg-light/60 p-2 text-[12px] italic text-muted">
                {order.delivery.notes}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-white p-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Payment
            </h3>
            <div className="mt-2 text-sm font-semibold">
              {order.paymentMethod === "cod" ? "Cash on delivery" : order.paymentMethod}
            </div>
            <div className="mt-1 text-[12px] text-muted">
              Locale: <span className="font-mono uppercase">{order.locale}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-danger/30 bg-rose-50/40 p-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-danger">
              Danger zone
            </h3>
            <p className="mt-1.5 text-[12px] text-muted">
              Permanently removes this order. Useful for clearing test data.
            </p>
            {order.expiresAt && (
              <p className="mt-1.5 text-[11px] text-muted">
                Auto-deletes on{" "}
                <span className="font-mono">
                  {new Date(order.expiresAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                {" "}(retention: {ORDER_TTL_DAYS} days).
              </p>
            )}
            <div className="mt-3">
              <DeleteOrderButton
                id={order._id ?? ""}
                reference={order.reference}
                redirectTo="/orders"
              />
            </div>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}
