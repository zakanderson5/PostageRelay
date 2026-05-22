import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { verifyMessageSignature } from "@/lib/signedLinks";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

type ResultState =
  | "accepted"
  | "payouts_not_ready"
  | "no_stripe_account"
  | "already_handled"
  | "invalid_link"
  | "not_found"
  | "transfer_failed"
  | "error";

function resultRedirect(
  req: Request,
  state: ResultState,
  publicId?: string | null
): NextResponse {
  const url = new URL("/review-result", req.url);
  url.searchParams.set("state", state);
  if (publicId) url.searchParams.set("publicId", publicId);
  return NextResponse.redirect(url, 303);
}

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
    return resultRedirect(req, "invalid_link");
  }

  const msg = await prisma.message.findUnique({
    where: { publicId },
    include: { bondPage: true, receiver: true },
  });

  if (!msg || !msg.paymentIntentId) {
    return resultRedirect(req, "not_found");
  }

  // Already fully accepted (capture + transfer): idempotent success.
  if (msg.status === "ACCEPTED" && msg.transferId) {
    return resultRedirect(req, "accepted", publicId);
  }

  // Decide which side-effects are still needed.
  const needsCapture = msg.status === "AUTHORIZED";
  const needsTransferOnly =
    msg.status === "ACCEPTED" && !!msg.latestChargeId && !msg.transferId;

  if (!needsCapture && !needsTransferOnly) {
    return resultRedirect(req, "already_handled", publicId);
  }

  // Verify receiver is set up for payouts.
  const receiverStripeAccountId = msg.receiver.stripeAccountId;
  if (!receiverStripeAccountId) {
    return resultRedirect(req, "no_stripe_account", publicId);
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
      return resultRedirect(req, "payouts_not_ready", publicId);
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
    let pi: Stripe.PaymentIntent;
    try {
      pi = await stripe.paymentIntents.retrieve(msg.paymentIntentId);
    } catch (err: any) {
      console.error("Accept: PI retrieve failed", {
        publicId: msg.publicId,
        code: err?.code,
        type: err?.type,
      });
      return resultRedirect(req, "error", publicId);
    }

    let captured: Stripe.PaymentIntent;
    if (pi.status === "requires_capture") {
      try {
        captured = await stripe.paymentIntents.capture(
          msg.paymentIntentId,
          {},
          { idempotencyKey: `capture_${msg.publicId}` }
        );
      } catch (err: any) {
        console.error("Accept: capture failed", {
          publicId: msg.publicId,
          code: err?.code,
          type: err?.type,
        });
        return resultRedirect(req, "error", publicId);
      }
    } else if (pi.status === "succeeded") {
      // PI was already captured at Stripe (likely a prior request that crashed
      // before persisting). Recover by reusing the existing charge.
      captured = pi;
    } else {
      return resultRedirect(req, "already_handled", publicId);
    }

    latestChargeId = extractChargeId(captured.latest_charge);

    // Fallback: if latest_charge wasn't returned/expanded, look it up directly.
    if (!latestChargeId) {
      try {
        const charges = await stripe.charges.list({
          payment_intent: msg.paymentIntentId,
          limit: 1,
        });
        latestChargeId = charges.data[0]?.id ?? null;
      } catch (err: any) {
        console.error("Accept: charges.list failed", {
          publicId: msg.publicId,
          code: err?.code,
          type: err?.type,
        });
      }
    }

    if (!latestChargeId) {
      console.error("Accept: missing latestChargeId after capture", {
        publicId: msg.publicId,
        piStatus: captured.status,
      });
      // Do NOT persist ACCEPTED without a charge id — that would strand funds
      // (transfer-retry path requires latestChargeId).
      return resultRedirect(req, "error", publicId);
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
    return resultRedirect(req, "error", publicId);
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
      error: err?.message ?? String(err),
    });
    return resultRedirect(req, "transfer_failed", publicId);
  }

  return resultRedirect(req, "accepted", publicId);
}
