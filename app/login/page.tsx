"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Dynamic — useSearchParams reads request-time data so we can't prerender.
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("from") || "/products";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Login failed");
        return;
      }
      router.push(next);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl border border-border bg-white p-8 shadow-sm"
      >
        <div className="mb-7 text-center">
          <h1 className="text-2xl font-bold tracking-tight">LEGEND VAPE STORE</h1>
          <p className="mt-1 text-sm text-muted">Admin sign-in</p>
        </div>

        <label className="block text-xs font-medium uppercase tracking-wider text-muted">
          Admin password
        </label>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded-lg border border-border bg-bg-light px-3 py-2.5 outline-none transition-colors focus:border-accent"
          placeholder="••••••••"
        />

        {error && (
          <p className="mt-3 text-sm text-danger">⚠ {error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || !password}
          className="mt-6 w-full rounded-full bg-bg-dark py-2.5 text-sm font-semibold uppercase tracking-wider text-bg-light transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>

        <p className="mt-6 text-center text-[11px] text-muted">
          Set <code>ADMIN_PASSWORD</code> in <code>.env.local</code>.
        </p>
      </form>
    </main>
  );
}
