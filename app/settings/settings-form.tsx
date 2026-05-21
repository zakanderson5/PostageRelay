"use client";

import { useMemo, useState } from "react";

type Initial = {
  email: string;
  stripeAccountId: string;
  stripeOnboarded: boolean;
  slug: string;
  displayName: string;
  minBondCents: number;
};

export default function SettingsForm({ initial }: { initial: Initial }) {
  const [email, setEmail] = useState(initial.email);
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [minBondDollars, setMinBondDollars] = useState(() => (initial.minBondCents / 100).toFixed(2));

  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const publicLink = useMemo(() => `https://www.gatepostinbox.com/u/${initial.slug}`, [initial.slug]);

  async function save() {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          displayName,
          minBondDollars,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(data?.error || "Save failed");
        return;
      }
      setStatus("Saved");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <main style={{ minHeight: "100vh", padding: 24, display: "grid", placeItems: "center" }}>
      <div style={{ width: "100%", maxWidth: 680 }}>
        <h1 style={{ marginBottom: 8 }}>Settings</h1>

        <div style={{ opacity: 0.85, marginBottom: 16 }}>
          Your public link:{" "}
          <a href={publicLink} target="_blank" rel="noreferrer">
            {publicLink}
          </a>
        </div>

        <section style={{ border: "1px solid rgba(255,255,255,0.14)", borderRadius: 14, padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>Account</h2>

          <label style={{ display: "grid", gap: 6, marginBottom: 12 }}>
            Review email (where you receive review links)
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              style={{ padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)" }}
            />
          </label>

          <label style={{ display: "grid", gap: 6, marginBottom: 12 }}>
            Display name
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={{ padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)" }}
            />
          </label>

          <label style={{ display: "grid", gap: 6, marginBottom: 12 }}>
            Minimum bond (USD)
            <input
              value={minBondDollars}
              onChange={(e) => setMinBondDollars(e.target.value)}
              inputMode="decimal"
              style={{ padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)" }}
            />
          </label>

          <div style={{ opacity: 0.85, marginBottom: 12 }}>
            Stripe status:{" "}
            {initial.stripeOnboarded ? (
              <b>Connected</b>
            ) : initial.stripeAccountId ? (
              <b>Started (not complete)</b>
            ) : (
              <b>Not connected</b>
            )}
            <div style={{ opacity: 0.7, marginTop: 6 }}>
              (Next improvement: put a “Connect / Continue Stripe onboarding” button here.)
            </div>
          </div>

          {status ? <div style={{ marginBottom: 12 }}>{status}</div> : null}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={save}
              disabled={saving}
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.06)",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>

            <button
              onClick={logout}
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.02)",
                cursor: "pointer",
              }}
            >
              Log out
            </button>
          </div>
        </section>

        <section style={{ marginTop: 16, opacity: 0.75 }}>
          Next settings we’ll add here:
          <div>- Domain routing (copy/paste forwarding rules)</div>
          <div>- Notifications</div>
          <div>- Max bond (optional) and timeout window</div>
          <div>- Stripe reconnect button</div>
        </section>
      </div>
    </main>
  );
}
