export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { createSessionToken, hashPassword, setSessionCookie } from "@/lib/auth";
import crypto from "crypto";

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

async function makeOnboardingLink(opts: { req: Request; accountId: string; slug: string }) {
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

  // Honeypot (anti-bot)
  const website = String(form.get("website") || "").trim();
  if (website) return new Response(null, { status: 204 });

  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!looksLikeEmail(email) || email.length > 200) return text("Invalid email", 400);

  const password = String(form.get("password") ?? "");
  const confirmPassword = String(form.get("confirmPassword") ?? "");
  if (password.length < 8) return text("Password must be at least 8 characters.", 400);
  if (password !== confirmPassword) return text("Passwords do not match.", 400);

  const slug = normalizeSlug(String(form.get("slug") ?? ""));
  if (!slug) return text("Invalid slug. Use 3-32 chars: letters, numbers, hyphens.", 400);

  const displayNameRaw = String(form.get("displayName") ?? "").trim();
  const displayName = displayNameRaw ? displayNameRaw.slice(0, 80) : null;

  // Create user OR set password for legacy user (no passwordHash)
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });

  let userId: string;

  if (!existing) {
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash },
    });
    userId = user.id;
  } else {
    userId = existing.id;

    // If account already has a password, don't let /start overwrite it.
    if (existing.passwordHash) {
      return text("Account already exists for this email. Please log in.", 409);
    }

    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  // One page per user in v1
  const existingForUser = await prisma.bondPage.findUnique({
    where: { userId },
  });

  let finalSlug = slug;

  if (existingForUser) {
    finalSlug = existingForUser.slug;
  } else {
    // Slug must be unique
    const existingSlug = await prisma.bondPage.findUnique({ where: { slug } });
    if (existingSlug) return text("That link is already taken. Pick a different one.", 409);

    await prisma.bondPage.create({
      data: {
        slug,
        userId,
        ...(displayName ? { displayName } : {}),
      },
    });
  }

  // Stripe onboarding redirect
  const accountId = await ensureStripeAccount(userId, email);
  const link = await makeOnboardingLink({ req, accountId, slug: finalSlug });

  // Create session cookie so they're logged in after they come back from Stripe
  const token = await createSessionToken(userId);
  const res = NextResponse.redirect(link, 303);
  setSessionCookie(res, token);

  // Optional helper cookie
  res.cookies.set("pr_onboard", crypto.randomBytes(16).toString("hex"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 30,
  });

  return res;
}
