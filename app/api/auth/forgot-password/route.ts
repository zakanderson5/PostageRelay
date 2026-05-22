export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

// SAFE DIAGNOSTICS — logs only booleans/status labels and a short email-hash
// prefix for correlation. Never includes the email address, raw token, token
// hash, password, cookies, API key, or email body.
type Diag = {
  emailHashPrefix: string | null;
  hasResendApiKey: boolean;
  normalizedEmailProvided: boolean;
  userFound: boolean;
  userHasPasswordHash: boolean;
  resetTokenCreated: boolean;
  resendAttempted: boolean;
  resendSucceeded: boolean;
  resendErrorMessage?: string;
  rateLimited?: boolean;
  unexpectedError?: boolean;
};

function logDiag(d: Diag): void {
  // eslint-disable-next-line no-console
  console.log("[forgot-password diag]", JSON.stringify(d));
}

export async function POST(req: Request) {
  const diag: Diag = {
    emailHashPrefix: null,
    hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
    normalizedEmailProvided: false,
    userFound: false,
    userHasPasswordHash: false,
    resetTokenCreated: false,
    resendAttempted: false,
    resendSucceeded: false,
  };

  let email = "";
  try {
    const body = (await req.json().catch(() => null)) as Body | null;
    email = String(body?.email ?? "").trim().toLowerCase();
  } catch {
    logDiag(diag);
    return NextResponse.json({ ok: true });
  }

  const looksValid =
    !!email && email.includes("@") && email.length > 2 && email.length <= 254;
  diag.normalizedEmailProvided = looksValid;

  if (!looksValid) {
    logDiag(diag);
    return NextResponse.json({ ok: true });
  }

  // Short SHA-256 hash prefix of the normalized email for log correlation only.
  diag.emailHashPrefix = sha256Hex(email).slice(0, 8);

  // Run the real work in the background so timing is closer between the
  // "exists" and "does-not-exist" branches.
  void (async () => {
    try {
      if (!allowEmail(email)) {
        diag.rateLimited = true;
        logDiag(diag);
        return;
      }

      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, passwordHash: true },
      });

      diag.userFound = !!user;
      diag.userHasPasswordHash = !!user?.passwordHash;

      if (!user || !user.passwordHash) {
        logDiag(diag);
        return;
      }

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
      diag.resetTokenCreated = true;

      const result = await sendPasswordResetEmail({ to: email, rawToken });
      diag.resendAttempted = result.attempted;
      diag.resendSucceeded = result.succeeded;
      if (result.errorMessage) diag.resendErrorMessage = result.errorMessage;

      logDiag(diag);
    } catch {
      diag.unexpectedError = true;
      // Never log token, hash, password, recipient, cookies, or email body.
      // eslint-disable-next-line no-console
      console.error("forgot-password: background task failed");
      logDiag(diag);
    }
  })();

  return NextResponse.json({ ok: true });
}
