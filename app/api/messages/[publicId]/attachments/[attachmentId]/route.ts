import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { get } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, getUserIdFromToken } from "@/lib/auth";
import { verifyMessageSignature } from "@/lib/signedLinks";
import {
  INLINE_PREVIEW_TYPES,
  isReceiverVisibleStatus,
  sanitizeFilename,
} from "@/lib/attachments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PUBLIC_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const ATT_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

function notFound() {
  return new Response("Not found", { status: 404 });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ publicId: string; attachmentId: string }> },
) {
  const { publicId, attachmentId } = await context.params;
  if (!PUBLIC_ID_RE.test(publicId) || !ATT_ID_RE.test(attachmentId)) return notFound();

  const url = new URL(request.url);
  const e = url.searchParams.get("e");
  const s = url.searchParams.get("s");
  const inline = url.searchParams.get("inline") === "1";

  const msg = await prisma.message.findUnique({
    where: { publicId },
    select: { id: true, status: true, receiverId: true },
  });
  if (!msg) return notFound();
  if (!isReceiverVisibleStatus(msg.status)) return notFound();

  // Auth: cookie-session receiver OR valid signed review link.
  let authorized = false;
  if (e && s) {
    const expUnix = Number(e);
    if (verifyMessageSignature(publicId, expUnix, s)) authorized = true;
  }
  if (!authorized) {
    const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value ?? null;
    const userId = token ? await getUserIdFromToken(token) : null;
    if (userId && userId === msg.receiverId) authorized = true;
  }
  if (!authorized) return notFound();

  const att = await prisma.messageAttachment.findUnique({
    where: { id: attachmentId },
    select: {
      messageId: true,
      originalFileName: true,
      contentType: true,
      sizeBytes: true,
      storageKey: true,
    },
  });
  if (!att || att.messageId !== msg.id) return notFound();

  // Private blob: fetch server-side via the SDK so the private URL/token
  // never reach the client.
  let result;
  try {
    result = await get(att.storageKey, { access: "private" });
  } catch {
    return new Response("Storage unavailable", { status: 502 });
  }
  if (!result || result.statusCode !== 200 || !result.stream) {
    return new Response("Storage error", { status: 502 });
  }

  const safeName = sanitizeFilename(att.originalFileName);
  const disposition =
    inline && INLINE_PREVIEW_TYPES.has(att.contentType)
      ? `inline; filename="${safeName}"`
      : `attachment; filename="${safeName}"`;

  const headers = new Headers();
  headers.set("content-type", att.contentType);
  headers.set("content-disposition", disposition);
  headers.set("content-length", String(att.sizeBytes));
  headers.set("cache-control", "private, no-store");
  headers.set("x-content-type-options", "nosniff");

  return new Response(result.stream, { status: 200, headers });
}
