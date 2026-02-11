import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { notifyReceiver } from "@/lib/notify";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!endpointSecret) {
    console.error("STRIPE_WEBHOOK_SECRET missing");
    return new Response("Server misconfigured", { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing stripe-signature", { status: 400 });

  const buf = Buffer.from(await req.arrayBuffer());

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed", err?.message ?? err);
    return new Response("Webhook Error", { status: 400 });
  }

  const obj: any = event.data.object as any;
  const publicId: string | undefined = obj?.metadata?.messagePublicId;

  // If we can't associate this event to a message, ignore safely.
  // (Returning 200 prevents Stripe retry storms.)
  if (!publicId) {
    console.warn("Webhook event missing metadata.messagePublicId", { type: event.type });
    return new Response("ok", { status: 200 });
  }

  // Load the message + receiver email + bondPage settings
  const msg = await prisma.message.findUnique({
    where: { publicId },
    include: { receiver: true, bondPage: true },
  });

  if (!msg) {
    console.warn("Webhook message not found", { publicId, type: event.type });
    return new Response("ok", { status: 200 });
  }

  if (event.type === "payment_intent.amount_capturable_updated") {
    const pi = obj as Stripe.PaymentIntent;

    console.log("🔔 webhook: payment_intent.amount_capturable_updated", {
      pi: pi.id,
      status: pi.status,
      publicId,
    });

    // Only transition once
    if (msg.status === "AUTHORIZED" || msg.status === "ACCEPTED" || msg.status === "RELEASED" || msg.status === "EXPIRED") {
      return new Response("ok", { status: 200 });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + msg.bondPage.timeoutHours * 60 * 60 * 1000);

    await prisma.message.update({
      where: { id: msg.id },
      data: {
        status: "AUTHORIZED",
        authorizedAt: now,
        expiresAt,
      },
    });

    try {
      await notifyReceiver({
        to: msg.receiver.email,
        senderEmail: msg.senderEmail,
        subject: msg.subject,
        body: msg.body,
        publicId: msg.publicId,
        expiresAt,
      });
    } catch (e: any) {
      console.error("notifyReceiver failed", { publicId, error: e?.message ?? String(e) });
      // We still return 200; otherwise Stripe will retry the webhook repeatedly.
    }

    return new Response("ok", { status: 200 });
  }

  if (event.type === "payment_intent.payment_failed" || event.type === "payment_intent.canceled") {
    console.log("🔔 webhook: payment failed/canceled", { type: event.type, publicId });

    await prisma.message.update({
      where: { id: msg.id },
      data: { status: "FAILED" },
    });

    return new Response("ok", { status: 200 });
  }

  return new Response("ok", { status: 200 });
}
