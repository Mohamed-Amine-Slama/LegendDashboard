"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

/**
 * Top bar + side margins shared across all admin pages. Keeps a logout
 * button accessible from every screen.
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-bg-light/95 px-4 py-3 backdrop-blur sm:px-6">
        <Link
          href="/products"
          className="flex min-w-0 items-center gap-2 text-sm font-bold tracking-tight"
        >
          <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-accent" />
          <span className="truncate">
            <span className="sm:hidden">Legend · Admin</span>
            <span className="hidden sm:inline">LEGEND VAPE STORE · Admin</span>
          </span>
        </Link>

        <nav className="flex shrink-0 items-center gap-1 text-[12px] font-medium uppercase tracking-wider">
          <Link
            href="/products"
            className={navLink(pathname?.startsWith("/products") ?? false)}
          >
            Products
          </Link>
          <button
            onClick={logout}
            type="button"
            className="ml-2 rounded-full border border-border px-3 py-1.5 text-[11px] uppercase tracking-wider transition-colors hover:border-bg-dark hover:bg-bg-dark hover:text-bg-light sm:ml-3"
          >
            <span className="sm:hidden">Logout</span>
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}

function navLink(active: boolean): string {
  const base = "rounded-full px-3 py-1.5 transition-colors";
  return active
    ? `${base} bg-bg-dark text-bg-light`
    : `${base} text-muted hover:text-bg-dark`;
}
