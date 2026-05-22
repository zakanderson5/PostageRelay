import { prisma } from "@/lib/prisma";
import { verifyMessageSignature } from "@/lib/signedLinks";
import { notFound } from "next/navigation";
import { INLINE_PREVIEW_TYPES, isReceiverVisibleStatus } from "@/lib/attachments";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default async function ReviewPage(props: {
  params: Promise<{ publicId: string }>;
  searchParams: Promise<{ e?: string; s?: string }>;
}) {
  const { publicId } = await props.params;
  const sp = await props.searchParams;

  const expUnix = Number(sp.e);
  const sig = sp.s ?? "";

  if (!verifyMessageSignature(publicId, expUnix, sig)) notFound();

  const msg = await prisma.message.findUnique({
    where: { publicId },
    include: {
      bondPage: true,
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

  if (!msg) notFound();

  const bond = (msg.bondCents / 100).toFixed(2);
  const fee = (msg.deliveryFeeCents / 100).toFixed(2);

  const acceptAction = `/api/messages/${publicId}/accept?e=${expUnix}&s=${sig}`;
  const releaseAction = `/api/messages/${publicId}/release?e=${expUnix}&s=${sig}`;

  const showAttachments =
    msg.attachments.length > 0 && isReceiverVisibleStatus(msg.status);

  return (
    <main style={{ padding: 24, maxWidth: 820, margin: "0 auto", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 26, fontWeight: 900 }}>Review message</h1>

      <div style={{ marginTop: 14, padding: 12, border: "1px solid #333", borderRadius: 10 }}>
        <div><b>Status:</b> {msg.status}</div>
        <div><b>From:</b> {msg.senderEmail}</div>
        <div><b>Subject:</b> {msg.subject ?? "(none)"}</div>
        <div><b>Bond:</b> ${bond} &nbsp; <b>Delivery fee:</b> ${fee}</div>
      </div>

      <pre style={{ marginTop: 12, padding: 12, border: "1px solid #333", borderRadius: 10, whiteSpace: "pre-wrap" }}>
        {msg.body}
      </pre>

      {showAttachments ? (
        <section style={{ marginTop: 12, padding: 12, border: "1px solid #333", borderRadius: 10 }}>
          <h2 style={{ marginTop: 0, marginBottom: 8, fontSize: 18, fontWeight: 800 }}>
            Attachments ({msg.attachments.length})
          </h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
            {msg.attachments.map((a) => {
              const base = `/api/messages/${publicId}/attachments/${a.id}?e=${expUnix}&s=${sig}`;
              const canInline = INLINE_PREVIEW_TYPES.has(a.contentType);
              return (
                <li
                  key={a.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "6px 10px",
                    border: "1px solid #444",
                    borderRadius: 8,
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    📎 {a.originalFileName}{" "}
                    <span style={{ color: "#aaa", fontSize: 12 }}>
                      ({formatSize(a.sizeBytes)})
                    </span>
                  </span>
                  <span style={{ display: "flex", gap: 10 }}>
                    {canInline ? (
                      <a href={`${base}&inline=1`} target="_blank" rel="noreferrer" style={{ color: "#6aa9ff" }}>
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

      {msg.status === "AUTHORIZED" ? (
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <form method="post" action={acceptAction}>
            <button style={{ padding: 10, borderRadius: 10, border: "1px solid #222", fontWeight: 900 }}>
              Accept (keep bond)
            </button>
          </form>
          <form method="post" action={releaseAction}>
            <button style={{ padding: 10, borderRadius: 10, border: "1px solid #222", fontWeight: 900 }}>
              Release (capture fee only)
            </button>
          </form>
        </div>
      ) : (
        <p style={{ marginTop: 12, color: "#bbb" }}>
          This message is no longer actionable (status: {msg.status}).
        </p>
      )}
    </main>
  );
}
