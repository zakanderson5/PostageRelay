import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function dollarsToCents(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.round(n * 100);
}

function looksLikeEmail(s: string) {
  return s.includes("@") && s.includes(".") && s.length <= 254;
}

function wantsJson(request: NextRequest): boolean {
  const accept = request.headers.get("accept") ?? "";
  if (accept.toLowerCase().includes("application/json")) return true;
  const xrw = request.headers.get("x-requested-with") ?? "";
  return xrw.toLowerCase() === "fetch";
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const formData = await request.formData();
  const jsonResponse = wantsJson(request);

  // Honeypot
  const website = String(formData.get("website") || "").trim();
  if (website) {
    if (jsonResponse) return NextResponse.json({ ok: true }, { status: 200 });
    return new Response(null, { status: 204 });
  }

  const senderEmail = String(formData.get("senderEmail") || "").trim();
  const senderNameRaw = String(formData.get("senderName") || "").trim();
  const subjectRaw = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();

  const senderName = senderNameRaw ? senderNameRaw.slice(0, 120) : null;
  const subject = subjectRaw ? subjectRaw.slice(0, 180) : null;

  if (!looksLikeEmail(senderEmail)) {
    return jsonResponse
      ? NextResponse.json({ error: "Invalid senderEmail" }, { status: 400 })
      : new Response("Invalid senderEmail", { status: 400 });
  }
  if (!body || body.length > 5000) {
    return jsonResponse
      ? NextResponse.json({ error: "Invalid body" }, { status: 400 })
      : new Response("Invalid body", { status: 400 });
  }

  const requestedBondCents = dollarsToCents(
    formData.get("bondDollars")?.toString() ?? null
  );

  const page = await prisma.bondPage.findUnique({ where: { slug } });
  if (!page) {
    return jsonResponse
      ? NextResponse.json({ error: "Page not found" }, { status: 404 })
      : NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const min = page.minBondCents;
  const max = page.allowBoost ? page.maxBondCents : min;
  const requested = typeof requestedBondCents === "number" ? requestedBondCents : min;
  const bondCents = Math.min(Math.max(requested, min), max);

  const msg = await prisma.message.create({
    data: {
      receiverId: page.userId,
      bondPageId: page.id,
      senderEmail,
      senderName: senderName ?? undefined,
      subject: subject ?? undefined,
      body,
      bondCents,
      deliveryFeeCents: 99,
      currency: "usd",
      status: "DRAFT",
    },
    select: { publicId: true },
  });

  if (jsonResponse) {
    return NextResponse.json(
      { publicId: msg.publicId, checkoutUrl: `/m/${msg.publicId}/checkout` },
      { status: 200 },
    );
  }

  const url = new URL(`/m/${msg.publicId}/checkout`, request.url);
  return NextResponse.redirect(url, 303);
}
