import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { notFound } from "next/navigation";

export default async function SuccessPage(props: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await props.params;

  const msg = await prisma.message.findUnique({
    where: { publicId },
    include: { bondPage: true },
  });

  if (!msg || !msg.paymentIntentId) notFound();

  const pi = await stripe.paymentIntents.retrieve(msg.paymentIntentId);

  // IMPORTANT: Do NOT mutate DB here.
  // Webhook is the source of truth for AUTHORIZED + notification.
  const fresh = await prisma.message.findUnique({ where: { id: msg.id } });

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800 }}>✅ Delivered</h1>

      <p style={{ marginTop: 8 }}>
        Payment authorized. The receiver will be notified by the webhook and can accept or release the bond.
      </p>

      <div style={{ marginTop: 12, padding: 12, border: "1px solid #333", borderRadius: 10 }}>
        <div><b>PaymentIntent status:</b> {pi.status}</div>
        <div><b>Message status in DB:</b> {fresh?.status ?? msg.status}</div>
      </div>

      <p style={{ marginTop: 12, color: "#bbb" }}>
        If the DB status is still AUTHORIZING, refresh in a moment — the Stripe webhook updates it.
      </p>
    </main>
  );
}
