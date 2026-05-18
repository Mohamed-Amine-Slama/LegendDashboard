"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

// Custom icons
function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Top bar + side margins shared across all admin pages. Keeps a logout
 * button accessible from every screen.
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

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
            <span className="sm:hidden">Maison · Admin</span>
            <span className="hidden sm:inline">La Maison Des Vapes · Admin</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden shrink-0 items-center gap-1 text-[12px] font-medium uppercase tracking-wider sm:flex">
          <Link
            href="/products"
            className={navLink(pathname?.startsWith("/products") ?? false)}
          >
            Products
          </Link>
          <Link
            href="/orders"
            className={navLink(pathname?.startsWith("/orders") ?? false)}
          >
            Orders
          </Link>
          <Link
            href="/analytics"
            className={navLink(pathname?.startsWith("/analytics") ?? false)}
          >
            Analytics
          </Link>
          <button
            onClick={logout}
            type="button"
            className="ml-3 rounded-full border border-border px-3 py-1.5 text-[11px] uppercase tracking-wider transition-colors hover:border-bg-dark hover:bg-bg-dark hover:text-bg-light"
          >
            Sign out
          </button>
        </nav>

        {/* Mobile Nav Dropdown */}
        <div className="relative sm:hidden" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center justify-center rounded-md p-2 text-bg-dark transition-colors hover:bg-bg-dark/5 focus:outline-none"
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-lg border border-border bg-bg-light py-2 shadow-lg ring-1 ring-black/5 animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95">
              <nav className="flex flex-col text-[13px] font-medium uppercase tracking-wider">
                <Link
                  href="/products"
                  className={`px-4 py-2 hover:bg-bg-dark/5 transition-colors ${
                    pathname?.startsWith("/products") ? "text-accent" : "text-bg-dark"
                  }`}
                >
                  Products
                </Link>
                <Link
                  href="/orders"
                  className={`px-4 py-2 hover:bg-bg-dark/5 transition-colors ${
                    pathname?.startsWith("/orders") ? "text-accent" : "text-bg-dark"
                  }`}
                >
                  Orders
                </Link>
                <Link
                  href="/analytics"
                  className={`px-4 py-2 hover:bg-bg-dark/5 transition-colors ${
                    pathname?.startsWith("/analytics") ? "text-accent" : "text-bg-dark"
                  }`}
                >
                  Analytics
                </Link>
                <div className="my-1 border-t border-border" />
                <button
                  onClick={logout}
                  className="flex w-full items-center px-4 py-2 text-left hover:bg-bg-dark/5 transition-colors text-bg-dark"
                >
                  Sign out
                </button>
              </nav>
            </div>
          )}
        </div>
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
