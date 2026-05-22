import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { verifyMessageSignature } from "@/lib/signedLinks";
import { NextResponse } from "next/server";

type ResultState =
  | "released"
  | "already_handled"
  | "invalid_link"
  | "not_found"
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
    include: { bondPage: true },
  });

  if (!msg || !msg.paymentIntentId) {
    return resultRedirect(req, "not_found");
  }
  if (msg.status !== "AUTHORIZED") {
    return resultRedirect(req, "already_handled", publicId);
  }

  let pi;
  try {
    pi = await stripe.paymentIntents.retrieve(msg.paymentIntentId);
  } catch (err: any) {
    console.error("Release: PI retrieve failed", {
      publicId: msg.publicId,
      code: err?.code,
      type: err?.type,
    });
    return resultRedirect(req, "error", publicId);
  }

  if (pi.status !== "requires_capture") {
    return resultRedirect(req, "already_handled", publicId);
  }

  let captured;
  try {
    captured = await stripe.paymentIntents.capture(msg.paymentIntentId, {
      amount_to_capture: msg.deliveryFeeCents,
    });
  } catch (err: any) {
    console.error("Release: capture failed", {
      publicId: msg.publicId,
      code: err?.code,
      type: err?.type,
    });
    return resultRedirect(req, "error", publicId);
  }

  await prisma.message.update({
    where: { id: msg.id },
    data: {
      status: "RELEASED",
      latestChargeId: typeof captured.latest_charge === "string" ? captured.latest_charge : null,
    },
  });

  return resultRedirect(req, "released", publicId);
}
