"use client";

import React, { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginInner() {
  const router = useRouter();
  const sp = useSearchParams();

  const nextUrl = useMemo(() => {
    const n = sp.get("next");
    return n && n.startsWith("/") ? n : "/settings";
  }, [sp]);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Login failed");
        return;
      }

      router.push(nextUrl);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", padding: 24, display: "grid", placeItems: "center" }}>
      <div style={{ width: "100%", maxWidth: 520 }}>
        <h1 style={{ marginBottom: 8 }}>Log in</h1>
        <p style={{ opacity: 0.8, marginTop: 0 }}>
          Use your email or your link slug (example: <b>acme-support</b>)
        </p>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            Email or slug
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              required
              style={{ padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)" }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              required
              style={{ padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)" }}
            />
          </label>

          {error ? <div style={{ color: "#ff6b6b" }}>{error}</div> : null}

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.06)",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {submitting ? "Logging in..." : "Log in"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: "100vh", padding: 24 }}>Loading...</main>}>
      <LoginInner />
    </Suspense>
  );
}
