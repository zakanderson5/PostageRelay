import { prisma } from "@/lib/prisma";
import { verifyMessageSignature } from "@/lib/signedLinks";
import { notFound } from "next/navigation";

export default async function ReviewPage(props: {
  params: Promise<{ publicId: string }>;
  searchParams: Promise<{ e?: string; s?: string; done?: string }>;
}) {
  const { publicId } = await props.params;
  const sp = await props.searchParams;

  const expUnix = Number(sp.e);
  const sig = sp.s ?? "";

  if (!verifyMessageSignature(publicId, expUnix, sig)) notFound();

  const msg = await prisma.message.findUnique({
    where: { publicId },
    include: { bondPage: true },
  });

  if (!msg) notFound();

  const bond = (msg.bondCents / 100).toFixed(2);
  const fee = (msg.deliveryFeeCents / 100).toFixed(2);

  const acceptAction = `/api/messages/${publicId}/accept?e=${expUnix}&s=${sig}`;
  const releaseAction = `/api/messages/${publicId}/release?e=${expUnix}&s=${sig}`;

  return (
    <main style={{ padding: 24, maxWidth: 820, margin: "0 auto", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 26, fontWeight: 900 }}>Review message</h1>

      {sp.done ? (
        <p style={{ marginTop: 12, padding: 10, border: "1px solid #2d2", borderRadius: 10 }}>
          ✅ Action complete: <b>{sp.done}</b>
        </p>
      ) : null}

      <div style={{ marginTop: 14, padding: 12, border: "1px solid #333", borderRadius: 10 }}>
        <div><b>Status:</b> {msg.status}</div>
        <div><b>From:</b> {msg.senderEmail}</div>
        <div><b>Subject:</b> {msg.subject ?? "(none)"}</div>
        <div><b>Bond:</b> ${bond} &nbsp; <b>Delivery fee:</b> ${fee}</div>
      </div>

      <pre style={{ marginTop: 12, padding: 12, border: "1px solid #333", borderRadius: 10, whiteSpace: "pre-wrap" }}>
        {msg.body}
      </pre>

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
