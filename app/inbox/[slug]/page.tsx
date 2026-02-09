import { prisma } from "@/lib/prisma";
import { signMessage } from "@/lib/signedLinks";
import { notFound } from "next/navigation";
import type { Message } from "@prisma/client";

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

  // Links valid for 7 days
  const expUnix = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

  return (
    <main style={{ padding: 24, maxWidth: 920, margin: "0 auto", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800 }}>Inbox: {slug}</h1>

      <p style={{ color: "#bbb" }}>
        Demo inbox (no auth yet). For real use, you’ll act via signed Review links.
      </p>

      <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
        {page.messages.map((m: Message) => {
          const bond = (m.bondCents / 100).toFixed(2);
          const fee = (m.deliveryFeeCents / 100).toFixed(2);

          const sig = signMessage(m.publicId, expUnix);
          const review = `/r/${m.publicId}?e=${expUnix}&s=${sig}`;

          return (
            <div key={m.id} style={{ padding: 12, border: "1px solid #333", borderRadius: 10 }}>
              <div style={{ display: "grid", gap: 4 }}>
                <div><b>Status:</b> {m.status}</div>
                <div><b>From:</b> {m.senderEmail}</div>
                <div><b>Subject:</b> {m.subject ?? "(none)"}</div>
                <div><b>Bond:</b> ${bond} &nbsp; <b>Fee:</b> ${fee}</div>
                {m.expiresAt ? <div><b>Expires:</b> {m.expiresAt.toISOString()}</div> : null}
              </div>

              <div style={{ marginTop: 10 }}>
                <a href={review} style={{ textDecoration: "underline" }}>
                  Review (signed link)
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
