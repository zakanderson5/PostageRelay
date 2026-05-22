import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
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

const PAGE_SIZE = 20;

const VISIBLE_STATUSES = ["AUTHORIZED", "ACCEPTED", "RELEASED", "EXPIRED"] as const;
type VisibleStatus = (typeof VISIBLE_STATUSES)[number];

const FILTERS = [
  { key: "all", label: "All", statuses: [...VISIBLE_STATUSES] as VisibleStatus[] },
  { key: "awaiting", label: "Awaiting review", statuses: ["AUTHORIZED"] as VisibleStatus[] },
  { key: "accepted", label: "Accepted", statuses: ["ACCEPTED"] as VisibleStatus[] },
  { key: "released", label: "Released", statuses: ["RELEASED"] as VisibleStatus[] },
  { key: "expired", label: "Expired", statuses: ["EXPIRED"] as VisibleStatus[] },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function normalizeStatus(raw: string | string[] | undefined): FilterKey {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const found = FILTERS.find((f) => f.key === v);
  return (found?.key ?? "all") as FilterKey;
}

function normalizeQuery(raw: string | string[] | undefined): string {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v) return "";
  return v.trim().slice(0, 120);
}

function normalizePage(raw: string | string[] | undefined): number {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const n = Number.parseInt(v ?? "1", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 100000);
}

function buildHref(params: { status: FilterKey; q: string; page: number }): string {
  const sp = new URLSearchParams();
  if (params.status !== "all") sp.set("status", params.status);
  if (params.q) sp.set("q", params.q);
  if (params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `/inbox?${qs}` : "/inbox";
}

export default async function InboxPage(props: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  const userId = token ? await getUserIdFromToken(token) : null;
  if (!userId) redirect("/login?next=/inbox");

  const sp = await props.searchParams;
  const statusKey = normalizeStatus(sp.status);
  const q = normalizeQuery(sp.q);
  const page = normalizePage(sp.page);

  const filter = FILTERS.find((f) => f.key === statusKey)!;

  const where: Prisma.MessageWhereInput = {
    receiverId: userId,
    status: { in: filter.statuses },
    ...(q
      ? {
          OR: [
            { senderEmail: { contains: q, mode: "insensitive" } },
            { senderName: { contains: q, mode: "insensitive" } },
            { subject: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const total = await prisma.message.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const hasPrev = safePage > 1;
  const hasNext = safePage < totalPages;

  const messages = total === 0
    ? []
    : await prisma.message.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (safePage - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
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
        <div style={{ opacity: 0.7, marginBottom: 16 }}>
          {total === 0
            ? "No messages match your filters."
            : `${total} message${total === 1 ? "" : "s"} — page ${safePage} of ${totalPages}`}
        </div>

        <nav
          aria-label="Filter by status"
          style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}
        >
          {FILTERS.map((f) => {
            const active = f.key === statusKey;
            return (
              <Link
                key={f.key}
                href={buildHref({ status: f.key, q, page: 1 })}
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                  border: active
                    ? "1px solid rgba(106,169,255,0.9)"
                    : "1px solid rgba(255,255,255,0.18)",
                  background: active ? "rgba(106,169,255,0.18)" : "rgba(255,255,255,0.02)",
                  color: active ? "#cfe2ff" : "rgba(255,255,255,0.85)",
                }}
              >
                {f.label}
              </Link>
            );
          })}
        </nav>

        <form
          method="get"
          action="/inbox"
          style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}
        >
          {statusKey !== "all" ? (
            <input type="hidden" name="status" value={statusKey} />
          ) : null}
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search sender or subject"
            aria-label="Search messages"
            style={{
              flex: "1 1 240px",
              minWidth: 0,
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.04)",
              color: "inherit",
              fontSize: 14,
            }}
          />
          <button
            type="submit"
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.06)",
              color: "inherit",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Search
          </button>
          {q ? (
            <Link
              href={buildHref({ status: statusKey, q: "", page: 1 })}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.14)",
                color: "rgba(255,255,255,0.75)",
                textDecoration: "none",
                fontSize: 13,
                alignSelf: "center",
              }}
            >
              Clear
            </Link>
          ) : null}
        </form>

        <section style={cardStyle}>
          {messages.length === 0 ? (
            <div style={{ opacity: 0.7 }}>No messages found.</div>
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
                    const detailHref = `/messages/${m.publicId}`;
                    return (
                      <tr key={m.publicId} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                        <td style={{ padding: "10px 6px", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={senderDisplay}>
                          <Link href={detailHref} style={{ color: "inherit", textDecoration: "none" }}>
                            {truncate(senderDisplay, 40)}
                          </Link>
                        </td>
                        <td style={{ padding: "10px 6px", maxWidth: 280 }} title={m.subject ?? ""}>
                          <Link href={detailHref} style={{ color: "inherit", textDecoration: "none" }}>
                            {truncate(m.subject, 80) || <span style={{ opacity: 0.5 }}>(no subject)</span>}
                          </Link>
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
                          <Link href={detailHref} style={{ color: "#6aa9ff" }}>
                            {canReview ? "Review" : "Open"}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {totalPages > 1 ? (
          <nav
            aria-label="Pagination"
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}
          >
            {hasPrev ? (
              <Link
                href={buildHref({ status: statusKey, q, page: safePage - 1 })}
                style={{
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.18)",
                  textDecoration: "none",
                  color: "inherit",
                  fontWeight: 600,
                }}
              >
                ← Previous
              </Link>
            ) : (
              <span
                aria-disabled="true"
                style={{
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.35)",
                  fontWeight: 600,
                }}
              >
                ← Previous
              </span>
            )}
            <div style={{ opacity: 0.7, fontSize: 13 }}>
              Page {safePage} of {totalPages}
            </div>
            {hasNext ? (
              <Link
                href={buildHref({ status: statusKey, q, page: safePage + 1 })}
                style={{
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.18)",
                  textDecoration: "none",
                  color: "inherit",
                  fontWeight: 600,
                }}
              >
                Next →
              </Link>
            ) : (
              <span
                aria-disabled="true"
                style={{
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.35)",
                  fontWeight: 600,
                }}
              >
                Next →
              </span>
            )}
          </nav>
        ) : null}
      </div>
    </main>
  );
}
