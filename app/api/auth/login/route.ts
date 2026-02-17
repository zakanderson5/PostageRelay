export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";

type Body = {
  identifier?: string; // email OR slug
  password?: string;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;

  const identifier = String(body?.identifier ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  if (!identifier || !password) {
    return NextResponse.json({ error: "Missing identifier or password" }, { status: 400 });
  }

  let user: any = null;

  if (identifier.includes("@")) {
    user = await prisma.user.findUnique({ where: { email: identifier } });
  } else {
    const page = await prisma.bondPage.findUnique({
      where: { slug: identifier },
      include: { user: true },
    });
    user = page?.user ?? null;
  }

  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: "Invalid login" }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid login" }, { status: 401 });
  }

  const token = await createSessionToken(user.id);

  const res = NextResponse.json({ ok: true });
  setSessionCookie(res, token);
  return res;
}
