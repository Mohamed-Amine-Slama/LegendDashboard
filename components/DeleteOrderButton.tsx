"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Props {
  id: string;
  reference: string;
  /** Where to send the user after a successful delete. Omit to stay on the
   *  current page and just `router.refresh()` (used in the orders list). */
  redirectTo?: string;
  /** Visual variant. "compact" is for inline use in table rows. */
  variant?: "default" | "compact";
}

export default function DeleteOrderButton({
  id,
  reference,
  redirectTo,
  variant = "default",
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onDelete(e?: React.MouseEvent) {
    e?.stopPropagation();
    e?.preventDefault();
    if (!confirm(`Delete order ${reference}? This cannot be undone.`)) return;
    setError(null);
    start(async () => {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Failed to delete");
        return;
      }
      if (redirectTo) {
        router.push(redirectTo);
        router.refresh();
      } else {
        router.refresh();
      }
    });
  }

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        title={error || `Delete ${reference}`}
        aria-label={`Delete order ${reference}`}
        className="rounded border border-danger/30 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-danger transition-colors hover:bg-danger hover:text-white disabled:opacity-40"
      >
        {pending ? "…" : "Delete"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="rounded-full border border-danger/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-danger transition-colors hover:bg-danger hover:text-white disabled:opacity-40"
      >
        {pending ? "Deleting…" : "Delete order"}
      </button>
      {error && <span className="text-[11px] text-danger">{error}</span>}
    </div>
  );
}
