"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  BADGES,
  BRANDS,
  CATEGORIES,
  FLAVOR_FAMILIES,
  NICOTINE_OPTIONS,
  VOLUME_OPTIONS,
} from "@/lib/enums";
import type { MongoProduct } from "@/lib/types";
import CustomSelect from "./CustomSelect";

interface Props {
  /** Existing product when editing; undefined when creating new. */
  product?: MongoProduct;
}

const EMPTY: MongoProduct = {
  name: "",
  category: "PODS",
  description: "",
  priceTND: 0,
  nicotineMg: 20,
  caffeinated: false,
  brand: "LEGEND VAPE STORE Original",
  flavorFamily: "Fruity",
  flavorColor: "#C8273A",
  imageUrl: "",
  propImageUrl: "",
  badge: undefined,
  releaseOrder: Math.floor(Date.now() / 1000),
  featuredOrder: 100,
  inStock: true,
  onPromo: false,
  promoPriceTND: undefined,
};

export default function ProductForm({ product }: Props) {
  const router = useRouter();
  const isEdit = Boolean(product?._id);
  const [draft, setDraft] = useState<MongoProduct>(product ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function set<K extends keyof MongoProduct>(key: K, value: MongoProduct[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  /** Switching category changes which of mlSize / puffCount is meaningful.
   *  Drop the stale one so it doesn't get persisted on the document. */
  function onCategoryChange(next: MongoProduct["category"]) {
    setDraft((d) => ({
      ...d,
      category: next,
      ...(next === "PUFFS"
        ? { mlSize: undefined }
        : { puffCount: undefined }),
    }));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side guard for the promo combo. The API also validates this.
    if (draft.onPromo) {
      const promo = Number(draft.promoPriceTND);
      if (!Number.isFinite(promo) || promo < 0) {
        setError("Promo price is required when promotion is enabled.");
        return;
      }
      if (promo >= draft.priceTND) {
        setError("Promo price must be lower than the regular price.");
        return;
      }
    }

    // Strip stale promoPrice when promo is disabled so the DB stays clean.
    const payload: MongoProduct = draft.onPromo
      ? draft
      : { ...draft, onPromo: false, promoPriceTND: undefined };

    start(async () => {
      const url = isEdit ? `/api/products/${product?._id}` : "/api/products";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Save failed");
        return;
      }
      router.push("/products");
      router.refresh();
    });
  }

  const promoPercent =
    draft.onPromo &&
    typeof draft.promoPriceTND === "number" &&
    draft.promoPriceTND >= 0 &&
    draft.promoPriceTND < draft.priceTND &&
    draft.priceTND > 0
      ? Math.round((1 - draft.promoPriceTND / draft.priceTND) * 100)
      : null;

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
      {/* ── Main column ────────────────────────────────────────────── */}
      <div className="space-y-6 rounded-2xl border border-border bg-white p-4 sm:p-6">
        <Section title="Basic info">
          <Field label="Name *">
            <input
              required
              type="text"
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputCls}
              placeholder="e.g. Strawberry Mint Pod"
            />
          </Field>
          <Field label="Description">
            <textarea
              rows={3}
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              className={inputCls}
              placeholder="Italic descriptor shown under the product name."
            />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Category *">
              <CustomSelect value={draft.category} onChange={(val) => set("category", val)} options={CATEGORIES.map(c => ({value:c,label:c}))} />
            </Field>
            <Field label="Brand">
              <CustomSelect value={draft.brand} onChange={(val) => set("brand", val)} options={BRANDS.map(b => ({value:b,label:b}))} />
            </Field>
          </div>
        </Section>

        <Section title="Specs">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Nicotine strength">
              <CustomSelect value={draft.nicotineMg} onChange={(val) => set("nicotineMg", Number(val) as MongoProduct["nicotineMg"])} options={NICOTINE_OPTIONS.map(n => ({value:n.value,label:n.label}))} />
            </Field>

            {draft.category === "PUFFS" ? (
              <Field label="Puff count">
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={draft.puffCount ?? 0}
                  onChange={(e) => set("puffCount", Number(e.target.value))}
                  className={inputCls}
                />
              </Field>
            ) : (
              <Field label="Volume (ml)">
                <select
                  value={draft.mlSize ?? ""}
                  onChange={(e) =>
                    set(
                      "mlSize",
                      e.target.value
                        ? (Number(e.target.value) as MongoProduct["mlSize"])
                        : undefined,
                    )
                  }
                  className={inputCls}
                >
                  <option value="">—</option>
                  {VOLUME_OPTIONS.map((v) => (
                    <option key={v} value={v}>
                      {v}ml
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Flavor family">
              <CustomSelect value={draft.flavorFamily} onChange={(val) => set("flavorFamily", val as MongoProduct["flavorFamily"])} options={FLAVOR_FAMILIES.map(f => ({value:f.value,label:f.value}))} />
            </Field>
            <Field label="Flavor color (hex)">
              <div className="flex gap-2">
                <input
                  type="color"
                  value={draft.flavorColor}
                  onChange={(e) => set("flavorColor", e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded-lg border border-border bg-white p-1"
                />
                <input
                  type="text"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  value={draft.flavorColor}
                  onChange={(e) => set("flavorColor", e.target.value)}
                  className={`${inputCls} flex-1 font-mono uppercase`}
                />
              </div>
            </Field>
          </div>

          <Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.caffeinated}
                onChange={(e) => set("caffeinated", e.target.checked)}
                className="h-4 w-4 rounded border-border accent-bg-dark"
              />
              Caffeinated
            </label>
          </Field>
        </Section>

        <Section title="Media">
          <Field label="Main image URL">
            <input
              type="text"
              inputMode="url"
              value={draft.imageUrl ?? ""}
              onChange={(e) => set("imageUrl", e.target.value)}
              className={inputCls}
              placeholder="https://… or /products/foo.png"
            />
          </Field>
          <Field label="Prop image URL (optional)">
            <input
              type="text"
              inputMode="url"
              value={draft.propImageUrl ?? ""}
              onChange={(e) => set("propImageUrl", e.target.value)}
              className={inputCls}
              placeholder="https://… or /props/foo.png"
            />
          </Field>
          {draft.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={draft.imageUrl}
              alt="Preview"
              className="h-40 w-40 rounded-xl border border-border bg-bg-light object-contain p-2"
            />
          )}
        </Section>

        {(draft.category === "PUFFS" ||
          draft.category === "PODS" ||
          draft.category === "CAPSULES") && (
          <Section title="Available flavors">
            <Field label="Flavors (one per line)">
              <textarea
                rows={5}
                value={(draft.flavors ?? []).join("\n")}
                onChange={(e) =>
                  set(
                    "flavors",
                    e.target.value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
                className={inputCls}
                placeholder={"Strawberry Mint\nMango Ice\nBlue Razz"}
              />
              <p className="mt-1 text-[11px] text-muted">
                Listed under the product on the storefront detail modal. Leave empty to hide.
              </p>
            </Field>
          </Section>
        )}
      </div>

      {/* ── Side column ────────────────────────────────────────────── */}
      <div className="space-y-6">
        <div className="space-y-4 rounded-2xl border border-border bg-white p-4 sm:p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider">Shop settings</h3>

          <Field label="Price (TND) *">
            <input
              required
              type="number"
              min={0}
              step={0.5}
              value={draft.priceTND}
              onChange={(e) => set("priceTND", Number(e.target.value))}
              className={inputCls}
            />
          </Field>

          <Field label="Badge">
            <select
              value={draft.badge ?? ""}
              onChange={(e) =>
                set("badge", (e.target.value || undefined) as MongoProduct["badge"])
              }
              className={inputCls}
            >
              {BADGES.map((b) => (
                <option key={b.label} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Featured rank">
            <input
              type="number"
              value={draft.featuredOrder}
              onChange={(e) => set("featuredOrder", Number(e.target.value))}
              className={inputCls}
            />
            <p className="mt-1 text-[11px] text-muted">
              Lower = first in shop. Set 0 for top, 100 for normal.
            </p>
          </Field>

          <Field label="Release rank">
            <input
              type="number"
              value={draft.releaseOrder}
              onChange={(e) => set("releaseOrder", Number(e.target.value))}
              className={inputCls}
            />
            <p className="mt-1 text-[11px] text-muted">
              Higher = newer. Used by NEWEST sort.
            </p>
          </Field>

          <Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.inStock}
                onChange={(e) => set("inStock", e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              In stock
              {!draft.inStock && (
                <span className="ml-auto rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-danger">
                  Sold out
                </span>
              )}
            </label>
          </Field>
        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-white p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider">Promotion</h3>
            {promoPercent !== null && (
              <span className="rounded-full bg-danger px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-white">
                −{promoPercent}%
              </span>
            )}
          </div>

          <Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.onPromo ?? false}
                onChange={(e) => {
                  const on = e.target.checked;
                  setDraft((d) => ({
                    ...d,
                    onPromo: on,
                    // Seed promo price at 80% of regular when toggling on for the first time.
                    promoPriceTND:
                      on && (d.promoPriceTND === undefined || d.promoPriceTND === null)
                        ? Math.max(0, Math.round(d.priceTND * 0.8 * 100) / 100)
                        : d.promoPriceTND,
                  }));
                }}
                className="h-4 w-4 rounded border-border"
              />
              On promo
            </label>
            <p className="mt-1 text-[11px] text-muted">
              When enabled, storefront shows a strikethrough on the regular price and a PROMO badge.
            </p>
          </Field>

          {draft.onPromo && (
            <Field label="Promo price (TND) *">
              <input
                type="number"
                min={0}
                max={draft.priceTND > 0 ? draft.priceTND - 0.01 : undefined}
                step={0.5}
                value={draft.promoPriceTND ?? ""}
                onChange={(e) =>
                  set(
                    "promoPriceTND",
                    e.target.value === "" ? undefined : Number(e.target.value),
                  )
                }
                className={inputCls}
                placeholder="e.g. 24.5"
              />
              <p className="mt-1 text-[11px] text-muted">
                Must be lower than the regular price ({draft.priceTND.toFixed(2)} TND).
              </p>
            </Field>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-danger bg-danger/5 p-3 text-sm text-danger">
            ⚠ {error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-bg-dark px-6 py-3 text-xs font-semibold uppercase tracking-wider text-bg-light transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create product"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/products")}
            className="rounded-full border border-border px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted hover:text-bg-dark"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

const inputCls =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-accent";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">
          {label}
        </label>
      )}
      {children}
    </div>
  );
}
