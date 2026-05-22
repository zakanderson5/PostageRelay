"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const token = sp.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasToken = token.length > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!hasToken) {
      setError("Reset link is invalid or has expired.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Reset link is invalid or has expired.");
        return;
      }
      router.push("/login?reset=1");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", padding: 24, display: "grid", placeItems: "center" }}>
      <div style={{ width: "100%", maxWidth: 520 }}>
        <h1 style={{ marginBottom: 8 }}>Set a new password</h1>
        <p style={{ opacity: 0.8, marginTop: 0 }}>
          Choose a new password for your GatePost Inbox account.
        </p>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            New password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              style={{ padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)" }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            Confirm new password
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              style={{ padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)" }}
            />
          </label>

          {error ? <div style={{ color: "#ff6b6b" }}>{error}</div> : null}

          <button
            type="submit"
            disabled={submitting || !hasToken}
            style={{
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.06)",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {submitting ? "Updating..." : "Update password"}
          </button>
        </form>

        <p style={{ marginTop: 16, fontSize: 14 }}>
          <Link href="/login" style={{ color: "#6aa9ff" }}>
            ← Back to login
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: "100vh", padding: 24 }}>Loading...</main>}>
      <ResetPasswordInner />
    </Suspense>
  );
}
