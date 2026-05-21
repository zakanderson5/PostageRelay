import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { verifyMessageSignature } from "@/lib/signedLinks";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

async function isPayoutReady(
  stripeAccountId: string
): Promise<{ ready: boolean; account: Stripe.Account | null }> {
  try {
    const account = await stripe.accounts.retrieve(stripeAccountId);
    const ready = Boolean(
      account.details_submitted &&
        account.payouts_enabled &&
        account.capabilities?.transfers === "active"
    );
    return { ready, account };
  } catch (err: any) {
    // Missing/invalid/deauthorized connected account → not payout ready.
    console.error("isPayoutReady: account retrieve failed", {
      stripeAccountId,
      code: err?.code,
      type: err?.type,
      message: err?.message,
    });
    return { ready: false, account: null };
  }
}

export async function POST(req: Request, context: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await context.params;

  const url = new URL(req.url);
  const expUnix = Number(url.searchParams.get("e"));
  const sig = url.searchParams.get("s") ?? "";

  if (!verifyMessageSignature(publicId, expUnix, sig)) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 401 });
  }

  const msg = await prisma.message.findUnique({
    where: { publicId },
    include: { bondPage: true, receiver: true },
  });

  if (!msg || !msg.paymentIntentId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Already fully accepted (capture + transfer): idempotent success.
  if (msg.status === "ACCEPTED" && msg.transferId) {
    return NextResponse.redirect(
      new URL(`/r/${publicId}?e=${expUnix}&s=${sig}&done=accepted`, req.url),
      303
    );
  }

  // Decide which side-effects are still needed.
  const needsCapture = msg.status === "AUTHORIZED";
  const needsTransferOnly =
    msg.status === "ACCEPTED" && !!msg.latestChargeId && !msg.transferId;

  if (!needsCapture && !needsTransferOnly) {
    return NextResponse.json(
      { error: `Not actionable (status=${msg.status})` },
      { status: 400 }
    );
  }

  // Verify receiver is set up for payouts.
  const receiverStripeAccountId = msg.receiver.stripeAccountId;
  if (!receiverStripeAccountId) {
    return NextResponse.json(
      { error: "Receiver is not set up to receive payouts." },
      { status: 409 }
    );
  }

  // Always re-validate payout readiness from Stripe at accept time so we don't
  // capture funds only to discover the connected account can't receive a transfer.
  {
    const { ready } = await isPayoutReady(receiverStripeAccountId);
    if (ready !== msg.receiver.stripeOnboarded) {
      await prisma.user.update({
        where: { id: msg.receiver.id },
        data: { stripeOnboarded: ready },
      });
    }
    if (!ready) {
      return NextResponse.json(
        { error: "Receiver is not set up to receive payouts." },
        { status: 409 }
      );
    }
  }

  // Helper: extract a charge id from PI.latest_charge regardless of expansion.
  const extractChargeId = (
    latest: string | Stripe.Charge | null | undefined
  ): string | null => {
    if (!latest) return null;
    return typeof latest === "string" ? latest : latest.id ?? null;
  };

  // ---- Capture (skip on transfer-only retry) ----
  let latestChargeId: string | null = msg.latestChargeId;

  if (needsCapture) {
    const pi = await stripe.paymentIntents.retrieve(msg.paymentIntentId);

    let captured: Stripe.PaymentIntent;
    if (pi.status === "requires_capture") {
      captured = await stripe.paymentIntents.capture(
        msg.paymentIntentId,
        {},
        { idempotencyKey: `capture_${msg.publicId}` }
      );
    } else if (pi.status === "succeeded") {
      // PI was already captured at Stripe (likely a prior request that crashed
      // before persisting). Recover by reusing the existing charge.
      captured = pi;
    } else {
      return NextResponse.json(
        { error: `PaymentIntent not capturable (status=${pi.status})` },
        { status: 400 }
      );
    }

    latestChargeId = extractChargeId(captured.latest_charge);

    // Fallback: if latest_charge wasn't returned/expanded, look it up directly.
    if (!latestChargeId) {
      const charges = await stripe.charges.list({
        payment_intent: msg.paymentIntentId,
        limit: 1,
      });
      latestChargeId = charges.data[0]?.id ?? null;
    }

    if (!latestChargeId) {
      console.error("Accept: missing latestChargeId after capture", {
        publicId: msg.publicId,
        piStatus: captured.status,
      });
      // Do NOT persist ACCEPTED without a charge id — that would strand funds
      // (transfer-retry path requires latestChargeId).
      return NextResponse.json(
        { error: "Internal error: could not resolve captured charge." },
        { status: 500 }
      );
    }

    // Persist ACCEPTED + latestChargeId BEFORE attempting the transfer.
    // If the transfer fails, we can safely retry it without re-capturing.
    await prisma.message.update({
      where: { id: msg.id },
      data: {
        status: "ACCEPTED",
        latestChargeId,
      },
    });
  }

  if (!latestChargeId) {
    console.error("Accept: missing latestChargeId before transfer", {
      publicId: msg.publicId,
    });
    return NextResponse.json(
      { error: "Internal error: missing charge id." },
      { status: 500 }
    );
  }

  // ---- Transfer 80% of bond to receiver's connected account ----
  const transferAmount = Math.floor(msg.bondCents * 0.8);

  try {
    const transfer = await stripe.transfers.create(
      {
        amount: transferAmount,
        currency: msg.currency,
        destination: receiverStripeAccountId,
        source_transaction: latestChargeId,
        metadata: { messagePublicId: msg.publicId },
      },
      { idempotencyKey: `transfer_${msg.publicId}` }
    );

    await prisma.message.update({
      where: { id: msg.id },
      data: { transferId: transfer.id },
    });
  } catch (err: any) {
    console.error("Accept: transfer failed", {
      publicId: msg.publicId,
      latestChargeId,
      error: err?.message ?? String(err),
    });
    return NextResponse.json(
      {
        error:
          "Payment captured but payout to receiver failed. Please retry to complete the payout.",
      },
      { status: 502 }
    );
  }

  return NextResponse.redirect(
    new URL(`/r/${publicId}?e=${expUnix}&s=${sig}&done=accepted`, req.url),
    303
  );
}
