export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { SESSION_COOKIE_NAME, getUserIdFromToken } from "@/lib/auth";

function getBaseUrl(req: Request) {
  const env =
    (process.env.APP_URL || process.env.APP_BASE_URL || "").trim().replace(/\/+$/, "");
  if (env) return env;
  return new URL(req.url).origin;
}

async function ensureStripeAccount(userId: string, email: string) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeAccountId: true },
  });

  if (existing?.stripeAccountId) return existing.stripeAccountId;

  const account = await stripe.accounts.create({
    type: "express",
    email,
    capabilities: {
      transfers: { requested: true },
    },
    metadata: { userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeAccountId: account.id },
  });

  return account.id;
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  const userId = token ? await getUserIdFromToken(token) : null;

  if (!userId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const accountId = await ensureStripeAccount(userId, user.email);
    const base = getBaseUrl(req);

    const link = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: `${base}/settings?stripe=refresh`,
      return_url: `${base}/settings?stripe=return`,
    });

    return NextResponse.json({ url: link.url });
  } catch (e: any) {
    const msg = String(e?.message || "Stripe error");
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
