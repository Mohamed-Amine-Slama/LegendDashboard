import Link from "next/link";
import { notFound } from "next/navigation";
import { ObjectId } from "mongodb";
import { COLLECTIONS, getDb } from "@/lib/db";
import type { MongoProduct } from "@/lib/types";
import AdminShell from "@/components/AdminShell";
import ProductForm from "@/components/ProductForm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getProduct(id: string): Promise<MongoProduct | null> {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  const doc = await db
    .collection<MongoProduct>(COLLECTIONS.products)
    .findOne({ _id: new ObjectId(id) as unknown as MongoProduct["_id"] });
  if (!doc) return null;
  return { ...doc, _id: String(doc._id) };
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <AdminShell>
      <Link
        href="/products"
        className="mb-4 inline-block text-xs font-semibold uppercase tracking-wider text-muted hover:text-bg-dark"
      >
        ← Back to products
      </Link>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">
          {product.name}
        </h1>
        <span className="break-all text-[11px] uppercase tracking-wider text-muted sm:text-xs">
          ID: {product._id}
        </span>
      </div>

      <ProductForm product={product} />
    </AdminShell>
  );
}
