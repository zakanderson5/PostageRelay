import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import CheckoutClient from "./CheckoutClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function dollars(cents: number) {
  return (cents / 100).toFixed(2);
}

export default async function Page(props: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await props.params;

  const msg = await prisma.message.findUnique({
    where: { publicId },
    select: {
      id: true,
      publicId: true,
      senderEmail: true,
      senderName: true,
      subject: true,
      bondCents: true,
      deliveryFeeCents: true,
      currency: true,
      paymentIntentId: true,
      status: true,
    },
  });

  // IMPORTANT: show a readable error page instead of a silent 404
  if (!msg) {
    console.error("Checkout: message not found", { publicId });
    return (
      <main style={{ padding: 24, maxWidth: 720, margin: "0 auto", fontFamily: "system-ui" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Checkout error</h1>
        <p>We couldn't find this message.</p>
        <p><b>publicId:</b> {publicId}</p>
        <p>
          If you just submitted the form, open <b>/inbox/demo</b>. If the message is there but this page can’t
          find it, you likely have a DATABASE_URL mismatch between environments.
        </p>
      </main>
    );
  }

  const totalCents = msg.bondCents + msg.deliveryFeeCents;
  const currency = (msg.currency || "usd").toLowerCase();

  let paymentIntentId: string | null = msg.paymentIntentId ?? null;
  let clientSecret: string | null = null;

  // Reuse existing PaymentIntent if possible
  if (paymentIntentId) {
    try {
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
      clientSecret = typeof pi.client_secret === "string" ? pi.client_secret : null;

      // If PI is unusable, recreate it
      if (pi.status === "canceled" || !clientSecret) {
        paymentIntentId = null;
        clientSecret = null;
      }
    } catch (e) {
      console.error("Checkout: PI retrieve failed, recreating", { publicId, paymentIntentId }, e);
      paymentIntentId = null;
      clientSecret = null;
    }
  }

  // Create PaymentIntent if missing
  if (!paymentIntentId) {
    const pi = await stripe.paymentIntents.create({
      amount: totalCents,
      currency,
      capture_method: "manual",
      automatic_payment_methods: { enabled: true },
      metadata: { messagePublicId: msg.publicId },
      description: "GatePost Inbox bond hold for " + msg.senderEmail,
    });

    clientSecret = pi.client_secret ?? null;

    await prisma.message.update({
      where: { id: msg.id },
      data: { paymentIntentId: pi.id },
    });

    paymentIntentId = pi.id;

    console.log("Checkout: created PI", { publicId, paymentIntentId, hasClientSecret: !!clientSecret });
  }

  if (!clientSecret) {
    console.error("Checkout: missing clientSecret", { publicId, paymentIntentId });
    return (
      <main style={{ padding: 24, maxWidth: 720, margin: "0 auto", fontFamily: "system-ui" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Payment setup error</h1>
        <p>We couldn't initialize payment (missing client secret). Please try again.</p>
      </main>
    );
  }

  const bond = dollars(msg.bondCents);
  const fee = dollars(msg.deliveryFeeCents);
  const total = dollars(totalCents);

  const fromLine = msg.senderName ? `${msg.senderName} <${msg.senderEmail}>` : msg.senderEmail;

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800 }}>Confirm delivery</h1>

      <p style={{ marginTop: 10, color: "#555", lineHeight: 1.55 }}>
        You are <b>authorizing a hold</b>, not an immediate charge. Your bond is{" "}
        <b>refundable unless the receiver accepts</b>. The $0.99 delivery fee is{" "}
        <b>non-refundable once your message is delivered for review</b>.
      </p>

      <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 10 }}>
        <div><b>From:</b> {fromLine}</div>
        <div><b>Subject:</b> {msg.subject || "(no subject)"}</div>

        <div style={{ marginTop: 10 }}><b>Refundable deposit (bond):</b> ${bond}</div>
        <div><b>Delivery fee (non-refundable once delivered):</b> ${fee}</div>
        <div><b>Total authorization:</b> ${total}</div>
      </div>

      <div
        style={{
          marginTop: 12,
          padding: 12,
          border: "1px solid #d6e8ff",
          background: "#f3f8ff",
          borderRadius: 10,
          fontSize: 13,
          lineHeight: 1.55,
          color: "#234",
        }}
      >
        <div><b>What happens next:</b></div>
        <div style={{ marginTop: 6 }}>
          • If the receiver <b>accepts</b>: the deposit is captured.
        </div>
        <div>
          • If the receiver <b>releases</b>, <b>ignores</b>, or the timeout expires: the
          deposit is released back to your card.
        </div>
        <div>
          • <b>Card details are handled by Stripe</b> &mdash; GatePost does not see or store
          your card information.
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <CheckoutClient clientSecret={clientSecret} publicId={publicId} />
      </div>
    </main>
  );
}
