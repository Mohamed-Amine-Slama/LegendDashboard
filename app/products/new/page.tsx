import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import ProductForm from "@/components/ProductForm";

export default function NewProductPage() {
  return (
    <AdminShell>
      <Link
        href="/products"
        className="mb-4 inline-block text-xs font-semibold uppercase tracking-wider text-muted hover:text-bg-dark"
      >
        ← Back to products
      </Link>
      <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">New product</h1>

      <ProductForm />
    </AdminShell>
  );
}
