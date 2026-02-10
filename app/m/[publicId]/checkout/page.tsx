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
body: true,
bondCents: true,
deliveryFeeCents: true,
currency: true,
status: true,
paymentIntentId: true,
createdAt: true,
},
});

// IMPORTANT: do NOT return a 404 here. Show a real error so you can diagnose prod quickly.
if (!msg) {
console.error("Checkout: message not found", { publicId });
return (
<main style={{ padding: 24, maxWidth: 720, margin: "0 auto", fontFamily: "system-ui" }}>
<h1 style={{ fontSize: 22, fontWeight: 800 }}>Checkout error</h1>
<p>We couldn't find this message.</p>
<p>publicId: {publicId}</p>
<p>
Open /inbox/demo to see if the message exists. If it does, this deployment is likely pointing at a different
DATABASE_URL for page renders vs API writes.
</p>
</main>
);
}

console.log("Checkout: loaded message", {
publicId,
status: msg.status,
hasPaymentIntentId: !!msg.paymentIntentId,
});

const totalCents = msg.bondCents + msg.deliveryFeeCents;
const currency = (msg.currency || "usd").toLowerCase();

let paymentIntentId = msg.paymentIntentId ?? null;
let clientSecret: string | null = null;

// If we already have a PI, try to reuse it
if (paymentIntentId) {
try {
const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
clientSecret = typeof pi.client_secret === "string" ? pi.client_secret : null;
  // If Stripe says it's canceled or missing secret, recreate
  if (pi.status === "canceled" || !clientSecret) {
    paymentIntentId = null;
    clientSecret = null;
  }
} catch (e) {
  console.error("Checkout: failed to retrieve PaymentIntent, recreating", { publicId, paymentIntentId });
  paymentIntentId = null;
  clientSecret = null;
}
}

// If we don't have a PI yet, create one now
if (!paymentIntentId) {
const pi = await stripe.paymentIntents.create({
amount: totalCents,
currency,
capture_method: "manual",
automatic_payment_methods: { enabled: true },
metadata: {
messagePublicId: msg.publicId,
},
description: Postage Relay bond hold for ${msg.senderEmail},
});
clientSecret = pi.client_secret ?? null;

await prisma.message.update({
  where: { id: msg.id },
  data: { paymentIntentId: pi.id },
});

paymentIntentId = pi.id;

console.log("Checkout: created PaymentIntent", {
  publicId,
  paymentIntentId,
  hasClientSecret: !!clientSecret,
});
}

if (!clientSecret) {
console.error("Checkout: missing clientSecret after PI setup", { publicId, paymentIntentId });
return (
<main style={{ padding: 24, maxWidth: 720, margin: "0 auto", fontFamily: "system-ui" }}>
<h1 style={{ fontSize: 22, fontWeight: 800 }}>Payment setup error</h1>
<p>We couldn't initialize the payment session (missing client secret). Please try again.</p>
</main>
);
}

const bond = dollars(msg.bondCents);
const fee = dollars(msg.deliveryFeeCents);
const total = dollars(totalCents);

const fromLine = msg.senderName ? msg.senderName + " <" + msg.senderEmail + ">" : msg.senderEmail;

return (
<main style={{ padding: 24, maxWidth: 720, margin: "0 auto", fontFamily: "system-ui" }}>
<h1 style={{ fontSize: 26, fontWeight: 800 }}>Confirm delivery</h1>
  <p style={{ marginTop: 10, color: "#555" }}>
    You’re placing a hold, not a charge. The bond is refundable unless the receiver accepts. The delivery fee is
    non-refundable if delivered.
  </p>

  <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 10 }}>
    <div>
      <b>From:</b> {fromLine}
    </div>
    <div>
      <b>Subject:</b> {msg.subject || "(no subject)"}
    </div>

    <div style={{ marginTop: 10 }}>
      <b>Bond:</b> ${bond}
    </div>
    <div>
      <b>Delivery fee (non-refundable):</b> ${fee}
    </div>
    <div>
      <b>Total hold:</b> ${total}
    </div>
  </div>

  <div style={{ marginTop: 18 }}>
    <CheckoutClient clientSecret={clientSecret} publicId={publicId} />
  </div>
</main>
);
}
