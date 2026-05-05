"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/types";

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

interface OrderStatusUpdaterProps {
  id: string;
  initial: OrderStatus;
}

export default function OrderStatusUpdater({ id, initial }: OrderStatusUpdaterProps) {
  const [status, setStatus] = useState<OrderStatus>(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function update(next: OrderStatus) {
    if (next === status) return;
    setError(null);
    const previous = status;
    setStatus(next);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to update status.");
      }
      startTransition(() => router.refresh());
    } catch (err) {
      setStatus(previous);
      setError(err instanceof Error ? err.message : "Failed to update status.");
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        Status
      </label>
      <div className="flex flex-wrap gap-1.5">
        {ORDER_STATUSES.map((s) => {
          const active = status === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => update(s)}
              disabled={isPending && active}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                active
                  ? "bg-bg-dark text-bg-light"
                  : "border border-border text-muted hover:border-bg-dark hover:text-bg-dark"
              } ${isPending && active ? "opacity-60" : ""}`}
            >
              {STATUS_LABEL[s]}
            </button>
          );
        })}
      </div>
      {error && (
        <p className="text-[11px] font-medium text-danger">{error}</p>
      )}
    </div>
  );
}
