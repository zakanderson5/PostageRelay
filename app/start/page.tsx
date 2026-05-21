"use client";

import React, { useState } from "react";
import DomainRoutingOptions from "./DomainRoutingOptions";

export default function StartPage() {
  const [slug, setSlug] = useState("");

  return (
    <main
      style={{
        maxWidth: 560,
        margin: "40px auto",
        padding: 20,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      <h1 style={{ marginBottom: 8 }}>Create your GatePost Inbox</h1>

      <p style={{ marginTop: 0, opacity: 0.85, lineHeight: 1.4 }}>
        Pick your link + password, then connect Stripe so you can receive payouts when you accept messages.
      </p>

      <form action="/api/start" method="POST" style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Your email (where you’ll receive review links)</span>
          <input
            name="email"
            type="email"
            placeholder="you@company.com"
            required
            autoComplete="email"
            style={{ padding: 10, borderRadius: 8, border: "1px solid #333" }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Choose your link</span>
          <input
            name="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="acme-support"
            required
            minLength={3}
            maxLength={32}
            autoComplete="username"
            style={{ padding: 10, borderRadius: 8, border: "1px solid #333" }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Password (min 8 characters)</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            style={{ padding: 10, borderRadius: 8, border: "1px solid #333" }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Confirm password</span>
          <input
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            style={{ padding: 10, borderRadius: 8, border: "1px solid #333" }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Display name (optional)</span>
          <input
            name="displayName"
            placeholder="Acme Support"
            style={{ padding: 10, borderRadius: 8, border: "1px solid #333" }}
          />
        </label>

        <DomainRoutingOptions slug={slug} />

        <input name="website" tabIndex={-1} autoComplete="off" style={{ display: "none" }} />

        <button
          type="submit"
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #333",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Continue to Stripe
        </button>
      </form>

      <p style={{ marginTop: 14, fontSize: 12, opacity: 0.75 }}>
        Already have an account? <a href="/login">Log in</a>
      </p>

      <p style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
        By continuing you’ll be redirected to Stripe Connect onboarding.
      </p>
    </main>
  );
}
