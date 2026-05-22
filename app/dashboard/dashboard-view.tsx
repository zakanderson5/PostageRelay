"use client";

import Link from "next/link";
import { useState } from "react";
import {
  centsToUsd,
  formatDateTime,
  maskAccountId,
  relativeFromNow,
  statusColor,
  statusLabel,
  truncate,
} from "@/lib/format";

type StripeStatus = "ready" | "pending" | "not_connected" | "error_unknown";

type MessageRow = {
  publicId: string;
  senderEmail: string;
  senderName: string | null;
  subject: string | null;
  bondCents: number;
  deliveryFeeCents: number;
  currency: string;
  status: string;
  expiresAt: string | null;
  createdAt: string;
};

const STATUS_TILES: { key: string; label: string }[] = [
  { key: "AUTHORIZED", label: "Awaiting review" },
  { key: "ACCEPTED", label: "Accepted" },
  { key: "RELEASED", label: "Released" },
  { key: "EXPIRED", label: "Expired" },
  { key: "FAILED", label: "Failed" },
];

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

function StripeBadge({ status }: { status: StripeStatus }) {
  const map: Record<StripeStatus, { color: string; label: string }> = {
    ready: { color: "#3ddc84", label: "Payouts ready" },
    pending: { color: "#f0b429", label: "Payouts pending" },
    not_connected: { color: "#ef4444", label: "Not connected" },
    error_unknown: { color: "#9aa3ad", label: "Status unknown" },
  };
  const { color, label } = map[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "2px 10px",
        borderRadius: 999,
        border: `1px solid ${color}`,
        color,
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: 999, background: color }} aria-hidden />
      {label}
    </span>
  );
}

export default function DashboardView({
  stripeAccountId,
  stripeStatus,
  publicLink,
  statusCounts,
  messages,
}: {
  stripeAccountId: string;
  stripeStatus: StripeStatus;
  publicLink: string;
  statusCounts: Record<string, number>;
  messages: MessageRow[];
}) {
  const [copied, setCopied] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  async function startStripeOnboarding() {
    setStripeLoading(true);
    setStripeError(null);
    try {
      const res = await fetch("/api/stripe/onboarding-link", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) {
        setStripeError(data?.error || "Could not start Stripe onboarding");
        setStripeLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch (e: any) {
      setStripeError(e?.message || "Network error");
      setStripeLoading(false);
    }
  }

  const stripeCtaLabel =
    stripeStatus === "not_connected"
      ? "Connect Stripe"
      : stripeStatus === "pending"
        ? "Resume Stripe onboarding"
        : stripeStatus === "error_unknown"
          ? "Retry Stripe"
          : null;

  return (
    <main style={{ minHeight: "100vh", padding: "0 20px 32px", display: "grid", placeItems: "start center" }}>
      <div style={{ width: "100%", maxWidth: 880 }}>
        <h1 style={{ marginTop: 0, marginBottom: 4 }}>Dashboard</h1>
        <div style={{ opacity: 0.7, marginBottom: 20 }}>
          Overview of your GatePost Inbox.
        </div>

        {/* Stripe readiness */}
        <section style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h2 style={{ margin: 0, marginBottom: 6 }}>Payouts</h2>
              <StripeBadge status={stripeStatus} />
              {stripeAccountId ? (
                <div style={{ opacity: 0.6, marginTop: 8, fontSize: 13 }}>
                  Stripe account: <code>{maskAccountId(stripeAccountId)}</code>
                </div>
              ) : null}
              <div style={{ opacity: 0.7, marginTop: 8, fontSize: 13, maxWidth: 520 }}>
                {stripeStatus === "ready"
                  ? "You can accept bonds and receive payouts."
                  : stripeStatus === "pending"
                    ? "Stripe is verifying your account. Finish onboarding to enable payouts."
                    : stripeStatus === "not_connected"
                      ? "Connect Stripe to receive bond payouts when you accept messages."
                      : "We couldn't reach Stripe to check your status. Try again."}
              </div>
            </div>
            {stripeCtaLabel ? (
              <button onClick={startStripeOnboarding} disabled={stripeLoading} style={btnPrimary}>
                {stripeLoading ? "Opening…" : stripeCtaLabel}
              </button>
            ) : null}
          </div>
          {stripeError ? (
            <div style={{ marginTop: 10, color: "#ef4444", fontSize: 13 }}>{stripeError}</div>
          ) : null}
        </section>

        {/* Public link */}
        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Your public link</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <code
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                background: "rgba(0,0,0,0.25)",
                border: "1px solid rgba(255,255,255,0.1)",
                flex: "1 1 320px",
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {publicLink}
            </code>
            <button onClick={copyLink} style={btnSecondary}>
              {copied ? "Copied!" : "Copy link"}
            </button>
            <a href={publicLink} target="_blank" rel="noreferrer" style={{ ...btnSecondary, textDecoration: "none", display: "inline-block" }}>
              Open
            </a>
          </div>
          <div style={{ opacity: 0.65, marginTop: 8, fontSize: 13 }}>
            Share this link so senders can pay a bond to reach you.
          </div>
        </section>

        {/* Status summary */}
        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>At a glance</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 10,
            }}
          >
            {STATUS_TILES.map((t) => {
              const n = statusCounts[t.key] ?? 0;
              return (
                <div
                  key={t.key}
                  style={{
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 12,
                    padding: 12,
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{t.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: statusColor(t.key) }}>{n}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent messages */}
        <section style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <h2 style={{ margin: 0 }}>Recent messages</h2>
            <Link href="/inbox" style={{ color: "#6aa9ff", fontSize: 14 }}>
              View full inbox →
            </Link>
          </div>
          {messages.length === 0 ? (
            <div style={{ opacity: 0.7 }}>No messages yet. Share your link to get started.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ textAlign: "left", opacity: 0.7 }}>
                    <th style={{ padding: "8px 6px" }}>When</th>
                    <th style={{ padding: "8px 6px" }}>Sender</th>
                    <th style={{ padding: "8px 6px" }}>Subject</th>
                    <th style={{ padding: "8px 6px" }}>Bond</th>
                    <th style={{ padding: "8px 6px" }}>Status</th>
                    <th style={{ padding: "8px 6px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((m) => {
                    const senderDisplay = m.senderName ? `${m.senderName} <${m.senderEmail}>` : m.senderEmail;
                    const canReview = m.status === "AUTHORIZED";
                    return (
                      <tr key={m.publicId} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                        <td style={{ padding: "10px 6px", whiteSpace: "nowrap" }} title={formatDateTime(m.createdAt)}>
                          {relativeFromNow(m.createdAt)}
                        </td>
                        <td style={{ padding: "10px 6px", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={senderDisplay}>
                          {truncate(senderDisplay, 40)}
                        </td>
                        <td style={{ padding: "10px 6px", maxWidth: 280 }} title={m.subject ?? ""}>
                          {truncate(m.subject, 80) || <span style={{ opacity: 0.5 }}>(no subject)</span>}
                        </td>
                        <td style={{ padding: "10px 6px", whiteSpace: "nowrap" }}>
                          {centsToUsd(m.bondCents, m.currency)}
                        </td>
                        <td style={{ padding: "10px 6px", whiteSpace: "nowrap" }}>
                          <span style={{ color: statusColor(m.status), fontWeight: 600 }}>{statusLabel(m.status)}</span>
                        </td>
                        <td style={{ padding: "10px 6px", whiteSpace: "nowrap" }}>
                          {canReview ? (
                            <a href={`/r/${m.publicId}`} style={{ color: "#6aa9ff" }}>
                              Review
                            </a>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
