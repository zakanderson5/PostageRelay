export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { sha256Hex } from "@/lib/passwordReset";

type Body = { token?: string; password?: string };

const GENERIC_INVALID = NextResponse.json(
  { error: "Reset link is invalid or has expired." },
  { status: 400 },
);

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  const token = String(body?.token ?? "");
  const password = String(body?.password ?? "");

  if (!token || token.length < 16 || token.length > 256) {
    return NextResponse.json(
      { error: "Reset link is invalid or has expired." },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const tokenHash = sha256Hex(token);

  // Pre-fetch only to discover the userId; the authoritative validity check
  // happens atomically inside the transaction via a conditional updateMany.
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true },
  });

  if (!record) {
    return NextResponse.json(
      { error: "Reset link is invalid or has expired." },
      { status: 400 },
    );
  }

  const passwordHash = await hashPassword(password);
  const now = new Date();

  let consumed = false;
  try {
    await prisma.$transaction(async (tx) => {
      // Atomic check-and-consume: only succeeds for an unused, unexpired token.
      // Concurrent duplicate submissions will see count === 0 on the loser.
      const claim = await tx.passwordResetToken.updateMany({
        where: {
          id: record.id,
          tokenHash,
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: { usedAt: now },
      });

      if (claim.count !== 1) {
        // Force rollback of the entire transaction.
        throw new Error("token_already_consumed_or_expired");
      }

      await tx.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      });

      await tx.passwordResetToken.updateMany({
        where: { userId: record.userId, usedAt: null, id: { not: record.id } },
        data: { usedAt: now },
      });

      consumed = true;
    });
  } catch (e) {
    if ((e as Error)?.message !== "token_already_consumed_or_expired") {
      // eslint-disable-next-line no-console
      console.error("reset-password: transaction failed");
    }
    return NextResponse.json(
      { error: "Reset link is invalid or has expired." },
      { status: 400 },
    );
  }

  if (!consumed) {
    return NextResponse.json(
      { error: "Reset link is invalid or has expired." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
