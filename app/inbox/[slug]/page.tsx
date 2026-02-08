import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function InboxPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;

  const page = await prisma.bondPage.findUnique({
    where: { slug },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!page) notFound();

  return (
    <main style={{ padding: 24, maxWidth: 920, margin: "0 auto", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800 }}>Inbox: {slug}</h1>

      <p style={{ color: "#bbb" }}>
        Demo inbox (no auth yet). Next we’ll secure it with signed links + login.
      </p>

      <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
        {page.messages.map((m) => {
          const bond = (m.bondCents / 100).toFixed(2);
          const fee = (m.deliveryFeeCents / 100).toFixed(2);

          return (
            <div key={m.id} style={{ padding: 12, border: "1px solid #333", borderRadius: 10 }}>
              <div style={{ display: "grid", gap: 4 }}>
                <div><b>Status:</b> {m.status}</div>
                <div><b>From:</b> {m.senderEmail}</div>
                <div><b>Subject:</b> {m.subject ?? "(none)"}</div>
                <div><b>Bond:</b> ${bond} &nbsp; <b>Fee:</b> ${fee}</div>
                {m.expiresAt ? <div><b>Expires:</b> {m.expiresAt.toISOString()}</div> : null}
              </div>

              <details style={{ marginTop: 8 }}>
                <summary>Message</summary>
                <pre style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>{m.body}</pre>
              </details>

              {m.status === "AUTHORIZED" ? (
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <form method="post" action={`/api/messages/${m.publicId}/accept`}>
                    <button style={{ padding: 10, borderRadius: 10, border: "1px solid #222", fontWeight: 800 }}>
                      Accept (keep bond)
                    </button>
                  </form>

                  <form method="post" action={`/api/messages/${m.publicId}/release`}>
                    <button style={{ padding: 10, borderRadius: 10, border: "1px solid #222", fontWeight: 800 }}>
                      Release (capture fee only)
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </main>
  );
}
