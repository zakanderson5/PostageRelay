import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function text(msg: string, status = 400) {
  return new NextResponse(msg, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

function normalizeSlug(raw: string): string | null {
  const s = raw.trim().toLowerCase();

  const cleaned = s
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

  if (cleaned.length < 3 || cleaned.length > 32) return null;
  return cleaned;
}

function looksLikeEmail(s: string) {
  return s.includes("@") && s.includes(".") && s.length <= 254;
}

function getBaseUrl(req: Request) {
  const env = (process.env.APP_URL || "").trim().replace(/\/+$/, "");
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

async function makeOnboardingLink(opts: {
  req: Request;
  accountId: string;
  slug: string;
}) {
  const base = getBaseUrl(opts.req);
  const url = await stripe.accountLinks.create({
    account: opts.accountId,
    type: "account_onboarding",
    refresh_url: `${base}/u/${opts.slug}?stripe=refresh`,
    return_url: `${base}/u/${opts.slug}?stripe=return`,
  });
  return url.url;
}

export async function POST(req: Request) {
  const form = await req.formData();

  // Honeypot (optional anti-bot)
  const website = String(form.get("website") || "").trim();
  if (website) return new Response(null, { status: 204 });

  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!looksLikeEmail(email) || email.length > 200) return text("Invalid email", 400);

  const slug = normalizeSlug(String(form.get("slug") ?? ""));
  if (!slug) return text("Invalid slug. Use 3-32 chars: letters, numbers, hyphens.", 400);

  const displayNameRaw = String(form.get("displayName") ?? "").trim();
  const displayName = displayNameRaw ? displayNameRaw.slice(0, 80) : null;

  // Create or reuse user
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  // One page per user in v1
  const existingForUser = await prisma.bondPage.findUnique({
    where: { userId: user.id },
  });

  if (existingForUser) {
    // If they already have a page, send them to Stripe connect onboarding (again),
    // so they can finish/retry setup without needing an invite code.
    const accountId = await ensureStripeAccount(user.id, email);
    const link = await makeOnboardingLink({
      req,
      accountId,
      slug: existingForUser.slug,
    });
    return NextResponse.redirect(link, 303);
  }

  // Slug must be unique
  const existingSlug = await prisma.bondPage.findUnique({
    where: { slug },
  });

  if (existingSlug) {
    return text("That link is already taken. Pick a different one.", 409);
  }

  await prisma.bondPage.create({
    data: {
      slug,
      userId: user.id,
      ...(displayName ? { displayName } : {}),
      // keep other defaults in prisma for minBondCents/maxBondCents/timeoutHours/etc
    },
  });

  // Create Stripe connected account + redirect to Stripe onboarding
  const accountId = await ensureStripeAccount(user.id, email);
  const link = await makeOnboardingLink({ req, accountId, slug });

  // Optional: drop a cookie that helps you recognize "just onboarded" users later
  const res = NextResponse.redirect(link, 303);
  res.cookies.set("pr_onboard", crypto.randomBytes(16).toString("hex"), {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 30, // 30 minutes
  });
  return res;
}
