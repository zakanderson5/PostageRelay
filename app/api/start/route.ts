import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function text(msg: string, status = 400) {
  return new NextResponse(msg, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

function normalizeSlug(raw: string): string | null {
  const s = raw.trim().toLowerCase();

  // Only allow letters/numbers/hyphens
  const cleaned = s
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

  if (cleaned.length < 3 || cleaned.length > 32) return null;
  return cleaned;
}

export async function POST(req: Request) {
  const expectedInvite = process.env.INVITE_CODE?.trim();
  if (!expectedInvite) return text("Server misconfigured (missing INVITE_CODE)", 500);

  const form = await req.formData();

  const invite = String(form.get("invite") ?? "").trim();
  if (invite !== expectedInvite) return text("Invalid invite code", 403);

  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!email.includes("@") || email.length > 200) return text("Invalid email", 400);

  const slug = normalizeSlug(String(form.get("slug") ?? ""));
  if (!slug) return text("Invalid slug. Use 3-32 chars: letters, numbers, hyphens.", 400);

  const displayNameRaw = String(form.get("displayName") ?? "").trim();
  const displayName = displayNameRaw ? displayNameRaw.slice(0, 80) : null;

  // Create or reuse user
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  // One page per user in v1
  const existingForUser = await prisma.bondPage.findUnique({
    where: { userId: user.id },
  });

  if (existingForUser) {
    return NextResponse.redirect(new URL(`/u/${existingForUser.slug}`, req.url));
  }

  // Slug must be unique
  const existingSlug = await prisma.bondPage.findUnique({
    where: { slug },
  });

  if (existingSlug) {
    return text("That link is already taken. Pick a different one.", 409);
  }

  await prisma.bondPage.create({
    data: {
      slug,
      userId: user.id,
      ...(displayName ? { displayName } : {}),
    },
  });

  return NextResponse.redirect(new URL(`/u/${slug}`, req.url));
}
