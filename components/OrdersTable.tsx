"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { MongoOrder, OrderStatus } from "@/lib/types";
import DeleteOrderButton from "./DeleteOrderButton";

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_TONE: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-900 ring-yellow-200",
  confirmed: "bg-blue-100 text-blue-900 ring-blue-200",
  shipped: "bg-indigo-100 text-indigo-900 ring-indigo-200",
  delivered: "bg-green-100 text-green-900 ring-green-200",
  cancelled: "bg-rose-100 text-rose-900 ring-rose-200",
};

interface OrdersTableProps {
  orders: MongoOrder[];
  initialStatus: OrderStatus | "all";
  initialSearch: string;
}

export default function OrdersTable({
  orders,
  initialStatus,
  initialSearch,
}: OrdersTableProps) {
  const [status, setStatus] = useState<OrderStatus | "all">(initialStatus);
  const [search, setSearch] = useState(initialSearch);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (!q) return true;
      const hay =
        `${o.reference} ${o.customer.fullName} ${o.customer.phone} ${o.delivery.governorate}`.toLowerCase();
      return hay.includes(q);
    });
  }, [orders, status, search]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search reference, name, phone…"
          className="w-full rounded-full border border-border bg-bg-light/60 px-4 py-2 text-sm outline-none transition-shadow focus:border-bg-dark focus:bg-white sm:max-w-sm"
        />

        <div className="flex flex-wrap gap-1.5">
          {(["all", "pending", "confirmed", "shipped", "delivered", "cancelled"] as const).map((s) => {
            const isActive = status === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                  isActive
                    ? "bg-bg-dark text-bg-light"
                    : "border border-border text-muted hover:border-bg-dark hover:text-bg-dark"
                }`}
              >
                {s === "all" ? "All" : STATUS_LABEL[s]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-light/40 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Placed</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => {
              const totalQty = o.items.reduce((s, i) => s + i.qty, 0);
              return (
                <tr key={o._id} className="border-b border-border/60 last:border-b-0 hover:bg-bg-light/40">
                  <td className="px-4 py-3 font-mono text-[12px]">{o.reference}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{o.customer.fullName}</div>
                    <div className="text-[11px] text-muted">{o.customer.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-muted">
                    {totalQty} {totalQty === 1 ? "unit" : "units"}
                    <div className="text-[11px] text-muted/80">
                      {o.items.length} {o.items.length === 1 ? "line" : "lines"}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums">
                    {o.totalTND.toFixed(2)} TND
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${STATUS_TONE[o.status]}`}
                    >
                      {STATUS_LABEL[o.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-muted tabular-nums">
                    {formatDate(o.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/orders/${o._id}`}
                        className="text-[11px] font-semibold uppercase tracking-wider text-accent hover:underline"
                      >
                        View
                      </Link>
                      <DeleteOrderButton
                        id={o._id ?? ""}
                        reference={o.reference}
                        variant="compact"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <ul className="divide-y divide-border md:hidden">
        {filtered.map((o) => (
          <li key={o._id} className="px-4 py-3 hover:bg-bg-light/40">
            <Link href={`/orders/${o._id}`} className="block">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[12px]">{o.reference}</span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${STATUS_TONE[o.status]}`}
                >
                  {STATUS_LABEL[o.status]}
                </span>
              </div>
              <div className="mt-1.5 text-sm font-medium">{o.customer.fullName}</div>
              <div className="text-[11px] text-muted">{o.customer.phone}</div>
              <div className="mt-2 flex items-center justify-between text-[12px]">
                <span className="text-muted">{formatDate(o.createdAt)}</span>
                <span className="font-semibold tabular-nums">{o.totalTND.toFixed(2)} TND</span>
              </div>
            </Link>
            <div className="mt-2 flex justify-end">
              <DeleteOrderButton
                id={o._id ?? ""}
                reference={o.reference}
                variant="compact"
              />
            </div>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <div className="border-t border-border p-8 text-center text-sm text-muted">
          No orders match the current filters.
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
