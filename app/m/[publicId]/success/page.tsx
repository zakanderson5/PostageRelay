import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SuccessPage(props: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await props.params;

  const msg = await prisma.message.findUnique({
    where: { publicId },
    select: { id: true, paymentIntentId: true },
  });

  if (!msg || !msg.paymentIntentId) notFound();

  return (
    <main style={{ padding: 24, maxWidth: 640, margin: "0 auto", fontFamily: "system-ui" }}>
      <div
        style={{
          padding: 24,
          border: "1px solid #2a2a2a",
          borderRadius: 14,
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <div style={{ fontSize: 13, letterSpacing: 1.1, textTransform: "uppercase", opacity: 0.7 }}>
          GatePost Inbox
        </div>
        <h1 style={{ marginTop: 8, fontSize: 26, fontWeight: 900 }}>
          ✅ Your message is on its way
        </h1>

        <p style={{ marginTop: 12, lineHeight: 1.6 }}>
          The receiver has been notified by email. They can review your message and accept,
          release, or let it expire.
        </p>

        <div style={{ marginTop: 14, padding: 14, border: "1px solid #2a2a2a", borderRadius: 10, lineHeight: 1.7 }}>
          <div><b>Your card has been authorized, not fully charged.</b></div>
          <div style={{ marginTop: 6 }}>
            The refundable deposit is held by Stripe. It is only captured if the receiver
            accepts. Otherwise it is released back to your card on the card / bank&apos;s standard
            timeline. The $0.99 delivery fee is non-refundable now that the message has been
            delivered for review.
          </div>
        </div>

        <p style={{ marginTop: 14, lineHeight: 1.6 }}>
          You will be notified by email when the message is accepted, released, or expires.
        </p>

        <p style={{ marginTop: 12, color: "#9aa0aa", fontSize: 13 }}>
          You can close this tab. No further action is needed from you.
        </p>
      </div>
    </main>
  );
}
