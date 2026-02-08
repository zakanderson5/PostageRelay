import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  context: { params: Promise<{ publicId: string }> }
) {
  const { publicId } = await context.params;

  const msg = await prisma.message.findUnique({
    where: { publicId },
    include: { bondPage: true },
  });

  if (!msg || !msg.paymentIntentId) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  if (msg.status !== "AUTHORIZED") {
    return NextResponse.json(
      { error: `Not AUTHORIZED (status=${msg.status})` },
      { status: 400 }
    );
  }

  const pi = await stripe.paymentIntents.retrieve(msg.paymentIntentId);

  if (pi.status === "requires_capture") {
    const captured = await stripe.paymentIntents.capture(msg.paymentIntentId, {
      amount_to_capture: msg.deliveryFeeCents, // ✅ capture fee only; remainder releases
    });

    await prisma.message.update({
      where: { id: msg.id },
      data: {
        status: "RELEASED",
        latestChargeId:
          typeof captured.latest_charge === "string" ? captured.latest_charge : null,
      },
    });
  } else if (pi.status === "succeeded") {
    // Could already be captured (e.g., accepted earlier)
    await prisma.message.update({
      where: { id: msg.id },
      data: { status: "RELEASED" },
    });
  } else {
    return NextResponse.json(
      { error: `PaymentIntent not capturable (status=${pi.status})` },
      { status: 400 }
    );
  }

  return NextResponse.redirect(new URL(`/inbox/${msg.bondPage.slug}`, req.url), 303);
}
