import Link from "next/link";
import { COLLECTIONS, getDb } from "@/lib/db";
import type { MongoProduct } from "@/lib/types";
import AdminShell from "@/components/AdminShell";
import ProductsTable from "@/components/ProductsTable";

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

  const promoCount = products.filter(
    (p) =>
      p.onPromo &&
      typeof p.promoPriceTND === "number" &&
      p.promoPriceTND < p.priceTND,
  ).length;
  const soldOutCount = products.filter((p) => !p.inStock).length;

  return (
    <AdminShell>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Products</h1>
          <p className="mt-1 text-sm text-muted">
            {products.length} {products.length === 1 ? "item" : "items"} in catalogue
            {promoCount > 0 && (
              <>
                {" · "}
                <span className="font-semibold text-danger">
                  {promoCount} on promo
                </span>
              </>
            )}
            {soldOutCount > 0 && (
              <>
                {" · "}
                <span className="font-semibold text-danger">
                  {soldOutCount} sold out
                </span>
              </>
            )}
          </p>
        </div>
        <Link
          href="/products/new"
          className="self-start rounded-full bg-bg-dark px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-bg-light transition-opacity hover:opacity-90 sm:self-auto"
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
        <ProductsTable products={products} />
      )}
    </AdminShell>
  );
}
