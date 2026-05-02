import Link from "next/link";
import { COLLECTIONS, getDb } from "@/lib/db";
import type { MongoProduct } from "@/lib/types";
import AdminShell from "@/components/AdminShell";
import DeleteProductButton from "@/components/DeleteProductButton";

export const dynamic = "force-dynamic";

async function getAllProducts(): Promise<MongoProduct[]> {
  const db = await getDb();
  const docs = await db
    .collection<MongoProduct>(COLLECTIONS.products)
    .find({})
    .sort({ featuredOrder: 1, releaseOrder: -1 })
    .toArray();
  return docs.map((d) => ({ ...d, _id: String(d._id) }));
}

export default async function ProductsPage() {
  const products = await getAllProducts();

  return (
    <AdminShell>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-muted">
            {products.length} {products.length === 1 ? "item" : "items"} in catalogue
          </p>
        </div>
        <Link
          href="/products/new"
          className="rounded-full bg-bg-dark px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-bg-light transition-opacity hover:opacity-90"
        >
          + New product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center">
          <p className="text-base font-semibold">No products yet</p>
          <p className="mt-1 text-sm text-muted">
            Create the first product to populate the storefront.
          </p>
          <Link
            href="/products/new"
            className="mt-4 inline-block rounded-full bg-accent px-5 py-2 text-xs font-semibold uppercase tracking-wider text-bg-dark"
          >
            Add a product
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <table className="w-full text-left">
            <thead className="border-b border-border bg-bg-light">
              <tr className="text-[10px] uppercase tracking-wider text-muted">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Brand</th>
                <th className="px-4 py-3 font-semibold">Nicotine</th>
                <th className="px-4 py-3 text-right font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
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
                  <td className="px-4 py-3 text-sm">{p.brand.replace("LEGEND VAPE STORE ", "")}</td>
                  <td className="px-4 py-3 text-sm tabular-nums">{p.nicotineMg}mg</td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums font-semibold">
                    {p.priceTND.toFixed(2)} TND
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {p.inStock ? (
                      <span className="text-success">● In stock</span>
                    ) : (
                      <span className="text-danger">● Out</span>
                    )}
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
