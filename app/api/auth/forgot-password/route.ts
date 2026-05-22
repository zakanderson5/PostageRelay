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

const GENERIC_OK = { ok: true } as const;

export async function POST(req: Request) {
  let normalizedEmail = "";
  try {
    const body = (await req.json().catch(() => null)) as Body | null;
    normalizedEmail = String(body?.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json(GENERIC_OK);
  }

  const looksValid =
    !!normalizedEmail &&
    normalizedEmail.includes("@") &&
    normalizedEmail.length > 2 &&
    normalizedEmail.length <= 254;

  if (!looksValid) {
    return NextResponse.json(GENERIC_OK);
  }

  try {
    if (allowEmail(normalizedEmail)) {
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true, passwordHash: true },
      });

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

        // Await delivery so serverless does not tear down the function
        // before Resend is actually called. Never reveal delivery result.
        await sendPasswordResetEmail({
          to: normalizedEmail,
          rawToken,
        });
      }
    }
  } catch {
    // Generic server log only. Never log raw email, token, hash, password,
    // cookies, API keys, or email body.
    // eslint-disable-next-line no-console
    console.error("forgot-password: internal failure");
  }

  return NextResponse.json(GENERIC_OK);
}
