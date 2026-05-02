"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MongoProduct } from "@/lib/types";

interface Props {
  product: MongoProduct;
}

/**
 * Row-level quick toggles for the products table.
 *  - Stock pill: flips `inStock` immediately.
 *  - Promo pill: opens an inline editor for the promo price (or removes
 *    an active promo with a single click).
 *
 * Both call `PATCH /api/products/[id]` so they don't need the full
 * product payload that PUT requires.
 */
export default function ProductQuickActions({ product }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [promoOpen, setPromoOpen] = useState(false);

  const onPromoActive =
    product.onPromo === true &&
    typeof product.promoPriceTND === "number" &&
    product.promoPriceTND < product.priceTND;

  function patch(body: Partial<MongoProduct>, onSuccess?: () => void) {
    setError(null);
    start(async () => {
      const res = await fetch(`/api/products/${product._id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Update failed");
        return;
      }
      onSuccess?.();
      router.refresh();
    });
  }

  function toggleStock() {
    patch({ inStock: !product.inStock });
  }

  function removePromo() {
    patch({ onPromo: false });
  }

  function savePromo(price: number) {
    patch({ onPromo: true, promoPriceTND: price }, () => setPromoOpen(false));
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-1.5">
        <button
          type="button"
          onClick={toggleStock}
          disabled={pending}
          title={product.inStock ? "Mark as sold out" : "Mark as in stock"}
          className={
            "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors disabled:opacity-40 " +
            (product.inStock
              ? "border-danger/40 text-danger hover:bg-danger hover:text-white"
              : "border-success/40 text-success hover:bg-success hover:text-white")
          }
        >
          {product.inStock ? "Sold out" : "Restock"}
        </button>

        {onPromoActive ? (
          <>
            <button
              type="button"
              onClick={() => setPromoOpen((v) => !v)}
              disabled={pending}
              title="Edit promo price"
              className="rounded-full border border-accent/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-deep transition-colors hover:bg-accent hover:text-bg-dark disabled:opacity-40"
            >
              Edit promo
            </button>
            <button
              type="button"
              onClick={removePromo}
              disabled={pending}
              title="Remove promotion"
              className="rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted transition-colors hover:border-bg-dark hover:text-bg-dark disabled:opacity-40"
            >
              Remove
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setPromoOpen((v) => !v)}
            disabled={pending}
            title="Mark on promo"
            className="rounded-full border border-danger/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-danger transition-colors hover:bg-danger hover:text-white disabled:opacity-40"
          >
            Promo
          </button>
        )}
      </div>

      {promoOpen && (
        <PromoEditor
          regularPrice={product.priceTND}
          initial={product.promoPriceTND}
          pending={pending}
          onCancel={() => setPromoOpen(false)}
          onSave={savePromo}
        />
      )}

      {error && <span className="text-[10px] text-danger">{error}</span>}
    </div>
  );
}

/* ─── Inline price editor ─────────────────────────────────────────── */

interface PromoEditorProps {
  regularPrice: number;
  initial: number | undefined;
  pending: boolean;
  onCancel: () => void;
  onSave: (price: number) => void;
}

function PromoEditor({
  regularPrice,
  initial,
  pending,
  onCancel,
  onSave,
}: PromoEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState<string>(
    initial !== undefined
      ? String(initial)
      : regularPrice > 0
        ? String(Math.max(0, Math.round(regularPrice * 0.8 * 100) / 100))
        : "",
  );

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const numeric = Number(value);
  const valid =
    Number.isFinite(numeric) && numeric >= 0 && numeric < regularPrice;
  const off =
    valid && regularPrice > 0
      ? Math.round((1 - numeric / regularPrice) * 100)
      : null;

  function submit() {
    if (!valid) return;
    onSave(numeric);
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-white p-1.5 shadow-sm">
      <span className="pl-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
        Promo
      </span>
      <input
        ref={inputRef}
        type="number"
        min={0}
        max={regularPrice > 0 ? regularPrice - 0.01 : undefined}
        step={0.5}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
        }}
        className="w-20 rounded border border-border px-2 py-1 text-right text-xs tabular-nums outline-none focus:border-accent"
      />
      <span className="text-[10px] text-muted">
        / {regularPrice.toFixed(2)}
        {off !== null && (
          <span className="ml-1 font-bold text-danger">−{off}%</span>
        )}
      </span>
      <button
        type="button"
        onClick={submit}
        disabled={!valid || pending}
        className="rounded-full bg-bg-dark px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-bg-light transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {pending ? "…" : "Save"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={pending}
        className="rounded-full border border-border px-2 py-1 text-[10px] uppercase tracking-wider text-muted hover:text-bg-dark disabled:opacity-40"
      >
        ✕
      </button>
    </div>
  );
}
