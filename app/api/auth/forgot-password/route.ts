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

// Anti-enumeration: pad every handled request to the same target latency
// so existent/non-existent/rate-limited/invalid paths are indistinguishable
// to a remote timing observer. The target must exceed the worst-case
// synchronous work of the user-exists branch (token writes + Resend send),
// which is also capped via WORK_BUDGET_MS below.
const MIN_RESPONSE_MS = 1500;
const WORK_BUDGET_MS = 1400;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function padTo(startedAt: number, floorMs: number): Promise<void> {
  const elapsed = Date.now() - startedAt;
  const remaining = floorMs - elapsed;
  if (remaining > 0) await sleep(remaining);
}

async function withBudget<T>(p: Promise<T>, budgetMs: number): Promise<void> {
  // Resolve as soon as either the work completes or the budget elapses.
  // Result is intentionally discarded — caller must never reveal it.
  await Promise.race([
    p.then(
      () => undefined,
      () => undefined,
    ),
    sleep(budgetMs),
  ]);
}

export async function POST(req: Request) {
  const startedAt = Date.now();

  let normalizedEmail = "";
  try {
    const body = (await req.json().catch(() => null)) as Body | null;
    normalizedEmail = String(body?.email ?? "").trim().toLowerCase();
  } catch {
    await padTo(startedAt, MIN_RESPONSE_MS);
    return NextResponse.json(GENERIC_OK);
  }

  const looksValid =
    !!normalizedEmail &&
    normalizedEmail.includes("@") &&
    normalizedEmail.length > 2 &&
    normalizedEmail.length <= 254;

  if (!looksValid) {
    await padTo(startedAt, MIN_RESPONSE_MS);
    return NextResponse.json(GENERIC_OK);
  }

  try {
    if (allowEmail(normalizedEmail)) {
      // Run all user-exists-only work (lookup + token writes + email send)
      // under a single hard budget so the branch cannot exceed
      // MIN_RESPONSE_MS and leak account existence via timing. Anything
      // that does not complete in time is dropped silently; the response
      // shape is invariant.
      const branchWork = (async () => {
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: { id: true, passwordHash: true },
        });

        if (!user || !user.passwordHash) return;

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

        await sendPasswordResetEmail({ to: normalizedEmail, rawToken });
      })();

      await withBudget(branchWork, WORK_BUDGET_MS);
    }
  } catch {
    // Generic server log only. Never log raw email, token, hash, password,
    // cookies, API keys, or email body.
    // eslint-disable-next-line no-console
    console.error("forgot-password: internal failure");
  }

  await padTo(startedAt, MIN_RESPONSE_MS);
  return NextResponse.json(GENERIC_OK);
}
