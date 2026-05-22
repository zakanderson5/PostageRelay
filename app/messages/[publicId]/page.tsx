import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, getUserIdFromToken } from "@/lib/auth";
import { signMessage } from "@/lib/signedLinks";
import {
  centsToUsd,
  formatDateTime,
  statusColor,
  statusLabel,
} from "@/lib/format";
import { INLINE_PREVIEW_TYPES, isReceiverVisibleStatus } from "@/lib/attachments";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const dynamic = "force-dynamic";

const cardStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 14,
  padding: 16,
  marginBottom: 16,
  background: "rgba(255,255,255,0.02)",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.65,
  textTransform: "uppercase",
  letterSpacing: 0.4,
  marginBottom: 2,
};

const valueStyle: React.CSSProperties = {
  fontSize: 14,
};

function payoutLabel(status: string): string {
  switch (status) {
    case "ACCEPTED":
      return "Bond captured — payout sent to your Stripe account";
    case "RELEASED":
      return "Bond released — sender refunded (delivery fee captured)";
    case "EXPIRED":
      return "Expired — bond released to sender automatically";
    case "AUTHORIZED":
      return "Bond authorized — awaiting your review";
    default:
      return "—";
  }
}

export default async function MessageDetailPage(props: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await props.params;

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  const userId = token ? await getUserIdFromToken(token) : null;
  if (!userId) redirect(`/login?next=/messages/${publicId}`);

  const msg = await prisma.message.findUnique({
    where: { publicId },
    select: {
      publicId: true,
      receiverId: true,
      senderEmail: true,
      senderName: true,
      subject: true,
      body: true,
      bondCents: true,
      deliveryFeeCents: true,
      currency: true,
      status: true,
      authorizedAt: true,
      expiresAt: true,
      createdAt: true,
      attachments: {
        select: {
          id: true,
          originalFileName: true,
          contentType: true,
          sizeBytes: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  // Ownership + status guard — DRAFT/AUTHORIZING are not yet "real" delivered messages.
  if (!msg) notFound();
  if (msg.receiverId !== userId) notFound();
  if (msg.status === "DRAFT" || msg.status === "AUTHORIZING") notFound();

  const senderDisplay = msg.senderName
    ? `${msg.senderName} <${msg.senderEmail}>`
    : msg.senderEmail;

  // Build a signed review URL for AUTHORIZED messages (reuses existing /r flow).
  let reviewUrl: string | null = null;
  if (msg.status === "AUTHORIZED") {
    const expUnix = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour
    const sig = signMessage(publicId, expUnix);
    reviewUrl = `/r/${publicId}?e=${expUnix}&s=${sig}`;
  }

  return (
    <main style={{ minHeight: "100vh", padding: "0 20px 32px", display: "grid", placeItems: "start center" }}>
      <div style={{ width: "100%", maxWidth: 760 }}>
        <div style={{ marginBottom: 12, fontSize: 14 }}>
          <Link href="/inbox" style={{ color: "#6aa9ff", textDecoration: "none" }}>
            ← Back to inbox
          </Link>
        </div>

        <h1 style={{ marginTop: 0, marginBottom: 4 }}>
          {msg.subject?.trim() || "(no subject)"}
        </h1>
        <div style={{ opacity: 0.7, marginBottom: 20, fontSize: 14 }}>
          From {senderDisplay}
        </div>

        <section style={cardStyle}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 12,
            }}
          >
            <div>
              <div style={labelStyle}>Status</div>
              <div style={{ ...valueStyle, color: statusColor(msg.status), fontWeight: 700 }}>
                {statusLabel(msg.status)}
              </div>
            </div>
            <div>
              <div style={labelStyle}>Bond</div>
              <div style={valueStyle}>{centsToUsd(msg.bondCents, msg.currency)}</div>
            </div>
            <div>
              <div style={labelStyle}>Delivery fee</div>
              <div style={valueStyle}>{centsToUsd(msg.deliveryFeeCents, msg.currency)}</div>
            </div>
            <div>
              <div style={labelStyle}>Received</div>
              <div style={valueStyle}>{formatDateTime(msg.createdAt)}</div>
            </div>
            {msg.authorizedAt ? (
              <div>
                <div style={labelStyle}>Authorized</div>
                <div style={valueStyle}>{formatDateTime(msg.authorizedAt)}</div>
              </div>
            ) : null}
            {msg.expiresAt ? (
              <div>
                <div style={labelStyle}>
                  {msg.status === "AUTHORIZED" ? "Expires" : "Expired"}
                </div>
                <div style={valueStyle}>{formatDateTime(msg.expiresAt)}</div>
              </div>
            ) : null}
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={labelStyle}>Payout status</div>
            <div style={valueStyle}>{payoutLabel(msg.status)}</div>
          </div>
        </section>

        {msg.attachments.length > 0 && isReceiverVisibleStatus(msg.status) ? (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, marginBottom: 12 }}>
              Attachments ({msg.attachments.length})
            </h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
              {msg.attachments.map((a) => {
                const base = `/api/messages/${msg.publicId}/attachments/${a.id}`;
                const canInline = INLINE_PREVIEW_TYPES.has(a.contentType);
                return (
                  <li
                    key={a.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "8px 10px",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 8,
                      fontSize: 14,
                    }}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      📎 {a.originalFileName}{" "}
                      <span style={{ opacity: 0.65, fontSize: 12 }}>
                        ({formatSize(a.sizeBytes)})
                      </span>
                    </span>
                    <span style={{ display: "flex", gap: 10 }}>
                      {canInline ? (
                        <a href={`${base}?inline=1`} target="_blank" rel="noreferrer" style={{ color: "#6aa9ff" }}>
                          View
                        </a>
                      ) : null}
                      <a href={base} style={{ color: "#6aa9ff" }}>Download</a>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0, marginBottom: 12 }}>Message</h2>
          <pre
            style={{
              margin: 0,
              padding: 14,
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              background: "rgba(0,0,0,0.25)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontFamily: "inherit",
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            {msg.body}
          </pre>
        </section>

        {reviewUrl ? (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>Action required</h2>
            <div style={{ opacity: 0.75, fontSize: 14, marginBottom: 12 }}>
              This message is awaiting your decision. Accept to keep the bond, or
              release to refund the sender (the delivery fee is still captured).
            </div>
            <a
              href={reviewUrl}
              style={{
                display: "inline-block",
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.08)",
                color: "inherit",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Review / Accept or Release
            </a>
          </section>
        ) : null}
      </div>
    </main>
  );
}
