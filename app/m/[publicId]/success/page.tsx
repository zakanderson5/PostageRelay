import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { notFound } from "next/navigation";

export default async function SuccessPage(props: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await props.params;

  const message = await prisma.message.findUnique({
    where: { publicId },
    include: { bondPage: true },
  });

  if (!message || !message.paymentIntentId) notFound();

  const pi = await stripe.paymentIntents.retrieve(message.paymentIntentId);

  // After confirmation, manual-capture intents should be "requires_capture"
  if (pi.status === "requires_capture") {
    if (message.status !== "AUTHORIZED") {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + message.bondPage.timeoutHours * 60 * 60 * 1000);

      await prisma.message.update({
        where: { id: message.id },
        data: {
          status: "AUTHORIZED",
          authorizedAt: now,
          expiresAt,
        },
      });
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800 }}>✅ Delivered</h1>
      <p style={{ marginTop: 8 }}>
        Your message is now in the receiver’s inbox. The bond is on hold until they accept or release it.
      </p>

      <div style={{ marginTop: 12, padding: 12, border: "1px solid #333", borderRadius: 10 }}>
        <div><b>PaymentIntent status:</b> {pi.status}</div>
        <div><b>Message status in DB:</b> {(await prisma.message.findUnique({ where: { id: message.id } }))?.status}</div>
      </div>

      <p style={{ marginTop: 12, color: "#bbb" }}>
        Next: we’ll build the receiver inbox and Accept/Release buttons.
      </p>
    </main>
  );
}
