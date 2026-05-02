"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Props {
  id: string;
  name: string;
}

export default function DeleteProductButton({ id, name }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setError(null);
    start(async () => {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Failed to delete");
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="rounded border border-danger/40 px-3 py-1 text-[11px] uppercase tracking-wider text-danger transition-colors hover:bg-danger hover:text-white disabled:opacity-40"
      >
        {pending ? "…" : "Delete"}
      </button>
      {error && <span className="ml-2 text-[11px] text-danger">{error}</span>}
    </>
  );
}
