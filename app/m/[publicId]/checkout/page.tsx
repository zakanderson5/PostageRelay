import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { notFound } from "next/navigation";
import CheckoutClient from "./CheckoutClient";

export default async function CheckoutPage(props: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await props.params;
  // ...
}
  const { publicId } = await props.params;

  const message = await prisma.message.findUnique({
    where: { publicId },
    include: { bondPage: true },
  });

  if (!message || !message.paymentIntentId) notFound();

  const pi = await stripe.paymentIntents.retrieve(message.paymentIntentId);
  if (!pi.client_secret) throw new Error("Missing client_secret on PaymentIntent");

  const bond = (message.bondCents / 100).toFixed(2);
  const fee = (message.deliveryFeeCents / 100).toFixed(2);
  const total = ((message.bondCents + message.deliveryFeeCents) / 100).toFixed(2);

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800 }}>Confirm delivery</h1>

      <div style={{ marginTop: 12, padding: 12, border: "1px solid #333", borderRadius: 10 }}>
        <div><b>Bond:</b> ${bond}</div>
        <div><b>Delivery fee (non-refundable):</b> ${fee}</div>
        <div><b>Total hold:</b> ${total}</div>
      </div>

      <p style={{ marginTop: 12, color: "#bbb" }}>
        The bond is refundable unless the receiver accepts. Delivery fee is always charged if delivered.
      </p>

      <CheckoutClient clientSecret={pi.client_secret} publicId={publicId} />
    </main>
  );
}
