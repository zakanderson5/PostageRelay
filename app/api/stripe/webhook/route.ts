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

  // ---- Connect account updates (must run before the messagePublicId check;
  // account.* events do not carry that metadata) ----
  if (event.type === "account.updated") {
    const account = obj as Stripe.Account;
    const accountId = account?.id;
    if (!accountId) {
      console.warn("account.updated missing account id");
      return new Response("ok", { status: 200 });
    }

    const onboarded = Boolean(
      account.details_submitted &&
        account.payouts_enabled &&
        account.capabilities?.transfers === "active"
    );

    const result = await prisma.user.updateMany({
      where: { stripeAccountId: accountId },
      data: { stripeOnboarded: onboarded },
    });

    console.log("🔔 webhook: account.updated", {
      accountId,
      onboarded,
      usersUpdated: result.count,
    });

    return new Response("ok", { status: 200 });
  }

  const publicId: string | undefined = obj?.metadata?.messagePublicId;

  // If we can't associate this event to a message, ignore safely.
  // (Returning 200 prevents Stripe retry storms.)
  if (!publicId) {
    console.warn("Webhook event missing metadata.messagePublicId", { type: event.type });
    return new Response("ok", { status: 200 });
  }

  // Load the message + receiver email + bondPage settings + attachment count (read-only)
  const msg = await prisma.message.findUnique({
    where: { publicId },
    include: {
      receiver: true,
      bondPage: true,
      _count: { select: { attachments: true } },
    },
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
        attachmentCount: msg._count.attachments,
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
