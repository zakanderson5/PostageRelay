import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

function dollarsToCents(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.round(n * 100);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params; // ✅ FIX: await params

  const formData = await request.formData();

  const senderEmail = String(formData.get("senderEmail") || "").trim();
  const senderName = String(formData.get("senderName") || "").trim() || null;
  const subject = String(formData.get("subject") || "").trim() || null;
  const body = String(formData.get("body") || "").trim();

  const requestedBondCents = dollarsToCents(
    formData.get("bondDollars")?.toString() ?? null
  );

  const page = await prisma.bondPage.findUnique({
    where: { slug }, // ✅ slug is now correct
  });

  if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });

  if (!senderEmail || !senderEmail.includes("@") || !body) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const min = page.minBondCents;
  const max = page.allowBoost ? page.maxBondCents : min;

  const requested = typeof requestedBondCents === "number" ? requestedBondCents : min;
  const bondCents = Math.min(Math.max(requested, min), max);

  const deliveryFeeCents = 99;
  const totalCents = bondCents + deliveryFeeCents;

  // 1) Create DB message first
  const message = await prisma.message.create({
    data: {
      receiverId: page.userId,
      bondPageId: page.id,
      senderEmail,
      senderName: senderName ?? undefined,
      subject: subject ?? undefined,
      body,
      bondCents,
      deliveryFeeCents,
      currency: "usd",
      status: "AUTHORIZING",
    },
  });

  // 2) Create a manual-capture PaymentIntent (authorization hold)
  const pi = await stripe.paymentIntents.create(
    {
      amount: totalCents,
      currency: "usd",
      capture_method: "manual",
      payment_method_types: ["card"],
      metadata: {
        messagePublicId: message.publicId,
        receiverId: page.userId,
        bondCents: String(bondCents),
        deliveryFeeCents: String(deliveryFeeCents),
      },
    },
    { idempotencyKey: `msg_${message.publicId}` }
  );

  // 3) Save PaymentIntent id
  await prisma.message.update({
    where: { id: message.id },
    data: { paymentIntentId: pi.id },
  });

  // 4) Redirect to checkout page
  const url = new URL(`/m/${message.publicId}/checkout`, request.url);
  return NextResponse.redirect(url, 303);
}
