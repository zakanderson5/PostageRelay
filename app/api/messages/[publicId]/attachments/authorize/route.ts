import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { prisma } from "@/lib/prisma";
import {
  ALLOWED_CONTENT_TYPES,
  MAX_SINGLE_FILE_BYTES,
  MAX_FILES_PER_MESSAGE,
  isPrePaymentStatus,
  buildStorageKey,
} from "@/lib/attachments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PUBLIC_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

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
    select: { id: true, status: true, _count: { select: { attachments: true } } },
  });
  if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isPrePaymentStatus(msg.status)) {
    return NextResponse.json({ error: "Message no longer accepts uploads" }, { status: 409 });
  }
  if (msg._count.attachments >= MAX_FILES_PER_MESSAGE) {
    return NextResponse.json({ error: "Attachment limit reached" }, { status: 409 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!pathname.startsWith(`messages/${publicId}/`)) {
          throw new Error("Pathname must be scoped to this message");
        }
        let declaredType: string | undefined;
        if (clientPayload) {
          try {
            const parsed = JSON.parse(clientPayload) as { contentType?: string };
            declaredType = parsed.contentType;
          } catch {
            // ignore
          }
        }
        return {
          allowedContentTypes: [...ALLOWED_CONTENT_TYPES],
          maximumSizeInBytes: MAX_SINGLE_FILE_BYTES,
          addRandomSuffix: false,
          tokenPayload: JSON.stringify({ publicId, declaredType }),
        };
      },
      onUploadCompleted: async () => {
        // Finalization is performed via the finalize route. No-op here.
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload authorization failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// Helper export used by the client form to build a unique pathname.
export function _buildKey(publicId: string, originalName: string) {
  return buildStorageKey(publicId, originalName);
}
