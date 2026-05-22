export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, getUserIdFromToken } from "@/lib/auth";

type Body = {
  email?: string;
  displayName?: string;
  minBondDollars?: string;
  maxBondDollars?: string;
  allowBoost?: boolean;
};

const MIN_BOND_CENTS = 99;            // $0.99
const MAX_BOND_CENTS_CAP = 1_000_000; // $10,000

function dollarsToCents(input: unknown): number | null {
  const trimmed = String(input ?? "").trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  const cents = Math.round(n * 100);
  if (cents < 0) return null;
  return cents;
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  const userId = token ? await getUserIdFromToken(token) : null;

  if (!userId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as Body | null;
  const email = String(body?.email ?? "").trim().toLowerCase();
  const displayName = String(body?.displayName ?? "").trim();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  // Load current bondPage so we can default optional fields (backward compat).
  const existing = await prisma.bondPage.findUnique({ where: { userId } });
  if (!existing) {
    return NextResponse.json({ error: "BondPage not found" }, { status: 404 });
  }

  // minBondDollars: required if provided, else fall back to current value.
  let minBondCents = existing.minBondCents;
  if (body && Object.prototype.hasOwnProperty.call(body, "minBondDollars")) {
    const parsed = dollarsToCents(body.minBondDollars);
    if (parsed === null || parsed < MIN_BOND_CENTS) {
      return NextResponse.json(
        { error: "Minimum bond must be at least $0.99" },
        { status: 400 }
      );
    }
    minBondCents = parsed;
  }

  // maxBondDollars: optional; default to existing.
  let maxBondCents = existing.maxBondCents;
  if (body && Object.prototype.hasOwnProperty.call(body, "maxBondDollars")) {
    const parsed = dollarsToCents(body.maxBondDollars);
    if (parsed === null) {
      return NextResponse.json(
        { error: "Maximum bond is invalid" },
        { status: 400 }
      );
    }
    maxBondCents = parsed;
  }

  // allowBoost: optional; default to existing. If provided, must be boolean.
  let allowBoost = existing.allowBoost;
  if (body && Object.prototype.hasOwnProperty.call(body, "allowBoost")) {
    if (typeof body.allowBoost !== "boolean") {
      return NextResponse.json(
        { error: "allowBoost must be true or false" },
        { status: 400 }
      );
    }
    allowBoost = body.allowBoost;
  }

  // Cross-field validation (applied to the effective values being saved).
  if (maxBondCents < minBondCents) {
    return NextResponse.json(
      { error: "Maximum bond must be at least the minimum bond" },
      { status: 400 }
    );
  }
  if (maxBondCents > MAX_BOND_CENTS_CAP) {
    return NextResponse.json(
      { error: "Maximum bond cannot exceed $10,000" },
      { status: 400 }
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { email },
      });

      await tx.bondPage.update({
        where: { userId },
        data: {
          displayName,
          minBondCents,
          maxBondCents,
          allowBoost,
        },
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
