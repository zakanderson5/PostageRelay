export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

type Body = { email?: string };

function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function unauthorized(): NextResponse {
  // 404 to avoid leaking endpoint existence to unauthorized callers.
  return new NextResponse("Not found", { status: 404 });
}

function parseDbHost(url: string | undefined | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.hostname || null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  // --- AuthZ: require Authorization: Bearer <CRON_SECRET> ---
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return unauthorized();

  const authHeader = req.headers.get("authorization") || "";
  const expected = `Bearer ${cronSecret}`;

  // Constant-time compare to avoid timing oracle.
  const a = Buffer.from(authHeader);
  const b = Buffer.from(expected);
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!ok) return unauthorized();

  // --- Parse body ---
  const body = (await req.json().catch(() => null)) as Body | null;
  const email = String(body?.email ?? "").trim().toLowerCase();
  const normalizedEmailProvided =
    !!email && email.includes("@") && email.length > 2 && email.length <= 254;

  // --- Environment fingerprints (hashed, never raw) ---
  const databaseUrl = process.env.DATABASE_URL;
  const databaseUrlHashPrefix = databaseUrl
    ? sha256Hex(databaseUrl).slice(0, 12)
    : null;
  const dbHost = parseDbHost(databaseUrl);
  const databaseHostHashPrefix = dbHost ? sha256Hex(dbHost).slice(0, 12) : null;

  // --- Read-only DB probes ---
  let currentDatabase: string | null = null;
  let currentDbUserHashPrefix: string | null = null;
  let dbProbeError: string | null = null;

  try {
    const rows = await prisma.$queryRawUnsafe<
      Array<{ db: string; usr: string }>
    >(`SELECT current_database() AS db, current_user AS usr`);
    if (rows.length > 0) {
      currentDatabase = String(rows[0].db ?? "");
      const usr = String(rows[0].usr ?? "");
      currentDbUserHashPrefix = usr ? sha256Hex(usr).slice(0, 12) : null;
    }
  } catch (err) {
    dbProbeError = (err as Error)?.name || "db_probe_failed";
  }

  // --- User + token lookup (read-only) ---
  let userFound = false;
  let userHasPasswordHash = false;
  let recentResetTokenCount = 0;
  let recentResetTokens: Array<{
    createdAt: string;
    expiresAt: string;
    usedAt: string | null;
  }> = [];
  let userProbeError: string | null = null;

  if (normalizedEmailProvided) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, passwordHash: true },
      });
      userFound = !!user;
      userHasPasswordHash = !!user?.passwordHash;

      if (user) {
        const tokens = await prisma.passwordResetToken.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { createdAt: true, expiresAt: true, usedAt: true },
        });
        recentResetTokenCount = tokens.length;
        recentResetTokens = tokens.map((t) => ({
          createdAt: t.createdAt.toISOString(),
          expiresAt: t.expiresAt.toISOString(),
          usedAt: t.usedAt ? t.usedAt.toISOString() : null,
        }));
      }
    } catch (err) {
      userProbeError = (err as Error)?.name || "user_probe_failed";
    }
  }

  const emailHashPrefix = normalizedEmailProvided
    ? sha256Hex(email).slice(0, 8)
    : null;

  return NextResponse.json({
    ok: true,
    diagnostics: {
      hasDatabaseUrl: !!databaseUrl,
      databaseUrlHashPrefix,
      databaseHostHashPrefix,
      currentDatabase,
      currentDbUserHashPrefix,
      hasResendApiKey: !!process.env.RESEND_API_KEY,
      emailFromConfigured: !!(process.env.EMAIL_FROM && process.env.EMAIL_FROM.trim()),
      appBaseUrlConfigured: !!(process.env.APP_BASE_URL && process.env.APP_BASE_URL.trim()),
      appUrlConfigured: !!(process.env.APP_URL && process.env.APP_URL.trim()),
      normalizedEmailProvided,
      emailHashPrefix,
      userFound,
      userHasPasswordHash,
      recentResetTokenCount,
      recentResetTokens,
      ...(dbProbeError ? { dbProbeError } : {}),
      ...(userProbeError ? { userProbeError } : {}),
    },
  });
}
