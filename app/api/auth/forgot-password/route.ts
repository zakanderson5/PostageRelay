export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateResetToken,
  resetTokenExpiresAt,
  sha256Hex,
} from "@/lib/passwordReset";
import { sendPasswordResetEmail } from "@/lib/notifyPasswordReset";

type Body = { email?: string };

// Best-effort in-memory rate limiting. Single-instance only; do not surface
// throttling to the client (would enable enumeration / timing signal).
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_EMAIL = 5;
const recentByEmail = new Map<string, number[]>();

function allowEmail(email: string): boolean {
  const now = Date.now();
  const arr = (recentByEmail.get(email) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  arr.push(now);
  recentByEmail.set(email, arr);
  return arr.length <= MAX_PER_EMAIL;
}

function emailCorrelationId(normalizedEmail: string): string {
  // First 8 hex chars of sha256(email) — non-reversible correlation id only.
  return crypto
    .createHash("sha256")
    .update(normalizedEmail)
    .digest("hex")
    .slice(0, 8);
}

const GENERIC_OK = { ok: true } as const;

export async function POST(req: Request) {
  let normalizedEmail = "";
  try {
    const body = (await req.json().catch(() => null)) as Body | null;
    normalizedEmail = String(body?.email ?? "").trim().toLowerCase();
  } catch {
    // Malformed body: still respond generically. No internal work to do.
    // eslint-disable-next-line no-console
    console.warn("[forgot-password flow]", {
      normalizedEmailProvided: false,
      userFound: false,
      userHasPasswordHash: false,
      rateLimited: false,
      resetTokenCreated: false,
      resendAttempted: false,
      resendSucceeded: false,
    });
    return NextResponse.json(GENERIC_OK);
  }

  const looksValid =
    !!normalizedEmail &&
    normalizedEmail.includes("@") &&
    normalizedEmail.length > 2 &&
    normalizedEmail.length <= 254;

  if (!looksValid) {
    // eslint-disable-next-line no-console
    console.warn("[forgot-password flow]", {
      normalizedEmailProvided: !!normalizedEmail,
      userFound: false,
      userHasPasswordHash: false,
      rateLimited: false,
      resetTokenCreated: false,
      resendAttempted: false,
      resendSucceeded: false,
    });
    return NextResponse.json(GENERIC_OK);
  }

  const corrId = emailCorrelationId(normalizedEmail);

  let userFound = false;
  let userHasPasswordHash = false;
  let rateLimited = false;
  let resetTokenCreated = false;
  let resendAttempted = false;
  let resendSucceeded = false;
  let resendErrorMessage: string | undefined;

  try {
    rateLimited = !allowEmail(normalizedEmail);

    if (!rateLimited) {
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true, passwordHash: true },
      });

      userFound = !!user;
      userHasPasswordHash = !!user?.passwordHash;

      if (user && user.passwordHash) {
        const rawToken = generateResetToken();
        const tokenHash = sha256Hex(rawToken);
        const expiresAt = resetTokenExpiresAt();

        // Invalidate any prior outstanding tokens for this user.
        await prisma.passwordResetToken.updateMany({
          where: { userId: user.id, usedAt: null },
          data: { usedAt: new Date() },
        });

        await prisma.passwordResetToken.create({
          data: { userId: user.id, tokenHash, expiresAt },
        });
        resetTokenCreated = true;

        // Await the email send so that on a serverless platform the function
        // does not return before Resend is actually called. We never reveal
        // delivery success/failure to the client.
        const result = await sendPasswordResetEmail({
          to: normalizedEmail,
          rawToken,
        });
        resendAttempted = result.attempted;
        resendSucceeded = result.succeeded;
        if (!result.succeeded) {
          resendErrorMessage = result.errorMessage;
        }
      }
    } else {
      // eslint-disable-next-line no-console
      console.warn("[forgot-password] rate limited", { corr: corrId });
    }
  } catch {
    // Never log token, hash, password, recipient, cookies, or email body.
    // eslint-disable-next-line no-console
    console.error("forgot-password: internal failure", { corr: corrId });
  }

  // Temporary safe diagnostic for beta testing. Does not include raw email,
  // tokens, hashes, passwords, cookies, API keys, or email body.
  // eslint-disable-next-line no-console
  console.warn("[forgot-password flow]", {
    normalizedEmailProvided: true,
    userFound,
    userHasPasswordHash,
    rateLimited,
    resetTokenCreated,
    resendAttempted,
    resendSucceeded,
    ...(resendErrorMessage ? { resendErrorMessage } : {}),
    corr: corrId,
  });

  return NextResponse.json(GENERIC_OK);
}
