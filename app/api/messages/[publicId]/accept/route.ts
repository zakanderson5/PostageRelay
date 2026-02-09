import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { verifyMessageSignature } from "@/lib/signedLinks";
import { NextResponse } from "next/server";

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
    include: { bondPage: true },
  });

  if (!msg || !msg.paymentIntentId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (msg.status !== "AUTHORIZED") return NextResponse.json({ error: `Not AUTHORIZED (status=${msg.status})` }, { status: 400 });

  const pi = await stripe.paymentIntents.retrieve(msg.paymentIntentId);
  if (pi.status !== "requires_capture") {
    return NextResponse.json({ error: `PaymentIntent not capturable (status=${pi.status})` }, { status: 400 });
  }

  const captured = await stripe.paymentIntents.capture(msg.paymentIntentId);

  await prisma.message.update({
    where: { id: msg.id },
    data: {
      status: "ACCEPTED",
      latestChargeId: typeof captured.latest_charge === "string" ? captured.latest_charge : null,
    },
  });

  return NextResponse.redirect(new URL(`/r/${publicId}?e=${expUnix}&s=${sig}&done=accepted`, req.url), 303);
}
