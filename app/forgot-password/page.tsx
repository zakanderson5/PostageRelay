"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      // Intentionally swallow — UI shows the same generic confirmation either way.
    } finally {
      setSubmitting(false);
      setSubmitted(true);
    }
  }

  return (
    <main style={{ minHeight: "100vh", padding: 24, display: "grid", placeItems: "center" }}>
      <div style={{ width: "100%", maxWidth: 520 }}>
        <h1 style={{ marginBottom: 8 }}>Forgot your password?</h1>
        <p style={{ opacity: 0.8, marginTop: 0 }}>
          Enter the email for your GatePost Inbox account and we&apos;ll send you a reset link.
        </p>

        {submitted ? (
          <div
            style={{
              padding: 14,
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
              marginBottom: 16,
            }}
          >
            If an account exists for that email, we sent a reset link.
          </div>
        ) : (
          <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
            <label style={{ display: "grid", gap: 6 }}>
              Email
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                required
                style={{ padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)" }}
              />
            </label>

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
              {submitting ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <p style={{ marginTop: 16, fontSize: 14 }}>
          <Link href="/login" style={{ color: "#6aa9ff" }}>
            ← Back to login
          </Link>
        </p>
      </div>
    </main>
  );
}
