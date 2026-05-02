"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { MongoProduct } from "@/lib/types";
import { BRANDS, CATEGORIES } from "@/lib/enums";
import DeleteProductButton from "./DeleteProductButton";
import ProductQuickActions from "./ProductQuickActions";

type StockMode = "ALL" | "IN" | "OUT";
type PromoMode = "ALL" | "ON" | "OFF";
type SortMode =
  | "FEATURED"
  | "NEWEST"
  | "PRICE_ASC"
  | "PRICE_DESC"
  | "NAME_ASC";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "FEATURED", label: "Featured rank" },
  { value: "NEWEST", label: "Newest first" },
  { value: "PRICE_ASC", label: "Price · low → high" },
  { value: "PRICE_DESC", label: "Price · high → low" },
  { value: "NAME_ASC", label: "Name A → Z" },
];

interface Props {
  products: MongoProduct[];
}

export default function ProductsTable({ products }: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<MongoProduct["category"] | "ALL">("ALL");
  const [brand, setBrand] = useState<MongoProduct["brand"] | "ALL">("ALL");
  const [stock, setStock] = useState<StockMode>("ALL");
  const [promo, setPromo] = useState<PromoMode>("ALL");
  const [sort, setSort] = useState<SortMode>("FEATURED");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = products.filter((p) => {
      if (category !== "ALL" && p.category !== category) return false;
      if (brand !== "ALL" && p.brand !== brand) return false;
      if (stock === "IN" && !p.inStock) return false;
      if (stock === "OUT" && p.inStock) return false;
      if (promo === "ON" && !p.onPromo) return false;
      if (promo === "OFF" && p.onPromo) return false;
      if (q) {
        const hay =
          `${p.name} ${p.description ?? ""} ${p.brand} ${p.flavorFamily}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "NEWEST":
          return (b.releaseOrder ?? 0) - (a.releaseOrder ?? 0);
        case "PRICE_ASC":
          return a.priceTND - b.priceTND;
        case "PRICE_DESC":
          return b.priceTND - a.priceTND;
        case "NAME_ASC":
          return a.name.localeCompare(b.name);
        case "FEATURED":
        default:
          return (
            (a.featuredOrder ?? 100) - (b.featuredOrder ?? 100) ||
            (b.releaseOrder ?? 0) - (a.releaseOrder ?? 0)
          );
      }
    });

    return list;
  }, [products, search, category, brand, stock, promo, sort]);

  const hasActiveFilters =
    search.trim() !== "" ||
    category !== "ALL" ||
    brand !== "ALL" ||
    stock !== "ALL" ||
    promo !== "ALL" ||
    sort !== "FEATURED";

  function clearAll() {
    setSearch("");
    setCategory("ALL");
    setBrand("ALL");
    setStock("ALL");
    setPromo("ALL");
    setSort("FEATURED");
  }

  return (
    <>
      {/* Filter bar */}
      <div className="mb-5 rounded-2xl border border-border bg-white p-3 shadow-sm sm:p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Label>Search</Label>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, description, brand…"
              className={inputCls}
            />
          </div>

          <div className="lg:col-span-2">
            <Label>Category</Label>
            <select
              aria-label="Filter by category"
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as MongoProduct["category"] | "ALL")
              }
              className={inputCls}
            >
              <option value="ALL">All</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3">
            <Label>Brand</Label>
            <select
              aria-label="Filter by brand"
              value={brand}
              onChange={(e) =>
                setBrand(e.target.value as MongoProduct["brand"] | "ALL")
              }
              className={inputCls}
            >
              <option value="ALL">All</option>
              {BRANDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3">
            <Label>Sort</Label>
            <select
              aria-label="Sort products"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              className={inputCls}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-col flex-wrap gap-2 sm:flex-row sm:items-center">
          <SegGroup label="Stock">
            <Seg active={stock === "ALL"} onClick={() => setStock("ALL")}>
              All
            </Seg>
            <Seg active={stock === "IN"} onClick={() => setStock("IN")}>
              In stock
            </Seg>
            <Seg active={stock === "OUT"} onClick={() => setStock("OUT")}>
              Sold out
            </Seg>
          </SegGroup>

          <SegGroup label="Promo">
            <Seg active={promo === "ALL"} onClick={() => setPromo("ALL")}>
              All
            </Seg>
            <Seg active={promo === "ON"} onClick={() => setPromo("ON")}>
              On promo
            </Seg>
            <Seg active={promo === "OFF"} onClick={() => setPromo("OFF")}>
              No promo
            </Seg>
          </SegGroup>

          <span className="text-xs text-muted sm:ml-auto">
            {filtered.length} of {products.length} shown
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="self-start rounded-full border border-border px-3 py-1.5 text-[11px] uppercase tracking-wider text-muted hover:border-bg-dark hover:text-bg-dark sm:self-auto"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table — desktop / tablet only */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-8 text-center sm:p-12">
          <p className="text-base font-semibold">No products match the filters</p>
          <p className="mt-1 text-sm text-muted">
            Try clearing one of the filters above.
          </p>
        </div>
      ) : (
        <>
          {/* ── Mobile cards (below md) ────────────────────────────── */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filtered.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>

          {/* ── Table (md+) ─────────────────────────────────────────── */}
          <div className="hidden overflow-x-auto rounded-2xl border border-border bg-white shadow-sm md:block">
          <table className="w-full text-left">
            <thead className="border-b border-border bg-bg-light">
              <tr className="text-[10px] uppercase tracking-wider text-muted">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Brand</th>
                <th className="px-4 py-3 font-semibold">Nicotine</th>
                <th className="px-4 py-3 text-right font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Quick actions</th>
                <th className="px-4 py-3 font-semibold">
                  <span className="sr-only">Edit / delete</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const promoActive =
                  p.onPromo &&
                  typeof p.promoPriceTND === "number" &&
                  p.promoPriceTND < p.priceTND;
                const off = promoActive
                  ? Math.round((1 - (p.promoPriceTND as number) / p.priceTND) * 100)
                  : 0;
                return (
                  <tr
                    key={p._id}
                    className="border-b border-border last:border-b-0 hover:bg-bg-light/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ background: p.flavorColor }}
                        />
                        <Link
                          href={`/products/${p._id}`}
                          className="font-semibold hover:underline"
                        >
                          {p.name}
                        </Link>
                        {p.badge && (
                          <span className="rounded-full bg-bg-dark px-2 py-0.5 text-[9px] font-bold uppercase text-bg-light">
                            {p.badge}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs uppercase tracking-wider text-muted">
                      {p.category}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {p.brand.replace("LEGEND VAPE STORE ", "")}
                    </td>
                    <td className="px-4 py-3 text-sm tabular-nums">{p.nicotineMg}mg</td>
                    <td className="px-4 py-3 text-right text-sm tabular-nums">
                      {promoActive ? (
                        <div className="flex items-baseline justify-end gap-1.5">
                          <span className="text-xs text-muted line-through">
                            {p.priceTND.toFixed(2)}
                          </span>
                          <span className="font-bold text-danger">
                            {(p.promoPriceTND as number).toFixed(2)}
                          </span>
                          <span className="text-[10px] text-muted">TND</span>
                        </div>
                      ) : (
                        <span className="font-semibold">
                          {p.priceTND.toFixed(2)} TND
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {p.inStock ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-success">
                            ● In stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-danger">
                            ● Sold out
                          </span>
                        )}
                        {promoActive && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                            −{off}% Promo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ProductQuickActions product={p} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/products/${p._id}`}
                          className="rounded border border-border px-3 py-1 text-[11px] uppercase tracking-wider hover:bg-bg-dark hover:text-bg-light"
                        >
                          Edit
                        </Link>
                        <DeleteProductButton id={p._id ?? ""} name={p.name} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </>
      )}
    </>
  );
}

