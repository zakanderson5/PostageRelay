export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, getUserIdFromToken } from "@/lib/auth";

type Body = {
  email?: string;
  displayName?: string;
  minBondDollars?: string;
};

function dollarsToCents(input: string): number | null {
  const n = Number(input);
  if (!Number.isFinite(n)) return null;
  const cents = Math.round(n * 100);
  if (cents < 0) return null;
  return cents;
}

export async function POST(req: Request) {
  // Next.js 16: treat cookies() as async-safe
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  const userId = token ? await getUserIdFromToken(token) : null;

  if (!userId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as Body | null;
  const email = String(body?.email ?? "").trim().toLowerCase();
  const displayName = String(body?.displayName ?? "").trim();
  const minBondDollars = String(body?.minBondDollars ?? "").trim();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const minBondCents = dollarsToCents(minBondDollars);
  if (minBondCents === null || minBondCents < 99) {
    return NextResponse.json({ error: "Minimum bond must be at least $0.99" }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { email },
      });

      const bondPage = await tx.bondPage.findUnique({ where: { userId } });
      if (!bondPage) throw new Error("BondPage not found");

      await tx.bondPage.update({
        where: { userId },
        data: { displayName, minBondCents },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("duplicate")) {
      return NextResponse.json({ error: "That email is already in use" }, { status: 409 });
    }
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
