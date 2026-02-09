import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { notifyReceiver } from "@/lib/notify";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const HANDLED = new Set([
  "payment_intent.amount_capturable_updated",
  "payment_intent.payment_failed",
  "payment_intent.canceled",
]);

export async function POST(req: Request) {
  if (!endpointSecret) return new Response("Missing STRIPE_WEBHOOK_SECRET", { status: 500 });

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing stripe-signature", { status: 400 });

  const buf = Buffer.from(await req.arrayBuffer());

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (!HANDLED.has(event.type)) return new Response("ok", { status: 200 });

  const pi = event.data.object as Stripe.PaymentIntent;
  const publicId = pi.metadata?.messagePublicId;

  console.log("🔔 webhook:", event.type, "pi:", pi.id, "status:", pi.status, "publicId:", publicId);

  if (!publicId) return new Response("Missing messagePublicId", { status: 200 });

  const msg = await prisma.message.findUnique({
    where: { publicId },
    include: { bondPage: true, receiver: true },
  });

  if (!msg) return new Response("Message not found", { status: 200 });

  if (event.type === "payment_intent.amount_capturable_updated") {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + msg.bondPage.timeoutHours * 60 * 60 * 1000);

    const updated = await prisma.message.updateMany({
      where: { id: msg.id, status: { in: ["AUTHORIZING", "DRAFT"] } },
      data: { status: "AUTHORIZED", authorizedAt: now, expiresAt },
    });

    console.log("🔔 capturable → updated rows:", updated.count);

    if (updated.count === 1) {
      await notifyReceiver({
        to: msg.receiver.email,
        senderEmail: msg.senderEmail,
        subject: msg.subject ?? null,
        body: msg.body,
        publicId: msg.publicId,
        expiresAt,
      });
    }
  }

  if (event.type === "payment_intent.payment_failed" || event.type === "payment_intent.canceled") {
    await prisma.message.update({
      where: { id: msg.id },
      data: { status: "FAILED" },
    });
  }

  return new Response("ok", { status: 200 });
}
