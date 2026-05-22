import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, getUserIdFromToken } from "@/lib/auth";
import {
  centsToUsd,
  formatDateTime,
  relativeFromNow,
  statusColor,
  statusLabel,
  truncate,
} from "@/lib/format";

export const dynamic = "force-dynamic";

const cardStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 14,
  padding: 16,
  marginBottom: 16,
  background: "rgba(255,255,255,0.02)",
};

export default async function InboxPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  const userId = token ? await getUserIdFromToken(token) : null;
  if (!userId) redirect("/login?next=/inbox");

  const messages = await prisma.message.findMany({
    where: { receiverId: userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      publicId: true,
      senderEmail: true,
      senderName: true,
      subject: true,
      bondCents: true,
      deliveryFeeCents: true,
      currency: true,
      status: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  return (
    <main style={{ minHeight: "100vh", padding: "0 20px 32px", display: "grid", placeItems: "start center" }}>
      <div style={{ width: "100%", maxWidth: 980 }}>
        <h1 style={{ marginTop: 0, marginBottom: 4 }}>Inbox</h1>
        <div style={{ opacity: 0.7, marginBottom: 20 }}>
          Your most recent {messages.length === 0 ? "messages" : `${messages.length} message${messages.length === 1 ? "" : "s"}`}.
        </div>

        <section style={cardStyle}>
          {messages.length === 0 ? (
            <div style={{ opacity: 0.7 }}>No messages yet. Share your public link to start receiving messages.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ textAlign: "left", opacity: 0.7 }}>
                    <th style={{ padding: "8px 6px" }}>Sender</th>
                    <th style={{ padding: "8px 6px" }}>Subject</th>
                    <th style={{ padding: "8px 6px" }}>Bond</th>
                    <th style={{ padding: "8px 6px" }}>Fee</th>
                    <th style={{ padding: "8px 6px" }}>Status</th>
                    <th style={{ padding: "8px 6px" }}>Created</th>
                    <th style={{ padding: "8px 6px" }}>Expires</th>
                    <th style={{ padding: "8px 6px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((m) => {
                    const senderDisplay = m.senderName ? `${m.senderName} <${m.senderEmail}>` : m.senderEmail;
                    const canReview = m.status === "AUTHORIZED";
                    return (
                      <tr key={m.publicId} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                        <td style={{ padding: "10px 6px", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={senderDisplay}>
                          {truncate(senderDisplay, 40)}
                        </td>
                        <td style={{ padding: "10px 6px", maxWidth: 280 }} title={m.subject ?? ""}>
                          {truncate(m.subject, 80) || <span style={{ opacity: 0.5 }}>(no subject)</span>}
                        </td>
                        <td style={{ padding: "10px 6px", whiteSpace: "nowrap" }}>
                          {centsToUsd(m.bondCents, m.currency)}
                        </td>
                        <td style={{ padding: "10px 6px", whiteSpace: "nowrap", opacity: 0.8 }}>
                          {centsToUsd(m.deliveryFeeCents, m.currency)}
                        </td>
                        <td style={{ padding: "10px 6px", whiteSpace: "nowrap" }}>
                          <span style={{ color: statusColor(m.status), fontWeight: 600 }}>{statusLabel(m.status)}</span>
                        </td>
                        <td style={{ padding: "10px 6px", whiteSpace: "nowrap", opacity: 0.8 }} title={formatDateTime(m.createdAt)}>
                          {relativeFromNow(m.createdAt)}
                        </td>
                        <td style={{ padding: "10px 6px", whiteSpace: "nowrap", opacity: 0.8 }} title={m.expiresAt ? formatDateTime(m.expiresAt) : ""}>
                          {m.status === "AUTHORIZED" && m.expiresAt ? relativeFromNow(m.expiresAt) : "—"}
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
