"use client";

import { useState } from "react";

type Initial = {
  email: string;
  displayName: string;
  minBondCents: number;
  maxBondCents: number;
  allowBoost: boolean;
};

const cardStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 14,
  padding: 16,
  marginBottom: 16,
  background: "rgba(255,255,255,0.02)",
};

const btnPrimary: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.08)",
  cursor: "pointer",
  fontWeight: 600,
  color: "inherit",
};

const btnSecondary: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.02)",
  cursor: "pointer",
  color: "inherit",
};

const inputStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(0,0,0,0.2)",
  color: "inherit",
};

export default function SettingsForm({ initial }: { initial: Initial }) {
  const [email, setEmail] = useState(initial.email);
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [minBondDollars, setMinBondDollars] = useState(() =>
    (initial.minBondCents / 100).toFixed(2)
  );
  const [maxBondDollars, setMaxBondDollars] = useState(() =>
    (initial.maxBondCents / 100).toFixed(2)
  );
  const [allowBoost, setAllowBoost] = useState(initial.allowBoost);

  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function save() {
    setSaving(true);
    setStatus(null);
    setIsError(false);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          displayName,
          minBondDollars,
          maxBondDollars,
          allowBoost,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setIsError(true);
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
    <main style={{ minHeight: "100vh", padding: "0 20px 32px", display: "grid", placeItems: "start center" }}>
      <div style={{ width: "100%", maxWidth: 720 }}>
        <h1 style={{ marginTop: 0, marginBottom: 4 }}>Settings</h1>
        <div style={{ opacity: 0.7, marginBottom: 20 }}>
          Your profile and bond rules.
        </div>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Profile</h2>

          <label style={{ display: "grid", gap: 6, marginBottom: 12 }}>
            Review email (where you receive review links)
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              style={inputStyle}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            Display name
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={inputStyle}
            />
          </label>
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Bond rules</h2>
          <div style={{ opacity: 0.7, fontSize: 13, marginBottom: 12 }}>
            Set the bond range senders can offer to reach you.
          </div>

          <label style={{ display: "grid", gap: 6, marginBottom: 12 }}>
            Minimum bond (USD)
            <input
              value={minBondDollars}
              onChange={(e) => setMinBondDollars(e.target.value)}
              inputMode="decimal"
              style={inputStyle}
            />
          </label>

          <label style={{ display: "grid", gap: 6, marginBottom: 12 }}>
            Maximum bond (USD)
            <input
              value={maxBondDollars}
              onChange={(e) => setMaxBondDollars(e.target.value)}
              inputMode="decimal"
              style={inputStyle}
            />
            <span style={{ opacity: 0.6, fontSize: 12 }}>
              Up to $10,000. Must be at least the minimum.
            </span>
          </label>

          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={allowBoost}
              onChange={(e) => setAllowBoost(e.target.checked)}
              style={{ marginTop: 3 }}
            />
            <span>
              <div style={{ fontWeight: 600 }}>Allow senders to boost above the minimum</div>
              <div style={{ opacity: 0.65, fontSize: 13 }}>
                When off, every sender pays exactly the minimum bond.
              </div>
            </span>
          </label>
        </section>

        {status ? (
          <div
            style={{
              marginBottom: 12,
              color: isError ? "#ef4444" : "#3ddc84",
              fontSize: 14,
            }}
          >
            {status}
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={save} disabled={saving} style={btnPrimary}>
            {saving ? "Saving..." : "Save changes"}
          </button>
          <button onClick={logout} style={btnSecondary}>
            Log out
          </button>
        </div>
      </div>
    </main>
  );
}