/* ─── Mobile card (below md) ──────────────────────────────────────── */

function ProductCard({ product: p }: { product: MongoProduct }) {
  const promoActive =
    p.onPromo &&
    typeof p.promoPriceTND === "number" &&
    p.promoPriceTND < p.priceTND;
  const off = promoActive
    ? Math.round((1 - (p.promoPriceTND as number) / p.priceTND) * 100)
    : 0;

  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{ background: p.flavorColor }}
            />
            <Link
              href={`/products/${p._id}`}
              className="truncate font-semibold hover:underline"
            >
              {p.name}
            </Link>
            {p.badge && (
              <span className="shrink-0 rounded-full bg-bg-dark px-2 py-0.5 text-[9px] font-bold uppercase text-bg-light">
                {p.badge}
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] uppercase tracking-wider text-muted">
            {p.category} · {p.brand.replace("LEGEND VAPE STORE ", "")} · {p.nicotineMg}mg
          </p>
        </div>

        <div className="shrink-0 text-right tabular-nums">
          {promoActive ? (
            <>
              <div className="text-sm font-bold text-danger">
                {(p.promoPriceTND as number).toFixed(2)}
              </div>
              <div className="text-[10px] text-muted line-through">
                {p.priceTND.toFixed(2)}
              </div>
            </>
          ) : (
            <div className="text-sm font-semibold">{p.priceTND.toFixed(2)} TND</div>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {p.inStock ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-success">
            ● In stock
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-danger">
            ● Sold out
          </span>
        )}
        {promoActive && (
          <span className="inline-flex items-center gap-1 rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            −{off}% Promo
          </span>
        )}
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <ProductQuickActions product={p} />
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <Link
          href={`/products/${p._id}`}
          className="rounded border border-border px-3 py-1 text-[11px] uppercase tracking-wider hover:bg-bg-dark hover:text-bg-light"
        >
          Edit
        </Link>
        <DeleteProductButton id={p._id ?? ""} name={p.name} />
      </div>
    </div>
  );
}

/* ─── Tiny presentational helpers ─────────────────────────────────── */

const inputCls =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-accent";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">
      {children}
    </label>
  );
}

function SegGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      <div className="inline-flex items-center rounded-full border border-border bg-bg-light/50 p-0.5">
        {children}
      </div>
    </div>
  );
}

function Seg({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors " +
        (active
          ? "bg-bg-dark text-bg-light"
          : "text-muted hover:text-bg-dark")
      }
    >
      {children}
    </button>
  );
}
