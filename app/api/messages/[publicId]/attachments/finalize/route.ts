import { NextRequest, NextResponse } from "next/server";
import { head, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import {
  isAllowedContentType,
  isPrePaymentStatus,
  sanitizeFilename,
  validateBatchAddition,
  MAX_FILES_PER_MESSAGE,
} from "@/lib/attachments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PUBLIC_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

type IncomingItem = {
  pathname?: string;
  url?: string;
  contentType?: string;
  originalFileName?: string;
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ publicId: string }> },
) {
  const { publicId } = await context.params;
  if (!PUBLIC_ID_RE.test(publicId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const msg = await prisma.message.findUnique({
    where: { publicId },
    select: {
      id: true,
      status: true,
      attachments: { select: { sizeBytes: true } },
    },
  });
  if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isPrePaymentStatus(msg.status)) {
    return NextResponse.json({ error: "Message no longer accepts uploads" }, { status: 409 });
  }

  let payload: { items?: IncomingItem[] };
  try {
    payload = (await request.json()) as { items?: IncomingItem[] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const items = Array.isArray(payload.items) ? payload.items : [];
  if (items.length === 0) {
    return NextResponse.json({ error: "No items" }, { status: 400 });
  }
  if (msg.attachments.length + items.length > MAX_FILES_PER_MESSAGE) {
    return NextResponse.json({ error: "Attachment limit reached" }, { status: 409 });
  }

  // Verify each blob actually exists and matches limits.
  const verified: {
    url: string;
    pathname: string;
    contentType: string;
    sizeBytes: number;
    originalFileName: string;
  }[] = [];

  for (const item of items) {
    const url = (item.url ?? "").trim();
    if (!url || !/^https?:\/\//i.test(url)) {
      return NextResponse.json({ error: "Invalid blob URL" }, { status: 400 });
    }

    let blob;
    try {
      blob = await head(url);
    } catch {
      return NextResponse.json({ error: "Blob not found" }, { status: 400 });
    }
    if (!blob.pathname.startsWith(`messages/${publicId}/`)) {
      // Reject and best-effort delete the rogue object.
      try { await del(url); } catch {}
      return NextResponse.json({ error: "Pathname not scoped to message" }, { status: 400 });
    }
    if (!isAllowedContentType(blob.contentType)) {
      try { await del(url); } catch {}
      return NextResponse.json({ error: `Disallowed type: ${blob.contentType}` }, { status: 400 });
    }
    verified.push({
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
      sizeBytes: blob.size,
      originalFileName: sanitizeFilename(item.originalFileName ?? blob.pathname.split("/").pop() ?? "file"),
    });
  }

  const batchCheck = validateBatchAddition(
    msg.attachments.map((a) => ({ sizeBytes: a.sizeBytes })),
    verified.map((v) => ({
      filename: v.originalFileName,
      contentType: v.contentType,
      sizeBytes: v.sizeBytes,
    })),
  );
  if (!batchCheck.ok) {
    for (const v of verified) {
      try { await del(v.url); } catch {}
    }
    return NextResponse.json({ error: batchCheck.error }, { status: 400 });
  }

  // Re-check status under transaction-style guard (lightweight).
  const fresh = await prisma.message.findUnique({
    where: { id: msg.id },
    select: { status: true, _count: { select: { attachments: true } } },
  });
  if (!fresh || !isPrePaymentStatus(fresh.status)) {
    for (const v of verified) {
      try { await del(v.url); } catch {}
    }
    return NextResponse.json({ error: "Message no longer accepts uploads" }, { status: 409 });
  }
  if (fresh._count.attachments + verified.length > MAX_FILES_PER_MESSAGE) {
    for (const v of verified) {
      try { await del(v.url); } catch {}
    }
    return NextResponse.json({ error: "Attachment limit reached" }, { status: 409 });
  }

  const created = await prisma.$transaction(
    verified.map((v) =>
      prisma.messageAttachment.create({
        data: {
          messageId: msg.id,
          originalFileName: v.originalFileName,
          storageProvider: "vercel_blob",
          storageKey: v.pathname,
          blobUrl: v.url,
          contentType: v.contentType,
          sizeBytes: v.sizeBytes,
        },
        select: { id: true, originalFileName: true, contentType: true, sizeBytes: true },
      }),
    ),
  );

  return NextResponse.json({ attachments: created });
}
