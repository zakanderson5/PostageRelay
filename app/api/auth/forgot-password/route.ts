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

export async function POST(req: Request) {
  let email = "";
  try {
    const body = (await req.json().catch(() => null)) as Body | null;
    email = String(body?.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const looksValid =
    !!email && email.includes("@") && email.length > 2 && email.length <= 254;

  if (!looksValid) {
    return NextResponse.json({ ok: true });
  }

  // Run the real work in the background so timing is closer between the
  // "exists" and "does-not-exist" branches.
  void (async () => {
    try {
      if (!allowEmail(email)) {
        return;
      }

      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, passwordHash: true },
      });

      if (!user || !user.passwordHash) {
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

      await sendPasswordResetEmail({ to: email, rawToken });
    } catch {
      // Never log token, hash, password, recipient, cookies, or email body.
      // eslint-disable-next-line no-console
      console.error("forgot-password: background task failed");
    }
  })();

  return NextResponse.json({ ok: true });
}
